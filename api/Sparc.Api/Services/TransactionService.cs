using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Every path is scoped to the caller: another user's transaction is a 404, the same as a
/// missing one. Amounts are not logged — ids are enough to find a row.
/// </summary>
public sealed class TransactionService(
    ITransactionRepository transactions,
    ICategoryRepository categories,
    IFxRateService fxRates,
    ILogger<TransactionService> logger) : ITransactionService
{
    public async Task<PagedResponse<TransactionResponse>> ListAsync(Guid userId, TransactionListQuery query)
    {
        var filter = new TransactionFilter(
            Type: query.Type switch
            {
                "income" => TransactionType.Income,
                "expense" => TransactionType.Expense,
                _ => null,
            },
            From: query.From,
            To: query.To,
            CategoryId: query.CategoryId,
            Uncategorised: query.Uncategorised,
            Currency: query.Currency?.ToUpperInvariant());
        var (items, totalCount) = await transactions.ListAsync(userId, filter, query.Page, query.PageSize);

        return new PagedResponse<TransactionResponse>
        {
            Items = items.Select(t => ToResponse(t, t.Category)).ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<TransactionResponse> GetAsync(Guid userId, Guid id)
    {
        var transaction = await transactions.GetAsync(userId, id) ?? throw new NotFoundException("Transaction");
        return ToResponse(transaction, transaction.Category);
    }

    public async Task<TransactionResponse> CreateAsync(Guid userId, TransactionRequest request)
    {
        var category = await ValidateAsync(userId, request);
        await ValidateReceiptAsync(userId, request);

        var transaction = new Transaction
        {
            UserId = userId,
            Currency = Currencies.Rsd,
            FiscalReceiptNumber = request.FiscalReceiptNumber,
        };
        Apply(transaction, request);
        await FreezeRateAsync(transaction);

        await transactions.AddAsync(transaction);
        logger.LogInformation("Transaction created {TransactionId} for {UserId}", transaction.Id, userId);

        return ToResponse(transaction, category);
    }

    // Ownership first: someone else's id is a 404 whatever the body says.
    public async Task UpdateAsync(Guid userId, Guid id, TransactionRequest request)
    {
        var transaction = await transactions.FindForUpdateAsync(userId, id)
            ?? throw new NotFoundException("Transaction");

        // A paid bill's expense stays an expense; its amount, date and text stay editable (D-035).
        if (transaction.BillOccurrenceId is not null && request.Type != TransactionType.Expense)
        {
            throw new DomainValidationException(nameof(TransactionRequest.Type),
                "A paid bill's expense can't be changed to income.");
        }
        // So does a scanned receipt's (D-047). Its receipt number is never rewritten here.
        if (transaction.FiscalReceiptNumber is not null && request.Type != TransactionType.Expense)
        {
            throw new DomainValidationException(nameof(TransactionRequest.Type),
                "A scanned receipt's expense can't be changed to income.");
        }

        await ValidateAsync(userId, request);

        // A new amount, currency or date is a new entry of the value, so the rate is taken again
        // (D-038). Category or description alone leave the frozen pair untouched.
        var valueChanged = transaction.Amount != request.Amount
                           || transaction.Currency != request.Currency.ToUpperInvariant()
                           || transaction.OccurredOn != request.OccurredOn;
        Apply(transaction, request);
        if (valueChanged)
        {
            // If this throws (no rate, provider down), nothing is saved: the tracked changes are
            // discarded with the request's DbContext.
            await FreezeRateAsync(transaction);
        }

        await transactions.SaveAsync();
        logger.LogInformation("Transaction updated {TransactionId} for {UserId}", id, userId);
    }

    /// <summary>
    /// Deleting a paid bill's expense is the user's undo of "mark paid": its month goes back to
    /// pending in the same save, so a month is never paid without an expense behind it (D-035).
    /// </summary>
    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var transaction = await transactions.FindForDeleteAsync(userId, id)
            ?? throw new NotFoundException("Transaction");

        if (transaction.BillOccurrence is { } occurrence)
        {
            occurrence.Status = BillOccurrenceStatus.Pending;
            occurrence.PaidAt = null;
        }

        await transactions.DeleteAsync(transaction);
        logger.LogInformation("Transaction deleted {TransactionId} for {UserId}, bill occurrence reverted: {Reverted}",
            id, userId, transaction.BillOccurrence is not null);
    }

    /// <summary>The rules a DTO cannot check. Returns the category the transaction will point to.</summary>
    private async Task<Category> ValidateAsync(Guid userId, TransactionRequest request)
    {
        // Another user's category gets the same answer as a missing one.
        var category = await categories.FindVisibleAsync(userId, request.CategoryId!.Value)
            ?? throw new DomainValidationException(nameof(TransactionRequest.CategoryId), "Category was not found.");

        // Keeps spending-by-category from mixing income into expense (D-024).
        if (category.Kind != request.Type)
        {
            throw new DomainValidationException(nameof(TransactionRequest.CategoryId),
                $"Category is for {category.Kind.ToString().ToLowerInvariant()} transactions.");
        }

        return category;
    }

    /// <summary>
    /// A receipt number belongs to an expense and to one transaction per user (D-047). The unique
    /// index catches a concurrent double confirm; this check gives the usual case a clear answer.
    /// </summary>
    private async Task ValidateReceiptAsync(Guid userId, TransactionRequest request)
    {
        if (request.FiscalReceiptNumber is not { } number)
        {
            return;
        }
        if (request.Type != TransactionType.Expense)
        {
            throw new DomainValidationException(nameof(TransactionRequest.Type), "A receipt is always an expense.");
        }
        if (await transactions.FindIdByFiscalReceiptNumberAsync(userId, number) is not null)
        {
            throw new ConflictException("This receipt is already in your activity.");
        }
    }

    private static void Apply(Transaction transaction, TransactionRequest request)
    {
        transaction.Type = request.Type!.Value;
        transaction.Amount = request.Amount!.Value;
        transaction.CategoryId = request.CategoryId!.Value;
        transaction.OccurredOn = request.OccurredOn!.Value;
        transaction.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        // [SupportedCurrency] has already limited it to RSD/EUR/USD, case-insensitively.
        transaction.Currency = request.Currency.ToUpperInvariant();
    }

    /// <summary>
    /// Freezes the rate in force for the transaction's own date (D-037, D-038): RSD is 1 and never
    /// calls the provider, so an FX outage can't block an RSD entry; EUR and USD take the NBS
    /// middle rate from FxRates. Runs after validation, so a bad request never reaches the
    /// provider, and before the save, so no database transaction waits on it.
    /// </summary>
    private async Task FreezeRateAsync(Transaction transaction)
    {
        // A ServiceUnavailableException (503) passes through: nothing is saved.
        var frozen = await fxRates.FreezeAsync(transaction.Currency, transaction.Amount, transaction.OccurredOn)
            ?? throw new DomainValidationException(nameof(TransactionRequest.OccurredOn), NoRateMessage);
        transaction.RateToRsd = frozen.RateToRsd;
        transaction.AmountRsd = frozen.AmountRsd;
    }

    internal const string NoRateMessage = "No official NBS exchange rate exists for this date. Enter the amount in RSD.";

    /// <summary>Shared with BillOccurrenceService, which answers a payment with its expense.</summary>
    internal static TransactionResponse ToResponse(Transaction transaction, Category? category) => new()
    {
        Id = transaction.Id,
        Type = transaction.Type,
        Amount = transaction.Amount,
        Currency = transaction.Currency,
        RateToRsd = transaction.RateToRsd,
        AmountRsd = transaction.AmountRsd,
        CategoryId = transaction.CategoryId,
        CategoryName = category?.Name,
        OccurredOn = transaction.OccurredOn,
        Description = transaction.Description,
        FiscalReceiptNumber = transaction.FiscalReceiptNumber,
        CreatedAt = transaction.CreatedAt,
        UpdatedAt = transaction.UpdatedAt,
    };
}
