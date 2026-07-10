using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddKnownPeopleFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KnownPeople",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Scope = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Nickname = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    RelationshipType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CustomRelationshipLabel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Initials = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    AvatarSelection = table.Column<string>(type: "jsonb", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KnownPeople", x => x.Id);
                    table.CheckConstraint("CK_KnownPeople_Scope_FamilyMember", "(\"Scope\" = 'Shared' AND \"FamilyMemberId\" IS NULL) OR (\"Scope\" = 'PrivateToMember' AND \"FamilyMemberId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_KnownPeople_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KnownPeople_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KnownPeople_FamilyMemberId",
                table: "KnownPeople",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_KnownPeople_HouseholdId_FamilyMemberId_IsDeleted_DisplayName",
                table: "KnownPeople",
                columns: new[] { "HouseholdId", "FamilyMemberId", "IsDeleted", "DisplayName" });

            migrationBuilder.CreateIndex(
                name: "IX_KnownPeople_HouseholdId_IsDeleted_DisplayName",
                table: "KnownPeople",
                columns: new[] { "HouseholdId", "IsDeleted", "DisplayName" });

            migrationBuilder.CreateIndex(
                name: "IX_KnownPeople_HouseholdId_RelationshipType_IsDeleted",
                table: "KnownPeople",
                columns: new[] { "HouseholdId", "RelationshipType", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_KnownPeople_HouseholdId_Scope_IsDeleted_DisplayName",
                table: "KnownPeople",
                columns: new[] { "HouseholdId", "Scope", "IsDeleted", "DisplayName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KnownPeople");
        }
    }
}
