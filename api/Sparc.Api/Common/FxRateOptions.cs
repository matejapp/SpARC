namespace Sparc.Api.Common;

/// <summary>The "FxRates" configuration section, in appsettings.json. Nothing in it is secret.</summary>
public sealed class FxRateOptions
{
    public const string Section = "FxRates";

    /// <summary>The rate provider's base address, e.g. https://kurs.resenje.org/.</summary>
    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>
    /// Per provider call. A transaction save waits on it, so it is short; a timeout is a 503,
    /// never a fallback to another date's rate.
    /// </summary>
    public int TimeoutSeconds { get; init; }

    /// <summary>Pause between dates in the fx-backfill command, to be polite to a free service.</summary>
    public int BackfillDelayMilliseconds { get; init; }

    /// <summary>Fails startup rather than calling a wrong or insecure address.</summary>
    public void Validate()
    {
        if (!Uri.TryCreate(BaseUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
        {
            throw new InvalidOperationException("FxRates:BaseUrl must be an absolute https:// URL in appsettings.json.");
        }
        if (TimeoutSeconds is < 1 or > 30 || BackfillDelayMilliseconds < 0)
        {
            throw new InvalidOperationException(
                "FxRates:TimeoutSeconds must be 1–30 and FxRates:BackfillDelayMilliseconds not negative.");
        }
    }
}
