using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// UserManager is the repository for users: Identity's store already filters, hashes and
/// normalises, so there is no Repositories/ layer between them (D-020). Refresh tokens are our
/// own table and go through IRefreshTokenRepository (D-021).
/// </summary>
public sealed class AuthService(
    UserManager<AppUser> userManager,
    IPasswordHasher<AppUser> passwordHasher,
    IOptions<IdentityOptions> identityOptions,
    ITokenService tokenService,
    IRefreshTokenRepository refreshTokens,
    JwtOptions jwtOptions,
    ILogger<AuthService> logger) : IAuthService
{
    // Verified against when the account does not exist, so an unknown login costs the same PBKDF2
    // work as a wrong password and response time does not reveal which accounts exist.
    private static readonly string DummyPasswordHash =
        new PasswordHasher<AppUser>().HashPassword(null!, "no account has this password");

    private const string InvalidRefreshToken = "The refresh token is invalid or has expired.";

    public async Task<UserResponse> RegisterAsync(RegisterRequest request)
    {
        var user = new AppUser
        {
            UserName = request.Username,
            Email = request.Email.Trim(),
            EmailConfirmed = false,
            PreferredCurrency = request.PreferredCurrency.ToUpperInvariant(),
        };

        // Validates the password, then the username/email rules and uniqueness, then inserts.
        // Two concurrent requests can both pass the uniqueness check; the unique indexes stop the
        // second insert and GlobalExceptionHandler turns that into a 409 (D-013, D-016).
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            ThrowFor(result.Errors);
        }

        logger.LogInformation("User registered {UserId}", user.Id);

        return new UserResponse
        {
            Id = user.Id,
            Username = user.UserName!,
            Email = user.Email!,
            PreferredCurrency = user.PreferredCurrency,
        };
    }

    // Every failure — unknown account, wrong password, locked out — throws the same message, which
    // also warns that lockout exists without saying whether this account hit it (D-021).
    // Unconfirmed emails can log in until verification ships in Sprint 5.
    public async Task<TokenResponse> LoginAsync(LoginRequest request)
    {
        var login = request.Login.Trim();
        var user = login.Contains('@')
            ? await userManager.FindByEmailAsync(login)
            : await userManager.FindByNameAsync(login);

        if (user is null)
        {
            passwordHasher.VerifyHashedPassword(null!, DummyPasswordHash, request.Password);
            logger.LogInformation("Login failed: no such account");
            throw InvalidCredentials();
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            passwordHasher.VerifyHashedPassword(user, DummyPasswordHash, request.Password);
            logger.LogInformation("Login refused: {UserId} is locked out", user.Id);
            throw InvalidCredentials();
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            // Counts toward lockout (D-018). Two concurrent failures can collide on Identity's
            // concurrency stamp and count once; rate limiting (#12) bounds that gap.
            await userManager.AccessFailedAsync(user);
            if (await userManager.IsLockedOutAsync(user))
            {
                logger.LogWarning("Account locked out after failed logins {UserId}", user.Id);
            }
            else
            {
                logger.LogInformation("Login failed: wrong password for {UserId}", user.Id);
            }
            throw InvalidCredentials();
        }

        await userManager.ResetAccessFailedCountAsync(user);

        var now = DateTime.UtcNow;
        var familyExpiresAt = now.AddDays(jwtOptions.RefreshFamilyDays);
        var (refreshToken, refreshEntity) = NewRefreshToken(user.Id, Guid.CreateVersion7(), familyExpiresAt, now);
        await refreshTokens.AddAsync(refreshEntity);

        logger.LogInformation("User logged in {UserId}", user.Id);
        return Tokens(user.Id, refreshToken, refreshEntity);
    }

    public async Task<TokenResponse> RefreshAsync(RefreshRequest request)
    {
        var current = await refreshTokens.FindByHashAsync(tokenService.HashRefreshToken(request.RefreshToken));
        if (current is null)
        {
            throw new AuthenticationFailedException(InvalidRefreshToken);
        }

        if (current.RevokedAt is not null)
        {
            // A rotated token is only ever presented again by whoever copied it. Kill the family,
            // so the thief's newer token dies too and the real user has to log in again.
            if (current.RevocationReason == RevocationReason.Rotated)
            {
                await RevokeForReuseAsync(current);
            }
            throw new AuthenticationFailedException(InvalidRefreshToken);
        }

        var now = DateTime.UtcNow;
        if (current.ExpiresAt <= now)
        {
            throw new AuthenticationFailedException(InvalidRefreshToken);
        }

        var (refreshToken, next) = NewRefreshToken(current.UserId, current.FamilyId, current.FamilyExpiresAt, now);
        if (!await refreshTokens.RotateAsync(current.Id, next))
        {
            // Another request rotated this token between our read and our update: the same token
            // was used twice. The app must never refresh concurrently (D-021).
            await RevokeForReuseAsync(current);
            throw new AuthenticationFailedException(InvalidRefreshToken);
        }

        return Tokens(current.UserId, refreshToken, next);
    }

    // Ends this login on the server: the whole family, so an older copy of the token is dead too.
    // Succeeds silently for an unknown, foreign or already-revoked token — the outcome the
    // caller wants is "this token no longer works", and a difference would leak which tokens exist.
    // The access token lives on until it expires (15 min); there is no access-token denylist (D-022).
    public async Task LogoutAsync(Guid userId, LogoutRequest request)
    {
        var token = await refreshTokens.FindByHashAsync(userId, tokenService.HashRefreshToken(request.RefreshToken));
        if (token is null)
        {
            logger.LogInformation("Logout with an unknown refresh token for {UserId}", userId);
            return;
        }

        await refreshTokens.RevokeFamilyAsync(token.FamilyId, RevocationReason.LoggedOut);
        logger.LogInformation("User logged out {UserId}, family {FamilyId}", userId, token.FamilyId);
    }

    private async Task RevokeForReuseAsync(RefreshToken token)
    {
        await refreshTokens.RevokeFamilyAsync(token.FamilyId, RevocationReason.ReuseDetected);
        logger.LogWarning("Refresh token reuse: revoked family {FamilyId} of {UserId}", token.FamilyId, token.UserId);
    }

    private (string Token, RefreshToken Entity) NewRefreshToken(
        Guid userId, Guid familyId, DateTime familyExpiresAt, DateTime now)
    {
        var token = tokenService.CreateRefreshToken();
        var slidingExpiry = now.AddDays(jwtOptions.RefreshTokenDays);

        return (token, new RefreshToken
        {
            UserId = userId,
            FamilyId = familyId,
            TokenHash = tokenService.HashRefreshToken(token),
            ExpiresAt = slidingExpiry < familyExpiresAt ? slidingExpiry : familyExpiresAt,
            FamilyExpiresAt = familyExpiresAt,
        });
    }

    private TokenResponse Tokens(Guid userId, string refreshToken, RefreshToken refreshEntity)
    {
        var (accessToken, accessExpiresAt) = tokenService.CreateAccessToken(userId);
        return new TokenResponse
        {
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessExpiresAt,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshEntity.ExpiresAt,
        };
    }

    private AuthenticationFailedException InvalidCredentials()
    {
        var lockout = identityOptions.Value.Lockout;
        return new AuthenticationFailedException(
            $"Invalid login or password. After {lockout.MaxFailedAccessAttempts} failed attempts, " +
            $"sign-in is blocked for {lockout.DefaultLockoutTimeSpan.TotalMinutes:0} minutes.");
    }

    private static void ThrowFor(IEnumerable<IdentityError> identityErrors)
    {
        var errors = identityErrors.ToList();

        // A duplicate wins over a validation error: retyping the password will not help.
        var duplicateEmail = errors.Any(e => e.Code == nameof(IdentityErrorDescriber.DuplicateEmail));
        var duplicateUserName = errors.Any(e => e.Code == nameof(IdentityErrorDescriber.DuplicateUserName));
        if (duplicateEmail || duplicateUserName)
        {
            // Telling a registrant the email is taken is deliberate; rate limiting (#12) is what
            // stops bulk probing (D-020).
            throw new ConflictException((duplicateEmail, duplicateUserName) switch
            {
                (true, true) => "This username and email are already registered.",
                (true, false) => "An account with this email already exists.",
                _ => "This username is already taken.",
            });
        }

        var fieldErrors = errors
            .GroupBy(e => FieldFor(e.Code))
            .ToDictionary(g => g.Key, g => g.Select(DescriptionFor).ToArray());

        throw new DomainValidationException(fieldErrors);
    }

    // Keys match the DTO property names, so these errors look like [ApiController] model errors.
    private static string FieldFor(string code) => code switch
    {
        _ when code.StartsWith("Password", StringComparison.Ordinal) => nameof(RegisterRequest.Password),
        nameof(IdentityErrorDescriber.InvalidEmail) => nameof(RegisterRequest.Email),
        nameof(IdentityErrorDescriber.InvalidUserName) => nameof(RegisterRequest.Username),

        // Anything else from CreateAsync is not the client's fault; let it surface as a 500.
        _ => throw new InvalidOperationException($"Unexpected Identity error during registration: {code}"),
    };

    // Identity's own text says "letters or digits", which hides that - . _ + are allowed too.
    private static string DescriptionFor(IdentityError error) =>
        error.Code == nameof(IdentityErrorDescriber.InvalidUserName)
            ? "Username can only contain letters, digits and - . _ +"
            : error.Description;
}
