using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface ITransactionService
{
    Task<PagedResponse<TransactionResponse>> ListAsync(Guid userId, TransactionListQuery query);
    Task<TransactionResponse> GetAsync(Guid userId, Guid id);
    Task<TransactionResponse> CreateAsync(Guid userId, TransactionRequest request);
    Task UpdateAsync(Guid userId, Guid id, TransactionRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}
