using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingListLifecycleCompletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The previous endpoint labelled these records as permanently deleted but only hid them.
            // Complete that already-confirmed user intent before enabling the corrected hard-delete path.
            migrationBuilder.Sql("DELETE FROM \"Lists\" WHERE \"IsDeleted\" = TRUE;");

            migrationBuilder.DropIndex(
                name: "IX_Lists_HouseholdId_Name",
                table: "Lists");

            migrationBuilder.CreateIndex(
                name: "IX_Lists_HouseholdId_Name",
                table: "Lists",
                columns: new[] { "HouseholdId", "Name" },
                unique: true,
                filter: "NOT \"IsArchived\" AND NOT \"IsDeleted\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Lists_HouseholdId_Name",
                table: "Lists");

            migrationBuilder.CreateIndex(
                name: "IX_Lists_HouseholdId_Name",
                table: "Lists",
                columns: new[] { "HouseholdId", "Name" },
                unique: true);
        }
    }
}
