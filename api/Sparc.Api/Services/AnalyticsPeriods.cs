namespace Sparc.Api.Services;

/// <summary>
/// The calendar rules behind the analytics periods (D-042). The app computes the periods it asks
/// for (week, month, quarter, year) on the phone; the API only needs a default, a "previous"
/// period and day counts. Dates are calendar dates; "today" is the UTC date, as D-025.
/// </summary>
public static class AnalyticsPeriods
{
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow);

    public static DateOnly FirstOfMonth(DateOnly date) => new(date.Year, date.Month, 1);

    public static DateOnly LastOfMonth(DateOnly date) => FirstOfMonth(date).AddMonths(1).AddDays(-1);

    /// <summary>The given period, or the current UTC month when neither date was given.</summary>
    public static (DateOnly From, DateOnly To) OrCurrentMonth(DateOnly? from, DateOnly? to)
    {
        if (from is { } f && to is { } t)
        {
            return (f, t);
        }
        var today = Today();
        return (FirstOfMonth(today), LastOfMonth(today));
    }

    /// <summary>
    /// The period of the same length just before. A run of whole calendar months (a month, a
    /// quarter, a year) is compared with the same number of whole months before it — October with
    /// September, not with the 31 days ending 30 September. Anything else: the same number of days.
    /// </summary>
    public static (DateOnly From, DateOnly To) Previous(DateOnly from, DateOnly to)
    {
        if (from.Day == 1 && to == LastOfMonth(to))
        {
            var months = (to.Year - from.Year) * 12 + to.Month - from.Month + 1;
            return (from.AddMonths(-months), from.AddDays(-1));
        }
        var length = to.DayNumber - from.DayNumber + 1;
        return (from.AddDays(-length), from.AddDays(-1));
    }

    /// <summary>
    /// The days an average spreads over: the whole period once it is over or not yet begun, and
    /// for a period running now only the days elapsed, today included — on 10 October a month's
    /// spend so far is divided by 10, not 31.
    /// </summary>
    public static int DaysForAverage(DateOnly from, DateOnly to, DateOnly today) =>
        from <= today && today < to
            ? today.DayNumber - from.DayNumber + 1
            : to.DayNumber - from.DayNumber + 1;

    /// <summary>The first day of every month the period touches, in order.</summary>
    public static IEnumerable<DateOnly> Months(DateOnly from, DateOnly to)
    {
        for (var m = FirstOfMonth(from); m <= to; m = m.AddMonths(1))
        {
            yield return m;
        }
    }
}
