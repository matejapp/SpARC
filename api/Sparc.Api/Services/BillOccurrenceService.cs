using Sparc.Api.Common;
using Sparc.Api.Dto;
using Sparc.Api.Models;
using Sparc.Api.Repositories.Interfaces;
using Sparc.Api.Services.Interfaces;

namespace Sparc.Api.Services;

/// <summary>
/// The months of the caller's bills: listing them for the calendar and the bill detail, and paying
/// one, which records exactly one expense (D-035). Another user's occurrence is a 404, the same as
/// a missing one. Amounts and names are not logged — ids are enough to find a row.
/// </summary>
public sealed class BillOccurrenceService(
    IBillOccurrenceRepository occurrences,
    ILogger<BillOccurrenceService> logger) : IBillOccurrenceService
{
    public async Task<List<OccurrenceResponse>> ListAsync(Guid userId, OccurrenceListQuery query)
    {
        var (from, to) = query is { From: { } f, To: { } t } ? (f, t) : CurrentMonth();

        var views = await occurrences.ListAsync(userId, from, to, query.BillId);
        return views.Select(ToResponse).ToList();
    }

    /// <summary>How far ahead the dashboard looks, and how many months it shows at most.</summary>
    public const int UpcomingDays = 30;
    public const int UpcomingLimit = 10;

    public async Task<List<OccurrenceResponse>> UpcomingAsync(Guid userId, UpcomingOccurrencesQuery query)
    {
        var today = query.Today ?? BillSchedule.Today();
        var views = await occurrences.UpcomingAsync(userId, today.AddDays(UpcomingDays), UpcomingLimit);
        return views.Select(ToResponse).ToList();
    }

    /// <summary>
    /// Pending → paid, plus its expense, in one save. The expense takes the month's own amount and
    /// the bill's category and name; the user corrects the amount later by editing the expense.
    /// A double tap or a retry is a 409: the status check catches the usual case, and the unique
    /// Transactions.BillOccurrenceId index catches a race (GlobalExceptionHandler maps it to 409).
    /// </summary>
    public async Task<TransactionResponse> PayAsync(Guid userId, Guid id, PayOccurrenceRequest request)
    {
        var occurrence = await occurrences.FindForPayAsync(userId, id) ?? throw new NotFoundException("Bill payment");

        if (occurrence.Status == BillOccurrenceStatus.Paid)
        {
            throw new ConflictException("This month is already paid.");
        }

        // Bills are RSD-only until FX rates exist (D-034), so the frozen rate is 1. A non-RSD
        // month cannot exist yet; paying one at rate 1 would freeze a wrong rate forever (D-004).
        if (occurrence.CurrencyAtDue != Currencies.Rsd)
        {
            throw new InvalidOperationException($"Occurrence {occurrence.Id} is not in RSD.");
        }

        var bill = occurrence.RecurringBill;
        occurrence.Status = BillOccurrenceStatus.Paid;
        occurrence.PaidAt = DateTime.UtcNow;

        var expense = new Transaction
        {
            UserId = userId,
            Type = TransactionType.Expense,
            Amount = occurrence.AmountAtDue,
            Currency = occurrence.CurrencyAtDue,
            RateToRsd = 1m,
            AmountRsd = Money.ToRsd(occurrence.AmountAtDue, 1m),
            CategoryId = bill.CategoryId,
            OccurredOn = request.PaidOn!.Value,
            Description = bill.Name,
            BillOccurrenceId = occurrence.Id,
        };

        await occurrences.PayAsync(occurrence, expense);
        logger.LogInformation("Bill occurrence {OccurrenceId} paid for {UserId} as transaction {TransactionId}",
            id, userId, expense.Id);

        return TransactionService.ToResponse(expense, bill.Category);
    }

    // The UTC month, as the dashboard's default (D-025); the app always sends explicit dates.
    private static (DateOnly From, DateOnly To) CurrentMonth()
    {
        var first = BillSchedule.MonthOf(BillSchedule.Today());
        return (first, first.AddMonths(1).AddDays(-1));
    }

    private static OccurrenceResponse ToResponse(OccurrenceView v) => new()
    {
        Id = v.Id,
        BillId = v.BillId,
        BillName = v.BillName,
        CategoryId = v.CategoryId,
        CategoryName = v.CategoryName,
        DueDate = v.DueDate,
        Status = v.Status,
        Amount = v.Amount,
        Currency = v.Currency,
        PaidAt = v.PaidAt,
        TransactionId = v.TransactionId,
    };
}
