namespace Sparc.Api.Dto;

/// <summary>
/// GET /api/v1/analytics/pace: running expense through a month and the month before, aligned by
/// day of month (D-042).
/// </summary>
public sealed class AnalyticsPaceResponse
{
    /// <summary>"2026-11".</summary>
    public required string Month { get; init; }

    /// <summary>"2026-10".</summary>
    public required string PreviousMonth { get; init; }

    public required string Currency { get; init; }

    /// <summary>Day 1 to the longer month's last day.</summary>
    public required List<PaceDay> Days { get; init; }
}

public sealed class PaceDay
{
    public required int Day { get; init; }

    /// <summary>
    /// Expense from the 1st through this day, rounded once. Null past the month's last day, and
    /// for days after today (the line stops at today).
    /// </summary>
    public required decimal? Current { get; init; }

    /// <summary>The same for the month before; null past its last day.</summary>
    public required decimal? Previous { get; init; }
}
