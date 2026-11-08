using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>
/// The list filters, already validated. Null means "any". <see cref="Uncategorised"/> and
/// <see cref="CategoryId"/> are never both set (the query DTO refuses it).
/// </summary>
public sealed record TransactionFilter(
    TransactionType? Type = null,
    DateOnly? From = null,
    DateOnly? To = null,
    Guid? CategoryId = null,
    bool Uncategorised = false,
    string? Currency = null);

/// <summary>Every method takes the user id and filters on it; there is no unscoped read.</summary>
public interface ITransactionRepository
{
    /// <summary>
    /// Newest first, with Category loaded, narrowed by <paramref name="filter"/>. Also returns how
    /// many of the user's rows match it.
    /// </summary>
    Task<(List<Transaction> Items, int TotalCount)> ListAsync(Guid userId, TransactionFilter filter, int page, int pageSize);

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

    /// <summary>The id of the user's transaction with this fiscal receipt number, if any (D-047).</summary>
    Task<Guid?> FindIdByFiscalReceiptNumberAsync(Guid userId, string fiscalReceiptNumber);
}
