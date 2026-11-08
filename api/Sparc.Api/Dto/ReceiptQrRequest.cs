using System.ComponentModel.DataAnnotations;
using Sparc.Api.Services;

namespace Sparc.Api.Dto;

/// <summary>The text of a scanned QR code, exactly as the camera read it.</summary>
public sealed class ReceiptQrRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(FiscalReceiptParser.MaxTextLength)]
    public string? Text { get; init; }
}
