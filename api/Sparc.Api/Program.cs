using Microsoft.EntityFrameworkCore;
using Sparc.Api.Data;
using Sparc.Api.Middleware;

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

app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
