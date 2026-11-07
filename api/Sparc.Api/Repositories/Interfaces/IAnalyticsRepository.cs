using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

/// <summary>Income and expense of a period in the display currency, each rounded once.</summary>
public sealed record TypeTotals(decimal Income, decimal Expense);

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
}
