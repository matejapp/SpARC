using System.ComponentModel.DataAnnotations;
using Sparc.Api.Common;
using Sparc.Api.Models;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>
/// Create and update take the same body, so an update is validated exactly like a create.
/// Rules that need the database — the category is visible to this user and matches the type —
/// are checked by the service.
/// </summary>
public sealed class TransactionRequest
{
    // Nullable so a missing value is a 400, not a silent default.
    [Required]
    public TransactionType? Type { get; init; }

    [Required]
    [MoneyAmount]
    public decimal? Amount { get; init; }

    [Required]
    [SupportedCurrency]
    public string Currency { get; init; } = string.Empty;

    [Required]
    public Guid? CategoryId { get; init; }

    [Required]
    [TransactionDate]
    public DateOnly? OccurredOn { get; init; }

    [StringLength(500)]
    public string? Description { get; init; }

    /// <summary>
    /// The receipt number from a scan's draft (D-047), so the same receipt can't be entered
    /// twice. Read on create only; an update leaves a transaction's receipt number as it was.
    /// </summary>
    [StringLength(FiscalReceiptNumbers.MaxLength)]
    [RegularExpression(FiscalReceiptNumbers.Pattern, ErrorMessage = "This isn't a fiscal receipt number.")]
    public string? FiscalReceiptNumber { get; init; }
}
