using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

public sealed class LogoutRequest
{
    [Required]
    [StringLength(128)]
    public string RefreshToken { get; init; } = string.Empty;
}
