using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Sparc.Api.Models;

/// <summary>
/// One link in a refresh chain. Every login starts a family; every refresh revokes the current
/// token and adds the next one in the same family (D-021). Only the hash is stored.
/// </summary>
[Index(nameof(TokenHash), IsUnique = true)]
[Index(nameof(FamilyId))]
public class RefreshToken : ITimestamped
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    public AppUser User { get; set; } = null!;

    /// <summary>Shared by every token descended from one login.</summary>
    public Guid FamilyId { get; set; }

    /// <summary>SHA-256 of the token, lowercase hex. The token itself is never stored.</summary>
    [Column(TypeName = "character(64)")]
    public required string TokenHash { get; set; }

    /// <summary>Sliding: each refresh pushes it out, but never past <see cref="FamilyExpiresAt"/>.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Absolute end of the login this token descends from.</summary>
    public DateTime FamilyExpiresAt { get; set; }

    // Both null while live, both set once revoked — a CHECK constraint holds them together.
    public DateTime? RevokedAt { get; set; }
    public RevocationReason? RevocationReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
