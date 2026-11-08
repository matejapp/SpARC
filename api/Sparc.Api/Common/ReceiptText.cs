using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Sparc.Api.Common;

/// <summary>
/// A store or shop name from a receipt is someone else's text — the tax authority's record or
/// OCR (D-045, D-048). Control and format characters dropped, whitespace collapsed, length
/// capped; null when nothing readable is left. Shown to the user, never interpreted.
/// </summary>
public static partial class ReceiptText
{
    public const int MaxNameLength = 100;

    [GeneratedRegex(@"\p{L}")]
    private static partial Regex Letter();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    public static string? Clean(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }
        var kept = new StringBuilder(Math.Min(text.Length, 4 * MaxNameLength));
        foreach (var c in text.AsSpan(0, Math.Min(text.Length, 4 * MaxNameLength)))
        {
            if (!char.IsControl(c) && char.GetUnicodeCategory(c) != UnicodeCategory.Format)
            {
                kept.Append(c);
            }
        }
        var clean = Whitespace().Replace(kept.ToString(), " ").Trim();
        if (clean.Length > MaxNameLength)
        {
            clean = clean[..MaxNameLength].TrimEnd();
        }
        return Letter().IsMatch(clean) ? clean : null;
    }
}
