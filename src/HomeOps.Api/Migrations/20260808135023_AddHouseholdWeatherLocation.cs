using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdWeatherLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "WeatherLatitude",
                table: "Households",
                type: "numeric(8,5)",
                precision: 8,
                scale: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeatherLocationDisplayName",
                table: "Households",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeatherLongitude",
                table: "Households",
                type: "numeric(9,5)",
                precision: 9,
                scale: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeatherUnitSystem",
                table: "Households",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Metric");

            migrationBuilder.UpdateData(
                table: "Households",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "WeatherLatitude", "WeatherLocationDisplayName", "WeatherLongitude", "WeatherUnitSystem" },
                values: new object[] { null, null, null, "Metric" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WeatherLatitude",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "WeatherLocationDisplayName",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "WeatherLongitude",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "WeatherUnitSystem",
                table: "Households");
        }
    }
}
