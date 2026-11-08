using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Suggests a receipt draft's category (D-049): the user's own history first, then Gemini, then
/// the keyword table, then nothing. Every answer is checked against the user's visible expense
/// categories, so a suggestion can never be someone else's category or an income one.
/// </summary>
public sealed class CategorySuggester(
    ITransactionRepository transactions,
    ICategoryRepository categories,
    IReceiptCategoryAi ai,
    ILogger<CategorySuggester> logger) : ICategorySuggester
{
    /// <summary>sparc-ai takes at most this many; system categories come first in the list.</summary>
    public const int MaxCategoriesForAi = 60;

    public async Task<Guid?> SuggestAsync(
        Guid userId, string? storeName, string? locationName, CancellationToken cancellationToken)
    {
        // The add form puts the shop in the description (location, else company), so the same
        // shop's earlier expenses carry that exact text unless the user rewrote it.
        var description = locationName ?? storeName;
        if (description is null)
        {
            return null;
        }

        if (await transactions.FindLatestCategoryIdByDescriptionAsync(userId, description) is { } own)
        {
            logger.LogInformation("Category suggestion for {UserId}: own history", userId);
            return own;
        }

        var visible = await categories.ListVisibleAsync(userId, TransactionType.Expense);
        var options = visible.Take(MaxCategoriesForAi).Select(c => new CategoryOption(c.Id, c.Name)).ToList();
        if (await ai.SuggestAsync(storeName, locationName, options, cancellationToken) is { } picked
            && options.Any(o => o.Id == picked))
        {
            logger.LogInformation("Category suggestion for {UserId}: model", userId);
            return picked;
        }

        if (ReceiptCategoryKeywords.Match(storeName, locationName) is { } keyword && visible.Any(c => c.Id == keyword))
        {
            logger.LogInformation("Category suggestion for {UserId}: keyword table", userId);
            return keyword;
        }

        logger.LogInformation("Category suggestion for {UserId}: none", userId);
        return null;
    }
}
