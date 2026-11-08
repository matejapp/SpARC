namespace Sparc.Api.Common;

/// <summary>The "FiscalReceipts" configuration section, in appsettings.json. Nothing in it is secret.</summary>
public sealed class FiscalReceiptOptions
{
    public const string Section = "FiscalReceipts";

    /// <summary>
    /// The tax authority's verification site, e.g. https://suf.purs.gov.rs/. Its host is also the
    /// only host a scanned code may name (D-045).
    /// </summary>
    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>
    /// Per lookup. The user is waiting on the scan; a timeout only leaves the store name empty.
    /// </summary>
    public int TimeoutSeconds { get; init; }

    public string Host => new Uri(BaseUrl).Host;

    /// <summary>Fails startup rather than calling a wrong or insecure address.</summary>
    public void Validate()
    {
        if (!Uri.TryCreate(BaseUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps
            || uri.AbsolutePath != "/")
        {
            throw new InvalidOperationException(
                "FiscalReceipts:BaseUrl must be an absolute https:// URL with no path in appsettings.json.");
        }
        if (TimeoutSeconds is < 1 or > 15)
        {
            throw new InvalidOperationException("FiscalReceipts:TimeoutSeconds must be 1–15.");
        }
    }
}
