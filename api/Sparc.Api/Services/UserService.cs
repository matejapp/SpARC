using Microsoft.AspNetCore.Identity;
using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Reads the caller's own account. UserManager is the repository for users (D-020); only the
/// DTO leaves this class, so no hash, stamp or lockout field can reach a response.
/// </summary>
public sealed class UserService(UserManager<AppUser> userManager) : IUserService
{
    public async Task<UserResponse> GetAsync(Guid userId)
    {
        // A valid token can outlive its account; that is a 404, not a 500.
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw new NotFoundException("User");

        return new UserResponse
        {
            Id = user.Id,
            Username = user.UserName!,
            Email = user.Email!,
            PreferredCurrency = user.PreferredCurrency,
        };
    }
}
