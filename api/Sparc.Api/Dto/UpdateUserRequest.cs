using System.ComponentModel.DataAnnotations;
using Sparc.Api.Validators;

namespace Sparc.Api.Dto;

/// <summary>
/// The settings a user may change on their own account. Only the display currency for now:
/// username, email and password have their own flows, so they are deliberately not here and
/// can't be written through this request (D-043).
/// </summary>
public sealed class UpdateUserRequest
{
    [Required]
    [SupportedCurrency]
    public string? PreferredCurrency { get; init; }
}
