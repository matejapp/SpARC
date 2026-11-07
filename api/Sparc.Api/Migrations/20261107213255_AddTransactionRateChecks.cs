using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionRateChecks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_AmountRsd_Matches",
                table: "Transactions",
                sql: "\"AmountRsd\" = round(\"Amount\" * \"RateToRsd\", 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_Rsd_RateIsOne",
                table: "Transactions",
                sql: "\"Currency\" <> 'RSD' OR \"RateToRsd\" = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_AmountRsd_Matches",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_Rsd_RateIsOne",
                table: "Transactions");
        }
    }
}
