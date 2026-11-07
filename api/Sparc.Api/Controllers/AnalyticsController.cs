using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

/// <summary>
/// The Analytics tab (D-042). Read-only; every amount is in the caller's preferred currency, and
/// every period is both dates or neither (the current UTC month), at most 731 days.
/// </summary>
public sealed class AnalyticsController(IAnalyticsService analyticsService) : BaseController
{
    /// <summary>Income, expense, net, savings rate and average daily spend, with the period before.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryResponse>> Summary([FromQuery] AnalyticsPeriodQuery query) =>
        await analyticsService.SummaryAsync(CurrentUserId, query);

    /// <summary>Income, expense and net per month; empty months are zeros.</summary>
    [HttpGet("trend")]
    public async Task<ActionResult<AnalyticsTrendResponse>> Trend([FromQuery] AnalyticsPeriodQuery query) =>
        await analyticsService.TrendAsync(CurrentUserId, query);

    /// <summary>Running expense through a month and the month before, by day of month.</summary>
    [HttpGet("pace")]
    public async Task<ActionResult<AnalyticsPaceResponse>> Pace([FromQuery] AnalyticsMonthQuery query) =>
        await analyticsService.PaceAsync(CurrentUserId, query);

    /// <summary>Totals and shares per category of one type (expense by default), largest first.</summary>
    [HttpGet("categories")]
    public async Task<ActionResult<AnalyticsCategoriesResponse>> Categories([FromQuery] AnalyticsTypedPeriodQuery query) =>
        await analyticsService.CategoriesAsync(CurrentUserId, query);

    /// <summary>Spending per month for the top categories plus Other, for stacked bars.</summary>
    [HttpGet("categories/monthly")]
    public async Task<ActionResult<AnalyticsCategoryMonthsResponse>> CategoryMonths([FromQuery] AnalyticsPeriodQuery query) =>
        await analyticsService.CategoryMonthsAsync(CurrentUserId, query);

    /// <summary>Expense and income per day of a month; every day present.</summary>
    [HttpGet("daily")]
    public async Task<ActionResult<AnalyticsDailyResponse>> Daily([FromQuery] AnalyticsMonthQuery query) =>
        await analyticsService.DailyAsync(CurrentUserId, query);

    /// <summary>Bills paid in the period, bills still unpaid, and the share of spending that is recurring.</summary>
    [HttpGet("bills")]
    public async Task<ActionResult<AnalyticsBillsResponse>> Bills([FromQuery] AnalyticsPeriodQuery query) =>
        await analyticsService.BillsAsync(CurrentUserId, query);

    /// <summary>Count, sum as entered, converted total and share per entry currency, of one type.</summary>
    [HttpGet("currencies")]
    public async Task<ActionResult<AnalyticsCurrenciesResponse>> Currencies([FromQuery] AnalyticsTypedPeriodQuery query) =>
        await analyticsService.CurrenciesAsync(CurrentUserId, query);
}
