using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

public interface IFxRateRepository
{
    Task<FxRate?> FindAsync(string currency, DateOnly date);

    /// <summary>
    /// The final row of <paramref name="currency"/> closest to <paramref name="date"/> (either side,
    /// excluding the date itself), within <paramref name="maxDays"/> days. Null when there is none.
    /// </summary>
    Task<FxRate?> FindNearestFinalAsync(string currency, DateOnly date, int maxDays);

    /// <summary>
    /// Inserts the row, or replaces it while the stored one is still provisional. A final row is
    /// never changed, and two requests writing the same date at once are harmless.
    /// </summary>
    Task UpsertAsync(FxRate rate);

    /// <summary>
    /// Every date that has a transaction (any user) and lacks a final rate in at least one of
    /// <paramref name="currencies"/>, oldest first. For the fx-backfill command only.
    /// </summary>
    Task<List<DateOnly>> ListTransactionDatesWithoutFinalRatesAsync(IReadOnlyList<string> currencies);
}
