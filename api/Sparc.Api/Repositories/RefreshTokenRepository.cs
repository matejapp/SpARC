using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;

namespace Sparc.Api.Repositories;

// ExecuteUpdate bypasses SaveChanges, so these updates stamp UpdatedAt themselves — the one
// place it is set by hand.
public sealed class RefreshTokenRepository(SparcDbContext db) : IRefreshTokenRepository
{
    public async Task AddAsync(RefreshToken token)
    {
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();
    }

    public Task<RefreshToken?> FindByHashAsync(string tokenHash) =>
        db.RefreshTokens.AsNoTracking().SingleOrDefaultAsync(t => t.TokenHash == tokenHash);

    public Task<RefreshToken?> FindByHashAsync(Guid userId, string tokenHash) =>
        db.RefreshTokens.AsNoTracking().SingleOrDefaultAsync(t => t.TokenHash == tokenHash && t.UserId == userId);

    public async Task<bool> RotateAsync(Guid currentId, RefreshToken replacement)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();

        // The WHERE on RevokedAt is the lock: of two requests racing with one token, exactly one
        // updates a row. The loser gets 0 and is treated as reuse.
        var now = DateTime.UtcNow;
        var rotated = await db.RefreshTokens
            .Where(t => t.Id == currentId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.RevokedAt, now)
                .SetProperty(t => t.RevocationReason, RevocationReason.Rotated)
                .SetProperty(t => t.UpdatedAt, now));
        if (rotated == 0)
        {
            return false;
        }

        db.RefreshTokens.Add(replacement);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return true;
    }

    public async Task RevokeFamilyAsync(Guid familyId, RevocationReason reason)
    {
        var now = DateTime.UtcNow;
        await db.RefreshTokens
            .Where(t => t.FamilyId == familyId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.RevokedAt, now)
                .SetProperty(t => t.RevocationReason, reason)
                .SetProperty(t => t.UpdatedAt, now));
    }
}
