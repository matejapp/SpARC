namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/summary: the headline numbers, now and the period before (D-042).</summary>
public sealed class AnalyticsSummaryResponse
{
    /// <summary>The display currency of every amount (the caller's preferred currency).</summary>
    public required string Currency { get; init; }

    public required PeriodFigures Current { get; init; }
    public required PeriodFigures Previous { get; init; }

    /// <summary>Current minus previous, for each number; the app draws the arrow from the sign.</summary>
    public required FigureChanges Change { get; init; }
}

public sealed class PeriodFigures
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }

    public required decimal Income { get; init; }
    public required decimal Expense { get; init; }

    /// <summary>Income minus expense; negative when more went out than came in.</summary>
    public required decimal Net { get; init; }

    /// <summary>Net ÷ income as a fraction (0.2512 = 25.12 %), 4 decimals; null when income is 0.</summary>
    public required decimal? SavingsRate { get; init; }

    /// <summary>The days <see cref="AverageDailySpend"/> is spread over: elapsed days for a running period.</summary>
    public required int Days { get; init; }

    /// <summary>Expense ÷ <see cref="Days"/>, rounded to 2 decimals.</summary>
    public required decimal AverageDailySpend { get; init; }
}

public sealed class FigureChanges
{
    public required decimal Income { get; init; }
    public required decimal Expense { get; init; }
    public required decimal Net { get; init; }

    /// <summary>In fraction points (0.0300 = 3 percentage points); null when either rate is null.</summary>
    public required decimal? SavingsRate { get; init; }

    public required decimal AverageDailySpend { get; init; }
}
