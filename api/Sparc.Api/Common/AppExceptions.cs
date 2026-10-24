namespace Sparc.Api.Common;

// Services throw these; GlobalExceptionHandler turns them into ProblemDetails.
// Messages reach the client, so they must never contain EF, SQL or stack detail.

public abstract class AppException(string message) : Exception(message);

/// <summary>
/// 404. Also used when the record exists but belongs to another user — a 403 would confirm
/// that it exists.
/// </summary>
public sealed class NotFoundException(string resource) : AppException($"{resource} was not found.");

/// <summary>409. Duplicate data, or a state change that is no longer allowed (e.g. already paid).</summary>
public sealed class ConflictException(string message) : AppException(message);

/// <summary>
/// 400 with field errors, for rules a DTO cannot check on its own
/// (e.g. the category does not belong to this user).
/// </summary>
public sealed class DomainValidationException(IDictionary<string, string[]> errors)
    : AppException("One or more validation errors occurred.")
{
    public IDictionary<string, string[]> Errors { get; } = errors;

    public DomainValidationException(string field, string message)
        : this(new Dictionary<string, string[]> { [field] = [message] })
    {
    }
}
