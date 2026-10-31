using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Sparc.Api.Controllers;

/// <summary>
/// Base for every API controller. Authorized by default: an endpoint is public only
/// when it opts out with [AllowAnonymous] (register, login, refresh, password reset).
/// Every route is versioned under api/v1 (D-023).
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// The authenticated user, from the JWT's validated "sub" claim — the only source of a user id
    /// anywhere in the API. Never read a user id from the body, query or route.
    /// </summary>
    protected Guid CurrentUserId =>
        Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id)
            ? id
            // Unreachable behind [Authorize] with our own tokens; a 500 if it ever happens.
            : throw new InvalidOperationException("Authenticated request without a valid sub claim.");
}
