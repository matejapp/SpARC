using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Sparc.Api.Controllers;

/// <summary>
/// Base for every API controller. Authorized by default: an endpoint is public only
/// when it opts out with [AllowAnonymous] (register, login, refresh, password reset).
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
}
