using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class CategoryRepository(SparcDbContext db) : ICategoryRepository
{
    public Task<List<Category>> ListVisibleAsync(Guid userId, TransactionType? kind) =>
        db.Categories.AsNoTracking()
            .Where(c => c.UserId == userId || c.UserId == null)
            .Where(c => kind == null || c.Kind == kind)
            // Income before expense, system before own, then by name.
            .OrderBy(c => c.Kind)
            .ThenByDescending(c => c.IsSystem)
            .ThenBy(c => c.Name)
            .ToListAsync();

    public Task<Category?> FindVisibleAsync(Guid userId, Guid id) =>
        db.Categories.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.UserId == null));

    public async Task AddAsync(Category category)
    {
        db.Categories.Add(category);
        await db.SaveChangesAsync();
    }

    // The database's ON DELETE SET NULL uncategorises this category's transactions.
    public async Task<bool> DeleteOwnAsync(Guid userId, Guid id) =>
        await db.Categories
            .Where(c => c.Id == id && c.UserId == userId)
            .ExecuteDeleteAsync() > 0;
}
