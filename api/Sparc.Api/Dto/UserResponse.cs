namespace Sparc.Api.Dto;

public sealed class UserResponse
{
    public required Guid Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string PreferredCurrency { get; init; }
}
