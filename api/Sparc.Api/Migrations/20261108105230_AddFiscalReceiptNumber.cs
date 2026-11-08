using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFiscalReceiptNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FiscalReceiptNumber",
                table: "Transactions",
                type: "character varying(28)",
                maxLength: 28,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_FiscalReceiptNumber",
                table: "Transactions",
                columns: new[] { "UserId", "FiscalReceiptNumber" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_FiscalReceiptNumber_Expense",
                table: "Transactions",
                sql: "\"FiscalReceiptNumber\" IS NULL OR \"Type\" = 1");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_FiscalReceiptNumber_Format",
                table: "Transactions",
                sql: "\"FiscalReceiptNumber\" IS NULL OR \"FiscalReceiptNumber\" ~ '^[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{1,10}$'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_FiscalReceiptNumber",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_FiscalReceiptNumber_Expense",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_FiscalReceiptNumber_Format",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "FiscalReceiptNumber",
                table: "Transactions");
        }
    }
}
