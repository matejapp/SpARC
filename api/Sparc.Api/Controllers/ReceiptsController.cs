using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Services;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

/// <summary>Receipt capture (F-08, D-045). Drafts only: nothing here writes a transaction.</summary>
public sealed class ReceiptsController(IReceiptService receiptService) : BaseController
{
    /// <summary>
    /// A draft expense from the text of a fiscal receipt's QR code. Rate-limited: each call makes
    /// one request to the tax authority's site.
    /// </summary>
    [HttpPost("qr")]
    [EnableRateLimiting(RateLimitPolicies.Receipts)]
    public async Task<ActionResult<ReceiptDraftResponse>> DraftFromQr(ReceiptQrRequest request) =>
        await receiptService.DraftFromQrAsync(CurrentUserId, request, HttpContext.RequestAborted);

    /// <summary>
    /// A draft expense from a photo of the receipt, as the multipart field <c>photo</c>. The form
    /// is held in memory up to the cap, so the photo is never buffered to disk, and it is not
    /// stored or logged. Rate-limited: each one is an OCR run.
    /// </summary>
    [HttpPost("photo")]
    [EnableRateLimiting(RateLimitPolicies.ReceiptPhotos)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(PhotoRequestLimit)]
    [RequestFormLimits(MultipartBodyLengthLimit = PhotoRequestLimit, MemoryBufferThreshold = (int)PhotoRequestLimit)]
    public async Task<ActionResult<ReceiptDraftResponse>> DraftFromPhoto([FromForm] ReceiptPhotoRequest request)
    {
        await using var photo = request.Photo!.OpenReadStream();
        return await receiptService.DraftFromPhotoAsync(
            CurrentUserId, photo, request.Photo.Length, HttpContext.RequestAborted);
    }

    // The photo's cap plus room for the multipart framing.
    private const long PhotoRequestLimit = ReceiptService.MaxPhotoBytes + 64 * 1024;
}
