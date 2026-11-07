namespace Sparc.Api.Common;

/// <summary>
/// Shares of a whole that add up exactly (D-042). Rounding each share on its own can total
/// 99.99 % or 100.01 %; the largest-remainder method floors every share to the unit, then gives
/// the units left over to the shares that lost most in the flooring.
/// </summary>
public static class Shares
{
    /// <summary>
    /// Each value's share of their sum, as a fraction with <paramref name="decimals"/> decimals
    /// (4: 0.2512 = 25.12 %), summing to exactly 1. All zeros when the sum is not positive. Ties
    /// in the remainder go to the earlier value, so a list sorted by size favours the larger.
    /// </summary>
    public static decimal[] LargestRemainder(IReadOnlyList<decimal> values, int decimals = 4)
    {
        var shares = new decimal[values.Count];
        var sum = values.Sum();
        if (sum <= 0)
        {
            return shares;
        }

        var unit = Pow10(decimals);
        var units = new long[values.Count];
        var remainders = new decimal[values.Count];
        long given = 0;
        for (var i = 0; i < values.Count; i++)
        {
            var exact = values[i] / sum * unit;
            units[i] = (long)decimal.Floor(exact);
            remainders[i] = exact - units[i];
            given += units[i];
        }

        var left = (long)unit - given;
        foreach (var i in Enumerable.Range(0, values.Count).OrderByDescending(i => remainders[i]).ThenBy(i => i).Take((int)left))
        {
            units[i]++;
        }

        for (var i = 0; i < values.Count; i++)
        {
            shares[i] = units[i] / unit;
        }
        return shares;
    }

    private static decimal Pow10(int n)
    {
        var p = 1m;
        for (var i = 0; i < n; i++)
        {
            p *= 10;
        }
        return p;
    }
}
