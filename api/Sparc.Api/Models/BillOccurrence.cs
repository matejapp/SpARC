using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

/// <summary>
/// One month of a bill. Its own row is why paying October does not change November. The
/// relationship to the bill — a composite key that also pins <see cref="UserId"/> — and the CHECKs
/// are in BillOccurrenceConfiguration.
/// </summary>
[Index(nameof(UserId), nameof(DueDate))]
// One occurrence per bill per month: moving the due day can never add a second one.
[Index(nameof(RecurringBillId), nameof(DueMonth), IsUnique = true)]
public class BillOccurrence : ITimestamped
{
    public Guid Id { get; set; }

    /// <summary>Always the bill's owner — the composite foreign key makes any other value fail.</summary>
    public Guid UserId { get; set; }

    public Guid RecurringBillId { get; set; }
    public RecurringBill RecurringBill { get; set; } = null!;

    public DateOnly DueDate { get; set; }

    /// <summary>First day of <see cref="DueDate"/>'s month, computed by the database.</summary>
    public DateOnly DueMonth { get; private set; }

    public BillOccurrenceStatus Status { get; set; }

    /// <summary>Set exactly when <see cref="Status"/> is paid.</summary>
    public DateTime? PaidAt { get; set; }

    /// <summary>Copied from the bill at generation, so a later edit never rewrites this month.</summary>
    [Precision(18, 2)]
    public decimal AmountAtDue { get; set; }

    [Column(TypeName = "character(3)")]
    public required string CurrencyAtDue { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
