using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>Income and expense of a period in the display currency, each rounded once.</summary>
public sealed record TypeTotals(decimal Income, decimal Expense);

/// <summary>One type's total in one calendar month.</summary>
public sealed record MonthTotal(int Year, int Month, TransactionType Type, decimal Total);

/// <summary>One type's total on one day.</summary>
public sealed record DayTotal(DateOnly Date, TransactionType Type, decimal Total);

/// <summary>
/// Aggregates over one user's transactions in a display currency (D-041). Every method takes the
/// user id and filters on it, and every amount is summed by Postgres: no row is loaded into C#.
/// Callers make sure FxRates covers the period first (<c>IDisplayCurrencyService</c>).
/// </summary>
public interface IAnalyticsRepository
{
    /// <summary>
    /// The dates in the period that have a row needing conversion to <paramref name="currency"/>
    /// (entered in another currency) and no final rate of it yet. Not for RSD, which needs none.
    /// </summary>
    Task<List<DateOnly>> ListDatesToConvertAsync(Guid userId, DateOnly from, DateOnly to, string currency);

    /// <summary>Both types' totals in <paramref name="currency"/>; zero for a type with no rows.</summary>
    Task<TypeTotals> TotalsByTypeAsync(Guid userId, DateOnly from, DateOnly to, string currency);

    /// <summary>Per calendar month and type, rounded once each. Months with no rows are absent.</summary>
    Task<List<MonthTotal>> TotalsByMonthAsync(Guid userId, DateOnly from, DateOnly to, string currency);

    /// <summary>
    /// Per day and type, rounded to <paramref name="decimals"/> — 2 for display, more for a value
    /// the caller accumulates and rounds once itself (the pace's running total). Days with no rows
    /// are absent. <paramref name="type"/> null means both types.
    /// </summary>
    Task<List<DayTotal>> TotalsByDayAsync(
        Guid userId, DateOnly from, DateOnly to, string currency, TransactionType? type, int decimals);
}
