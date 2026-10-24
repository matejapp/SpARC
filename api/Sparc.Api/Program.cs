using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sparc.Api.Common;
using Sparc.Api.Data;
using Sparc.Api.Middleware;
using Sparc.Api.Models;
using Sparc.Api.Repositories;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services;
using Sparc.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Development: user-secrets. Deployed: the ConnectionStrings__Sparc environment variable.
var connectionString = builder.Configuration.GetConnectionString("Sparc");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'Sparc' is not configured. Set it with: " +
        "dotnet user-secrets set \"ConnectionStrings:Sparc\" \"Host=...;Database=...;Username=...;Password=...;SSL Mode=VerifyFull\"");
}
if (connectionString.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Connection string 'Sparc' is a postgresql:// URL. Npgsql needs the key=value form " +
        "(Host=...;Database=...;Username=...;Password=...). Neon's Connect dialog offers it as the .NET option.");
}

builder.Services.AddDbContext<SparcDbContext>(options => options.UseNpgsql(connectionString));

// Identity core only: UserManager + the password hasher, no cookies, no roles (D-006, D-013).
// Password policy is length over composition (D-018).
builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.Password.RequiredLength = 10;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredUniqueChars = 1;

        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;

        options.User.RequireUniqueEmail = true;
        // Identity's default minus '@': login takes "email or username" and tells them apart by
        // the '@', so no username may look like someone else's email (D-020).
        options.User.AllowedUserNameCharacters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._+";
    })
    .AddEntityFrameworkStores<SparcDbContext>();

// JWT access tokens + rotated refresh tokens (D-021). The signing key is a secret: user-secrets
// in development, the Jwt__SigningKey environment variable when deployed.
var jwtOptions = builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
// `dotnet ef` builds this host without secrets and never issues a token.
if (!EF.IsDesignTime)
{
    jwtOptions.Validate();
}
builder.Services.AddSingleton(jwtOptions);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep "sub" as "sub" instead of remapping it to a long ClaimTypes URI.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = jwtOptions.Key,
            ValidateIssuerSigningKey = true,
            // Pinned: a token cannot choose its own algorithm (no "none", no algorithm confusion).
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = JwtRegisteredClaimNames.Sub,
        };
    });

builder.Services.AddAuthRateLimits();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Errors: exceptions → GlobalExceptionHandler; empty error responses (401, unknown route) →
// status code pages. Both write ProblemDetails, with a traceId to find the server-side log.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddControllers();
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseHttpsRedirection();

// Before authentication: a throttled request costs no token validation.
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
