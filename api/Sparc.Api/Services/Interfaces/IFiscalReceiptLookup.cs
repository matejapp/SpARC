namespace Sparc.Api.Services.Interfaces;

/// <summary>
/// What the receipt's public record says. Every field nullable: the record's shape is read
/// defensively until a real receipt confirms it (D-045).
/// </summary>
/// <param name="StoreName">The company that issued it, e.g. "DELHAIZE SERBIA DOO".</param>
/// <param name="LocationName">The shop or till it was issued at, e.g. "1043567-Maxi 155".</param>
public sealed record FiscalReceiptRecord(
    bool? IsValid,
    string? StoreName,
    string? LocationName,
    decimal? Total,
    DateTime? IssuedAtUtc,
    string? ReceiptNumber);

/// <summary>The tax authority's public record of a fiscal receipt.</summary>
public interface IFiscalReceiptLookup
{
    /// <summary>
    /// The record for <paramref name="vl"/>, a verification parameter that has already been
    /// parsed and re-encoded. Null when the site is slow, down or answers something unreadable;
    /// never throws for that — the draft goes on without it.
    /// </summary>
    Task<FiscalReceiptRecord?> FindAsync(string vl, CancellationToken cancellationToken);
}
