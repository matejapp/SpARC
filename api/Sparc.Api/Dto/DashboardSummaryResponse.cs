namespace Sparc.Api.Dto;

public sealed class DashboardSummaryResponse
{
    /// <summary>The period actually used, inclusive — the current month when none was given.</summary>
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }

    /// <summary>
    /// The currency of the totals: the caller's preferred currency (D-041). The app reads it
    /// rather than assuming RSD.
    /// </summary>
    public required string Currency { get; init; }

    public required decimal TotalIncome { get; init; }
    public required decimal TotalExpense { get; init; }

    /// <summary>Income minus expense; negative when more went out than came in.</summary>
    public required decimal Difference { get; init; }
}
