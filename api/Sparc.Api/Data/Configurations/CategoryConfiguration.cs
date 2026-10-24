using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>Mapping is attributes on Category; seed data is fluent-only.</summary>
public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasData(SystemCategories.All);
    }
}
