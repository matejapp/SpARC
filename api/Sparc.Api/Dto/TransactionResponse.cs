using Sparc.Api.Models;

namespace Sparc.Api.Dto;

public sealed class TransactionResponse
{
    public required Guid Id { get; init; }
    public required TransactionType Type { get; init; }
    public required decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required decimal RateToRsd { get; init; }
    public required decimal AmountRsd { get; init; }

    /// <summary>Null when the category was deleted after the transaction was saved.</summary>
    public required Guid? CategoryId { get; init; }
    public required string? CategoryName { get; init; }

    public required DateOnly OccurredOn { get; init; }
    public required string? Description { get; init; }

    /// <summary>Set when the transaction was confirmed from a scanned receipt (D-047).</summary>
    public required string? FiscalReceiptNumber { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}
