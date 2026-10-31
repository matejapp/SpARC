namespace Sparc.Api.Dto;

/// <summary>One page of a list. Every list endpoint returns this shape (D-024).</summary>
public sealed class PagedResponse<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required int TotalCount { get; init; }
}
