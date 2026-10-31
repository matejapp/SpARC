using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>Query string of GET /api/v1/transactions. Filters join this class in iteration 3.</summary>
public sealed class TransactionListQuery
{
    // Capped so (Page - 1) * PageSize stays far from int overflow; 10 000 pages is more than
    // any one user's history.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
