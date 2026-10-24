using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IAuthService
{
    Task<UserResponse> RegisterAsync(RegisterRequest request);
    Task<TokenResponse> LoginAsync(LoginRequest request);
    Task<TokenResponse> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(Guid userId, LogoutRequest request);
}
