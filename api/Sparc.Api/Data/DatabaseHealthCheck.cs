using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Sparc.Api.Data;

/// <summary>
/// Runs a trivial query against the database. A failure throws, so the health-check
/// service logs the real cause server-side while /health only ever says "Unhealthy".
/// </summary>
public sealed class DatabaseHealthCheck(SparcDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlAsync($"SELECT 1", cancellationToken);
        return HealthCheckResult.Healthy();
    }
}
