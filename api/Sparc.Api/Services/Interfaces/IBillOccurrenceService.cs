using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IBillOccurrenceService
{
    Task<List<OccurrenceResponse>> ListAsync(Guid userId, OccurrenceListQuery query);

    /// <summary>Marks one month paid and returns the expense it created.</summary>
    Task<TransactionResponse> PayAsync(Guid userId, Guid id, PayOccurrenceRequest request);
}
