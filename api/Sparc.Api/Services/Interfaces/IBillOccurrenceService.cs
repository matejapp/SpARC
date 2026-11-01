using Sparc.Api.Dto;

namespace Sparc.Api.Services.Interfaces;

public interface IBillOccurrenceService
{
    Task<List<OccurrenceResponse>> ListAsync(Guid userId, OccurrenceListQuery query);

    /// <summary>What the dashboard shows: overdue months first, then those due within 30 days.</summary>
    Task<List<OccurrenceResponse>> UpcomingAsync(Guid userId, UpcomingOccurrencesQuery query);

    /// <summary>Marks one month paid and returns the expense it created.</summary>
    Task<TransactionResponse> PayAsync(Guid userId, Guid id, PayOccurrenceRequest request);
}
