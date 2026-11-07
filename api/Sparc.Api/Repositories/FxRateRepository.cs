using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

public sealed class FxRateRepository(SparcDbContext db) : IFxRateRepository
{
    // Primary-key lookup on (Date, Currency).
    public Task<FxRate?> FindAsync(string currency, DateOnly date) =>
        db.FxRates.AsNoTracking().FirstOrDefaultAsync(r => r.Date == date && r.Currency == currency);

    // Two primary-key range reads of one row each — the nearest final row before and after.
    public async Task<FxRate?> FindNearestFinalAsync(string currency, DateOnly date, int maxDays)
    {
        var before = await db.FxRates.AsNoTracking()
            .Where(r => r.Currency == currency && r.IsFinal && r.Date < date && r.Date >= date.AddDays(-maxDays))
            .OrderByDescending(r => r.Date)
            .FirstOrDefaultAsync();
        var after = await db.FxRates.AsNoTracking()
            .Where(r => r.Currency == currency && r.IsFinal && r.Date > date && r.Date <= date.AddDays(maxDays))
            .OrderBy(r => r.Date)
            .FirstOrDefaultAsync();

        if (before is null || after is null)
        {
            return before ?? after;
        }
        return date.DayNumber - before.Date.DayNumber <= after.Date.DayNumber - date.DayNumber ? before : after;
    }

    // One statement, parameterised by ExecuteSqlAsync's interpolation. ON CONFLICT makes two
    // concurrent first fetches of a date harmless, and the WHERE is what keeps a final row final:
    // it is the only write path to this table.
    public Task UpsertAsync(FxRate rate) =>
        db.Database.ExecuteSqlAsync($"""
            INSERT INTO "FxRates" ("Date", "Currency", "RateToRsd", "ListDate", "IsFinal", "FetchedAt")
            VALUES ({rate.Date}, {rate.Currency}, {rate.RateToRsd}, {rate.ListDate}, {rate.IsFinal}, {rate.FetchedAt})
            ON CONFLICT ("Date", "Currency") DO UPDATE
            SET "RateToRsd" = EXCLUDED."RateToRsd",
                "ListDate"  = EXCLUDED."ListDate",
                "IsFinal"   = EXCLUDED."IsFinal",
                "FetchedAt" = EXCLUDED."FetchedAt"
            WHERE "FxRates"."IsFinal" = FALSE
            """);

    // IgnoreQueryFilters: the backfill runs outside any request, for every user's transaction
    // dates, and reads the dates only — no amount, no owner, nothing returned to a client.
    // Unbounded on purpose: at most one row per calendar day since 2000, for an operator command.
    public Task<List<DateOnly>> ListTransactionDatesWithoutFinalRatesAsync(IReadOnlyList<string> currencies) =>
        db.Transactions.IgnoreQueryFilters().AsNoTracking()
            .Select(t => t.OccurredOn)
            .Distinct()
            .Where(date => db.FxRates.Count(r => r.Date == date && r.IsFinal && currencies.Contains(r.Currency))
                           < currencies.Count)
            .OrderBy(date => date)
            .ToListAsync();
}
