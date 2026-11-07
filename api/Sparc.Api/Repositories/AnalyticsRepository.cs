using Microsoft.EntityFrameworkCore;
using Sparc.Api.Common;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

/// <summary>
/// The display conversion (D-041), written once and composed by every aggregate. Per row, in the
/// display currency P:
///   P = RSD             → AmountRsd, the frozen pivot value (no join);
///   row entered in P    → Amount, exact;
///   otherwise           → AmountRsd / the P rate of the row's own date (FxRates).
/// Sums run over the unrounded values and each total is rounded once, in SQL. (UserId, OccurredOn
/// DESC) serves the range; the FxRates join is its primary key (Date, Currency).
/// </summary>
public sealed class AnalyticsRepository(SparcDbContext db) : IAnalyticsRepository
{
    public Task<List<DateOnly>> ListDatesToConvertAsync(Guid userId, DateOnly from, DateOnly to, string currency) =>
        db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.OccurredOn >= from && t.OccurredOn <= to && t.Currency != currency)
            .Select(t => t.OccurredOn)
            .Distinct()
            .Where(d => !db.FxRates.Any(r => r.Date == d && r.Currency == currency && r.IsFinal))
            .ToListAsync();

    public async Task<TypeTotals> TotalsByTypeAsync(Guid userId, DateOnly from, DateOnly to, string currency)
    {
        var totals = await Converted(userId, from, to, currency)
            .GroupBy(x => x.Type)
            .Select(g => new { Type = g.Key, Total = Math.Round(g.Sum(x => x.Value), 2) })
            .ToListAsync();

        decimal TotalOf(TransactionType type) => totals.SingleOrDefault(t => t.Type == type)?.Total ?? 0m;
        return new TypeTotals(TotalOf(TransactionType.Income), TotalOf(TransactionType.Expense));
    }

    /// <summary>
    /// One user's rows in the period with their value in <paramref name="currency"/>. A LEFT join,
    /// so a missing rate could only ever show as a NULL value, never drop the row's other columns;
    /// IDisplayCurrencyService guarantees there is none before any aggregate runs.
    /// </summary>
    private IQueryable<ConvertedRow> Converted(Guid userId, DateOnly from, DateOnly to, string currency)
    {
        var mine = db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.OccurredOn >= from && t.OccurredOn <= to);

        if (currency == Currencies.Rsd)
        {
            return mine.Select(t => new ConvertedRow
            {
                Type = t.Type,
                OccurredOn = t.OccurredOn,
                CategoryId = t.CategoryId,
                BillOccurrenceId = t.BillOccurrenceId,
                Currency = t.Currency,
                Amount = t.Amount,
                Value = t.AmountRsd,
            });
        }

        return from t in mine
               from r in db.FxRates.Where(r => r.Date == t.OccurredOn && r.Currency == currency).DefaultIfEmpty()
               select new ConvertedRow
               {
                   Type = t.Type,
                   OccurredOn = t.OccurredOn,
                   CategoryId = t.CategoryId,
                   BillOccurrenceId = t.BillOccurrenceId,
                   Currency = t.Currency,
                   Amount = t.Amount,
                   Value = t.Currency == currency ? t.Amount : t.AmountRsd / r!.RateToRsd,
               };
    }

    private sealed class ConvertedRow
    {
        public TransactionType Type { get; init; }
        public DateOnly OccurredOn { get; init; }
        public Guid? CategoryId { get; init; }
        public Guid? BillOccurrenceId { get; init; }
        public required string Currency { get; init; }
        public decimal Amount { get; init; }
        public decimal Value { get; init; }
    }
}
