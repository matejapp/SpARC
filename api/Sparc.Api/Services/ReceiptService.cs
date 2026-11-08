using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Turns a scanned fiscal receipt into a draft expense (D-045). The QR code itself carries the
/// total, time and receipt number; the public record adds the store name, and stands in for the
/// decoded fields if the payload didn't decode. A photo goes to the receipt reader instead
/// (D-048). Nothing is written: confirming is a normal create.
/// </summary>
public sealed class ReceiptService(
    IFiscalReceiptLookup lookup,
    IReceiptOcr ocr,
    ICategorySuggester categories,
    ITransactionRepository transactions,
    FiscalReceiptOptions options,
    ILogger<ReceiptService> logger) : IReceiptService
{
    public const long MaxPhotoBytes = 10 * 1024 * 1024;

    private static readonly TimeZoneInfo Belgrade = TimeZoneInfo.FindSystemTimeZoneById("Europe/Belgrade");
    private static readonly DateOnly EarliestDate = new(2000, 1, 1);
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

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
            LocationName = record?.LocationName,
            ReceiptNumber = number,
            // Already saved: there is nothing to categorise.
            SuggestedCategoryId = existing is null
                ? await categories.SuggestAsync(userId, record?.StoreName, record?.LocationName, cancellationToken)
                : null,
            ExistingTransactionId = existing,
        };
    }

    public async Task<ReceiptDraftResponse> DraftFromPhotoAsync(
        Guid userId, Stream photo, long length, CancellationToken cancellationToken)
    {
        if (length is <= 0 or > MaxPhotoBytes)
        {
            throw new DomainValidationException("photo", "Send one photo of at most 10 MB.");
        }

        // By its first bytes, not its name or declared type: those are whatever the client says.
        var head = new byte[Png.Length];
        var read = await photo.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, cancellationToken);
        var contentType = head.AsSpan(0, read).StartsWith(Jpeg) ? "image/jpeg"
            : head.AsSpan(0, read).StartsWith(Png) ? "image/png"
            : throw new DomainValidationException("photo", "Send the photo as a JPEG or PNG.");
        photo.Position = 0;

        var found = await ocr.ReadAsync(photo, contentType, cancellationToken);

        // The reader's numbers are OCR: kept only when they could be a real entry.
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Belgrade));
        var date = found.Date is { } d && d >= EarliestDate && d <= today.AddDays(1) ? d : (DateOnly?)null;
        var total = found.Total is { } t && t > 0 && t <= Money.MaxAmount && decimal.Round(t, 2) == t
            ? t
            : (decimal?)null;

        if (date is null && total is null)
        {
            logger.LogInformation("Receipt photo unreadable for {UserId} (confidence {Confidence:0.00})",
                userId, found.Confidence);
            throw new UnprocessableException(
                "We couldn't read this receipt. Retake the photo flat and in good light, or enter it by hand.");
        }

        return new ReceiptDraftResponse
        {
            OccurredOn = date,
            Amount = total,
            Currency = Currencies.Rsd,
            StoreName = found.StoreName,
            LocationName = found.LocationName,
            ReceiptNumber = null,
            SuggestedCategoryId =
                await categories.SuggestAsync(userId, found.StoreName, found.LocationName, cancellationToken),
            ExistingTransactionId = null,
        };
    }
}
