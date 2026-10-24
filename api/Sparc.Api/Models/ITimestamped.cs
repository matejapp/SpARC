namespace Sparc.Api.Models;

/// <summary>Set by SparcDbContext on save. Always UTC; never assigned by hand.</summary>
public interface ITimestamped
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}
