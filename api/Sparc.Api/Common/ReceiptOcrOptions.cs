namespace Sparc.Api.Common;

/// <summary>
/// The "ReceiptOcr" section: where the Python receipt reader runs (D-048). BaseUrl and the
/// timeout live in appsettings.json; <see cref="ApiKey"/> is a secret — user-secrets in
/// development, the ReceiptOcr__ApiKey environment variable when deployed.
/// </summary>
public sealed class ReceiptOcrOptions
{
    public const string Section = "ReceiptOcr";

    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>OCR takes seconds; the user is watching a spinner.</summary>
    public int TimeoutSeconds { get; init; }

    /// <summary>Shared with the service's SPARC_AI_API_KEY. Never logged.</summary>
    public string ApiKey { get; init; } = string.Empty;

    /// <summary>
    /// Without a key, photo reading answers 503 and everything else works; the API still starts,
    /// so a machine without the reader isn't blocked.
    /// </summary>
    public bool IsConfigured => ApiKey.Length >= 32;

    /// <summary>
    /// https, or http only to this machine: the photo and the key cross this connection, and
    /// on the homelab it gets TLS (Iteration 5).
    /// </summary>
    public void Validate()
    {
        if (!Uri.TryCreate(BaseUrl, UriKind.Absolute, out var uri) || uri.AbsolutePath != "/"
            || !(uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)))
        {
            throw new InvalidOperationException(
                "ReceiptOcr:BaseUrl must be an https:// URL, or http:// to localhost, with no path.");
        }
        if (TimeoutSeconds is < 5 or > 60)
        {
            throw new InvalidOperationException("ReceiptOcr:TimeoutSeconds must be 5–60.");
        }
    }
}
