using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class UsersController(IUserService userService) : BaseController
{
    /// <summary>
    /// The caller's own account, for the greeting and settings. There is no id parameter: the
    /// user is the token's subject, so no other account can be named.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me() =>
        await userService.GetAsync(CurrentUserId);
}
