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
}
