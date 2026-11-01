using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>CHECKs have no attribute (D-014). The DTOs reject the same values first.</summary>
public sealed class RecurringBillConfiguration : IEntityTypeConfiguration<RecurringBill>
{
    public void Configure(EntityTypeBuilder<RecurringBill> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_RecurringBills_Amount_Positive", "\"Amount\" > 0");
            table.HasCheckConstraint("CK_RecurringBills_Currency", $"\"Currency\" IN ({Currencies.SqlList})");
            table.HasCheckConstraint("CK_RecurringBills_Name_NotBlank", "btrim(\"Name\") <> ''");
            table.HasCheckConstraint("CK_RecurringBills_IntervalMonths",
                "\"IntervalMonths\" IS NULL OR \"IntervalMonths\" >= 1");
        });
    }
}
