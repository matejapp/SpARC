using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class RecurringBillRepository(SparcDbContext db) : IRecurringBillRepository
{
    public async Task<(List<BillView> Items, int TotalCount)> ListActiveAsync(Guid userId, int page, int pageSize)
    {
        var mine = Active(userId);

        var totalCount = await mine.CountAsync();

        // Id breaks ties between equal names, so paging is stable.
        var items = await ToView(mine.OrderBy(b => b.Name).ThenBy(b => b.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize))
            .ToListAsync();

        return (items, totalCount);
    }

    public Task<BillView?> GetActiveAsync(Guid userId, Guid id) =>
        ToView(Active(userId).Where(b => b.Id == id)).SingleOrDefaultAsync();

    public Task<RecurringBill?> FindActiveForUpdateAsync(Guid userId, Guid id) =>
        db.RecurringBills.SingleOrDefaultAsync(b => b.Id == id && b.UserId == userId && b.IsActive);

    public async Task AddAsync(RecurringBill bill)
    {
        db.RecurringBills.Add(bill);
        await db.SaveChangesAsync();
    }

    public async Task<HashSet<DateOnly>> GetKeptMonthsAsync(Guid userId, Guid billId, DateOnly from)
    {
        var months = await db.BillOccurrences
            .Where(o => o.UserId == userId && o.RecurringBillId == billId)
            .Where(o => o.Status == BillOccurrenceStatus.Paid || o.DueDate < from)
            .Select(o => o.DueMonth)
            .ToListAsync();

        return [.. months];
    }

    public async Task ReplaceFutureOccurrencesAsync(
        Guid userId, RecurringBill bill, DateOnly from, List<BillOccurrence> newOccurrences)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();

        // A statement of its own, before the inserts: a regenerated month must not meet the row it
        // replaces in the unique (RecurringBillId, DueMonth) index. Pending rows have no expense,
        // and the NO ACTION key on Transactions would refuse a paid one anyway.
        await db.BillOccurrences
            .Where(o => o.UserId == userId && o.RecurringBillId == bill.Id)
            .Where(o => o.Status == BillOccurrenceStatus.Pending && o.DueDate >= from)
            .ExecuteDeleteAsync();

        db.BillOccurrences.AddRange(newOccurrences);
        await db.SaveChangesAsync();

        await transaction.CommitAsync();
    }

    public async Task DeactivateAsync(Guid userId, RecurringBill bill)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();

        bill.IsActive = false;
        await db.SaveChangesAsync();

        await db.BillOccurrences
            .Where(o => o.UserId == userId && o.RecurringBillId == bill.Id)
            .Where(o => o.Status == BillOccurrenceStatus.Pending)
            .ExecuteDeleteAsync();

        await transaction.CommitAsync();
    }

    private IQueryable<RecurringBill> Active(Guid userId) =>
        db.RecurringBills.AsNoTracking().Where(b => b.UserId == userId && b.IsActive);

    // One query per call: the category name through a join, the next unpaid due date through a
    // correlated MIN served by the (RecurringBillId, DueMonth) index.
    private static IQueryable<BillView> ToView(IQueryable<RecurringBill> bills) =>
        bills.Select(b => new BillView(
            b,
            b.Category != null ? b.Category.Name : null,
            b.Occurrences
                .Where(o => o.Status == BillOccurrenceStatus.Pending)
                .Min(o => (DateOnly?)o.DueDate)));
}
