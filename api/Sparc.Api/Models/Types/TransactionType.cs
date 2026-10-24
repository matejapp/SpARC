namespace Sparc.Api.Models;

/// <summary>Direction of money. Stored as smallint; used by Transaction.Type and Category.Kind.</summary>
public enum TransactionType : short
{
    Income = 0,
    Expense = 1,
}
