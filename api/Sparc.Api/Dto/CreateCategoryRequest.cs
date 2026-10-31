using System.ComponentModel.DataAnnotations;
using Sparc.Api.Models;

namespace Sparc.Api.Dto;

public sealed class CreateCategoryRequest
{
    // [Required] also rejects whitespace-only; the service trims.
    [Required]
    [StringLength(50)]
    public string Name { get; init; } = string.Empty;

    // Nullable so a missing value is a 400, not a silent Income (the enum's 0).
    [Required]
    public TransactionType? Kind { get; init; }
}
