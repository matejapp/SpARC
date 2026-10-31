using Sparc.Api.Dto;
using Sparc.Api.Models;

namespace Sparc.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryResponse>> ListAsync(Guid userId, TransactionType? kind);
    Task<CategoryResponse> CreateAsync(Guid userId, CreateCategoryRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}
