namespace Sparc.Api.Services;

/// <summary>
/// The due-date arithmetic of recurring bills, kept pure so it can be read and reasoned about on
/// its own. The database guarantees one occurrence per bill per month; this decides which dates.
/// </summary>
public static class BillSchedule
{
    /// <summary>How far ahead occurrences are generated, on create and on every edit.</summary>
    public const int HorizonMonths = 12;

    /// <summary>
    /// The server's today, UTC. The phone's today can be a day either side of it; callers that
    /// compare a client date against it allow for that (D-024).
    /// </summary>
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>First day of the date's month — the same value the database computes as DueMonth.</summary>
    public static DateOnly MonthOf(DateOnly date) => new(date.Year, date.Month, 1);

    /// <summary>
    /// The due dates from <paramref name="from"/> (inclusive) up to the horizon (exclusive), in
    /// order. Month n is always <c>anchor + n × interval</c> months — computed from the anchor,
    /// never from the previous date, so the 31st becomes the 28th in February and the 31st again
    /// in March (<see cref="DateOnly.AddMonths"/> clamps to the month's last day). A one-off bill
    /// (<paramref name="intervalMonths"/> null) has the anchor as its only date. The anchor itself
    /// is never cut off by the horizon.
    /// </summary>
    public static IEnumerable<DateOnly> DueDates(DateOnly anchor, int? intervalMonths, DateOnly from, DateOnly today)
    {
        var horizon = today.AddMonths(HorizonMonths);

        if (intervalMonths is not { } interval)
        {
            if (anchor >= from)
            {
                yield return anchor;
            }
            yield break;
        }

        for (var n = 0; ; n++)
        {
            var due = anchor.AddMonths(n * interval);
            if (n > 0 && due >= horizon)
            {
                yield break;
            }
            if (due >= from)
            {
                yield return due;
            }
        }
    }
}
