using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Sparc.Api.Common;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// The user id from the validated JWT "sub" claim — the only source of a user id anywhere in
    /// the API. Null when the request carries no valid token.
    /// </summary>
    public static Guid? GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id) ? id : null;
}

/// <summary>The authenticated user of the current request, for code below the controllers.</summary>
public interface ICurrentUser
{
    /// <summary>Null outside a request, or for a request without a valid token.</summary>
    Guid? Id { get; }
}

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid? Id => accessor.HttpContext?.User.GetUserId();
}
