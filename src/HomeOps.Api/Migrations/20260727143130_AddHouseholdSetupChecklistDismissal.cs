using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdSetupChecklistDismissal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SetupChecklistDismissedUtc",
                table: "Households",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Households"
                SET "SetupChecklistDismissedUtc" = "UpdatedUtc"
                WHERE "OnboardingCompleted" = TRUE
                  AND "SetupChecklistDismissedUtc" IS NULL
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SetupChecklistDismissedUtc",
                table: "Households");
        }
    }
}
