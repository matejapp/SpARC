namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/daily: expense and income per day of a month (D-042).</summary>
public sealed class AnalyticsDailyResponse
{
    /// <summary>"2026-11".</summary>
    public required string Month { get; init; }

    public required string Currency { get; init; }

    /// <summary>Every day of the month, the 1st first; a day without rows is zeros.</summary>
    public required List<DailyTotal> Days { get; init; }
}

public sealed class DailyTotal
{
    public required DateOnly Date { get; init; }
    public required decimal Expense { get; init; }
    public required decimal Income { get; init; }
}
