using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ListItems_ListId_CreatedUtc",
                table: "ListItems");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArchivedUtc",
                table: "Lists",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedUtc",
                table: "Lists",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Lists",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Lists",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CompletedUtc",
                table: "ListItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedUtc",
                table: "ListItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ListItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                columns: new[] { "CompletedUtc", "DeletedUtc", "IsDeleted" },
                values: new object[] { null, null, false });

            migrationBuilder.UpdateData(
                table: "Lists",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "ArchivedUtc", "DeletedUtc", "IsArchived", "IsDeleted" },
                values: new object[] { null, null, false, false });

            migrationBuilder.UpdateData(
                table: "Lists",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "ArchivedUtc", "DeletedUtc", "IsArchived", "IsDeleted" },
                values: new object[] { null, null, false, false });

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_ListId_IsDeleted_IsCompleted_CreatedUtc",
                table: "ListItems",
                columns: new[] { "ListId", "IsDeleted", "IsCompleted", "CreatedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ListItems_ListId_IsDeleted_IsCompleted_CreatedUtc",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "ArchivedUtc",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "DeletedUtc",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "CompletedUtc",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "DeletedUtc",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ListItems");

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_ListId_CreatedUtc",
                table: "ListItems",
                columns: new[] { "ListId", "CreatedUtc" });
        }
    }
}
