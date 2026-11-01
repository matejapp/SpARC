using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of GET /api/v1/occurrences. Both dates, inclusive, or neither for the current
/// UTC month (D-025). The span is capped, which is what bounds the answer: a range of months
/// holds at most one occurrence per bill per month, so the list is not paged.
/// </summary>
public sealed class OccurrenceListQuery : IValidatableObject
{
    /// <summary>Two years: the bill detail's history plus the 12-month schedule fits in it.</summary>
    public const int MaxSpanDays = 731;

    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    /// <summary>Only this bill's months. Another user's bill id simply matches nothing.</summary>
    public Guid? BillId { get; init; }

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
            yield return new ValidationResult($"The range can be at most {MaxSpanDays} days.", [nameof(To)]);
        }
    }
}
