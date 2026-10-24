using Sparc.Api.Models;

namespace Sparc.Api.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token);

    /// <summary>
    /// Unscoped, for refresh only: refresh is anonymous and the token is the credential, so the
    /// row's UserId is the owner. Every authenticated path uses the user-scoped overload.
    /// </summary>
    Task<RefreshToken?> FindByHashAsync(string tokenHash);

    /// <summary>Null when the token does not exist or belongs to another user.</summary>
    Task<RefreshToken?> FindByHashAsync(Guid userId, string tokenHash);

    /// <summary>
    /// Revokes <paramref name="currentId"/> as rotated and inserts <paramref name="replacement"/>,
    /// atomically. False when the current token was no longer live — another request used it first.
    /// </summary>
    Task<bool> RotateAsync(Guid currentId, RefreshToken replacement);

    Task RevokeFamilyAsync(Guid familyId, RevocationReason reason);
}
