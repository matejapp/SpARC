using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Validators;

/// <summary>
/// Not before 2000-01-01 and not after tomorrow (UTC). Tomorrow, because the phone's "today" is
/// up to a day ahead of UTC east of Greenwich. Null is left to [Required].
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class TransactionDateAttribute()
    : ValidationAttribute("Date must be between 2000-01-01 and today.")
{
    private static readonly DateOnly Earliest = new(2000, 1, 1);

    public override bool IsValid(object? value) =>
        value is null
        || (value is DateOnly date
            && date >= Earliest
            && date <= DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1));
}
