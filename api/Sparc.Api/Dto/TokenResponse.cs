namespace Sparc.Api.Dto;

/// <summary>Returned by login and refresh. The app keeps both tokens in expo-secure-store.</summary>
public sealed class TokenResponse
{
    public required string AccessToken { get; init; }
    public required DateTime AccessTokenExpiresAt { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime RefreshTokenExpiresAt { get; init; }
}
