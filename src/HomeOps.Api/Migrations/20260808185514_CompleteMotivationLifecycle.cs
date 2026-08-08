using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class CompleteMotivationLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HelpfulMoments_HouseholdId_CreatedUtc",
                table: "HelpfulMoments");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArchivedUtc",
                table: "MotivationFamilyGoals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedUtc",
                table: "HelpfulMoments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "HelpfulMoments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedUtc",
                table: "HelpfulMoments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"HelpfulMoments\" SET \"UpdatedUtc\" = date_trunc('milliseconds', \"CreatedUtc\");");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "UpdatedUtc",
                table: "HelpfulMoments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HelpfulMoments_HouseholdId_IsDeleted_CreatedUtc",
                table: "HelpfulMoments",
                columns: new[] { "HouseholdId", "IsDeleted", "CreatedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HelpfulMoments_HouseholdId_IsDeleted_CreatedUtc",
                table: "HelpfulMoments");

            migrationBuilder.DropColumn(
                name: "ArchivedUtc",
                table: "MotivationFamilyGoals");

            migrationBuilder.DropColumn(
                name: "DeletedUtc",
                table: "HelpfulMoments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "HelpfulMoments");

            migrationBuilder.DropColumn(
                name: "UpdatedUtc",
                table: "HelpfulMoments");

            migrationBuilder.CreateIndex(
                name: "IX_HelpfulMoments_HouseholdId_CreatedUtc",
                table: "HelpfulMoments",
                columns: new[] { "HouseholdId", "CreatedUtc" });
        }
    }
}
