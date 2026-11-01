using System.ComponentModel.DataAnnotations;
using Sparc.Api.Services;

namespace Sparc.Api.Validators;

/// <summary>
/// Not before 2000-01-01 and within the generation horizon (12 months from today, UTC, plus a day
/// because the phone's "today" can be ahead of UTC). A date in the past is refused by the service
/// unless it is the bill's existing date, which only the service can know. Null is left to
/// [Required].
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class BillDueDateAttribute()
    : ValidationAttribute($"Due date must be within the next {BillSchedule.HorizonMonths} months.")
{
    private static readonly DateOnly Earliest = new(2000, 1, 1);

    public override bool IsValid(object? value) =>
        value is null
        || (value is DateOnly date
            && date >= Earliest
            && date <= BillSchedule.Today().AddMonths(BillSchedule.HorizonMonths).AddDays(1));
}
