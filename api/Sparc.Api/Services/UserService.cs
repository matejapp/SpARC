using Microsoft.AspNetCore.Identity;
using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// Reads and updates the caller's own account. UserManager is the repository for users (D-020);
/// only the DTO leaves this class, so no hash, stamp or lockout field can reach a response.
/// </summary>
public sealed class UserService(UserManager<AppUser> userManager) : IUserService
{
    public async Task<UserResponse> GetAsync(Guid userId) => ToResponse(await FindAsync(userId));

    /// <summary>
    /// Switches the display currency. It is a display setting only (D-005): no transaction, bill
    /// or rate is touched, so switching back and forth is free and loses nothing (D-041).
    /// </summary>
    public async Task<UserResponse> UpdateAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await FindAsync(userId);
        var currency = request.PreferredCurrency!.ToUpperInvariant();
        if (user.PreferredCurrency == currency)
        {
            return ToResponse(user);
        }

        user.PreferredCurrency = currency;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            // Two saves of the same account raced; the client can reload and retry.
            if (result.Errors.Any(e => e.Code == nameof(IdentityErrorDescriber.ConcurrencyFailure)))
            {
                throw new ConflictException("Your account changed at the same time. Reload and try again.");
            }

            // Only the currency changed, so Identity's user validators have nothing new to reject.
            // Anything else is a bug: a 500, with the codes in the log, not the response.
            throw new InvalidOperationException(
                "Updating the preferred currency failed: " + string.Join(", ", result.Errors.Select(e => e.Code)));
        }

        return ToResponse(user);
    }

    // A valid token can outlive its account; that is a 404, not a 500.
    private async Task<AppUser> FindAsync(Guid userId) =>
        await userManager.FindByIdAsync(userId.ToString()) ?? throw new NotFoundException("User");

    private static UserResponse ToResponse(AppUser user) => new()
    {
        Id = user.Id,
        Username = user.UserName!,
        Email = user.Email!,
        PreferredCurrency = user.PreferredCurrency,
    };
}
