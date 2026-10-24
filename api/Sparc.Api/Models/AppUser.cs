using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Sparc.Api.Models;

public class AppUser : IdentityUser<Guid>, ITimestamped
{
    /// <summary>RSD, EUR or USD. Display setting only — never stored on a transaction.</summary>
    [Column(TypeName = "character(3)")]
    public required string PreferredCurrency { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
