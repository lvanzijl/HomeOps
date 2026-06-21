using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNoDateTaskLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArchivedUtc",
                table: "HouseholdTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "NoDateLastReviewedUtc",
                table: "HouseholdTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoDateReviewState",
                table: "HouseholdTasks",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_HouseholdId_NoDateReviewState_DueDate_Create~",
                table: "HouseholdTasks",
                columns: new[] { "HouseholdId", "NoDateReviewState", "DueDate", "CreatedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_HouseholdId_NoDateReviewState_DueDate_Create~",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "ArchivedUtc",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "NoDateLastReviewedUtc",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "NoDateReviewState",
                table: "HouseholdTasks");
        }
    }
}
