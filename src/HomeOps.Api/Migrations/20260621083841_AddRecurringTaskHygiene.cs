using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTaskHygiene : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_HouseholdId_IsCompleted_DueDate",
                table: "HouseholdTasks");

            migrationBuilder.AddColumn<bool>(
                name: "IsExpired",
                table: "HouseholdTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_HouseholdId_IsCompleted_IsExpired_DueDate",
                table: "HouseholdTasks",
                columns: new[] { "HouseholdId", "IsCompleted", "IsExpired", "DueDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_HouseholdId_IsCompleted_IsExpired_DueDate",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "IsExpired",
                table: "HouseholdTasks");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_HouseholdId_IsCompleted_DueDate",
                table: "HouseholdTasks",
                columns: new[] { "HouseholdId", "IsCompleted", "DueDate" });
        }
    }
}
