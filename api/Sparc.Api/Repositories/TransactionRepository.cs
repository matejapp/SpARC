using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class TransactionRepository(SparcDbContext db) : ITransactionRepository
{
    public async Task<(List<Transaction> Items, int TotalCount)> ListAsync(
        Guid userId, TransactionFilter filter, int page, int pageSize)
    {
        // The user first, always; each filter only narrows it. A category id is matched together
        // with the user, so another user's category matches nothing instead of revealing itself.
        // (UserId, OccurredOn DESC) serves a date range, (UserId, CategoryId) a category; type and
        // currency are checked on rows already narrowed to one user.
        var mine = db.Transactions.AsNoTracking().Where(t => t.UserId == userId);
        if (filter.Type is { } type)
        {
            mine = mine.Where(t => t.Type == type);
        }
        if (filter.From is { } from && filter.To is { } to)
        {
            mine = mine.Where(t => t.OccurredOn >= from && t.OccurredOn <= to);
        }
        if (filter.CategoryId is { } categoryId)
        {
            mine = mine.Where(t => t.CategoryId == categoryId);
        }
        else if (filter.Uncategorised)
        {
            mine = mine.Where(t => t.CategoryId == null);
        }
        if (filter.Currency is { } currency)
        {
            mine = mine.Where(t => t.Currency == currency);
        }

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

    public Task<Transaction?> FindForDeleteAsync(Guid userId, Guid id) =>
        db.Transactions
            .Include(t => t.BillOccurrence)
            .SingleOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    // One SaveChanges is one DB transaction: the delete and the occurrence's revert land together.
    public async Task DeleteAsync(Transaction transaction)
    {
        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync();
    }

    // Served by IX_Transactions_UserId_FiscalReceiptNumber.
    public async Task<Guid?> FindIdByFiscalReceiptNumberAsync(Guid userId, string fiscalReceiptNumber) =>
        await db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.FiscalReceiptNumber == fiscalReceiptNumber)
            .Select(t => (Guid?)t.Id)
            .FirstOrDefaultAsync();

    // Walks the user's rows newest first on (UserId, OccurredOn DESC) and stops at the first
    // match: bounded by one user's history, which for a personal tracker is thousands of rows,
    // not millions. No index on Description: it is free text, and this runs once per scan.
    public async Task<Guid?> FindLatestCategoryIdByDescriptionAsync(Guid userId, string description) =>
        await db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.Type == TransactionType.Expense
                        && t.CategoryId != null && t.Description == description)
            .OrderByDescending(t => t.OccurredOn)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => t.CategoryId)
            .FirstOrDefaultAsync();
}
