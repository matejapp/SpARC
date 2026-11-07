namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/bills: what recurring bills took and what they still ask (D-042).</summary>
public sealed class AnalyticsBillsResponse
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }
    public required string Currency { get; init; }

    /// <summary>Expenses that came from paying a bill, by the expense's date, in the display currency.</summary>
    public required PaidBills Paid { get; init; }

    /// <summary>Unpaid months of active bills due in the period, overdue ones included.</summary>
    public required UnpaidBills Unpaid { get; init; }

    /// <summary>The period's whole expense, the same number as the summary's.</summary>
    public required decimal Expense { get; init; }

    /// <summary>Paid bills ÷ expense, a fraction with 4 decimals; null when there was no expense.</summary>
    public required decimal? RecurringShare { get; init; }
}

public sealed class PaidBills
{
    public required int Count { get; init; }
    public required decimal Total { get; init; }
}

public sealed class UnpaidBills
{
    public required int Count { get; init; }

    /// <summary>What is owed, exactly, in each bill's own currency; largest count first.</summary>
    public required List<CurrencyAmount> ByCurrency { get; init; }

    /// <summary>
    /// All of it in the display currency at today's NBS rates. Each bill is paid at the rate of
    /// the day it is paid (D-039), so this is a forecast unless every bill is in the display
    /// currency — see <see cref="IsEstimate"/>.
    /// </summary>
    public required decimal EstimatedTotal { get; init; }

    /// <summary>True when some unpaid bill is in another currency than the display currency.</summary>
    public required bool IsEstimate { get; init; }
}

public sealed class CurrencyAmount
{
    public required string Currency { get; init; }
    public required int Count { get; init; }

    /// <summary>The exact sum in <see cref="Currency"/>, not converted.</summary>
    public required decimal Amount { get; init; }
}
