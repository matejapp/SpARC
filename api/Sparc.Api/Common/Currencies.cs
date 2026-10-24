namespace Sparc.Api.Common;

/// <summary>The fixed set of supported currencies (D-004). RSD is the pivot.</summary>
public static class Currencies
{
    public const string Rsd = "RSD";
    public const string Eur = "EUR";
    public const string Usd = "USD";

    public static readonly IReadOnlyList<string> All = [Rsd, Eur, Usd];

    /// <summary>Case-insensitive; callers store <c>code.ToUpperInvariant()</c>.</summary>
    public static bool IsSupported(string code) => All.Contains(code, StringComparer.OrdinalIgnoreCase);
}
