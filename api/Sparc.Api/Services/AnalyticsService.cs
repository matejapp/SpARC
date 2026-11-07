using System.Globalization;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Every amount here comes summed and rounded from Postgres (AnalyticsRepository); this class only
/// arranges those totals — fills empty months and days with zeros, takes differences and ratios of
/// already-rounded totals — and never sums transactions itself (D-042). Each method first asks
/// IDisplayCurrencyService for the currency, which also makes FxRates complete for the period.
/// </summary>
public sealed class AnalyticsService(
    IAnalyticsRepository analytics,
    IDisplayCurrencyService displayCurrency) : IAnalyticsService
{
    // A running total sums daily totals, so those are carried at this precision and the running
    // value is rounded once, per day shown (D-042).
    private const int RunningDecimals = 10;

    public async Task<AnalyticsSummaryResponse> SummaryAsync(Guid userId, AnalyticsPeriodQuery query)
    {
        var (from, to) = AnalyticsPeriods.OrCurrentMonth(query.From, query.To);
        var (prevFrom, prevTo) = AnalyticsPeriods.Previous(from, to);
        var currency = await displayCurrency.PrepareAsync(userId, prevFrom, to);

        var today = AnalyticsPeriods.Today();
        var current = Figures(from, to, await analytics.TotalsByTypeAsync(userId, from, to, currency), today);
        var previous = Figures(prevFrom, prevTo, await analytics.TotalsByTypeAsync(userId, prevFrom, prevTo, currency), today);

        return new AnalyticsSummaryResponse
        {
            Currency = currency,
            Current = current,
            Previous = previous,
            Change = new FigureChanges
            {
                Income = current.Income - previous.Income,
                Expense = current.Expense - previous.Expense,
                Net = current.Net - previous.Net,
                SavingsRate = current.SavingsRate - previous.SavingsRate, // null if either is
                AverageDailySpend = current.AverageDailySpend - previous.AverageDailySpend,
            },
        };
    }

    public async Task<AnalyticsTrendResponse> TrendAsync(Guid userId, AnalyticsPeriodQuery query)
    {
        var (from, to) = AnalyticsPeriods.OrCurrentMonth(query.From, query.To);
        var currency = await displayCurrency.PrepareAsync(userId, from, to);
        var totals = await analytics.TotalsByMonthAsync(userId, from, to, currency);

        decimal Total(DateOnly month, TransactionType type) =>
            totals.SingleOrDefault(t => t.Year == month.Year && t.Month == month.Month && t.Type == type)?.Total ?? 0m;

        return new AnalyticsTrendResponse
        {
            From = from,
            To = to,
            Currency = currency,
            Months = AnalyticsPeriods.Months(from, to).Select(m =>
            {
                var income = Total(m, TransactionType.Income);
                var expense = Total(m, TransactionType.Expense);
                return new TrendMonth { Month = MonthKey(m), Income = income, Expense = expense, Net = income - expense };
            }).ToList(),
        };
    }

    public async Task<AnalyticsPaceResponse> PaceAsync(Guid userId, AnalyticsMonthQuery query)
    {
        var today = AnalyticsPeriods.Today();
        var month = query.FirstDay() ?? AnalyticsPeriods.FirstOfMonth(today);
        var previous = month.AddMonths(-1);
        var monthEnd = AnalyticsPeriods.LastOfMonth(month);
        var currency = await displayCurrency.PrepareAsync(userId, previous, monthEnd);

        var daily = (await analytics.TotalsByDayAsync(
                userId, previous, monthEnd, currency, TransactionType.Expense, RunningDecimals))
            .ToDictionary(d => d.Date, d => d.Total);

        var currentRun = Running(month, daily, lastShown: today);
        var previousRun = Running(previous, daily, lastShown: AnalyticsPeriods.LastOfMonth(previous));
        var days = Math.Max(currentRun.Count, previousRun.Count);

        return new AnalyticsPaceResponse
        {
            Month = MonthKey(month),
            PreviousMonth = MonthKey(previous),
            Currency = currency,
            Days = Enumerable.Range(1, days).Select(d => new PaceDay
            {
                Day = d,
                Current = d <= currentRun.Count ? currentRun[d - 1] : null,
                Previous = d <= previousRun.Count ? previousRun[d - 1] : null,
            }).ToList(),
        };
    }

    private static PeriodFigures Figures(DateOnly from, DateOnly to, TypeTotals totals, DateOnly today)
    {
        var net = totals.Income - totals.Expense;
        var days = AnalyticsPeriods.DaysForAverage(from, to, today);
        return new PeriodFigures
        {
            From = from,
            To = to,
            Income = totals.Income,
            Expense = totals.Expense,
            Net = net,
            // Never divide by zero: no income, no rate.
            SavingsRate = totals.Income == 0 ? null : Math.Round(net / totals.Income, 4, MidpointRounding.AwayFromZero),
            Days = days,
            AverageDailySpend = Math.Round(totals.Expense / days, 2, MidpointRounding.AwayFromZero),
        };
    }

    /// <summary>
    /// The running expense of one month, one value per day from the 1st: a null for each day
    /// after <paramref name="lastShown"/> (the future), and nothing past the month's last day.
    /// </summary>
    private static List<decimal?> Running(DateOnly month, Dictionary<DateOnly, decimal> daily, DateOnly lastShown)
    {
        var run = new List<decimal?>();
        var sum = 0m;
        for (var day = month; day.Month == month.Month; day = day.AddDays(1))
        {
            sum += daily.GetValueOrDefault(day);
            run.Add(day <= lastShown ? Math.Round(sum, 2, MidpointRounding.AwayFromZero) : null);
        }
        return run;
    }

    private static string MonthKey(DateOnly month) => month.ToString("yyyy-MM", CultureInfo.InvariantCulture);
}
