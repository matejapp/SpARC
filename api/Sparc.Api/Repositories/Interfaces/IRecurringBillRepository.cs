using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>A bill read with what its response needs, in one query.</summary>
public sealed record BillView(RecurringBill Bill, string? CategoryName, DateOnly? NextDueDate);

/// <summary>
/// Every method takes the user id and filters on it; there is no unscoped read. Only active bills
/// are visible — a deactivated bill is gone as far as the API is concerned.
/// </summary>
public interface IRecurringBillRepository
{
    /// <summary>Active bills by name, one page, plus the user's total count of active bills.</summary>
    Task<(List<BillView> Items, int TotalCount)> ListActiveAsync(Guid userId, int page, int pageSize);

    /// <summary>Read-only. Null when the bill does not exist, is inactive or belongs to another user.</summary>
    Task<BillView?> GetActiveAsync(Guid userId, Guid id);

    /// <summary>Tracked, for a change followed by one of the writes below. Same null rule as Get.</summary>
    Task<RecurringBill?> FindActiveForUpdateAsync(Guid userId, Guid id);

    /// <summary>Inserts the bill with its occurrences in one SaveChanges, so both land or neither.</summary>
    Task AddAsync(RecurringBill bill);

    /// <summary>
    /// The months (first day) of the bill's occurrences that a schedule change keeps: every paid
    /// one, and pending ones due before <paramref name="from"/>.
    /// </summary>
    Task<HashSet<DateOnly>> GetKeptMonthsAsync(Guid userId, Guid billId, DateOnly from);

    /// <summary>
    /// In one DB transaction: deletes the bill's pending occurrences due on or after
    /// <paramref name="from"/>, adds <paramref name="newOccurrences"/>, and saves the tracked bill.
    /// Paid occurrences are never deleted.
    /// </summary>
    Task ReplaceFutureOccurrencesAsync(Guid userId, RecurringBill bill, DateOnly from, List<BillOccurrence> newOccurrences);

    /// <summary>
    /// In one DB transaction: marks the tracked bill inactive and deletes all its pending
    /// occurrences. Paid occurrences and their expenses stay.
    /// </summary>
    Task DeactivateAsync(Guid userId, RecurringBill bill);
}
