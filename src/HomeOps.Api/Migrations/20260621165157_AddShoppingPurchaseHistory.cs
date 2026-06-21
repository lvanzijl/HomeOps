using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingPurchaseHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShoppingPurchaseHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    ItemText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Store = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    PurchaseCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingPurchaseHistories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingPurchaseHistories_HouseholdId_NormalizedText_Purcha~",
                table: "ShoppingPurchaseHistories",
                columns: new[] { "HouseholdId", "NormalizedText", "PurchaseCount" });

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingPurchaseHistories_HouseholdId_NormalizedText_Store",
                table: "ShoppingPurchaseHistories",
                columns: new[] { "HouseholdId", "NormalizedText", "Store" },
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO "ShoppingPurchaseHistories" ("Id", "HouseholdId", "NormalizedText", "ItemText", "Store", "PurchaseCount", "CreatedUtc", "UpdatedUtc")
                SELECT "Id", "HouseholdId", "NormalizedText", "ItemText", "PreferredStore", GREATEST("StoreObservationCount", 1), "CreatedUtc", "UpdatedUtc"
                FROM "ShoppingItemPreferences"
                WHERE "PreferredStore" IS NOT NULL AND btrim("PreferredStore") <> ''
                ON CONFLICT ("HouseholdId", "NormalizedText", "Store") DO UPDATE
                SET "PurchaseCount" = "ShoppingPurchaseHistories"."PurchaseCount" + EXCLUDED."PurchaseCount",
                    "UpdatedUtc" = GREATEST("ShoppingPurchaseHistories"."UpdatedUtc", EXCLUDED."UpdatedUtc");
                """);

            migrationBuilder.DropTable(
                name: "ShoppingItemPreferences");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShoppingItemPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    NormalizedText = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    PreferredStore = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    StoreObservationCount = table.Column<int>(type: "integer", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingItemPreferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemPreferences_HouseholdId_NormalizedText",
                table: "ShoppingItemPreferences",
                columns: new[] { "HouseholdId", "NormalizedText" },
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO "ShoppingItemPreferences" ("Id", "HouseholdId", "NormalizedText", "ItemText", "PreferredStore", "StoreObservationCount", "CreatedUtc", "UpdatedUtc")
                SELECT DISTINCT ON ("HouseholdId", "NormalizedText") "Id", "HouseholdId", "NormalizedText", "ItemText", "Store", "PurchaseCount", "CreatedUtc", "UpdatedUtc"
                FROM "ShoppingPurchaseHistories"
                ORDER BY "HouseholdId", "NormalizedText", "PurchaseCount" DESC, "Store" ASC;
                """);

            migrationBuilder.DropTable(
                name: "ShoppingPurchaseHistories");
        }
    }
}
