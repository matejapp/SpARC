using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of the month-based analytics endpoints: <c>month=yyyy-MM</c>, or none for the
/// current UTC month (D-042).
/// </summary>
public sealed class AnalyticsMonthQuery : IValidatableObject
{
    [RegularExpression(@"^\d{4}-(0[1-9]|1[0-2])$", ErrorMessage = "Month must be yyyy-MM.")]
    public string? Month { get; init; }

    /// <summary>
    /// The month's first day; null when none was given (or, before validation, when it doesn't
    /// parse). A method, not a property: model validation reads every property of the query, and it
    /// must not trip over a value the format check is about to refuse.
    /// </summary>
    public DateOnly? FirstDay() =>
        Month is not null && DateOnly.TryParseExact($"{Month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var first)
            ? first
            : null;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // The format attribute refuses anything that doesn't parse.
        if (FirstDay() is not { } first)
        {
            yield break;
        }
        // The years a transaction can have (TransactionDateAttribute): 2000 to next year.
        if (first.Year < 2000 || first.Year > DateTime.UtcNow.Year + 1)
        {
            yield return new ValidationResult("Month must be between 2000-01 and next year.", [nameof(Month)]);
        }
    }
}
