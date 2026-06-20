using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskTemplatesFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskTemplates_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TaskTemplateItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    OwnershipKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    RecurrenceFrequency = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DueOffsetDays = table.Column<int>(type: "integer", nullable: true),
                    Position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTemplateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskTemplateItems_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskTemplateItems_TaskTemplates_TaskTemplateId",
                        column: x => x.TaskTemplateId,
                        principalTable: "TaskTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "TaskTemplates",
                columns: new[] { "Id", "CreatedUtc", "Description", "HouseholdId", "IsArchived", "Name", "UpdatedUtc" },
                values: new object[,]
                {
                    { new Guid("b0010000-0000-0000-0000-000000000001"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Simple school-morning preparation.", new Guid("11111111-1111-1111-1111-111111111111"), false, "Morning Routine", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("b0010000-0000-0000-0000-000000000002"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Simple end-of-day reset.", new Guid("11111111-1111-1111-1111-111111111111"), false, "Bedtime Routine", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("b0010000-0000-0000-0000-000000000003"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Homework and reading basics.", new Guid("11111111-1111-1111-1111-111111111111"), false, "Homework Routine", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("b0010000-0000-0000-0000-000000000004"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Basic pet care tasks.", new Guid("11111111-1111-1111-1111-111111111111"), false, "Pet Care", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("b0010000-0000-0000-0000-000000000005"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Quick kitchen cleanup.", new Guid("11111111-1111-1111-1111-111111111111"), false, "Kitchen Reset", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "TaskTemplateItems",
                columns: new[] { "Id", "DueOffsetDays", "FamilyMemberId", "OwnershipKind", "Position", "RecurrenceFrequency", "TaskTemplateId", "Title" },
                values: new object[,]
                {
                    { new Guid("b1010000-0000-0000-0000-000000000001"), null, null, "Unassigned", 0, "None", new Guid("b0010000-0000-0000-0000-000000000001"), "Brush teeth" },
                    { new Guid("b1010000-0000-0000-0000-000000000002"), null, null, "Unassigned", 1, "None", new Guid("b0010000-0000-0000-0000-000000000001"), "Get dressed" },
                    { new Guid("b1010000-0000-0000-0000-000000000003"), null, null, "Unassigned", 2, "None", new Guid("b0010000-0000-0000-0000-000000000001"), "Pack school bag" },
                    { new Guid("b1010000-0000-0000-0000-000000000004"), null, null, "Unassigned", 0, "None", new Guid("b0010000-0000-0000-0000-000000000002"), "Brush teeth" },
                    { new Guid("b1010000-0000-0000-0000-000000000005"), null, null, "Unassigned", 1, "None", new Guid("b0010000-0000-0000-0000-000000000002"), "Put on pajamas" },
                    { new Guid("b1010000-0000-0000-0000-000000000006"), null, null, "Unassigned", 2, "None", new Guid("b0010000-0000-0000-0000-000000000002"), "Tidy room" },
                    { new Guid("b1010000-0000-0000-0000-000000000007"), null, null, "Unassigned", 0, "None", new Guid("b0010000-0000-0000-0000-000000000003"), "Homework" },
                    { new Guid("b1010000-0000-0000-0000-000000000008"), null, null, "Unassigned", 1, "None", new Guid("b0010000-0000-0000-0000-000000000003"), "Reading" },
                    { new Guid("b1010000-0000-0000-0000-000000000009"), null, null, "Unassigned", 0, "None", new Guid("b0010000-0000-0000-0000-000000000004"), "Feed pet" },
                    { new Guid("b1010000-0000-0000-0000-000000000010"), null, null, "Unassigned", 0, "None", new Guid("b0010000-0000-0000-0000-000000000005"), "Empty dishwasher" },
                    { new Guid("b1010000-0000-0000-0000-000000000011"), null, null, "Unassigned", 1, "None", new Guid("b0010000-0000-0000-0000-000000000005"), "Wipe counters" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskTemplateItems_FamilyMemberId",
                table: "TaskTemplateItems",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTemplateItems_TaskTemplateId_Position",
                table: "TaskTemplateItems",
                columns: new[] { "TaskTemplateId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTemplates_HouseholdId_IsArchived_Name",
                table: "TaskTemplates",
                columns: new[] { "HouseholdId", "IsArchived", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskTemplateItems");

            migrationBuilder.DropTable(
                name: "TaskTemplates");
        }
    }
}
