using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserResponse> GetAsync(Guid userId);

    Task<UserResponse> UpdateAsync(Guid userId, UpdateUserRequest request);
}
