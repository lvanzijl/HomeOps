using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarRecurrenceRuntime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecurrenceType",
                table: "EventSeries",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.CreateTable(
                name: "EventExceptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventSeriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    OccurrenceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsSkipped = table.Column<bool>(type: "boolean", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventExceptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventExceptions_EventSeries_EventSeriesId",
                        column: x => x.EventSeriesId,
                        principalTable: "EventSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("13131313-1313-1313-1313-131313131313"),
                column: "RecurrenceType",
                value: "None");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("14141414-1414-1414-1414-141414141414"),
                column: "RecurrenceType",
                value: "None");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("15151515-1515-1515-1515-151515151515"),
                column: "RecurrenceType",
                value: "None");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("16161616-1616-1616-1616-161616161616"),
                column: "RecurrenceType",
                value: "None");

            migrationBuilder.CreateIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceDate",
                table: "EventExceptions",
                columns: new[] { "EventSeriesId", "OccurrenceDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "RecurrenceType",
                table: "EventSeries");
        }
    }
}
