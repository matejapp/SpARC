using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

/// <summary>
/// The National Bank of Serbia middle rate of one currency to RSD for one calendar date. Shared
/// reference data, not user-owned: no UserId, no query filter, no ownership guard.
/// <para>
/// A row is <b>provisional</b> while a later NBS list could still apply to its date (today before
/// NBS publishes, or a future date) and <b>final</b> after that. A provisional row is refreshed
/// until it is final; a final row never changes. The only write path is
/// <c>FxRateRepository.UpsertAsync</c>, whose SQL cannot touch a final row. Properties are
/// init-only so a tracked EF update cannot change one either.
/// </para>
/// </summary>
[PrimaryKey(nameof(Date), nameof(Currency))]
public class FxRate
{
    /// <summary>The calendar date the rate is for (a transaction's OccurredOn).</summary>
    public DateOnly Date { get; init; }

    /// <summary>EUR or USD. RSD is the pivot, its rate is 1 and is never stored.</summary>
    [Column(TypeName = "character(3)")]
    public required string Currency { get; init; }

    /// <summary>RSD for one unit of <see cref="Currency"/>.</summary>
    [Precision(18, 6)]
    public decimal RateToRsd { get; init; }

    /// <summary>
    /// The date of the NBS list the rate comes from: <see cref="Date"/> on a working day, the last
    /// working day before it at weekends and holidays.
    /// </summary>
    public DateOnly ListDate { get; init; }

    public bool IsFinal { get; init; }

    /// <summary>When the rate was last read from the provider. UTC.</summary>
    public DateTime FetchedAt { get; init; }
}
