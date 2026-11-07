using Sparc.Api.Common;
using System.ComponentModel.DataAnnotations;

namespace Sparc.Api.Validators;

/// <summary>
/// Positive, at most two decimal places, and fits numeric(18,2). Postgres would round a third
/// decimal silently, so it is rejected here instead. Null is left to [Required].
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class MoneyAmountAttribute()
    : ValidationAttribute("Amount must be greater than 0 with at most 2 decimal places.")
{
    public override bool IsValid(object? value) =>
        value is null || (value is decimal amount && amount > 0 && amount <= Money.MaxAmount && decimal.Round(amount, 2) == amount);
}
