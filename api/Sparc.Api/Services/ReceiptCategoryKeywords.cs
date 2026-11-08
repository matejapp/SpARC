using System.Text;
using Sparc.Api.Data;

namespace Sparc.Api.Services;

/// <summary>
/// The last suggestion step (D-049): well-known Serbian chains and shop words, mapped to system
/// categories. It works without the model, so suggestions keep coming with no Gemini key, the
/// service down or the free quota used up. A name matches on whole words, after Cyrillic is
/// written in Latin and diacritics are dropped ("АПОТЕКА", "Apoteka" and "APOTEKA" all match).
/// Reviewed in the diff; add a word here, not in a database.
/// </summary>
public static class ReceiptCategoryKeywords
{
    // First match wins, so the more specific shops come before the broad ones.
    private static readonly (string Category, string[] Words)[] Table =
    [
        ("Health", ["APOTEKA", "APOTEKE", "BENU", "FARMACIJA", "POLIKLINIKA", "ORDINACIJA", "LABORATORIJA", "OPTIKA"]),
        ("Transport", ["NIS", "OMV", "MOL", "LUKOIL", "GAZPROM", "EKO", "PUMPA", "PARKING", "TAKSI", "TAXI", "GARAZA"]),
        ("Groceries", ["MAXI", "DELHAIZE", "LIDL", "IDEA", "RODA", "MERCATOR", "UNIVEREXPORT", "AMAN", "DIS", "TEMPO",
                       "GOMEX", "MARKET", "SUPERMARKET", "HIPERMARKET", "MINIMARKET", "PEKARA", "MESARA", "MLEKARA"]),
        ("Dining out", ["RESTORAN", "KAFANA", "KAFE", "CAFE", "CAFFE", "BISTRO", "PICERIJA", "PIZZERIA",
                        "MCDONALDS", "KFC", "BURGER", "GRILL", "ROSTILJ", "POSLASTICARNICA"]),
        ("Shopping", ["DM", "LILLY", "DROGERIJA", "DROGERIE", "IKEA", "JYSK", "GIGATRON", "TEHNOMANIJA", "EMMEZETA",
                      "DECATHLON", "ZARA", "BUTIK", "OBUCA"]),
        ("Utilities", ["EPS", "INFOSTAN", "VODOVOD", "SRBIJAGAS", "TOPLANA", "TELEKOM", "YETTEL", "A1"]),
        ("Entertainment", ["BIOSKOP", "CINEPLEXX", "CINESTAR", "POZORISTE", "MUZEJ", "KONCERT"]),
        ("Education", ["KNJIZARA", "VULKAN", "DELFI", "LAGUNA"]),
    ];

    private static readonly (Guid Id, HashSet<string> Words)[] Lookup = Table
        .Select(row => (SystemCategories.All.Single(c => c.Name == row.Category).Id, row.Words.ToHashSet()))
        .ToArray();

    /// <summary>A system category id, or null when no word matches.</summary>
    public static Guid? Match(string? storeName, string? locationName)
    {
        var words = Words(storeName).Concat(Words(locationName)).ToHashSet();
        foreach (var (id, keywords) in Lookup)
        {
            if (words.Overlaps(keywords))
            {
                return id;
            }
        }
        return null;
    }

    private static IEnumerable<string> Words(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            yield break;
        }

        var latin = new StringBuilder(text.Length);
        foreach (var ch in text.ToUpperInvariant())
        {
            latin.Append(Latin.TryGetValue(ch, out var l) ? l : ch.ToString());
        }

        var word = new StringBuilder();
        foreach (var ch in latin.ToString().Replace("'", ""))
        {
            if (char.IsLetterOrDigit(ch))
            {
                word.Append(ch);
            }
            else if (word.Length > 0)
            {
                yield return word.ToString();
                word.Clear();
            }
        }
        if (word.Length > 0)
        {
            yield return word.ToString();
        }
    }

    // Serbian Cyrillic in Latin without diacritics, and the Latin diacritics dropped.
    private static readonly Dictionary<char, string> Latin = new()
    {
        ['А'] = "A", ['Б'] = "B", ['В'] = "V", ['Г'] = "G", ['Д'] = "D", ['Ђ'] = "DJ", ['Е'] = "E", ['Ж'] = "Z",
        ['З'] = "Z", ['И'] = "I", ['Ј'] = "J", ['К'] = "K", ['Л'] = "L", ['Љ'] = "LJ", ['М'] = "M", ['Н'] = "N",
        ['Њ'] = "NJ", ['О'] = "O", ['П'] = "P", ['Р'] = "R", ['С'] = "S", ['Т'] = "T", ['Ћ'] = "C", ['У'] = "U",
        ['Ф'] = "F", ['Х'] = "H", ['Ц'] = "C", ['Ч'] = "C", ['Џ'] = "DZ", ['Ш'] = "S",
        ['Š'] = "S", ['Đ'] = "DJ", ['Č'] = "C", ['Ć'] = "C", ['Ž'] = "Z",
    };
}
