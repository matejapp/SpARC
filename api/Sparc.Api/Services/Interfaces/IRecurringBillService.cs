using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IRecurringBillService
{
    Task<PagedResponse<BillResponse>> ListAsync(Guid userId, BillListQuery query);
    Task<BillResponse> GetAsync(Guid userId, Guid id);
    Task<BillResponse> CreateAsync(Guid userId, BillRequest request);
    Task UpdateAsync(Guid userId, Guid id, BillRequest request);
    Task DeactivateAsync(Guid userId, Guid id);
}
