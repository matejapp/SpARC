using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionInvariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Transactions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_Amount_Positive",
                table: "Transactions",
                sql: "\"Amount\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_AmountRsd_Positive",
                table: "Transactions",
                sql: "\"AmountRsd\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_Currency",
                table: "Transactions",
                sql: "\"Currency\" IN ('RSD', 'EUR', 'USD')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_RateToRsd_Positive",
                table: "Transactions",
                sql: "\"RateToRsd\" > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_Amount_Positive",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_AmountRsd_Positive",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_Currency",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_RateToRsd_Positive",
                table: "Transactions");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Transactions",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);
        }
    }
}
