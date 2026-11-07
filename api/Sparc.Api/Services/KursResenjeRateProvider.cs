using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Sparc.Api.Common;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// NBS middle rates from kurs.resenje.org, a free mirror of the official NBS lists (no key):
/// <c>GET api/v1/currencies/{code}/rates/{yyyy-MM-dd}</c>. For any date it answers the list in
/// force on that date — the latest one issued on or before it — with that list's date in
/// <c>date_from</c>. Its history starts on 2002-05-16; earlier dates are a 404 "Rate Not Found".
/// One attempt per call, no retries: the caller is a request that is waiting.
/// </summary>
public sealed class KursResenjeRateProvider(HttpClient http, ILogger<KursResenjeRateProvider> logger)
    : IFxRateProvider
{
    private const string RateNotFound = "Rate Not Found";

    // The first list the provider has. Earlier dates are answered here, without a request: no row
    // is stored for "no rate", so each such request would otherwise reach the provider again.
    private static readonly DateOnly HistoryStart = new(2002, 5, 16);

    public async Task<ProviderRate?> GetMiddleRateAsync(string currency, DateOnly date)
    {
        if (date < HistoryStart)
        {
            return null;
        }

        var day = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var path = $"api/v1/currencies/{currency.ToLowerInvariant()}/rates/{day}";
        var started = Stopwatch.GetTimestamp();

        HttpResponseMessage response;
        try
        {
            response = await http.GetAsync(path);
        }
        catch (HttpRequestException e)
        {
            throw Unavailable(currency, day, "the request failed", e);
        }
        catch (TaskCanceledException e) when (e.InnerException is TimeoutException)
        {
            throw Unavailable(currency, day, $"no answer within {http.Timeout.TotalSeconds:0} s", e);
        }

        using (response)
        {
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                var error = await ReadAsync<ProviderError>(response, currency, day);
                if (error?.Message == RateNotFound)
                {
                    logger.LogInformation("NBS has no {Currency} rate for {Date}", currency, day);
                    return null;
                }
                // "Currency Not Found" or anything else: our request is wrong, not the date.
                throw Unavailable(currency, day, $"404 \"{error?.Message}\"");
            }
            if (!response.IsSuccessStatusCode)
            {
                throw Unavailable(currency, day, $"HTTP {(int)response.StatusCode}");
            }

            var body = await ReadAsync<KursRate>(response, currency, day);
            if (body is null
                || !string.Equals(body.Code, currency, StringComparison.OrdinalIgnoreCase)
                || body.Date != date
                || body.DateFrom > date
                || body.ExchangeMiddle <= 0
                // numeric(18,6) would round anything finer silently; NBS publishes four decimals.
                || body.ExchangeMiddle.Scale > 6)
            {
                throw Unavailable(currency, day, "the answer failed validation");
            }

            logger.LogInformation(
                "Fetched NBS {Currency} rate for {Date}: list of {ListDate} in {ElapsedMs:0} ms",
                currency, day, body.DateFrom.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Stopwatch.GetElapsedTime(started).TotalMilliseconds);
            return new ProviderRate(body.ExchangeMiddle, body.DateFrom);
        }
    }

    private async Task<T?> ReadAsync<T>(HttpResponseMessage response, string currency, string day)
    {
        try
        {
            return await response.Content.ReadFromJsonAsync<T>();
        }
        catch (JsonException e)
        {
            throw Unavailable(currency, day, "the answer was not the expected JSON", e);
        }
    }

    // The client sees one generic 503 message; the operator sees what actually went wrong.
    private ServiceUnavailableException Unavailable(string currency, string day, string reason, Exception? cause = null)
    {
        logger.LogWarning(cause, "NBS rate provider failed for {Currency} {Date}: {Reason}", currency, day, reason);
        return new ServiceUnavailableException(
            "Exchange rates are unavailable right now. Try again shortly.",
            new HttpRequestException($"NBS rate provider failed for {currency} {day}: {reason}", cause));
    }

    private sealed record KursRate(
        [property: JsonPropertyName("code")] string? Code,
        [property: JsonPropertyName("date")] DateOnly Date,
        [property: JsonPropertyName("date_from")] DateOnly DateFrom,
        [property: JsonPropertyName("exchange_middle")] decimal ExchangeMiddle);

    private sealed record ProviderError([property: JsonPropertyName("message")] string? Message);
}
