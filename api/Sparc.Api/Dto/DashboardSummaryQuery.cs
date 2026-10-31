using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of GET /api/v1/dashboard/summary. Both dates, inclusive, or neither for the
/// current UTC month (D-025).
/// </summary>
public sealed class DashboardSummaryQuery : IValidatableObject
{
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (From.HasValue != To.HasValue)
        {
            yield return new ValidationResult(
                "Give both from and to, or neither for the current month.", [nameof(From), nameof(To)]);
        }
        else if (From > To)
        {
            yield return new ValidationResult("From must not be after to.", [nameof(From)]);
        }
    }
}
