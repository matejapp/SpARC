using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class TransactionRepository(SparcDbContext db) : ITransactionRepository
{
    public async Task<(List<Transaction> Items, int TotalCount)> ListAsync(Guid userId, int page, int pageSize)
    {
        var mine = db.Transactions.AsNoTracking().Where(t => t.UserId == userId);

        var totalCount = await mine.CountAsync();

        // (UserId, OccurredOn DESC) serves the filter and the main sort; CreatedAt and Id only
        // order rows within one day, so paging is stable when several share a date.
        var items = await mine
            .OrderByDescending(t => t.OccurredOn)
            .ThenByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(t => t.Category)
            .ToListAsync();

        return (items, totalCount);
    }

    public Task<Transaction?> GetAsync(Guid userId, Guid id) =>
        db.Transactions.AsNoTracking()
            .Include(t => t.Category)
            .SingleOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    // No Include: the update changes CategoryId, and a loaded Category would contradict it.
    public Task<Transaction?> FindForUpdateAsync(Guid userId, Guid id) =>
        db.Transactions.SingleOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    public async Task AddAsync(Transaction transaction)
    {
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
    }

    public Task SaveAsync() => db.SaveChangesAsync();

    public async Task<bool> DeleteAsync(Guid userId, Guid id) =>
        await db.Transactions
            .Where(t => t.Id == id && t.UserId == userId)
            .ExecuteDeleteAsync() > 0;
}
