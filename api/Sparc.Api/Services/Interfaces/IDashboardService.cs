using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, DashboardSummaryQuery query);
}
