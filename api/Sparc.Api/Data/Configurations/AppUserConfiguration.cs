using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>
/// Mapping is attributes on the entities. This class exists only because Identity configures
/// EmailIndex fluently, and fluent configuration can only be overridden fluently.
/// </summary>
public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        // Identity's EmailIndex is non-unique and RequireUniqueEmail is only an app-level check,
        // which two concurrent registrations can both pass. The database is the real guarantee.
        builder.HasIndex(u => u.NormalizedEmail).HasDatabaseName("EmailIndex").IsUnique();
    }
}
