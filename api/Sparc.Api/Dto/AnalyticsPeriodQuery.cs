using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of the period-based analytics endpoints. Both dates, inclusive, or neither for
/// the current UTC month (D-025); at most 731 days, as every period query (D-042).
/// </summary>
public class AnalyticsPeriodQuery : IValidatableObject
{
    public const int MaxSpanDays = 731;

    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    public virtual IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
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
            yield return new ValidationResult($"The range can be at most {MaxSpanDays} days.", [nameof(To)]);
        }
    }
}
