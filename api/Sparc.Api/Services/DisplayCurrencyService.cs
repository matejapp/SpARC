using System.Globalization;
using Microsoft.AspNetCore.Identity;
using Sparc.Api.Common;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Every total shown to a user is in their preferred currency (D-005, D-041). This is the one
/// place that decides it, and the one place that fills FxRates before an aggregate reads them:
/// RSD needs nothing; EUR or USD needs a rate for each date with a row entered in another
/// currency. Rows are never written here — switching the preferred currency touches no
/// transaction.
/// </summary>
public sealed class DisplayCurrencyService(
    UserManager<AppUser> users,
    IAnalyticsRepository analytics,
    IFxRateService fxRates) : IDisplayCurrencyService
{
    public async Task<string> PrepareAsync(Guid userId, DateOnly from, DateOnly to)
    {
        // A valid token can outlive its account; that is a 404, not a 500 (as UserService).
        var user = await users.FindByIdAsync(userId.ToString()) ?? throw new NotFoundException("User");
        var currency = user.PreferredCurrency.ToUpperInvariant();
        if (currency == Currencies.Rsd)
        {
            return currency;
        }

        var dates = await analytics.ListDatesToConvertAsync(userId, from, to, currency);
        var withoutRate = await fxRates.EnsureRatesAsync(currency, dates);
        if (withoutRate.Count > 0)
        {
            // Only RSD rows from before NBS's first list (2002-05-16) can get here. Refusing beats a
            // total that silently leaves them out.
            var first = withoutRate.Min().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            throw new DomainValidationException("From",
                $"No official NBS exchange rate exists for {first}, so this period can't be shown in {currency}.");
        }
        return currency;
    }
}
