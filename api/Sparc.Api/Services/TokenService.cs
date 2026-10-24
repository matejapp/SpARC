using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sparc.Api.Common;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

public sealed class TokenService(JwtOptions options) : ITokenService
{
    private static readonly JsonWebTokenHandler Handler = new();

    public (string Token, DateTime ExpiresAt) CreateAccessToken(Guid userId)
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(options.AccessTokenMinutes);

        // The user id is the only identity claim. Nothing else is trusted from the token, so nothing
        // else (email, username) is put in it to go stale or leak.
        var token = Handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = options.Issuer,
            Audience = options.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = expiresAt,
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = userId.ToString(),
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString(),
            },
            SigningCredentials = new SigningCredentials(options.Key, SecurityAlgorithms.HmacSha256),
        });

        return (token, expiresAt);
    }

    public string CreateRefreshToken() => Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));

    // A fast hash is right here, unlike for passwords: the input is 256 random bits, so there is
    // nothing to brute-force, and every refresh needs an indexed lookup by hash.
    public string HashRefreshToken(string refreshToken) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
}
