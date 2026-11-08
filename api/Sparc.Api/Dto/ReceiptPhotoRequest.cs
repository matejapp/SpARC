using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

/// <summary>A photo of a receipt, as the multipart field <c>photo</c> (D-048).</summary>
public sealed class ReceiptPhotoRequest
{
    [Required]
    public IFormFile? Photo { get; init; }
}
