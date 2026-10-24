using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Sparc.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedSystemCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "CreatedAt", "IsSystem", "Kind", "Name", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0001-000000000001"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)0, "Salary", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0001-000000000002"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)0, "Freelance", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0001-000000000003"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)0, "Gifts", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0001-000000000004"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)0, "Refunds", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0001-000000000005"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)0, "Other income", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000001"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Groceries", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000002"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Dining out", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000003"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Housing", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000004"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Utilities", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000005"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Transport", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000006"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Health", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000007"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Entertainment", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000008"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Shopping", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000009"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Subscriptions", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000010"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Education", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("00000000-0000-0000-0002-000000000011"), new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), true, (short)1, "Other expense", new DateTime(2026, 10, 24, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000001"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000002"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000003"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000004"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000005"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000001"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000002"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000003"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000004"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000005"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000006"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000007"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000008"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000009"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000010"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0002-000000000011"));
        }
    }
}
