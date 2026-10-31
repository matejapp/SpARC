using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryOwnershipCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_Categories_SystemHasNoOwner",
                table: "Categories",
                sql: "(\"UserId\" IS NULL) = \"IsSystem\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Categories_SystemHasNoOwner",
                table: "Categories");
        }
    }
}
