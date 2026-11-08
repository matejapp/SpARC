namespace Sparc.Api.Common;

/// <summary>
/// A fiscal receipt's number, as the receipt's QR code and public record give it:
/// "requestedBy-signedBy-counter", two 8-character device ids and the device's total counter
/// (D-047). The same pattern is checked by the DTO, the parser and the database.
/// </summary>
public static class FiscalReceiptNumbers
{
    public const string Pattern = "^[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{1,10}$";

    /// <summary>8 + 1 + 8 + 1 + 10.</summary>
    public const int MaxLength = 28;
}
