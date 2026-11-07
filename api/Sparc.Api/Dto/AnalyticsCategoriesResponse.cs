using Sparc.Api.Models;

namespace Sparc.Api.Dto;

/// <summary>GET /api/v1/analytics/categories: where the money went, per category (D-042).</summary>
public sealed class AnalyticsCategoriesResponse
{
    public required DateOnly From { get; init; }
    public required DateOnly To { get; init; }
    public required string Currency { get; init; }
    public required TransactionType Type { get; init; }

    /// <summary>The period's total of this type, rounded once — the same number as the summary's.</summary>
    public required decimal Total { get; init; }

    /// <summary>Largest total first. Rows whose category was deleted are one uncategorised bucket.</summary>
    public required List<CategoryShare> Categories { get; init; }
}

public sealed class CategoryShare
{
    /// <summary>Null for the uncategorised bucket.</summary>
    public required Guid? CategoryId { get; init; }

    /// <summary>
    /// Null for the uncategorised bucket. The app colours a category by its name and kind
    /// (D-032), so the name is also the colour key.
    /// </summary>
    public required string? Name { get; init; }

    public required decimal Total { get; init; }

    /// <summary>A fraction with 4 decimals; the shares of one answer add up to exactly 1.</summary>
    public required decimal Share { get; init; }

    public required int Count { get; init; }
}
