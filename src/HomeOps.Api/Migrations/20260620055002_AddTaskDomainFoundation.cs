using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskDomainFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HouseholdTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    OwnershipKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HouseholdTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HouseholdTasks_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_HouseholdId_IsCompleted_DueDate",
                table: "HouseholdTasks",
                columns: new[] { "HouseholdId", "IsCompleted", "DueDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HouseholdTasks");
        }
    }
}
