using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskDecorativeAvatars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceId",
                table: "HouseholdTasks",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceType",
                table: "HouseholdTasks",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_DecorativeAvatarReferenceType_DecorativeAvat~",
                table: "HouseholdTasks",
                columns: new[] { "DecorativeAvatarReferenceType", "DecorativeAvatarReferenceId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_HouseholdTasks_DecorativeAvatar_NullablePair",
                table: "HouseholdTasks",
                sql: "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_DecorativeAvatarReferenceType_DecorativeAvat~",
                table: "HouseholdTasks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_HouseholdTasks_DecorativeAvatar_NullablePair",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceId",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceType",
                table: "HouseholdTasks");
        }
    }
}
