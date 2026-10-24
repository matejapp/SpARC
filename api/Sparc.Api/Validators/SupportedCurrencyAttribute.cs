using System.ComponentModel.DataAnnotations;
using Sparc.Api.Common;

namespace Sparc.Api.Validators;

/// <summary>One of <see cref="Currencies.All"/>, any case. Null is left to [Required].</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class SupportedCurrencyAttribute()
    : ValidationAttribute($"Currency must be one of {string.Join(", ", Currencies.All)}.")
{
    public override bool IsValid(object? value) =>
        value is null || (value is string code && Currencies.IsSupported(code));
}
