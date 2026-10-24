using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparc.Api.Models;

namespace Sparc.Api.Data.Configurations;

/// <summary>CHECK constraints have no attribute, so they live here (D-014).</summary>
public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_RefreshTokens_Revocation",
                "(\"RevokedAt\" IS NULL) = (\"RevocationReason\" IS NULL)");
            table.HasCheckConstraint("CK_RefreshTokens_ExpiresWithinFamily",
                "\"ExpiresAt\" <= \"FamilyExpiresAt\"");
        });
    }
}
