using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

[Index(nameof(UserId), nameof(OccurredOn), IsDescending = new[] { false, true })]
[Index(nameof(UserId), nameof(CategoryId))]
// Postgres treats NULLs as distinct, so a plain unique index already means "unique where not null".
[Index(nameof(BillOccurrenceId), IsUnique = true)]
public class Transaction : ITimestamped
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public TransactionType Type { get; set; }

    /// <summary>As entered, in <see cref="Currency"/>.</summary>
    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [Column(TypeName = "character(3)")]
    public required string Currency { get; set; }

    // Frozen at entry time and never recalculated (D-004).
    [Precision(18, 6)]
    public decimal RateToRsd { get; set; }

    [Precision(18, 2)]
    public decimal AmountRsd { get; set; }

    public Guid? CategoryId { get; set; }

    /// <summary>Deleting a category keeps its transactions, uncategorised.</summary>
    [DeleteBehavior(DeleteBehavior.SetNull)]
    public Category? Category { get; set; }

    /// <summary>The day the money moved, not the day it was typed.</summary>
    public DateOnly OccurredOn { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// Set when this expense came from a paid bill. Unique, so a bill is counted once.
    /// No FK yet: BillOccurrences arrives in iteration 2.
    /// </summary>
    public Guid? BillOccurrenceId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
