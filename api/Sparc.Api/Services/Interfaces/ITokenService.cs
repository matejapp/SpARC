namespace Sparc.Api.Services.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateAccessToken(Guid userId);

    /// <summary>A new opaque refresh token, returned to the client once and never stored.</summary>
    string CreateRefreshToken();

    /// <summary>What the database stores and looks up instead of the token.</summary>
    string HashRefreshToken(string refreshToken);
}
