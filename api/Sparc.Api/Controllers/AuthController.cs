using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

// [AllowAnonymous] goes on each public action, not the class: logout needs a token.
public sealed class AuthController(IAuthService authService) : BaseController
{
    /// <summary>Creates an unconfirmed account. Issues no tokens; the app logs in next.</summary>
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Register)]
    [HttpPost("register")]
    public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
    {
        var user = await authService.RegisterAsync(request);
        return StatusCode(StatusCodes.Status201Created, user);
    }

    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    [HttpPost("login")]
    public async Task<ActionResult<TokenResponse>> Login(LoginRequest request) =>
        await authService.LoginAsync(request);

    /// <summary>Exchanges a refresh token for a new pair. The old refresh token stops working.</summary>
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Refresh)]
    [HttpPost("refresh")]
    public async Task<ActionResult<TokenResponse>> Refresh(RefreshRequest request) =>
        await authService.RefreshAsync(request);

    /// <summary>Revokes this login's refresh tokens. Always 204, so it is safe to repeat.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        await authService.LogoutAsync(CurrentUserId, request);
        return NoContent();
    }
}
