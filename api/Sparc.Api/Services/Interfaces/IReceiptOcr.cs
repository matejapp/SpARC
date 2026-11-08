namespace Sparc.Api.Services.Interfaces;

/// <summary>What the receipt reader found on a photo. Each field null when it wasn't legible.</summary>
public sealed record ReceiptOcrResult(
    DateOnly? Date,
    decimal? Total,
    string? StoreName,
    string? LocationName,
    double Confidence);

/// <summary>The Python receipt reader (sparc-ai, D-002, D-048).</summary>
public interface IReceiptOcr
{
    /// <summary>
    /// Reads a JPEG or PNG already checked by the caller. Throws
    /// <see cref="Common.ServiceUnavailableException"/> when the reader is not configured,
    /// unreachable, slow or failing; a photo it can't decode comes back with every field null.
    /// </summary>
    Task<ReceiptOcrResult> ReadAsync(Stream image, string contentType, CancellationToken cancellationToken);
}
