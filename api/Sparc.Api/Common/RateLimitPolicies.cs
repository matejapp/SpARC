using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Sparc.Api.Common;

/// <summary>
/// Per-IP limits on the anonymous auth endpoints (D-022). Identity lockout is the per-account
/// layer; this one stops a single source from spraying many accounts or probing for emails.
/// </summary>
public static class RateLimitPolicies
{
    public const string Login = "login";
    public const string Register = "register";
    public const string Refresh = "refresh";

    public static IServiceCollection AddAuthRateLimits(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.AddPolicy(Login, context => PerIp(context, permits: 10, TimeSpan.FromMinutes(1)));
            options.AddPolicy(Register, context => PerIp(context, permits: 10, TimeSpan.FromHours(1)));
            // A device refreshes every ~15 minutes; 20 a minute leaves room for several devices
            // behind one carrier NAT.
            options.AddPolicy(Refresh, context => PerIp(context, permits: 20, TimeSpan.FromMinutes(1)));

            // The body is left empty on purpose: UseStatusCodePages fills it with ProblemDetails,
            // the same as every other error response (D-016).
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }

                context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger(typeof(RateLimitPolicies))
                    .LogWarning("Rate limit hit on {Method} {Path}",
                        context.HttpContext.Request.Method, context.HttpContext.Request.Path);
                return ValueTask.CompletedTask;
            };
        });

    // RemoteIpAddress is the socket peer. Behind the homelab reverse proxy it becomes the proxy's
    // address, so deployment must add ForwardedHeaders with the proxy as the only KnownProxy —
    // trusting X-Forwarded-For from anyone would let a client pick its own partition.
    private static RateLimitPartition<string> PerIp(HttpContext context, int permits, TimeSpan window) =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = window, QueueLimit = 0 });
}
