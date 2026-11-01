using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class OccurrencesController(IBillOccurrenceService occurrenceService) : BaseController
{
    /// <summary>
    /// The months of the caller's active bills due in a range (both dates or neither), by due
    /// date. For the calendar, and with billId for one bill's detail.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<OccurrenceResponse>>> List([FromQuery] OccurrenceListQuery query) =>
        await occurrenceService.ListAsync(CurrentUserId, query);

    /// <summary>Marks one month paid and creates its expense. 409 when it is already paid.</summary>
    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<TransactionResponse>> Pay(Guid id, PayOccurrenceRequest request)
    {
        var expense = await occurrenceService.PayAsync(CurrentUserId, id, request);
        return CreatedAtAction(nameof(TransactionsController.Get), "Transactions", new { id = expense.Id }, expense);
    }
}
