using Sparc.Api.Models;

namespace Sparc.Api.Dto;

/// <summary>
/// One month of a bill. "Overdue" is not a status: it is pending with a due date before the
/// phone's today, which only the phone knows exactly.
/// </summary>
public sealed class OccurrenceResponse
{
    public required Guid Id { get; init; }
    public required Guid BillId { get; init; }
    public required string BillName { get; init; }

    /// <summary>The bill's category now; null when it was deleted.</summary>
    public required Guid? CategoryId { get; init; }
    public required string? CategoryName { get; init; }

    public required DateOnly DueDate { get; init; }
    public required BillOccurrenceStatus Status { get; init; }

    /// <summary>The month's own amount, fixed when it was generated.</summary>
    public required decimal Amount { get; init; }
    public required string Currency { get; init; }

    public required DateTime? PaidAt { get; init; }

    /// <summary>The expense the payment created; null while pending.</summary>
    public required Guid? TransactionId { get; init; }
}
