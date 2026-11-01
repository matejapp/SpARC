using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>
/// Fluent only for what attributes cannot say (D-014): the composite foreign key, the computed
/// month, and the CHECKs.
/// </summary>
public sealed class BillOccurrenceConfiguration : IEntityTypeConfiguration<BillOccurrence>
{
    public void Configure(EntityTypeBuilder<BillOccurrence> builder)
    {
        // (RecurringBillId, UserId) → RecurringBills (Id, UserId): an occurrence cannot name a
        // bill and a different owner, so the query filter on UserId is as safe as the bill's own.
        // Cascade fires only when the account is deleted (users cascade to bills); the app never
        // deletes a bill. A paid occurrence stays protected by the NO ACTION key on Transactions.
        builder.HasOne(o => o.RecurringBill)
            .WithMany(b => b.Occurrences)
            .HasForeignKey(o => new { o.RecurringBillId, o.UserId })
            .HasPrincipalKey(b => new { b.Id, b.UserId })
            .OnDelete(DeleteBehavior.Cascade);

        // Stored, so the unique (RecurringBillId, DueMonth) index can use it. date - integer is a
        // date, and both parts are immutable, as a generated column requires.
        builder.Property(o => o.DueMonth)
            .HasComputedColumnSql("\"DueDate\" - (EXTRACT(DAY FROM \"DueDate\")::integer - 1)", stored: true);

        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_BillOccurrences_Status", "\"Status\" IN (0, 1)");
            table.HasCheckConstraint("CK_BillOccurrences_PaidAt_MatchesStatus",
                "(\"Status\" = 1) = (\"PaidAt\" IS NOT NULL)");
            table.HasCheckConstraint("CK_BillOccurrences_AmountAtDue_Positive", "\"AmountAtDue\" > 0");
            table.HasCheckConstraint("CK_BillOccurrences_CurrencyAtDue",
                $"\"CurrencyAtDue\" IN ({Currencies.SqlList})");
        });
    }
}
