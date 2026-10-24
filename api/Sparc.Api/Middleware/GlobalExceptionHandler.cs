using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sparc.Api.Common;

namespace Sparc.Api.Middleware;

/// <summary>
/// The one place an exception becomes an HTTP response. Every failure leaves as ProblemDetails;
/// nothing from EF, Npgsql or a stack trace reaches the client — full detail is logged here.
/// </summary>
public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // The client went away; there is no one to answer.
        if (exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested)
        {
            return true;
        }

        var problem = exception switch
        {
            DomainValidationException e => new ValidationProblemDetails(e.Errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = e.Message,
            },
            NotFoundException e => Problem(StatusCodes.Status404NotFound, "Not found.", e.Message),
            ConflictException e => Problem(StatusCodes.Status409Conflict, "Conflict.", e.Message),

            // Safety net: a unique index caught what a service check missed (e.g. two concurrent
            // registrations). The constraint name stays in the log, not the response.
            DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } } =>
                Problem(StatusCodes.Status409Conflict, "Conflict.", "The request conflicts with existing data."),

            BadHttpRequestException e => Problem(e.StatusCode, "Bad request.", null),

            _ => Problem(StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null),
        };

        if (problem.Status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Request failed with {Status} for {Method} {Path}",
                problem.Status, httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = problem.Status!.Value;

        // If the client does not accept JSON, the status code alone still goes out.
        await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
        });
        return true;
    }

    private static ProblemDetails Problem(int status, string title, string? detail) => new()
    {
        Status = status,
        Title = title,
        Detail = detail,
    };
}
