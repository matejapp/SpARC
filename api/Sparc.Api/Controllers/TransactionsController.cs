using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class TransactionsController(ITransactionService transactionService) : BaseController
{
    /// <summary>The caller's transactions, newest first, one page at a time.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<TransactionResponse>>> List([FromQuery] TransactionListQuery query) =>
        await transactionService.ListAsync(CurrentUserId, query);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionResponse>> Get(Guid id) =>
        await transactionService.GetAsync(CurrentUserId, id);

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(TransactionRequest request)
    {
        var transaction = await transactionService.CreateAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(Get), new { id = transaction.Id }, transaction);
    }

    /// <summary>Replaces every editable field; the body is validated exactly like a create.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, TransactionRequest request)
    {
        await transactionService.UpdateAsync(CurrentUserId, id, request);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await transactionService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }
}
