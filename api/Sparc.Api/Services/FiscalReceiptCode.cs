using System.Buffers.Binary;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.WebUtilities;
using Sparc.Api.Common;

namespace Sparc.Api.Services;

/// <summary>What a fiscal receipt's QR code says about itself, before asking anyone (D-045).</summary>
/// <param name="Vl">The verification parameter, re-encoded by us. The only part sent anywhere.</param>
/// <param name="Total">In RSD, two decimals. Null when the payload did not decode plausibly.</param>
/// <param name="IssuedAtUtc">When the fiscal device signed it. Null as above.</param>
/// <param name="ReceiptNumber">"requestedBy-signedBy-counter". Null as above.</param>
public sealed record FiscalReceiptCode(string Vl, decimal? Total, DateTime? IssuedAtUtc, string? ReceiptNumber);

/// <summary>
/// Reads the text of a scanned QR code: the verification link printed on every Serbian fiscal
/// receipt, <c>https://suf.purs.gov.rs/v/?vl=…</c>. Pure, no I/O.
///
/// <c>vl</c> is base64 of the TaxCore verification payload. The fields used here, little-endian:
/// <code>
///   0  version             1 byte
///   1  requested by        8 bytes ASCII   the fiscal device's UID
///   9  signed by           8 bytes ASCII   the signing unit's UID
///  17  total counter       int32
///  21  type counter        int32
///  25  total amount        uint64          in 1/10 000 of a dinar
///  33  signed at           uint64          ms since the Unix epoch, UTC
///  41  … invoice type, transaction type, buyer id, encrypted data, signature, hash (not read)
/// </code>
/// Not yet confirmed against a real receipt (the spike card). A payload that doesn't decode
/// plausibly isn't refused: its fields come back null and the public record fills them.
/// </summary>
public static partial class FiscalReceiptParser
{
    public const int MaxTextLength = 2048;
    private const int MinPayloadBytes = 41;

    // The fiscal system went live for everyone in 2022; anything earlier is a misread.
    private static readonly DateTime EarliestIssue = new(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    [GeneratedRegex("^[A-Z0-9]{8}$")]
    private static partial Regex Uid();

    [GeneratedRegex(@"^[A-Za-z0-9+/]+={0,2}$")]
    private static partial Regex Base64();

    /// <summary>
    /// The receipt's code, or a <see cref="DomainValidationException"/> on <c>text</c> when the
    /// text is not a verification link on <paramref name="allowedHost"/>.
    /// </summary>
    public static FiscalReceiptCode Parse(string text, string allowedHost)
    {
        var vl = ExtractVl(text, allowedHost) ?? throw NotAReceipt();
        byte[] payload;
        try
        {
            payload = Convert.FromBase64String(vl);
        }
        catch (FormatException)
        {
            throw NotAReceipt();
        }

        return Decode(vl, payload);
    }

    private static string? ExtractVl(string text, string allowedHost)
    {
        text = text.Trim();
        if (text.Length is 0 or > MaxTextLength)
        {
            return null;
        }
        // Printed codes sometimes omit the scheme.
        if (!text.Contains("://", StringComparison.Ordinal))
        {
            text = "https://" + text;
        }
        if (!Uri.TryCreate(text, UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps
            || !string.Equals(uri.Host, allowedHost, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var query = QueryHelpers.ParseQuery(uri.Query);
        if (!query.TryGetValue("vl", out var values) || values.Count != 1)
        {
            return null;
        }

        // Query decoding turns '+' into a space; base64 has no spaces. URL-safe base64 is mapped
        // back, and the padding restored, so one canonical form goes on.
        var vl = values[0]!.Trim().Replace(' ', '+').Replace('-', '+').Replace('_', '/');
        vl = vl.TrimEnd('=');
        vl += new string('=', (4 - vl.Length % 4) % 4);
        return vl.Length is > 4 and <= MaxTextLength && Base64().IsMatch(vl) ? vl : null;
    }

    private static FiscalReceiptCode Decode(string vl, byte[] payload)
    {
        var unread = new FiscalReceiptCode(vl, null, null, null);
        if (payload.Length < MinPayloadBytes)
        {
            return unread;
        }

        var requestedBy = Ascii(payload.AsSpan(1, 8));
        var signedBy = Ascii(payload.AsSpan(9, 8));
        var counter = BinaryPrimitives.ReadInt32LittleEndian(payload.AsSpan(17, 4));
        var rawTotal = BinaryPrimitives.ReadUInt64LittleEndian(payload.AsSpan(25, 8));
        var rawTime = BinaryPrimitives.ReadUInt64LittleEndian(payload.AsSpan(33, 8));

        if (requestedBy is null || signedBy is null || !Uid().IsMatch(requestedBy) || !Uid().IsMatch(signedBy)
            || counter <= 0
            || rawTime > (ulong)DateTimeOffset.MaxValue.ToUnixTimeMilliseconds())
        {
            return unread;
        }

        var issuedAt = DateTimeOffset.FromUnixTimeMilliseconds((long)rawTime).UtcDateTime;
        // decimal holds any uint64 exactly. A total beyond numeric(18,2) can't be real; neither can
        // a signature from the future.
        var total = Math.Round((decimal)rawTotal / 10_000m, 2, MidpointRounding.AwayFromZero);
        if (total <= 0 || total > Money.MaxAmount
            || issuedAt < EarliestIssue || issuedAt > DateTime.UtcNow.AddDays(1))
        {
            return unread;
        }

        return new FiscalReceiptCode(vl, total, issuedAt, $"{requestedBy}-{signedBy}-{counter}");
    }

    private static string? Ascii(ReadOnlySpan<byte> bytes)
    {
        foreach (var b in bytes)
        {
            if (b is < 0x20 or > 0x7E)
            {
                return null;
            }
        }
        return System.Text.Encoding.ASCII.GetString(bytes);
    }

    internal static DomainValidationException NotAReceipt() =>
        new("text", "This isn't a fiscal receipt code. Scan the QR code printed on the receipt.");
}
