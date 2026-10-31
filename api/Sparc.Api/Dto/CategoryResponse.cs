using Sparc.Api.Models;

namespace Sparc.Api.Dto;

public sealed class CategoryResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required TransactionType Kind { get; init; }

    /// <summary>Shared by every user; cannot be deleted.</summary>
    public required bool IsSystem { get; init; }
}
