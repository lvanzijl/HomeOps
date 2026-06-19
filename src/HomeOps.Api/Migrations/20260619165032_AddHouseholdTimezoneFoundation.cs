using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdTimezoneFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "EventSeries");

            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "Households",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                column: "Name",
                value: "HomeOps Calendar");

            migrationBuilder.UpdateData(
                table: "Households",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "TimeZoneId",
                value: "Europe/Amsterdam");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "Households");

            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "EventSeries",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("13131313-1313-1313-1313-131313131313"),
                column: "TimeZoneId",
                value: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("14141414-1414-1414-1414-141414141414"),
                column: "TimeZoneId",
                value: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("15151515-1515-1515-1515-151515151515"),
                column: "TimeZoneId",
                value: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("16161616-1616-1616-1616-161616161616"),
                column: "TimeZoneId",
                value: "Europe/Amsterdam");

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                column: "Name",
                value: "HomeOps Manual Events");
        }
    }
}
