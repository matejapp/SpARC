namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/trend: income, expense and net per month (D-042).</summary>
public sealed class AnalyticsTrendResponse
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }
    public required string Currency { get; init; }

    /// <summary>Every month the period touches, oldest first; a month with no rows is zeros.</summary>
    public required List<TrendMonth> Months { get; init; }
}

public sealed class TrendMonth
{
    /// <summary>"2026-10".</summary>
    public required string Month { get; init; }

    public required decimal Income { get; init; }
    public required decimal Expense { get; init; }
    public required decimal Net { get; init; }
}
