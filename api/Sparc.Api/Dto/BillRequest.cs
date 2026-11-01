using System.ComponentModel.DataAnnotations;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>
/// Create and update take the same body, so an update is validated exactly like a create. Rules
/// that need the database — the category, and a first due date in the past being allowed only
/// when it is the one the bill already has — are checked by the service.
/// </summary>
public sealed class BillRequest
{
    // [Required] also refuses a blank or whitespace-only name.
    [Required]
    [StringLength(100)]
    public string Name { get; init; } = string.Empty;

    // Nullable so a missing value is a 400, not a silent default.
    [Required]
    [MoneyAmount]
    public decimal? Amount { get; init; }

    [Required]
    [SupportedCurrency]
    public string Currency { get; init; } = string.Empty;

    [Required]
    public Guid? CategoryId { get; init; }

    /// <summary>
    /// The first due date of the schedule. On an edit, a new date restarts the schedule from it;
    /// the unchanged date keeps it.
    /// </summary>
    [Required]
    [BillDueDate]
    public DateOnly? FirstDueDate { get; init; }

    /// <summary>True repeats every month; false is a one-off bill with a single due date.</summary>
    [Required]
    public bool? Monthly { get; init; }
}
