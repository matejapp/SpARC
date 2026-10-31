using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>Mapping is attributes on Category; seed data and CHECKs are fluent-only.</summary>
public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        // A category is a system one exactly when nobody owns it, so "UserId IS NULL" — what the
        // query filter and the delete path rely on — can never mean anything else (D-026).
        builder.ToTable(table => table.HasCheckConstraint("CK_Categories_SystemHasNoOwner",
            "(\"UserId\" IS NULL) = \"IsSystem\""));

        builder.HasData(SystemCategories.All);
    }
}
