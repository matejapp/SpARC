namespace Sparc.Api.Services.Interfaces;

/// <summary>
/// A category to pre-select on a receipt draft (F-08.6, D-049). Only a suggestion: the user sees
/// it and can change it before saving.
/// </summary>
public interface ICategorySuggester
{
    /// <summary>
    /// One of the user's visible expense categories, or null. In order: the category the user
    /// last gave an expense with this description, Gemini's pick among the user's categories,
    /// the keyword table, nothing. Never throws for a failing step; the next one runs.
    /// </summary>
    Task<Guid?> SuggestAsync(Guid userId, string? storeName, string? locationName, CancellationToken cancellationToken);
}

public sealed record CategoryOption(Guid Id, string Name);

/// <summary>The language-model step, through sparc-ai (D-049).</summary>
public interface IReceiptCategoryAi
{
    /// <summary>
    /// The id of one of <paramref name="categories"/>, or null: no key, the service down or
    /// slow, over its quota, no clear fit, or an answer that isn't one of the ids sent.
    /// </summary>
    Task<Guid?> SuggestAsync(
        string? storeName, string? locationName, IReadOnlyList<CategoryOption> categories, CancellationToken cancellationToken);
}
