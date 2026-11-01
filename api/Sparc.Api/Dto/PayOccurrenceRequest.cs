using System.ComponentModel.DataAnnotations;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>Body of POST /api/v1/occurrences/{id}/pay.</summary>
public sealed class PayOccurrenceRequest
{
    /// <summary>
    /// The day the bill was paid, in the phone's own calendar — it becomes the expense's
    /// OccurredOn, so it follows a transaction's date rule (D-024).
    /// </summary>
    [Required]
    [TransactionDate]
    public DateOnly? PaidOn { get; init; }
}
