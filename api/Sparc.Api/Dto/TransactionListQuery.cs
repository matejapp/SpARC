using System.ComponentModel.DataAnnotations;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>
/// Query string of GET /api/v1/transactions. Every filter is optional and they combine with AND;
/// none at all is the whole history, as before filters existed (D-040).
/// </summary>
public sealed class TransactionListQuery : IValidatableObject
{
    /// <summary>Two years, as the occurrence list (D-025): wide enough for any period the app offers.</summary>
    public const int MaxSpanDays = 731;

    // Capped so (Page - 1) * PageSize stays far from int overflow; 10 000 pages is more than
    // any one user's history.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    /// <summary>
    /// A string, not the enum: query-string binding would accept "1" for an enum, and the API
    /// refuses numbers for enums (D-024). Exactly the camelCase names the JSON uses.
    /// </summary>
    [AllowedValues(null, "income", "expense", ErrorMessage = "Type must be income or expense.")]
    public string? Type { get; init; }

    /// <summary>Both dates, inclusive, or neither for no date filter.</summary>
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    /// <summary>One category. One the caller can't see simply matches nothing — never a 404.</summary>
    public Guid? CategoryId { get; init; }

    /// <summary>Only rows whose category was deleted (CategoryId is NULL).</summary>
    public bool Uncategorised { get; init; }

    /// <summary>The currency the row was entered in, any case — not the display currency.</summary>
    [SupportedCurrency]
    public string? Currency { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (From.HasValue != To.HasValue)
        {
            yield return new ValidationResult("Give both from and to, or neither.", [nameof(From), nameof(To)]);
        }
        else if (From > To)
        {
            yield return new ValidationResult("From must not be after to.", [nameof(From)]);
        }
        else if (From is { } from && To is { } to && to.DayNumber - from.DayNumber > MaxSpanDays)
        {
            yield return new ValidationResult($"The range can be at most {MaxSpanDays} days.", [nameof(To)]);
        }

        if (Uncategorised && CategoryId.HasValue)
        {
            yield return new ValidationResult(
                "Filter by a category or by uncategorised, not both.", [nameof(CategoryId)]);
        }
    }
}
