using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyMemberPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FamilyMembers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DisplayColor = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Initials = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FamilyMembers_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "FamilyMembers",
                columns: new[] { "Id", "CreatedUtc", "DisplayColor", "HouseholdId", "Initials", "Name", "UpdatedUtc" },
                values: new object[,]
                {
                    { "alex", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#f8c8dc", new Guid("11111111-1111-1111-1111-111111111111"), "A", "Alex", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "jordan", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#fde68a", new Guid("11111111-1111-1111-1111-111111111111"), "J", "Jordan", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "riley", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#bbf7d0", new Guid("11111111-1111-1111-1111-111111111111"), "R", "Riley", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "sam", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#c7d2fe", new Guid("11111111-1111-1111-1111-111111111111"), "S", "Sam", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_FamilyMemberId",
                table: "HouseholdTasks",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_HouseholdId_Name",
                table: "FamilyMembers",
                columns: new[] { "HouseholdId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_HouseholdTasks_FamilyMembers_FamilyMemberId",
                table: "HouseholdTasks",
                column: "FamilyMemberId",
                principalTable: "FamilyMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HouseholdTasks_FamilyMembers_FamilyMemberId",
                table: "HouseholdTasks");

            migrationBuilder.DropTable(
                name: "FamilyMembers");

            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_FamilyMemberId",
                table: "HouseholdTasks");
        }
    }
}
