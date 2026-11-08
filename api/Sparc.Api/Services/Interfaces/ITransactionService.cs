using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface ITransactionService
{
    Task<PagedResponse<TransactionResponse>> ListAsync(Guid userId, TransactionListQuery query);
    /// <summary>One transaction, shown in <paramref name="displayCurrency"/> or, when null, the preferred one.</summary>
    Task<TransactionResponse> GetAsync(Guid userId, Guid id, string? displayCurrency);
    Task<TransactionResponse> CreateAsync(Guid userId, TransactionRequest request);
    Task UpdateAsync(Guid userId, Guid id, TransactionRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}
