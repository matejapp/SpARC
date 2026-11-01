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
    ILogger<TransactionService> logger) : ITransactionService
{
    public async Task<PagedResponse<TransactionResponse>> ListAsync(Guid userId, TransactionListQuery query)
    {
        var (items, totalCount) = await transactions.ListAsync(userId, query.Page, query.PageSize);

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

        var transaction = new Transaction { UserId = userId, Currency = Currencies.Rsd };
        Apply(transaction, request);

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

        await ValidateAsync(userId, request);
        Apply(transaction, request);

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
        // RSD only until FX rates exist (iteration 3). Saving EUR now would freeze RateToRsd = 1
        // on it, and a frozen rate is never corrected (D-004).
        if (!string.Equals(request.Currency, Currencies.Rsd, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainValidationException(nameof(TransactionRequest.Currency),
                "Only RSD is supported until multi-currency arrives.");
        }

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

    private static void Apply(Transaction transaction, TransactionRequest request)
    {
        transaction.Type = request.Type!.Value;
        transaction.Amount = request.Amount!.Value;
        transaction.CategoryId = request.CategoryId!.Value;
        transaction.OccurredOn = request.OccurredOn!.Value;
        transaction.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        // RSD only this sprint, so the frozen rate is 1 (D-004). Iteration 3 looks the rate up for
        // a new currency; an edit that keeps the currency keeps the rate it was saved with.
        transaction.Currency = Currencies.Rsd;
        transaction.RateToRsd = 1m;
        transaction.AmountRsd = transaction.Amount * transaction.RateToRsd;
    }

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
        CreatedAt = transaction.CreatedAt,
        UpdatedAt = transaction.UpdatedAt,
    };
}
