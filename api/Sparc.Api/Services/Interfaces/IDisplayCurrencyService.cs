namespace Sparc.Api.Services.Interfaces;

public interface IDisplayCurrencyService
{
    /// <summary>
    /// The caller's preferred currency, with FxRates made complete for every one of their
    /// transaction dates in the period that needs converting to it (D-041). After it returns, no
    /// aggregate over the period can miss a rate. A date NBS has no rate for is a 400 on From;
    /// a provider failure is a 503.
    /// </summary>
    Task<string> PrepareAsync(Guid userId, DateOnly from, DateOnly to);
}
