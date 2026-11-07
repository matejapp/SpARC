namespace Sparc.Api.Dto;

/// <summary>
/// GET /api/v1/analytics/categories/monthly: spending per month for the top categories of the
/// period plus one Other bucket, for stacked bars (D-042).
/// </summary>
public sealed class AnalyticsCategoryMonthsResponse
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }
    public required string Currency { get; init; }

    /// <summary>The stack's layers, largest over the period first; Other, if any, last.</summary>
    public required List<CategorySeries> Series { get; init; }

    /// <summary>Every month the period touches; each month's amounts line up with <see cref="Series"/>.</summary>
    public required List<CategoryMonth> Months { get; init; }
}

public sealed class CategorySeries
{
    /// <summary>Null for the uncategorised bucket and for Other.</summary>
    public required Guid? CategoryId { get; init; }

    /// <summary>Null for the uncategorised bucket and for Other.</summary>
    public required string? Name { get; init; }

    /// <summary>Every category outside the top ones, together.</summary>
    public required bool IsOther { get; init; }
}

public sealed class CategoryMonth
{
    /// <summary>"2026-10".</summary>
    public required string Month { get; init; }

    /// <summary>One amount per series, in the same order; zeros for a month without spending.</summary>
    public required List<decimal> Amounts { get; init; }
}
