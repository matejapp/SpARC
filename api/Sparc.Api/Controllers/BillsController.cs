using Microsoft.AspNetCore.Mvc;
using Sparc.Api.Dto;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Controllers;

public sealed class BillsController(IRecurringBillService billService) : BaseController
{
    /// <summary>The caller's active bills, by name, one page at a time.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponse<BillResponse>>> List([FromQuery] BillListQuery query) =>
        await billService.ListAsync(CurrentUserId, query);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BillResponse>> Get(Guid id) =>
        await billService.GetAsync(CurrentUserId, id);

    /// <summary>Creates the bill and its months up to 12 months ahead.</summary>
    [HttpPost]
    public async Task<ActionResult<BillResponse>> Create(BillRequest request)
    {
        var bill = await billService.CreateAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(Get), new { id = bill.Id }, bill);
    }

    /// <summary>
    /// Replaces every editable field; the body is validated exactly like a create. Unpaid months
    /// from today on are regenerated; paid months keep their amount and date.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, BillRequest request)
    {
        await billService.UpdateAsync(CurrentUserId, id, request);
        return NoContent();
    }

    /// <summary>Deactivates the bill: its unpaid months go, paid months and their expenses stay.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await billService.DeactivateAsync(CurrentUserId, id);
        return NoContent();
    }
}
