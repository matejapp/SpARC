using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Turns a scanned fiscal receipt into a draft expense (D-045). The QR code itself carries the
/// total, time and receipt number; the public record adds the store name, and stands in for the
/// decoded fields if the payload didn't decode. Nothing is written: confirming is a normal create.
/// </summary>
public sealed class ReceiptService(
    IFiscalReceiptLookup lookup,
    ITransactionRepository transactions,
    FiscalReceiptOptions options,
    ILogger<ReceiptService> logger) : IReceiptService
{
    private static readonly TimeZoneInfo Belgrade = TimeZoneInfo.FindSystemTimeZoneById("Europe/Belgrade");

    public async Task<ReceiptDraftResponse> DraftFromQrAsync(
        Guid userId, ReceiptQrRequest request, CancellationToken cancellationToken)
    {
        var code = FiscalReceiptParser.Parse(request.Text!, options.Host);
        var record = await lookup.FindAsync(code.Vl, cancellationToken);

        // The record says outright that this code is no genuine receipt.
        if (record?.IsValid == false)
        {
            logger.LogWarning("Scanned receipt failed verification for {UserId}", userId);
            throw new DomainValidationException("text",
                "The tax authority couldn't verify this receipt. Enter it by hand.");
        }

        var total = code.Total ?? record?.Total;
        var issuedAt = code.IssuedAtUtc ?? record?.IssuedAtUtc;
        if (total is null || issuedAt is null)
        {
            logger.LogWarning("Scanned receipt unreadable for {UserId}: decoded {Decoded}, record {HasRecord}",
                userId, code.Total is not null, record is not null);
            throw new DomainValidationException("text",
                "This receipt's code couldn't be read. Enter it by hand.");
        }

        // Both sides answered and disagree: the decoder's layout is wrong somewhere. The decoded
        // value is kept (the user reviews it anyway); the log is how we find out.
        if (code.Total is not null && record?.Total is not null && code.Total != record.Total)
        {
            logger.LogWarning("Decoded receipt total differs from its record for {UserId}", userId);
        }

        var number = code.ReceiptNumber ?? record?.ReceiptNumber;
        // Already entered: the draft still comes back, so the app can say so and link to it (D-047).
        var existing = number is null ? null : await transactions.FindIdByFiscalReceiptNumberAsync(userId, number);

        logger.LogInformation("Receipt draft for {UserId}: decoded {Decoded}, store {HasStore}, existing {Existing}",
            userId, code.Total is not null, record?.StoreName is not null, existing is not null);

        return new ReceiptDraftResponse
        {
            OccurredOn = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(issuedAt.Value, Belgrade)),
            Amount = total.Value,
            Currency = Currencies.Rsd,
            StoreName = record?.StoreName,
            ReceiptNumber = number,
            SuggestedCategoryId = null,
            ExistingTransactionId = existing,
        };
    }
}
