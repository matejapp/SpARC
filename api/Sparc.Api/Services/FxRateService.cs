using Sparc.Api.Common;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// NBS middle rates per calendar date, stored in FxRates on first use. A transaction freezes the
/// rate in force when it is entered: for a past date that date's final list; for today before NBS
/// publishes, or a future date, the latest published list — the one legally in force until NBS
/// issues the next. The stored row for such a date stays provisional and is refreshed until it is
/// final, so later reads (display conversion) get the list that finally applied.
/// </summary>
public sealed class FxRateService(
    IFxRateRepository rates,
    IFxRateProvider provider,
    FxRateOptions options,
    ILogger<FxRateService> logger) : IFxRateService
{
    // NBS publishes around 08:00 Belgrade time. A provisional row is re-checked at most this often,
    // so a busy morning costs a handful of provider calls, not one per request.
    private static readonly TimeSpan ProvisionalRefresh = TimeSpan.FromMinutes(10);

    private static readonly TimeZoneInfo Belgrade = TimeZoneInfo.FindSystemTimeZoneById("Europe/Belgrade");

    public async Task<FxRate?> GetRateAsync(string currency, DateOnly date)
    {
        var code = currency.ToUpperInvariant();
        if (!Currencies.Foreign.Contains(code))
        {
            // RSD has no row (its rate is 1) and anything else is not a currency we support:
            // a caller bug, not bad input.
            throw new ArgumentOutOfRangeException(nameof(currency), currency, "Only EUR and USD have NBS rates.");
        }

        var stored = await rates.FindAsync(code, date);
        var today = TodayInBelgrade();

        if (stored is { IsFinal: true })
        {
            return stored;
        }
        if (stored is not null && date >= today && DateTime.UtcNow - stored.FetchedAt < ProvisionalRefresh)
        {
            return stored;
        }

        var fetched = await provider.GetMiddleRateAsync(code, date);
        if (fetched is null)
        {
            return null;
        }
        await EnsurePlausibleAsync(code, date, fetched.RateToRsd);

        await rates.UpsertAsync(new FxRate
        {
            Date = date,
            Currency = code,
            RateToRsd = fetched.RateToRsd,
            ListDate = fetched.ListDate,
            // Final once no later list can apply: the date is over, or its own list is out.
            IsFinal = date < today || fetched.ListDate == date,
            FetchedAt = DateTime.UtcNow,
        });

        // Read back what is stored: a concurrent request may have written the final row first,
        // and the upsert leaves a final row alone.
        return await rates.FindAsync(code, date)
               ?? throw new InvalidOperationException($"FxRates row {code} {date:yyyy-MM-dd} missing right after its upsert.");
    }

    public async Task<FxBackfillResult> BackfillAsync()
    {
        var dates = await rates.ListTransactionDatesWithoutFinalRatesAsync(Currencies.Foreign);
        logger.LogInformation("fx-backfill: {Count} transaction dates need EUR/USD rates", dates.Count);

        var checkedDates = 0;
        var withoutRate = 0;
        foreach (var date in dates)
        {
            try
            {
                foreach (var currency in Currencies.Foreign)
                {
                    if (await GetRateAsync(currency, date) is null)
                    {
                        withoutRate++;
                        logger.LogWarning("fx-backfill: NBS has no {Currency} rate for {Date:yyyy-MM-dd}", currency, date);
                        break;
                    }
                }
            }
            // The provider already logged why. Stop rather than hammer a failing service; every
            // date done so far is stored, so a re-run continues where this one stopped.
            catch (ServiceUnavailableException)
            {
                logger.LogError("fx-backfill: stopped at {Date:yyyy-MM-dd} after {Done} of {Count} dates",
                    date, checkedDates, dates.Count);
                return new FxBackfillResult(checkedDates, withoutRate, Completed: false);
            }

            checkedDates++;
            await Task.Delay(options.BackfillDelayMilliseconds);
        }

        logger.LogInformation("fx-backfill: done, {Done} dates checked, {Without} without an NBS rate",
            checkedDates, withoutRate);
        return new FxBackfillResult(checkedDates, withoutRate, Completed: true);
    }

    /// <summary>
    /// A last line of defence against a wrong value from the provider (a third-party mirror):
    /// a stored rate is frozen into transactions for good, so one that jumps more than
    /// <see cref="MaxDeviation"/> from the nearest final rate within <see cref="NeighbourDays"/>
    /// days is refused, not stored. EUR/RSD moves well under 1 % a month and USD/RSD a few percent,
    /// so a real rate never trips it. With no neighbour in the window (the first rates, or a date
    /// far from any stored one) the check cannot run and the rate is accepted.
    /// </summary>
    private async Task EnsurePlausibleAsync(string currency, DateOnly date, decimal rate)
    {
        var neighbour = await rates.FindNearestFinalAsync(currency, date, NeighbourDays);
        if (neighbour is null)
        {
            return;
        }

        var deviation = Math.Abs(rate - neighbour.RateToRsd) / neighbour.RateToRsd;
        if (deviation > MaxDeviation)
        {
            logger.LogError(
                "Refused NBS {Currency} rate {Rate} for {Date:yyyy-MM-dd}: {Deviation:P1} away from {Neighbour} on {NeighbourDate:yyyy-MM-dd}",
                currency, rate, date, deviation, neighbour.RateToRsd, neighbour.Date);
            throw new ServiceUnavailableException(
                "Exchange rates are unavailable right now. Try again shortly.",
                new InvalidDataException($"Implausible {currency} rate {rate} for {date:yyyy-MM-dd}."));
        }
    }

    private const decimal MaxDeviation = 0.10m;
    private const int NeighbourDays = 31;

    private static DateOnly TodayInBelgrade() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Belgrade));
}
