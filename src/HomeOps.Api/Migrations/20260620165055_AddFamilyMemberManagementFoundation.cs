using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyMemberManagementFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FamilyMembers_HouseholdId_Name",
                table: "FamilyMembers");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateOfBirth",
                table: "FamilyMembers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedUtc",
                table: "FamilyMembers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "FamilyMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MemberKind",
                table: "FamilyMembers",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "FamilyMembers",
                keyColumn: "Id",
                keyValue: "alex",
                columns: new[] { "DateOfBirth", "DeletedUtc", "IsDeleted", "MemberKind" },
                values: new object[] { null, null, false, "Adult" });

            migrationBuilder.UpdateData(
                table: "FamilyMembers",
                keyColumn: "Id",
                keyValue: "jordan",
                columns: new[] { "DateOfBirth", "DeletedUtc", "IsDeleted", "MemberKind" },
                values: new object[] { new DateOnly(2020, 9, 3), null, false, "Child" });

            migrationBuilder.UpdateData(
                table: "FamilyMembers",
                keyColumn: "Id",
                keyValue: "riley",
                columns: new[] { "DateOfBirth", "DeletedUtc", "IsDeleted", "MemberKind" },
                values: new object[] { new DateOnly(2018, 4, 12), null, false, "Child" });

            migrationBuilder.UpdateData(
                table: "FamilyMembers",
                keyColumn: "Id",
                keyValue: "sam",
                columns: new[] { "DateOfBirth", "DeletedUtc", "IsDeleted", "MemberKind" },
                values: new object[] { null, null, false, "Adult" });

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_HouseholdId_IsDeleted_Name",
                table: "FamilyMembers",
                columns: new[] { "HouseholdId", "IsDeleted", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_HouseholdId_Name",
                table: "FamilyMembers",
                columns: new[] { "HouseholdId", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FamilyMembers_HouseholdId_IsDeleted_Name",
                table: "FamilyMembers");

            migrationBuilder.DropIndex(
                name: "IX_FamilyMembers_HouseholdId_Name",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "DeletedUtc",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "MemberKind",
                table: "FamilyMembers");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_HouseholdId_Name",
                table: "FamilyMembers",
                columns: new[] { "HouseholdId", "Name" },
                unique: true);
        }
    }
}
