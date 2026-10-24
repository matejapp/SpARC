using System.ComponentModel.DataAnnotations;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>
/// Shape and length only. Allowed username characters and the password minimum live in the
/// Identity options in Program.cs, so each rule is defined once (D-018, D-020).
/// </summary>
public sealed class RegisterRequest
{
    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; init; } = string.Empty;

    // Upper bound only: PBKDF2 hashes whatever it is given, so an unbounded password is a
    // cheap way to burn CPU. NIST asks for at least 64.
    [Required]
    [StringLength(128)]
    public string Password { get; init; } = string.Empty;

    [Required]
    [SupportedCurrency]
    public string PreferredCurrency { get; init; } = string.Empty;
}
