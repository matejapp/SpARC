using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparc.Api.Common;
using Sparc.Api.Dto;
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
}
