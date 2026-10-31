using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class CategoriesController(ICategoryService categoryService) : BaseController
{
    /// <summary>The shared system set plus the caller's own, optionally one kind only.</summary>
    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> List(
        // Model binding accepts any number for an enum; this rejects ?kind=7.
        [FromQuery, EnumDataType(typeof(TransactionType))] TransactionType? kind) =>
        await categoryService.ListAsync(CurrentUserId, kind);

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request)
    {
        var category = await categoryService.CreateAsync(CurrentUserId, request);
        return StatusCode(StatusCodes.Status201Created, category);
    }

    /// <summary>Own categories only. Its transactions stay, uncategorised.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await categoryService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }
}
