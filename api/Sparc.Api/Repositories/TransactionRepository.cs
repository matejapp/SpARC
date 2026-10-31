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

    // One GROUP BY: at most two rows come back, whatever the number of transactions. Totals are
    // AmountRsd, the frozen pivot value, never Amount (D-004).
    public async Task<(decimal Income, decimal Expense)> SumByTypeAsync(Guid userId, DateOnly from, DateOnly to)
    {
        var totals = await db.Transactions
            .Where(t => t.UserId == userId && t.OccurredOn >= from && t.OccurredOn <= to)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.AmountRsd) })
            .ToListAsync();

        decimal TotalOf(TransactionType type) => totals.SingleOrDefault(t => t.Type == type)?.Total ?? 0m;
        return (TotalOf(TransactionType.Income), TotalOf(TransactionType.Expense));
    }
}
