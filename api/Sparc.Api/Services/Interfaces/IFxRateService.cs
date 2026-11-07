using Sparc.Api.Models;

namespace Sparc.Api.Services.Interfaces;

public sealed record FxBackfillResult(int DatesChecked, int DatesWithoutRate, bool Completed);

/// <summary>The pair a transaction stores and never recalculates (D-004, D-038).</summary>
public sealed record FrozenAmount(decimal RateToRsd, decimal AmountRsd);

public interface IFxRateService
{
    /// <summary>
    /// The NBS middle rate of EUR or USD for <paramref name="date"/>, from FxRates, fetched and
    /// stored on first use. Null when NBS has no rate for that date (before 2002-05-16) — a fact about the
    /// date, for the caller to turn into a validation error. Throws
    /// <see cref="Common.ServiceUnavailableException"/> (503) when a fetch is needed and fails.
    /// </summary>
    Task<FxRate?> GetRateAsync(string currency, DateOnly date);

    /// <summary>
    /// The rate and RSD value a new entry of <paramref name="amount"/> freezes: RSD at 1 without a
    /// lookup, EUR and USD at the NBS rate for <paramref name="date"/>. Null when there is no rate
    /// for the date (the caller names its own date field in the 400). A value too large for
    /// numeric(18,2) in RSD is a 400 on Amount; a provider failure is the 503 above.
    /// </summary>
    Task<FrozenAmount?> FreezeAsync(string currency, decimal amount, DateOnly date);

    /// <summary>
    /// Makes sure every date that has a transaction has final EUR and USD rows. Safe to re-run:
    /// dates already final are skipped. Stops at the first provider failure (Completed = false).
    /// </summary>
    Task<FxBackfillResult> BackfillAsync();
}
