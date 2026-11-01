using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class BillOccurrenceRepository(SparcDbContext db) : IBillOccurrenceRepository
{
    // One query: the (UserId, DueDate) index serves the range, the bill and its category come in
    // through joins, and the expense id through a correlated lookup on the unique
    // Transactions.BillOccurrenceId index. The range cap in OccurrenceListQuery bounds the rows.
    public Task<List<OccurrenceView>> ListAsync(Guid userId, DateOnly from, DateOnly to, Guid? billId)
    {
        var mine = db.BillOccurrences.AsNoTracking()
            .Where(o => o.UserId == userId && o.DueDate >= from && o.DueDate <= to)
            .Where(o => o.RecurringBill.IsActive);

        if (billId is { } id)
        {
            mine = mine.Where(o => o.RecurringBillId == id);
        }

        return mine
            .OrderBy(o => o.DueDate).ThenBy(o => o.RecurringBill.Name).ThenBy(o => o.Id)
            .Select(o => new OccurrenceView(
                o.Id,
                o.RecurringBillId,
                o.RecurringBill.Name,
                o.RecurringBill.CategoryId,
                o.RecurringBill.Category != null ? o.RecurringBill.Category.Name : null,
                o.DueDate,
                o.Status,
                o.AmountAtDue,
                o.CurrencyAtDue,
                o.PaidAt,
                db.Transactions
                    .Where(t => t.UserId == userId && t.BillOccurrenceId == o.Id)
                    .Select(t => (Guid?)t.Id)
                    .FirstOrDefault()))
            .ToListAsync();
    }

    public Task<BillOccurrence?> FindForPayAsync(Guid userId, Guid id) =>
        db.BillOccurrences
            .Include(o => o.RecurringBill).ThenInclude(b => b.Category)
            .SingleOrDefaultAsync(o => o.Id == id && o.UserId == userId && o.RecurringBill.IsActive);

    // The expense belongs to another aggregate, but paying is one unit of work: the occurrence
    // must never be paid without its expense, nor the expense exist for a pending month.
    public async Task PayAsync(BillOccurrence occurrence, Transaction expense)
    {
        db.Transactions.Add(expense);
        await db.SaveChangesAsync();
    }
}
