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

    /// <summary>
    /// The amount in <see cref="DisplayCurrency"/>: the caller's preferred currency, or the one a
    /// single read asked for (D-051). Converted at the NBS rate of the row's own date, never
    /// stored. Null when there is no rate for that date; show <see cref="Amount"/> then.
    /// </summary>
    public required string DisplayCurrency { get; init; }
    public required decimal? DisplayAmount { get; init; }

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
