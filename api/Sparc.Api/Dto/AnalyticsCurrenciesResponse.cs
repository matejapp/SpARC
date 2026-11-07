using Sparc.Api.Models;

namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/currencies: how the period's money splits by entry currency (D-042).</summary>
public sealed class AnalyticsCurrenciesResponse
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }

    /// <summary>The display currency of <see cref="CurrencyShare.Total"/>.</summary>
    public required string Currency { get; init; }

    public required TransactionType Type { get; init; }

    /// <summary>Largest converted total first; a currency with no rows is absent.</summary>
    public required List<CurrencyShare> Currencies { get; init; }
}

public sealed class CurrencyShare
{
    /// <summary>The currency the rows were entered in.</summary>
    public required string EntryCurrency { get; init; }

    public required int Count { get; init; }

    /// <summary>The exact sum as entered, in <see cref="EntryCurrency"/>.</summary>
    public required decimal Amount { get; init; }

    /// <summary>The same rows in the display currency, each at its own date's rate.</summary>
    public required decimal Total { get; init; }

    /// <summary>Share of the converted totals, 4 decimals; the shares add up to exactly 1.</summary>
    public required decimal Share { get; init; }
}
