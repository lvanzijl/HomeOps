using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCelebrationMemory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CelebrationCelebratedUtc",
                table: "MotivationFamilyGoals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "MotivationFamilyGoals",
                keyColumn: "Id",
                keyValue: new Guid("8e7e795f-66cf-4c18-87cf-1d33d1b81f01"),
                column: "CelebrationCelebratedUtc",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CelebrationCelebratedUtc",
                table: "MotivationFamilyGoals");
        }
    }
}
