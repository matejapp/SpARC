using System.Diagnostics;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// The receipt's public record on the tax authority's verification site (D-045):
/// <c>GET v/?vl=…</c> with <c>Accept: application/json</c>. The client's base address is fixed
/// in configuration and redirects are off, so this only ever calls that one host — the URL is
/// built here from the re-encoded <c>vl</c>, never taken from what was scanned.
///
/// The JSON's shape isn't confirmed yet (the spike card), so it is read defensively: known field
/// names first, then the printed receipt text ("journal"), and anything missing stays null.
/// One attempt, no retries: the user is waiting at the camera.
/// </summary>
public sealed partial class PursReceiptLookup(HttpClient http, ILogger<PursReceiptLookup> logger)
    : IFiscalReceiptLookup
{
    public const int MaxStoreNameLength = 100;
    private const int MaxDepth = 6;

    private static readonly string[] StoreNameKeys = ["locationName", "shopName", "businessName", "companyName"];

    [GeneratedRegex(@"^\d{9}$")]
    private static partial Regex TaxId();

    [GeneratedRegex(@"\p{L}")]
    private static partial Regex Letter();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    [GeneratedRegex("^[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{1,10}$")]
    private static partial Regex ReceiptNumber();

    public async Task<FiscalReceiptRecord?> FindAsync(string vl, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"v/?vl={Uri.EscapeDataString(vl)}");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        var started = Stopwatch.GetTimestamp();

        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Receipt record answered HTTP {Status} in {ElapsedMs:0} ms",
                    (int)response.StatusCode, elapsed);
                return null;
            }

            // MaxResponseContentBufferSize on the client caps the body.
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            var record = Read(body);
            logger.LogInformation(
                "Receipt record read in {ElapsedMs:0} ms: store {HasStore}, total {HasTotal}, valid {IsValid}",
                elapsed, record?.StoreName is not null, record?.Total is not null, record?.IsValid);
            return record;
        }
        catch (TaskCanceledException e) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(e, "Receipt record: no answer within {Timeout:0} s", http.Timeout.TotalSeconds);
            return null;
        }
        catch (HttpRequestException e)
        {
            // Includes a body over the size cap.
            logger.LogWarning(e, "Receipt record: the request failed");
            return null;
        }
    }

    /// <summary>Null when the body isn't JSON (e.g. the HTML page came back instead).</summary>
    internal static FiscalReceiptRecord? Read(string body)
    {
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(body, new JsonDocumentOptions { MaxDepth = 32 });
        }
        catch (JsonException)
        {
            return null;
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            bool? isValid = Find(root, "isValid", 0) is { } v && v.ValueKind is JsonValueKind.True or JsonValueKind.False
                ? v.GetBoolean()
                : null;

            decimal? total = Find(root, "totalAmount", 0) is { ValueKind: JsonValueKind.Number } t
                             && t.TryGetDecimal(out var amount) && amount > 0
                ? Math.Round(amount, 2, MidpointRounding.AwayFromZero)
                : null;

            DateTime? issuedAt = Find(root, "sdcTime", 0) is { ValueKind: JsonValueKind.String } s
                                 && DateTimeOffset.TryParse(s.GetString(), CultureInfo.InvariantCulture,
                                     DateTimeStyles.AssumeUniversal, out var at)
                ? at.UtcDateTime
                : null;

            var number = Find(root, "invoiceNumber", 0) is { ValueKind: JsonValueKind.String } n
                         && n.GetString() is { } raw && ReceiptNumber().IsMatch(raw)
                ? raw
                : null;

            string? store = null;
            foreach (var key in StoreNameKeys)
            {
                if (Find(root, key, 0) is { ValueKind: JsonValueKind.String } name && Clean(name.GetString()) is { } clean)
                {
                    store = clean;
                    break;
                }
            }
            if (store is null && Find(root, "journal", 0) is { ValueKind: JsonValueKind.String } journal)
            {
                store = StoreFromJournal(journal.GetString()!);
            }

            return new FiscalReceiptRecord(isValid, store, total, issuedAt, number);
        }
    }

    /// <summary>The first property named <paramref name="key"/> (any case), depth-first, bounded.</summary>
    private static JsonElement? Find(JsonElement element, string key, int depth)
    {
        if (depth > MaxDepth || element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, key, StringComparison.OrdinalIgnoreCase))
            {
                return property.Value;
            }
        }
        foreach (var property in element.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.Object && Find(property.Value, key, depth + 1) is { } found)
            {
                return found;
            }
        }
        return null;
    }

    /// <summary>
    /// The printed receipt opens with the seller's tax id (PIB, nine digits) on a line of its own,
    /// then the company name, then the shop's name. The shop's name is what a person recognises
    /// ("Maxi 155"), so it wins when it has letters; otherwise the company.
    /// </summary>
    internal static string? StoreFromJournal(string journal)
    {
        var lines = journal.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var at = Array.FindIndex(lines, l => TaxId().IsMatch(l));
        if (at < 0)
        {
            return null;
        }
        var company = at + 1 < lines.Length ? Clean(lines[at + 1]) : null;
        var shop = at + 2 < lines.Length ? Clean(lines[at + 2]) : null;
        return shop is not null && Letter().IsMatch(shop) ? shop : company;
    }

    /// <summary>
    /// The store name is someone else's text: control characters dropped, whitespace collapsed,
    /// length capped. Null when nothing readable is left.
    /// </summary>
    internal static string? Clean(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }
        var kept = new StringBuilder(text.Length);
        foreach (var c in text)
        {
            if (!char.IsControl(c) && char.GetUnicodeCategory(c) != UnicodeCategory.Format)
            {
                kept.Append(c);
            }
        }
        var clean = Whitespace().Replace(kept.ToString(), " ").Trim();
        if (clean.Length > MaxStoreNameLength)
        {
            clean = clean[..MaxStoreNameLength].TrimEnd();
        }
        return Letter().IsMatch(clean) ? clean : null;
    }
}
