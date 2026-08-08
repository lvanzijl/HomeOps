using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingItemEditingAndHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Quantity",
                table: "ListItems",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ShoppingItemHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    ItemText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    UseCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingItemHistories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemHistories_HouseholdId_NormalizedText",
                table: "ShoppingItemHistories",
                columns: new[] { "HouseholdId", "NormalizedText" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemHistories_HouseholdId_UseCount_UpdatedUtc",
                table: "ShoppingItemHistories",
                columns: new[] { "HouseholdId", "UseCount", "UpdatedUtc" });

            migrationBuilder.Sql("""
                INSERT INTO "ShoppingItemHistories" ("Id", "HouseholdId", "NormalizedText", "ItemText", "UseCount", "CreatedUtc", "UpdatedUtc")
                SELECT (array_agg(items."Id" ORDER BY items."UpdatedUtc" DESC))[1], lists."HouseholdId", upper(btrim(items."Text")),
                       (array_agg(btrim(items."Text") ORDER BY items."UpdatedUtc" DESC))[1], count(*)::integer,
                       min(items."CreatedUtc"), max(items."UpdatedUtc")
                FROM "ListItems" AS items
                INNER JOIN "Lists" AS lists ON lists."Id" = items."ListId"
                WHERE btrim(items."Text") <> ''
                GROUP BY lists."HouseholdId", upper(btrim(items."Text"));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShoppingItemHistories");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "ListItems");
        }
    }
}
