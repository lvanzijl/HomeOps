using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarWriteContractVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CalendarWriteContractVersion",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "EventSeries" AS series
                SET "CalendarWriteContractVersion" = 1
                FROM "EventSources" AS source
                WHERE series."EventSourceId" = source."Id"
                  AND source."IsWritable" = TRUE
                  AND source."SourceType" IN ('Manual', 'manual');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CalendarWriteContractVersion",
                table: "EventSeries");
        }
    }
}
