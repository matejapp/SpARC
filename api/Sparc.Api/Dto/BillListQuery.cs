using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>Query string of GET /api/v1/bills. Same paging limits as transactions (D-024).</summary>
public sealed class BillListQuery
{
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
