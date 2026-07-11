using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingDecorativeAvatars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceId",
                table: "ListItems",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceType",
                table: "ListItems",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ListItems",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_ListItems_DecorativeAvatarReferenceType_DecorativeAvatarRef~",
                table: "ListItems",
                columns: new[] { "DecorativeAvatarReferenceType", "DecorativeAvatarReferenceId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ListItems_DecorativeAvatarReferenceType_DecorativeAvatarRef~",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceId",
                table: "ListItems");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceType",
                table: "ListItems");
        }
    }
}
