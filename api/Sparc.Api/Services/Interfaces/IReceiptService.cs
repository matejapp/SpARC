using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IReceiptService
{
    /// <summary>
    /// A draft expense from a scanned fiscal receipt QR code. Saves nothing. 400 on
    /// <c>text</c> when it isn't a fiscal receipt code, or one that neither decodes nor verifies.
    /// </summary>
    Task<ReceiptDraftResponse> DraftFromQrAsync(Guid userId, ReceiptQrRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// A draft expense from a photo of a receipt, read by OCR (D-048). Saves nothing and stores
    /// no photo. 400 on <c>photo</c> when it is empty, over 10 MB or not a JPEG/PNG; 422 when
    /// neither date nor total is legible; 503 when the reader is unavailable.
    /// </summary>
    Task<ReceiptDraftResponse> DraftFromPhotoAsync(Guid userId, Stream photo, long length, CancellationToken cancellationToken);
}
