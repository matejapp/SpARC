using System.Text.Json;
using System.Text.Json.Serialization;
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

// The context reads the current user for its ownership filters (D-026).
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
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
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
builder.Services.AddScoped<IDisplayCurrencyService, DisplayCurrencyService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IRecurringBillRepository, RecurringBillRepository>();
builder.Services.AddScoped<IRecurringBillService, RecurringBillService>();
builder.Services.AddScoped<IBillOccurrenceRepository, BillOccurrenceRepository>();
builder.Services.AddScoped<IBillOccurrenceService, BillOccurrenceService>();

// NBS exchange rates (Sprint 3). Provider settings are in appsettings.json; nothing secret.
var fxOptions = builder.Configuration.GetSection(FxRateOptions.Section).Get<FxRateOptions>() ?? new FxRateOptions();
if (!EF.IsDesignTime)
{
    fxOptions.Validate();
}
builder.Services.AddSingleton(fxOptions);
builder.Services.AddHttpClient<IFxRateProvider, KursResenjeRateProvider>(client =>
{
    client.BaseAddress = new Uri(fxOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(fxOptions.TimeoutSeconds);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("SpARC-API/1.0");
});
builder.Services.AddScoped<IFxRateRepository, FxRateRepository>();
builder.Services.AddScoped<IFxRateService, FxRateService>();

// Fiscal receipt lookups (Sprint 4, D-045). One fixed host, no redirects (a redirect could point
// anywhere), a short timeout and a capped body: the scanned text never chooses where we connect.
var receiptOptions = builder.Configuration.GetSection(FiscalReceiptOptions.Section).Get<FiscalReceiptOptions>()
    ?? new FiscalReceiptOptions();
if (!EF.IsDesignTime)
{
    receiptOptions.Validate();
}
builder.Services.AddSingleton(receiptOptions);
builder.Services.AddHttpClient<IFiscalReceiptLookup, PursReceiptLookup>(client =>
    {
        client.BaseAddress = new Uri(receiptOptions.BaseUrl);
        client.Timeout = TimeSpan.FromSeconds(receiptOptions.TimeoutSeconds);
        client.MaxResponseContentBufferSize = 512 * 1024;
        client.DefaultRequestHeaders.UserAgent.ParseAdd("SpARC-API/1.0");
    })
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler { AllowAutoRedirect = false });
builder.Services.AddScoped<IReceiptService, ReceiptService>();

// Errors: exceptions → GlobalExceptionHandler; empty error responses (401, unknown route) →
// status code pages. Both write ProblemDetails, with a traceId to find the server-side log.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Enums travel as camelCase names ("income", "expense"). Numbers are refused, so an undefined
// value like 7 cannot reach a service (D-024).
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)));
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

var app = builder.Build();

// Operator command, not a server: `dotnet run --project api/Sparc.Api -- fx-backfill` gives every
// existing transaction date its EUR and USD rates, then exits. Safe to re-run.
if (args.Contains("fx-backfill"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var result = await scope.ServiceProvider.GetRequiredService<IFxRateService>().BackfillAsync();
    return result.Completed ? 0 : 1;
}

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
return 0;
