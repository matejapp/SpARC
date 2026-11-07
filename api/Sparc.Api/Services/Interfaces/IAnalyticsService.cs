using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

/// <summary>The Analytics tab's numbers, all in the caller's preferred currency (D-041, D-042).</summary>
public interface IAnalyticsService
{
    Task<AnalyticsSummaryResponse> SummaryAsync(Guid userId, AnalyticsPeriodQuery query);
    Task<AnalyticsTrendResponse> TrendAsync(Guid userId, AnalyticsPeriodQuery query);
    Task<AnalyticsPaceResponse> PaceAsync(Guid userId, AnalyticsMonthQuery query);
    Task<AnalyticsCategoriesResponse> CategoriesAsync(Guid userId, AnalyticsTypedPeriodQuery query);
    Task<AnalyticsCategoryMonthsResponse> CategoryMonthsAsync(Guid userId, AnalyticsPeriodQuery query);
    Task<AnalyticsDailyResponse> DailyAsync(Guid userId, AnalyticsMonthQuery query);
    Task<AnalyticsBillsResponse> BillsAsync(Guid userId, AnalyticsPeriodQuery query);
    Task<AnalyticsCurrenciesResponse> CurrenciesAsync(Guid userId, AnalyticsTypedPeriodQuery query);
}
