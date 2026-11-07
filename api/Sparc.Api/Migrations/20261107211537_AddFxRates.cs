using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFxRates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FxRates",
                columns: table => new
                {
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Currency = table.Column<string>(type: "character(3)", nullable: false),
                    RateToRsd = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: false),
                    ListDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsFinal = table.Column<bool>(type: "boolean", nullable: false),
                    FetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FxRates", x => new { x.Date, x.Currency });
                    table.CheckConstraint("CK_FxRates_Currency", "\"Currency\" IN ('EUR', 'USD')");
                    table.CheckConstraint("CK_FxRates_ListDate_NotAfterDate", "\"ListDate\" <= \"Date\"");
                    table.CheckConstraint("CK_FxRates_RateToRsd_Positive", "\"RateToRsd\" > 0");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FxRates");
        }
    }
}
