using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

public sealed class DashboardService(ITransactionRepository transactions) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, DashboardSummaryQuery query)
    {
        var (from, to) = query is { From: { } f, To: { } t } ? (f, t) : CurrentMonth();

        var (income, expense) = await transactions.SumByTypeAsync(userId, from, to);

        return new DashboardSummaryResponse
        {
            From = from,
            To = to,
            Currency = Currencies.Rsd,
            TotalIncome = income,
            TotalExpense = expense,
            Difference = income - expense,
        };
    }

    // The UTC month. Around midnight on the 1st the phone's month can differ, so the app sends
    // explicit dates once it has a period picker (D-025).
    private static (DateOnly From, DateOnly To) CurrentMonth()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var first = new DateOnly(today.Year, today.Month, 1);
        return (first, first.AddMonths(1).AddDays(-1));
    }
}
