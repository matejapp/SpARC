using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>
/// CHECK constraints have no attribute, so they live here (D-014). The DTOs reject the same
/// values first; these make a bad amount impossible however a row is written (D-024).
/// </summary>
public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_Transactions_Amount_Positive", "\"Amount\" > 0");
            table.HasCheckConstraint("CK_Transactions_AmountRsd_Positive", "\"AmountRsd\" > 0");
            table.HasCheckConstraint("CK_Transactions_RateToRsd_Positive", "\"RateToRsd\" > 0");
            table.HasCheckConstraint("CK_Transactions_Currency", $"\"Currency\" IN ({Currencies.SqlList})");
        });
    }
}
