using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyGoalCelebrationFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RewardLabel",
                table: "MotivationFamilyGoals",
                newName: "CelebrationTitle");

            migrationBuilder.AddColumn<string>(
                name: "CelebrationDescription",
                table: "MotivationFamilyGoals",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CelebrationStatus",
                table: "MotivationFamilyGoals",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Planned");

            migrationBuilder.UpdateData(
                table: "MotivationFamilyGoals",
                keyColumn: "Id",
                keyValue: new Guid("8e7e795f-66cf-4c18-87cf-1d33d1b81f01"),
                columns: new[] { "CelebrationDescription", "CelebrationStatus" },
                values: new object[] { "Choose a board game and celebrate helping as a family.", "Planned" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CelebrationDescription",
                table: "MotivationFamilyGoals");

            migrationBuilder.DropColumn(
                name: "CelebrationStatus",
                table: "MotivationFamilyGoals");

            migrationBuilder.RenameColumn(
                name: "CelebrationTitle",
                table: "MotivationFamilyGoals",
                newName: "RewardLabel");
        }
    }
}
