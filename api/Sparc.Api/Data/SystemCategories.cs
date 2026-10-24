using Sparc.Api.Models;

namespace Sparc.Api.Data;

/// <summary>
/// The shared category set every user sees (UserId = NULL, IsSystem = true). Seeded by
/// migration with fixed ids so every database has the same ones. Changing this list means
/// adding a migration.
/// </summary>
public static class SystemCategories
{
    // HasData bypasses SaveChanges, so the seed carries its own fixed timestamp.
    private static readonly DateTime SeededAt = new(2026, 10, 24, 0, 0, 0, DateTimeKind.Utc);

    // Ids are readable on purpose: 0001-… income, 0002-… expense.
    public static readonly Category[] All =
    [
        Income("00000000-0000-0000-0001-000000000001", "Salary"),
        Income("00000000-0000-0000-0001-000000000002", "Freelance"),
        Income("00000000-0000-0000-0001-000000000003", "Gifts"),
        Income("00000000-0000-0000-0001-000000000004", "Refunds"),
        Income("00000000-0000-0000-0001-000000000005", "Other income"),

        Expense("00000000-0000-0000-0002-000000000001", "Groceries"),
        Expense("00000000-0000-0000-0002-000000000002", "Dining out"),
        Expense("00000000-0000-0000-0002-000000000003", "Housing"),
        Expense("00000000-0000-0000-0002-000000000004", "Utilities"),
        Expense("00000000-0000-0000-0002-000000000005", "Transport"),
        Expense("00000000-0000-0000-0002-000000000006", "Health"),
        Expense("00000000-0000-0000-0002-000000000007", "Entertainment"),
        Expense("00000000-0000-0000-0002-000000000008", "Shopping"),
        Expense("00000000-0000-0000-0002-000000000009", "Subscriptions"),
        Expense("00000000-0000-0000-0002-000000000010", "Education"),
        Expense("00000000-0000-0000-0002-000000000011", "Other expense"),
    ];

    private static Category Income(string id, string name) => Create(id, name, TransactionType.Income);
    private static Category Expense(string id, string name) => Create(id, name, TransactionType.Expense);

    private static Category Create(string id, string name, TransactionType kind) => new()
    {
        Id = Guid.Parse(id),
        UserId = null,
        Name = name,
        Kind = kind,
        IsSystem = true,
        CreatedAt = SeededAt,
        UpdatedAt = SeededAt,
    };
}
