using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of GET /api/v1/occurrences/upcoming. <c>today</c> is the phone's own date, which
/// decides what is overdue; left out, the server's UTC date stands in (as D-025).
/// </summary>
public sealed class UpcomingOccurrencesQuery : IValidatableObject
{
    public DateOnly? Today { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // A phone is at most a day either side of UTC; anything further is not its today.
        var utcToday = DateOnly.FromDateTime(DateTime.UtcNow);
        if (Today is { } today && Math.Abs(today.DayNumber - utcToday.DayNumber) > 1)
        {
            yield return new ValidationResult("Today must be the current date.", [nameof(Today)]);
        }
    }
}
