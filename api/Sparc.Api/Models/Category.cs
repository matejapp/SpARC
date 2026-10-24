using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

[Index(nameof(UserId), nameof(Kind))]
public class Category : ITimestamped
{
    public Guid Id { get; set; }

    /// <summary>Null for a system category shared by every user.</summary>
    public Guid? UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    public AppUser? User { get; set; }

    public required string Name { get; set; }
    public TransactionType Kind { get; set; }
    public bool IsSystem { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
