namespace Sparc.Api.Services.Interfaces;

/// <summary>An NBS list rate as the provider reported it.</summary>
public sealed record ProviderRate(decimal RateToRsd, DateOnly ListDate);

/// <summary>One calendar day of a batch answer: the list in force that day.</summary>
public sealed record ProviderDayRate(DateOnly Date, decimal RateToRsd, DateOnly ListDate);

/// <summary>
/// Where NBS middle rates come from. One implementation today (kurs.resenje.org, a free mirror of
/// the NBS lists); the official NBS web service can replace it without touching any caller.
/// </summary>
public interface IFxRateProvider
{
    /// <summary>
    /// The NBS middle rate in force on <paramref name="date"/>: that date's list, or the latest one
    /// issued before it (weekends, holidays, today before NBS publishes, future dates). Null when
    /// NBS has no list that early. Throws <see cref="Common.ServiceUnavailableException"/> when the
    /// provider cannot be reached or answers something unusable.
    /// </summary>
    Task<ProviderRate?> GetMiddleRateAsync(string currency, DateOnly date);

    /// <summary>The most days <see cref="GetMiddleRatesAsync"/> answers in one call.</summary>
    const int MaxBatchDays = 1000;

    /// <summary>
    /// The rate in force on each calendar day from <paramref name="from"/>, for
    /// <paramref name="days"/> days (at most <see cref="MaxBatchDays"/>), in one call. Days before
    /// NBS's first list are simply absent. Same failure rules as the single-day call.
    /// </summary>
    Task<IReadOnlyList<ProviderDayRate>> GetMiddleRatesAsync(string currency, DateOnly from, int days);
}
