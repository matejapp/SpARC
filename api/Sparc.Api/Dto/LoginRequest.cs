using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Dto;

public sealed class LoginRequest
{
    /// <summary>Email or username. An '@' means email — usernames cannot contain one (D-020).</summary>
    [Required]
    [StringLength(256)]
    public string Login { get; init; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Password { get; init; } = string.Empty;
}
