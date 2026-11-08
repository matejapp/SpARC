using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Sparc.Api.Common;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Calls sparc-ai's <c>POST v1/categories/suggest</c>, which asks Gemini (D-049). It sends the
/// shop's names and the user's category ids and names; sparc-ai passes only the names on to
/// Google. A suggestion is optional, so every failure is logged and answered with null; the
/// keyword table runs next. The answer is untrusted: only an id from the list sent counts.
/// </summary>
public sealed class SparcAiCategoryClassifier(
    HttpClient http, ReceiptOcrOptions options, ILogger<SparcAiCategoryClassifier> logger) : IReceiptCategoryAi
{
    private static readonly HashSet<string> Reasons = ["suggested", "none", "disabled", "limited", "unavailable"];

    public async Task<Guid?> SuggestAsync(
        string? storeName, string? locationName, IReadOnlyList<CategoryOption> categories, CancellationToken cancellationToken)
    {
        if (!options.IsConfigured || categories.Count == 0 || (storeName is null && locationName is null))
        {
            return null;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/categories/suggest");
        request.Headers.Add("X-Api-Key", options.ApiKey);
        request.Content = JsonContent.Create(new
        {
            storeName,
            locationName,
            categories = categories.Select(c => new { id = c.Id.ToString(), name = c.Name }),
        });

        string body;
        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                // 401: the two shared keys differ, a configuration error.
                var level = response.StatusCode == HttpStatusCode.Unauthorized ? LogLevel.Error : LogLevel.Warning;
                logger.Log(level, "Category suggester answered HTTP {Status}", (int)response.StatusCode);
                return null;
            }
            body = await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Category suggester timed out");
            return null;
        }
        catch (HttpRequestException e)
        {
            logger.LogWarning("Category suggester unreachable: {Error}", e.HttpRequestError);
            return null;
        }

        var (id, reason) = Parse(body, categories);
        logger.LogInformation("Category suggester: {Reason}", reason);
        return id;
    }

    internal static (Guid? Id, string Reason) Parse(string body, IReadOnlyList<CategoryOption> categories)
    {
        try
        {
            using var document = JsonDocument.Parse(body, new JsonDocumentOptions { MaxDepth = 4 });
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return (null, "malformed");
            }

            var reason = root.TryGetProperty("reason", out var r) && r.ValueKind == JsonValueKind.String
                         && Reasons.Contains(r.GetString()!)
                ? r.GetString()!
                : "unknown";
            var id = root.TryGetProperty("categoryId", out var c) && c.ValueKind == JsonValueKind.String
                     && Guid.TryParse(c.GetString(), out var parsed) && categories.Any(o => o.Id == parsed)
                ? parsed
                : (Guid?)null;
            return (id, id is null && reason == "suggested" ? "not one of the ids sent" : reason);
        }
        catch (JsonException)
        {
            return (null, "malformed");
        }
    }
}
