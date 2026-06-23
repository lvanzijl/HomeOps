using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarV2FamilyMemberConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarV2Accessory",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2AccessoryColor",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2ClothingColor",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2ClothingStyle",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2HairColor",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2HairStyle",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarV2HeadVariant",
                table: "FamilyMembers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarV2Accessory",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2AccessoryColor",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2ClothingColor",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2ClothingStyle",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2HairColor",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2HairStyle",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "AvatarV2HeadVariant",
                table: "FamilyMembers");
        }
    }
}
