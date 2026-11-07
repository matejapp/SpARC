using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of GET /api/v1/dashboard/summary. Both dates, inclusive, or neither for the
/// current UTC month (D-025).
/// </summary>
public sealed class DashboardSummaryQuery : IValidatableObject
{
    /// <summary>Two years, as the other period queries (D-025, D-040).</summary>
    public const int MaxSpanDays = 731;

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
        else if (From is { } from && To is { } to && to.DayNumber - from.DayNumber > MaxSpanDays)
        {
            // A converted total may fetch rates for the whole range first (D-041), so it is capped.
            yield return new ValidationResult($"The range can be at most {MaxSpanDays} days.", [nameof(To)]);
        }
    }
}
