using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

public sealed class CategoryService(
    ICategoryRepository categories,
    ILogger<CategoryService> logger) : ICategoryService
{
    public async Task<List<CategoryResponse>> ListAsync(Guid userId, TransactionType? kind)
    {
        var visible = await categories.ListVisibleAsync(userId, kind);
        return visible.Select(ToResponse).ToList();
    }

    public async Task<CategoryResponse> CreateAsync(Guid userId, CreateCategoryRequest request)
    {
        var category = new Category
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Kind = request.Kind!.Value,
            IsSystem = false,
        };

        await categories.AddAsync(category);
        logger.LogInformation("Category created {CategoryId} for {UserId}", category.Id, userId);

        return ToResponse(category);
    }

    // A system category or another user's id is a 404 like a missing one: users can never
    // change the system set, and a 403 would confirm the id exists (D-015).
    public async Task DeleteAsync(Guid userId, Guid id)
    {
        if (!await categories.DeleteOwnAsync(userId, id))
        {
            throw new NotFoundException("Category");
        }

        logger.LogInformation("Category deleted {CategoryId} for {UserId}", id, userId);
    }

    private static CategoryResponse ToResponse(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Kind = category.Kind,
        IsSystem = category.IsSystem,
    };
}
