using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

public sealed class RefreshRequest
{
    // Issued tokens are 43 characters; the cap only bounds what gets hashed.
    [Required]
    [StringLength(128)]
    public string RefreshToken { get; init; } = string.Empty;
}
