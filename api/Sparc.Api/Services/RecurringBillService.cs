using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Bills and their schedule. Creating a bill generates its months up to the horizon; editing one
/// regenerates the unpaid months from today on; paid months are never touched. Every path is
/// scoped to the caller: another user's bill is a 404, the same as a missing or deactivated one.
/// Names and amounts are not logged — ids are enough to find a row.
/// </summary>
public sealed class RecurringBillService(
    IRecurringBillRepository bills,
    ICategoryRepository categories,
    ILogger<RecurringBillService> logger) : IRecurringBillService
{
    public async Task<PagedResponse<BillResponse>> ListAsync(Guid userId, BillListQuery query)
    {
        var (items, totalCount) = await bills.ListActiveAsync(userId, query.Page, query.PageSize);

        return new PagedResponse<BillResponse>
        {
            Items = items.Select(v => ToResponse(v.Bill, v.CategoryName, v.NextDueDate)).ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<BillResponse> GetAsync(Guid userId, Guid id)
    {
        var view = await bills.GetActiveAsync(userId, id) ?? throw new NotFoundException("Bill");
        return ToResponse(view.Bill, view.CategoryName, view.NextDueDate);
    }

    public async Task<BillResponse> CreateAsync(Guid userId, BillRequest request)
    {
        var today = BillSchedule.Today();
        RefusePastDate(request.FirstDueDate!.Value, today);
        var category = await ValidateAsync(userId, request);

        var bill = new RecurringBill
        {
            UserId = userId,
            Name = string.Empty,
            Currency = Currencies.Rsd,
            IsActive = true,
        };
        Apply(bill, request);

        var dueDates = BillSchedule.DueDates(bill.FirstDueDate, bill.IntervalMonths, bill.FirstDueDate, today).ToList();
        bill.Occurrences.AddRange(dueDates.Select(d => NewOccurrence(bill, d)));

        await bills.AddAsync(bill);
        logger.LogInformation("Bill created {BillId} for {UserId} with {OccurrenceCount} occurrences",
            bill.Id, userId, dueDates.Count);

        return ToResponse(bill, category.Name, dueDates.Min());
    }

    /// <summary>
    /// Replaces every editable field, then regenerates the unpaid months from today on with the new
    /// amount and schedule. A month that keeps an occurrence — paid, or overdue from before today —
    /// is not generated again; the unique (RecurringBillId, DueMonth) index guarantees it.
    /// </summary>
    public async Task UpdateAsync(Guid userId, Guid id, BillRequest request)
    {
        // Ownership first: someone else's id is a 404 whatever the body says.
        var bill = await bills.FindActiveForUpdateAsync(userId, id) ?? throw new NotFoundException("Bill");

        var today = BillSchedule.Today();
        if (request.FirstDueDate != bill.FirstDueDate)
        {
            // A bill's own date is in the past once its first month has gone by; only a new one
            // has to be ahead.
            RefusePastDate(request.FirstDueDate!.Value, today);
        }
        await ValidateAsync(userId, request);
        Apply(bill, request);

        var kept = await bills.GetKeptMonthsAsync(userId, bill.Id, today);
        var newOccurrences = BillSchedule.DueDates(bill.FirstDueDate, bill.IntervalMonths, today, today)
            .Where(d => !kept.Contains(BillSchedule.MonthOf(d)))
            .Select(d => NewOccurrence(bill, d))
            .ToList();

        await bills.ReplaceFutureOccurrencesAsync(userId, bill, today, newOccurrences);
        logger.LogInformation("Bill updated {BillId} for {UserId} with {OccurrenceCount} future occurrences",
            id, userId, newOccurrences.Count);
    }

    /// <summary>Delete is deactivation: future dates go, paid months and their expenses stay.</summary>
    public async Task DeactivateAsync(Guid userId, Guid id)
    {
        var bill = await bills.FindActiveForUpdateAsync(userId, id) ?? throw new NotFoundException("Bill");

        await bills.DeactivateAsync(userId, bill);
        logger.LogInformation("Bill deactivated {BillId} for {UserId}", id, userId);
    }

    // A day of slack: the phone's today can be a day behind UTC (D-024).
    private static void RefusePastDate(DateOnly firstDueDate, DateOnly today)
    {
        if (firstDueDate < today.AddDays(-1))
        {
            throw new DomainValidationException(nameof(BillRequest.FirstDueDate), "Due date can't be in the past.");
        }
    }

    /// <summary>The rules a DTO cannot check. Returns the category the bill will point to.</summary>
    private async Task<Category> ValidateAsync(Guid userId, BillRequest request)
    {
        // Another user's category gets the same answer as a missing one.
        var category = await categories.FindVisibleAsync(userId, request.CategoryId!.Value)
            ?? throw new DomainValidationException(nameof(BillRequest.CategoryId), "Category was not found.");

        // A paid bill becomes an expense, so its category must be an expense one (D-024).
        if (category.Kind != TransactionType.Expense)
        {
            throw new DomainValidationException(nameof(BillRequest.CategoryId), "Category is for income transactions.");
        }

        return category;
    }

    private static void Apply(RecurringBill bill, BillRequest request)
    {
        bill.Name = request.Name.Trim();
        bill.Amount = request.Amount!.Value;
        // [SupportedCurrency] has already limited it to RSD/EUR/USD, case-insensitively. A bill
        // holds no rate: a month freezes one only when it is paid (D-039).
        bill.Currency = request.Currency.ToUpperInvariant();
        bill.CategoryId = request.CategoryId!.Value;
        bill.FirstDueDate = request.FirstDueDate!.Value;
        bill.IntervalMonths = request.Monthly!.Value ? 1 : null;
    }

    // Amount and currency are copied, so a later edit never rewrites this month.
    private static BillOccurrence NewOccurrence(RecurringBill bill, DateOnly dueDate) => new()
    {
        UserId = bill.UserId,
        RecurringBillId = bill.Id,
        DueDate = dueDate,
        Status = BillOccurrenceStatus.Pending,
        AmountAtDue = bill.Amount,
        CurrencyAtDue = bill.Currency,
    };

    private static BillResponse ToResponse(RecurringBill bill, string? categoryName, DateOnly? nextDueDate) => new()
    {
        Id = bill.Id,
        Name = bill.Name,
        Amount = bill.Amount,
        Currency = bill.Currency,
        CategoryId = bill.CategoryId,
        CategoryName = categoryName,
        FirstDueDate = bill.FirstDueDate,
        Monthly = bill.IntervalMonths is not null,
        NextDueDate = nextDueDate,
        CreatedAt = bill.CreatedAt,
        UpdatedAt = bill.UpdatedAt,
    };
}
