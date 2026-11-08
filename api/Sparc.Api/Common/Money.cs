namespace Sparc.Api.Common;

/// <summary>The one place an amount becomes its RSD value. The database checks the same rule.</summary>
public static class Money
{
    /// <summary>The largest value numeric(18,2) holds: 16 digits before the point.</summary>
    public const decimal MaxAmount = 9_999_999_999_999_999.99m;

    /// <summary>
    /// <c>round(amount × rateToRsd, 2)</c>, halves away from zero — what Postgres's <c>round</c>
    /// on <c>numeric</c> does, so CK_Transactions_AmountRsd_Matches agrees to the cent. Decimal
    /// throughout; the product of two decimals is exact before the single rounding.
    /// </summary>
    public static decimal ToRsd(decimal amount, decimal rateToRsd) =>
        Math.Round(amount * rateToRsd, 2, MidpointRounding.AwayFromZero);

    /// <summary>
    /// An RSD value in a foreign currency, for display only (D-041, D-051): one division, rounded
    /// once like <see cref="ToRsd"/>. Never stored.
    /// </summary>
    public static decimal FromRsd(decimal amountRsd, decimal rateToRsd) =>
        Math.Round(amountRsd / rateToRsd, 2, MidpointRounding.AwayFromZero);
}
