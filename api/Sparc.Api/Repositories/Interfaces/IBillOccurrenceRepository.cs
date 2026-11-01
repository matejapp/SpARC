using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>An occurrence read with its bill's name and category and its expense, in one query.</summary>
public sealed record OccurrenceView(
    Guid Id,
    Guid BillId,
    string BillName,
    Guid? CategoryId,
    string? CategoryName,
    DateOnly DueDate,
    BillOccurrenceStatus Status,
    decimal Amount,
    string Currency,
    DateTime? PaidAt,
    Guid? TransactionId);

/// <summary>
/// Every method takes the user id and filters on it; there is no unscoped read. Only occurrences
/// of active bills are visible.
/// </summary>
public interface IBillOccurrenceRepository
{
    /// <summary>
    /// Due between two dates, inclusive, by due date then bill name; optionally one bill only.
    /// </summary>
    Task<List<OccurrenceView>> ListAsync(Guid userId, DateOnly from, DateOnly to, Guid? billId);

    /// <summary>
    /// Tracked, with its bill and the bill's category loaded, for <see cref="PayAsync"/>. Null when
    /// the occurrence does not exist, belongs to another user or its bill is inactive.
    /// </summary>
    Task<BillOccurrence?> FindForPayAsync(Guid userId, Guid id);

    /// <summary>
    /// Saves the tracked occurrence (now paid) and inserts its expense in one SaveChanges, so both
    /// land or neither. A second expense for the same occurrence fails on the unique
    /// Transactions.BillOccurrenceId index.
    /// </summary>
    Task PayAsync(BillOccurrence occurrence, Transaction expense);
}
