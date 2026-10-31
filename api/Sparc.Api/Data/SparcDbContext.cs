using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sparc.Api.Common;
using Sparc.Api.Models;

namespace Sparc.Api.Data;

// IdentityUserContext, not IdentityDbContext: the product has one role, so no role tables.
public class SparcDbContext(DbContextOptions<SparcDbContext> options, ICurrentUser currentUser)
    : IdentityUserContext<AppUser, Guid>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Read by the query filters on every query; EF sends it as a parameter.
    private Guid? CurrentUserId => currentUser.Id;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mapping is attributes on the entities; Data/Configurations holds only what attributes
        // cannot express (overrides of Identity's fluent configuration, seed data, CHECKs).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SparcDbContext).Assembly);

        // Ownership by construction (D-026): every query on user data is scoped to the caller,
        // including ExecuteUpdate/ExecuteDelete, even when a repository forgets its own
        // UserId filter. No user (anonymous request, design time) sees no transactions and only
        // the system categories. Every new user-owned entity gets a filter here and a case in
        // EnforceOwnership. RefreshTokens are deliberately unfiltered: anonymous refresh finds a
        // token by its hash, and the token is the credential (D-021).
        modelBuilder.Entity<Transaction>().HasQueryFilter(t => t.UserId == CurrentUserId);
        modelBuilder.Entity<Category>().HasQueryFilter(c => c.UserId == CurrentUserId || c.UserId == null);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceOwnership();
        StampTimestamps();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        EnforceOwnership();
        StampTimestamps();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// The write side of the query filters: a transaction or category can be inserted, changed or
    /// deleted only by its owner. System categories (no owner) are written by migrations only,
    /// which bypass SaveChanges. A refusal is a programming error, so it surfaces as a 500.
    /// </summary>
    private void EnforceOwnership()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is not (Transaction or Category)
                || entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            var owner = entry.Property(nameof(Transaction.UserId));
            var isOwn = CurrentUserId is { } me
                && (Guid?)owner.CurrentValue == me
                // A changed row must also have been ours before the change.
                && (entry.State == EntityState.Added || (Guid?)owner.OriginalValue == me);

            if (!isOwn)
            {
                throw new InvalidOperationException(
                    $"Refused to save a {entry.Metadata.ClrType.Name} that does not belong to the current user.");
            }
        }
    }

    private void StampTimestamps()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<ITimestamped>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Property(e => e.CreatedAt).IsModified = false;
            }
        }
    }
}
