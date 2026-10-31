using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>
/// "Visible" means the user's own categories plus the shared system set (UserId IS NULL).
/// Writes only ever match the user's own rows, so a system category is never changed (D-015).
/// </summary>
public interface ICategoryRepository
{
    Task<List<Category>> ListVisibleAsync(Guid userId, TransactionType? kind);

    /// <summary>Null when the category does not exist or belongs to another user.</summary>
    Task<Category?> FindVisibleAsync(Guid userId, Guid id);

    Task AddAsync(Category category);

    /// <summary>False when the category does not exist, is a system one, or belongs to another user.</summary>
    Task<bool> DeleteOwnAsync(Guid userId, Guid id);
}
