using Sparc.Api.Models;

namespace Sparc.Api.Services.Interfaces;

public sealed record FxBackfillResult(int DatesChecked, int DatesWithoutRate, bool Completed);

public interface IFxRateService
{
    /// <summary>
    /// The NBS middle rate of EUR or USD for <paramref name="date"/>, from FxRates, fetched and
    /// stored on first use. Null when NBS has no rate for that date (before 2003) — a fact about the
    /// date, for the caller to turn into a validation error. Throws
    /// <see cref="Common.ServiceUnavailableException"/> (503) when a fetch is needed and fails.
    /// </summary>
    Task<FxRate?> GetRateAsync(string currency, DateOnly date);

    /// <summary>
    /// Makes sure every date that has a transaction has final EUR and USD rows. Safe to re-run:
    /// dates already final are skipped. Stops at the first provider failure (Completed = false).
    /// </summary>
    Task<FxBackfillResult> BackfillAsync();
}
