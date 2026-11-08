using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Services.Interfaces;

/// <summary>
/// Transactions shown in one currency (D-051), each at its own date's rate, by the rule the
/// totals use (D-041): RSD is the frozen AmountRsd; a row entered in the display currency is its
/// own Amount; any other row is AmountRsd divided by that date's NBS rate. Never stored.
/// </summary>
public sealed class DisplayRates(string currency, IReadOnlyDictionary<DateOnly, decimal> rates)
{
    public string Currency { get; } = currency;

    /// <summary>Null when there is no rate for the row's date: the app then shows it as entered.</summary>
    public decimal? Convert(Transaction row) =>
        Currency == Currencies.Rsd ? row.AmountRsd
        : row.Currency == Currency ? row.Amount
        : rates.TryGetValue(row.OccurredOn, out var rate) ? Money.FromRsd(row.AmountRsd, rate)
        : null;
}

public interface IDisplayCurrencyService
{
    /// <summary>
    /// How <paramref name="rows"/> show in <paramref name="currency"/>, or in the caller's
    /// preferred currency when it is null. Fetches the rates the rows need; never a 503 (D-051).
    /// </summary>
    Task<DisplayRates> RatesForAsync(Guid userId, string? currency, IReadOnlyCollection<Transaction> rows);

    /// <summary>
    /// The caller's preferred currency, with FxRates made complete for every one of their
    /// transaction dates in the period that needs converting to it (D-041). After it returns, no
    /// aggregate over the period can miss a rate. A date NBS has no rate for is a 400 on From;
    /// a provider failure is a 503.
    /// </summary>
    Task<string> PrepareAsync(Guid userId, DateOnly from, DateOnly to);
}
