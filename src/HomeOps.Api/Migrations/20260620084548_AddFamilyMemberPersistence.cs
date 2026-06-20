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
                    AgeGroup = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Presentation = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    SkinTone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    HairColor = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    HairStyle = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Glasses = table.Column<bool>(type: "boolean", nullable: false),
                    ShirtColor = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
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
                columns: new[] { "Id", "AgeGroup", "CreatedUtc", "DisplayColor", "Glasses", "HairColor", "HairStyle", "HouseholdId", "Initials", "Name", "Presentation", "ShirtColor", "SkinTone", "UpdatedUtc" },
                values: new object[,]
                {
                    { "alex", "Adult", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#f8c8dc", false, "#3b2416", "Long", new Guid("11111111-1111-1111-1111-111111111111"), "A", "Alex", "Feminine", "#f472b6", "#c68642", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "jordan", "Child", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#fde68a", true, "#92400e", "Top", new Guid("11111111-1111-1111-1111-111111111111"), "J", "Jordan", "Neutral", "#fbbf24", "#ffdbac", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "riley", "Child", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#bbf7d0", false, "#111827", "Curly", new Guid("11111111-1111-1111-1111-111111111111"), "R", "Riley", "Neutral", "#34d399", "#8d5524", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "sam", "Adult", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "#c7d2fe", true, "#4b5563", "Short", new Guid("11111111-1111-1111-1111-111111111111"), "S", "Sam", "Masculine", "#60a5fa", "#f1c27d", new DateTimeOffset(new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
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
