using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarCatalogFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarSelection",
                table: "FamilyMembers",
                type: "jsonb",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "FamilyMembers"
                SET "AvatarSelection" = jsonb_build_object(
                    'SchemaVersion', '1.0',
                    'Selections', jsonb_build_object(
                        'headVariant', CASE "AvatarV2HeadVariant"
                            WHEN 'oval' THEN 'head.variant.oval'
                            WHEN 'wide' THEN 'head.variant.wide'
                            ELSE 'head.variant.round'
                        END,
                        'skinTone', 'skin.tone.peach',
                        'hairStyle', CASE "AvatarV2HairStyle"
                            WHEN 'softCrop' THEN 'hair.style.soft-crop'
                            WHEN 'curlyCloud' THEN 'hair.style.curly-cloud'
                            WHEN 'sideBob' THEN 'hair.style.side-bob'
                            WHEN 'swoop' THEN 'hair.style.swoop'
                            WHEN 'layeredMessy' THEN 'hair.style.layered-messy'
                            WHEN 'longSoft' THEN 'hair.style.long-soft'
                            WHEN 'curlyPlayful' THEN 'hair.style.curly-playful'
                            ELSE 'hair.style.short-messy'
                        END,
                        'hairColor', CASE "AvatarV2HairColor"
                            WHEN 'hairChestnut' THEN 'hair.color.chestnut'
                            WHEN 'hairPlum' THEN 'hair.color.plum'
                            ELSE 'hair.color.cocoa'
                        END,
                        'clothingStyle', CASE "AvatarV2ClothingStyle"
                            WHEN 'roundedTee' THEN 'clothing.style.rounded-tee'
                            WHEN 'collar' THEN 'clothing.style.collar'
                            WHEN 'sweater' THEN 'clothing.style.sweater'
                            WHEN 'tShirt' THEN 'clothing.style.t-shirt'
                            WHEN 'overall' THEN 'clothing.style.overall'
                            ELSE 'clothing.style.hoodie'
                        END,
                        'clothingColor', CASE "AvatarV2ClothingColor"
                            WHEN 'shirtMint' THEN 'clothing.color.mint'
                            WHEN 'shirtRose' THEN 'clothing.color.rose'
                            WHEN 'shirtSun' THEN 'clothing.color.sun'
                            ELSE 'clothing.color.sky'
                        END,
                        'accessoryStyle', CASE "AvatarV2Accessory"
                            WHEN 'none' THEN 'accessory.style.none'
                            WHEN 'flower' THEN 'accessory.style.flower'
                            WHEN 'headband' THEN 'accessory.style.headband'
                            WHEN 'bow' THEN 'accessory.style.bow'
                            WHEN 'chestStar' THEN 'accessory.style.chest-star'
                            WHEN 'leafPin' THEN 'accessory.style.leaf-pin'
                            WHEN 'tinyCrown' THEN 'accessory.style.tiny-crown'
                            ELSE 'accessory.style.star'
                        END,
                        'accessoryColor', CASE "AvatarV2AccessoryColor"
                            WHEN 'accessoryCoral' THEN 'accessory.color.mint'
                            ELSE 'accessory.color.sky'
                        END
                    )
                )
                WHERE "AvatarSelection" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarSelection",
                table: "FamilyMembers");
        }
    }
}
