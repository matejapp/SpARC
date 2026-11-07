using System.ComponentModel.DataAnnotations;
using Sparc.Api.Models;

namespace Sparc.Api.Dto;

/// <summary>A period plus <c>type=expense|income</c>; expense when not given (D-042).</summary>
public sealed class AnalyticsTypedPeriodQuery : AnalyticsPeriodQuery
{
    /// <summary>
    /// A string, not the enum: query-string binding would accept "1" for an enum, and the API
    /// refuses numbers for enums (D-024, D-040).
    /// </summary>
    [AllowedValues(null, "income", "expense", ErrorMessage = "Type must be income or expense.")]
    public string? Type { get; init; }

    public TransactionType TypeOrExpense() => Type == "income" ? TransactionType.Income : TransactionType.Expense;
}
