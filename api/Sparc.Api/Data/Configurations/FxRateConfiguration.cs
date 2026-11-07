using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>CHECK constraints have no attribute, so they live here (D-014).</summary>
public sealed class FxRateConfiguration : IEntityTypeConfiguration<FxRate>
{
    public void Configure(EntityTypeBuilder<FxRate> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_FxRates_RateToRsd_Positive", "\"RateToRsd\" > 0");
            table.HasCheckConstraint("CK_FxRates_Currency", $"\"Currency\" IN ({Currencies.ForeignSqlList})");
            // A list never applies to a date before it was issued.
            table.HasCheckConstraint("CK_FxRates_ListDate_NotAfterDate", "\"ListDate\" <= \"Date\"");
        });
    }
}
