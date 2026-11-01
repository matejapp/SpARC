namespace Sparc.Api.Dto;

public sealed class BillResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }

    /// <summary>The current amount. Months already generated or paid keep their own.</summary>
    public required decimal Amount { get; init; }
    public required string Currency { get; init; }

    /// <summary>Null when the category was deleted after the bill was saved.</summary>
    public required Guid? CategoryId { get; init; }
    public required string? CategoryName { get; init; }

    public required DateOnly FirstDueDate { get; init; }
    public required bool Monthly { get; init; }

    /// <summary>
    /// Due date of the earliest unpaid month — in the past when that month is overdue. Null when
    /// nothing is unpaid.
    /// </summary>
    public required DateOnly? NextDueDate { get; init; }

    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}
