using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarSourceDomainContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "EventSources",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                column: "IsSystem",
                value: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_HouseholdId_IsSystem",
                table: "EventSources",
                columns: new[] { "HouseholdId", "IsSystem" },
                unique: true,
                filter: "\"IsSystem\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSources_HouseholdId_IsSystem",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "EventSources");
        }
    }
}
