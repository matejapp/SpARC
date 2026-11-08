using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Sparc.Api.Common;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Calls the receipt reader: <c>POST v1/receipts/read</c>, the photo as the raw body, the shared
/// key in <c>X-Api-Key</c>. Its answer is read as untrusted: the total parses as a decimal from
/// a string (never through a double), the date as yyyy-MM-dd, the names through
/// <see cref="ReceiptText.Clean"/>. One attempt: the user is waiting.
/// </summary>
public sealed class SparcAiReceiptOcr(HttpClient http, ReceiptOcrOptions options, ILogger<SparcAiReceiptOcr> logger)
    : IReceiptOcr
{
    public const string Unavailable = "Receipt reading isn't available right now. Enter it by hand.";

    private static readonly ReceiptOcrResult Nothing = new(null, null, null, null, 0);

    public async Task<ReceiptOcrResult> ReadAsync(Stream image, string contentType, CancellationToken cancellationToken)
    {
        if (!options.IsConfigured)
        {
            throw new ServiceUnavailableException(Unavailable,
                new InvalidOperationException("ReceiptOcr:ApiKey is not set."));
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/receipts/read");
        request.Headers.Add("X-Api-Key", options.ApiKey);
        request.Content = new StreamContent(image);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        var started = Stopwatch.GetTimestamp();

        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, cancellationToken);
        }
        catch (TaskCanceledException e) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ServiceUnavailableException(Unavailable, e);
        }
        catch (HttpRequestException e)
        {
            throw new ServiceUnavailableException(Unavailable, e);
        }

        using (response)
        {
            var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            if (response.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                // It isn't an image the reader can decode: as good as a photo with nothing on it.
                logger.LogInformation("Receipt reader couldn't decode the photo ({ElapsedMs:0} ms)", elapsed);
                return Nothing;
            }
            if (!response.IsSuccessStatusCode)
            {
                // 401 means the two keys differ: a configuration error, logged as one.
                var level = response.StatusCode == HttpStatusCode.Unauthorized ? LogLevel.Error : LogLevel.Warning;
                logger.Log(level, "Receipt reader answered HTTP {Status} in {ElapsedMs:0} ms",
                    (int)response.StatusCode, elapsed);
                throw new ServiceUnavailableException(Unavailable,
                    new HttpRequestException($"Receipt reader answered {(int)response.StatusCode}."));
            }

            string body;
            try
            {
                body = await response.Content.ReadAsStringAsync(cancellationToken);
            }
            catch (HttpRequestException e)
            {
                throw new ServiceUnavailableException(Unavailable, e);
            }

            var result = Parse(body) ?? throw new ServiceUnavailableException(Unavailable,
                new JsonException("Receipt reader answered something that isn't the expected JSON."));
            logger.LogInformation(
                "Receipt photo read in {ElapsedMs:0} ms: date {HasDate}, total {HasTotal}, store {HasStore}, confidence {Confidence:0.00}",
                elapsed, result.Date is not null, result.Total is not null, result.StoreName is not null, result.Confidence);
            return result;
        }
    }

    internal static ReceiptOcrResult? Parse(string body)
    {
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(body, new JsonDocumentOptions { MaxDepth = 8 });
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

            DateOnly? date = Text(root, "date") is { } d
                             && DateOnly.TryParseExact(d, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
                ? parsed
                : null;

            decimal? total = Text(root, "total") is { Length: <= 24 } t
                             && decimal.TryParse(t, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var amount)
                ? amount
                : null;

            var confidence = root.TryGetProperty("confidence", out var c) && c.ValueKind == JsonValueKind.Number
                ? Math.Clamp(c.GetDouble(), 0, 1)
                : 0;

            return new ReceiptOcrResult(
                date,
                total,
                ReceiptText.Clean(Text(root, "storeName")),
                ReceiptText.Clean(Text(root, "locationName")),
                confidence);
        }
    }

    private static string? Text(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}
