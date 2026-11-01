namespace Sparc.Api.Models;

/// <summary>State of one month of a bill. Stored as smallint. Overdue is not a state: it is a
/// pending occurrence whose due date has passed, so it is derived when read.</summary>
public enum BillOccurrenceStatus : short
{
    Pending = 0,
    Paid = 1,
}
