using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>Every method takes the user id and filters on it; there is no unscoped read.</summary>
public interface ITransactionRepository
{
    /// <summary>Newest first, with Category loaded. Also returns the user's total row count.</summary>
    Task<(List<Transaction> Items, int TotalCount)> ListAsync(Guid userId, int page, int pageSize);

    /// <summary>
    /// Read-only, with Category loaded. Null when the transaction does not exist or belongs to
    /// another user.
    /// </summary>
    Task<Transaction?> GetAsync(Guid userId, Guid id);

    /// <summary>
    /// Tracked, without Category, for an update followed by <see cref="SaveAsync"/>. Null when the
    /// transaction does not exist or belongs to another user.
    /// </summary>
    Task<Transaction?> FindForUpdateAsync(Guid userId, Guid id);

    Task AddAsync(Transaction transaction);

    Task SaveAsync();

    /// <summary>
    /// Tracked, with its bill occurrence (if any) loaded, for <see cref="DeleteAsync"/>. Null when
    /// the transaction does not exist or belongs to another user.
    /// </summary>
    Task<Transaction?> FindForDeleteAsync(Guid userId, Guid id);

    /// <summary>
    /// Deletes the tracked transaction and saves any change made to its loaded occurrence, in one
    /// SaveChanges.
    /// </summary>
    Task DeleteAsync(Transaction transaction);

    /// <summary>
    /// Sum of AmountRsd per type between two dates, inclusive, computed by the database.
    /// Zero for a type with no rows.
    /// </summary>
    Task<(decimal Income, decimal Expense)> SumByTypeAsync(Guid userId, DateOnly from, DateOnly to);
}
