namespace Sparc.Api.Dto;

/// <summary>
/// What a scan suggests for a new expense. Nothing is saved: the app shows it as an editable
/// form, and the user's confirmation is an ordinary create (domain rule 6, D-045).
/// </summary>
public sealed class ReceiptDraftResponse
{
    /// <summary>
    /// The receipt's date in Serbia (Europe/Belgrade). Always set from a QR code; null when a
    /// photo didn't show it legibly (D-048).
    /// </summary>
    public required DateOnly? OccurredOn { get; init; }

    /// <summary>Always set from a QR code; null when a photo didn't show it legibly.</summary>
    public required decimal? Amount { get; init; }

    /// <summary>Always RSD: fiscal receipts are issued in dinars.</summary>
    public required string Currency { get; init; }

    /// <summary>
    /// The company that issued the receipt, e.g. "DELHAIZE SERBIA DOO". Null when the public
    /// record didn't answer or didn't name it.
    /// </summary>
    public required string? StoreName { get; init; }

    /// <summary>The shop or till it was issued at, e.g. "1043567-Maxi 155". Null as above.</summary>
    public required string? LocationName { get; init; }

    /// <summary>
    /// Sent back with the create, so the same receipt can't be entered twice. Null from a photo:
    /// an OCR misread could block a different receipt.
    /// </summary>
    public required string? ReceiptNumber { get; init; }

    /// <summary>Null until category suggestion exists (Sprint 4, list 4.0.4).</summary>
    public required Guid? SuggestedCategoryId { get; init; }

    /// <summary>Set when this receipt is already one of the user's transactions.</summary>
    public required Guid? ExistingTransactionId { get; init; }
}
