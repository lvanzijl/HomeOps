using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventSourceNormalizationTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizationTimeZoneId",
                table: "EventSources",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "EventSources" AS source
                SET "NormalizationTimeZoneId" = household."TimeZoneId"
                FROM "Households" AS household
                WHERE source."HouseholdId" = household."Id"
                  AND source."IsEnabled" = TRUE
                  AND source."SourceType" IN ('ICalFeed', 'ICalFile');
                """);

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                column: "NormalizationTimeZoneId",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NormalizationTimeZoneId",
                table: "EventSources");
        }
    }
}
