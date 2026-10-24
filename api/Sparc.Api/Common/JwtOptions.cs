using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Sparc.Api.Common;

/// <summary>
/// The "Jwt" configuration section. Issuer, audience and lifetimes are in appsettings.json;
/// SigningKey comes from user-secrets (dev) or the Jwt__SigningKey environment variable.
/// </summary>
public sealed class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SigningKey { get; init; } = string.Empty;

    public int AccessTokenMinutes { get; init; }
    public int RefreshTokenDays { get; init; }
    public int RefreshFamilyDays { get; init; }

    public SymmetricSecurityKey Key => new(Encoding.UTF8.GetBytes(SigningKey));

    /// <summary>Fails startup rather than issuing tokens with a weak or missing key.</summary>
    public void Validate()
    {
        // HS256 needs at least a 256-bit key.
        if (Encoding.UTF8.GetByteCount(SigningKey) < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey is missing or shorter than 32 bytes. Set a random one (PowerShell): " +
                "$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); " +
                "dotnet user-secrets set \"Jwt:SigningKey\" ([Convert]::ToBase64String($b))");
        }
        if (string.IsNullOrWhiteSpace(Issuer) || string.IsNullOrWhiteSpace(Audience))
        {
            throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be set in appsettings.json.");
        }
        if (AccessTokenMinutes <= 0 || RefreshTokenDays <= 0 || RefreshFamilyDays < RefreshTokenDays)
        {
            throw new InvalidOperationException(
                "Jwt lifetimes must be positive, with RefreshFamilyDays >= RefreshTokenDays.");
        }
    }
}
