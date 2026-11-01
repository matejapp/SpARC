using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

/// <summary>
/// A bill the user pays on a schedule. Its months live in <see cref="Occurrences"/>; editing the
/// bill regenerates future unpaid months only, and paid months never change.
/// </summary>
[Index(nameof(UserId))]
[Index(nameof(CategoryId))]
public class RecurringBill : ITimestamped
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    [MaxLength(100)]
    public required string Name { get; set; }

    /// <summary>The current amount; each occurrence keeps the amount it was generated with.</summary>
    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [Column(TypeName = "character(3)")]
    public required string Currency { get; set; }

    public Guid? CategoryId { get; set; }

    /// <summary>Deleting a category keeps the bill, uncategorised, like a transaction.</summary>
    [DeleteBehavior(DeleteBehavior.SetNull)]
    public Category? Category { get; set; }

    /// <summary>Every later due date is computed from this one, so short months never drift it.</summary>
    public DateOnly FirstDueDate { get; set; }

    /// <summary>1 for monthly. Null for a one-off bill, which has exactly one occurrence.</summary>
    public int? IntervalMonths { get; set; }

    /// <summary>Deleting a bill deactivates it, so its paid history survives.</summary>
    public bool IsActive { get; set; }

    public List<BillOccurrence> Occurrences { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
