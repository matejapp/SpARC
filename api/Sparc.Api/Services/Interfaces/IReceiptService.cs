using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IReceiptService
{
    /// <summary>
    /// A draft expense from a scanned fiscal receipt QR code. Saves nothing. 400 on
    /// <c>text</c> when it isn't a fiscal receipt code, or one that neither decodes nor verifies.
    /// </summary>
    Task<ReceiptDraftResponse> DraftFromQrAsync(Guid userId, ReceiptQrRequest request, CancellationToken cancellationToken);
}
