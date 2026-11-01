using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringBills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecurringBills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character(3)", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    FirstDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IntervalMonths = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringBills", x => x.Id);
                    table.UniqueConstraint("AK_RecurringBills_Id_UserId", x => new { x.Id, x.UserId });
                    table.CheckConstraint("CK_RecurringBills_Amount_Positive", "\"Amount\" > 0");
                    table.CheckConstraint("CK_RecurringBills_Currency", "\"Currency\" IN ('RSD', 'EUR', 'USD')");
                    table.CheckConstraint("CK_RecurringBills_IntervalMonths", "\"IntervalMonths\" IS NULL OR \"IntervalMonths\" >= 1");
                    table.CheckConstraint("CK_RecurringBills_Name_NotBlank", "btrim(\"Name\") <> ''");
                    table.ForeignKey(
                        name: "FK_RecurringBills_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecurringBills_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BillOccurrences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecurringBillId = table.Column<Guid>(type: "uuid", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DueMonth = table.Column<DateOnly>(type: "date", nullable: false, computedColumnSql: "\"DueDate\" - (EXTRACT(DAY FROM \"DueDate\")::integer - 1)", stored: true),
                    Status = table.Column<short>(type: "smallint", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AmountAtDue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrencyAtDue = table.Column<string>(type: "character(3)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillOccurrences", x => x.Id);
                    table.CheckConstraint("CK_BillOccurrences_AmountAtDue_Positive", "\"AmountAtDue\" > 0");
                    table.CheckConstraint("CK_BillOccurrences_CurrencyAtDue", "\"CurrencyAtDue\" IN ('RSD', 'EUR', 'USD')");
                    table.CheckConstraint("CK_BillOccurrences_PaidAt_MatchesStatus", "(\"Status\" = 1) = (\"PaidAt\" IS NOT NULL)");
                    table.CheckConstraint("CK_BillOccurrences_Status", "\"Status\" IN (0, 1)");
                    table.ForeignKey(
                        name: "FK_BillOccurrences_RecurringBills_RecurringBillId_UserId",
                        columns: x => new { x.RecurringBillId, x.UserId },
                        principalTable: "RecurringBills",
                        principalColumns: new[] { "Id", "UserId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillOccurrences_RecurringBillId_DueMonth",
                table: "BillOccurrences",
                columns: new[] { "RecurringBillId", "DueMonth" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BillOccurrences_RecurringBillId_UserId",
                table: "BillOccurrences",
                columns: new[] { "RecurringBillId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_BillOccurrences_UserId_DueDate",
                table: "BillOccurrences",
                columns: new[] { "UserId", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_RecurringBills_CategoryId",
                table: "RecurringBills",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringBills_UserId",
                table: "RecurringBills",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_BillOccurrences_BillOccurrenceId",
                table: "Transactions",
                column: "BillOccurrenceId",
                principalTable: "BillOccurrences",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_BillOccurrences_BillOccurrenceId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "BillOccurrences");

            migrationBuilder.DropTable(
                name: "RecurringBills");
        }
    }
}
