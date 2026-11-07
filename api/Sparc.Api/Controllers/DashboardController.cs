using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class DashboardController(IDashboardService dashboardService) : BaseController
{
    /// <summary>Total income, total expense and their difference for a period, in the preferred currency.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> Summary([FromQuery] DashboardSummaryQuery query) =>
        await dashboardService.GetSummaryAsync(CurrentUserId, query);
}
