using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations;

/// <inheritdoc />
public partial class SeparateProductionBootstrapFromDemoData : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "LegacyDemoDataReviewRequired",
            table: "Households",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.Sql(
            """
            DO $$
            DECLARE
                household_id uuid := '11111111-1111-1111-1111-111111111111';
                exact_untouched_demo boolean;
                contains_legacy_demo boolean;
            BEGIN
                SELECT
                    EXISTS (
                        SELECT 1
                        FROM "Households"
                        WHERE "Id" = household_id
                          AND "Name" = 'Home'
                          AND "TimeZoneId" = 'Europe/Amsterdam'
                          AND "OnboardingCompleted" = TRUE
                          AND "CreatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00'
                          AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00')
                    AND (SELECT COUNT(*) FROM "FamilyMembers" WHERE "HouseholdId" = household_id) = 4
                    AND (SELECT COUNT(*) FROM "FamilyMembers"
                         WHERE "HouseholdId" = household_id
                           AND (
                               ("Id" = 'alex' AND "Name" = 'Alex' AND "DisplayColor" = '#f8c8dc' AND "Initials" = 'A' AND "MemberKind" = 'Adult' AND "DateOfBirth" IS NULL AND "IsDeleted" = FALSE AND "CreatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00' AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00')
                            OR ("Id" = 'sam' AND "Name" = 'Sam' AND "DisplayColor" = '#c7d2fe' AND "Initials" = 'S' AND "MemberKind" = 'Adult' AND "DateOfBirth" IS NULL AND "IsDeleted" = FALSE AND "CreatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00' AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00')
                            OR ("Id" = 'riley' AND "Name" = 'Riley' AND "DisplayColor" = '#bbf7d0' AND "Initials" = 'R' AND "MemberKind" = 'Child' AND "DateOfBirth" = DATE '2018-04-12' AND "IsDeleted" = FALSE AND "CreatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00' AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00')
                            OR ("Id" = 'jordan' AND "Name" = 'Jordan' AND "DisplayColor" = '#fde68a' AND "Initials" = 'J' AND "MemberKind" = 'Child' AND "DateOfBirth" = DATE '2020-09-03' AND "IsDeleted" = FALSE AND "CreatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00' AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-20 00:00:00+00')
                           )) = 4
                    AND (SELECT COUNT(*) FROM "FamilyMembers"
                         WHERE "HouseholdId" = household_id
                           AND "AvatarV2Accessory" IS NULL
                           AND "AvatarV2AccessoryColor" IS NULL
                           AND "AvatarV2ClothingColor" IS NULL
                           AND "AvatarV2ClothingStyle" IS NULL
                           AND "AvatarV2HairColor" IS NULL
                           AND "AvatarV2HairStyle" IS NULL
                           AND "AvatarV2HeadVariant" IS NULL
                           AND "AvatarSelection" = '{
                               "SchemaVersion": "1.0",
                               "Selections": {
                                   "headVariant": "head.variant.round",
                                   "skinTone": "skin.tone.peach",
                                   "hairStyle": "hair.style.short-messy",
                                   "hairColor": "hair.color.cocoa",
                                   "clothingStyle": "clothing.style.hoodie",
                                   "clothingColor": "clothing.color.sky",
                                   "accessoryStyle": "accessory.style.star",
                                   "accessoryColor": "accessory.color.sky"
                               }
                           }'::jsonb) = 4
                    AND (SELECT COUNT(*) FROM "Lists" WHERE "HouseholdId" = household_id) = 2
                    AND (SELECT COUNT(*) FROM "Lists"
                         WHERE "HouseholdId" = household_id
                           AND (
                               ("Id" = '22222222-2222-2222-2222-222222222222' AND "Name" = 'Shopping' AND "IsArchived" = FALSE AND "IsDeleted" = FALSE)
                            OR ("Id" = '33333333-3333-3333-3333-333333333333' AND "Name" = 'Vacation Packing' AND "IsArchived" = FALSE AND "IsDeleted" = FALSE)
                           )
                           AND "CreatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00'
                           AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00') = 2
                    AND (SELECT COUNT(*)
                         FROM "ListItems" item
                         INNER JOIN "Lists" list ON list."Id" = item."ListId"
                         WHERE list."HouseholdId" = household_id) = 6
                    AND (SELECT COUNT(*) FROM "ListItems"
                         WHERE (
                               ("Id" = '44444444-4444-4444-4444-444444444444' AND "ListId" = '22222222-2222-2222-2222-222222222222' AND "Text" = 'Bread')
                            OR ("Id" = '55555555-5555-5555-5555-555555555555' AND "ListId" = '22222222-2222-2222-2222-222222222222' AND "Text" = 'Milk')
                            OR ("Id" = '66666666-6666-6666-6666-666666666666' AND "ListId" = '22222222-2222-2222-2222-222222222222' AND "Text" = 'Coffee')
                            OR ("Id" = '77777777-7777-7777-7777-777777777777' AND "ListId" = '33333333-3333-3333-3333-333333333333' AND "Text" = 'Passport')
                            OR ("Id" = '88888888-8888-8888-8888-888888888888' AND "ListId" = '33333333-3333-3333-3333-333333333333' AND "Text" = 'Chargers')
                            OR ("Id" = '99999999-9999-9999-9999-999999999999' AND "ListId" = '33333333-3333-3333-3333-333333333333' AND "Text" = 'Swimwear')
                           )
                           AND "IsCompleted" = FALSE
                           AND "IsDeleted" = FALSE
                           AND "PreferredStore" IS NULL
                           AND "CreatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00'
                           AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00') = 6
                    AND (SELECT COUNT(*) FROM "MotivationFamilyGoals" WHERE "HouseholdId" = household_id) = 1
                    AND EXISTS (
                        SELECT 1 FROM "MotivationFamilyGoals"
                        WHERE "Id" = '8e7e795f-66cf-4c18-87cf-1d33d1b81f01'
                          AND "HouseholdId" = household_id
                          AND "Title" = 'Fill the family helper path'
                          AND "TargetCount" = 20
                          AND "CurrentProgress" = 13
                          AND "UnitLabel" = 'helpful actions'
                          AND "CelebrationTitle" = 'Board game night together'
                          AND "CelebrationStatus" = 'Planned'
                          AND "IsActive" = TRUE)
                    AND (SELECT COUNT(*) FROM "MotivationIndividualGoals" WHERE "HouseholdId" = household_id) = 4
                    AND (SELECT COUNT(*) FROM "MotivationIndividualGoals"
                         WHERE "HouseholdId" = household_id
                           AND (
                               ("Id" = 'e62d5716-a82a-4412-aacf-df78febbe301' AND "FamilyMemberId" = 'alex' AND "Title" = 'Finish morning routine' AND "TargetCount" = 5 AND "CurrentProgress" = 3)
                            OR ("Id" = 'd4c0882d-bf9a-4d4e-b925-1146e203f102' AND "FamilyMemberId" = 'sam' AND "Title" = 'Help with dinner' AND "TargetCount" = 3 AND "CurrentProgress" = 2)
                            OR ("Id" = '7f9ad1f4-5af7-47c8-bf0a-c8232c1c6403' AND "FamilyMemberId" = 'riley' AND "Title" = 'Tidy bedroom corner' AND "TargetCount" = 4 AND "CurrentProgress" = 2)
                            OR ("Id" = '65489d30-8f51-4181-9fae-e61254f8a4dc' AND "FamilyMemberId" = 'jordan' AND "Title" = 'Notice one helpful thing' AND "TargetCount" = 3 AND "CurrentProgress" = 1)
                           )
                           AND "IsActive" = TRUE) = 4
                    AND (SELECT COUNT(*) FROM "EventSources" WHERE "HouseholdId" = household_id) = 1
                    AND EXISTS (
                        SELECT 1 FROM "EventSources"
                        WHERE "Id" = '12121212-1212-1212-1212-121212121212'
                          AND "HouseholdId" = household_id
                          AND "Name" = 'HomeOps Calendar'
                          AND "SourceType" = 'Manual'
                          AND "IsWritable" = TRUE
                          AND "IsSystem" = TRUE)
                    AND (SELECT COUNT(*)
                         FROM "EventSeries" series
                         INNER JOIN "EventSources" source ON source."Id" = series."EventSourceId"
                         WHERE source."HouseholdId" = household_id) = 4
                    AND (SELECT COUNT(*) FROM "EventSeries"
                         WHERE (
                               ("Id" = '13131313-1313-1313-1313-131313131313' AND "Title" = 'Dentist Appointment' AND "StartDate" = DATE '2026-06-18')
                            OR ("Id" = '14141414-1414-1414-1414-141414141414' AND "Title" = 'Parent Evening' AND "StartDate" = DATE '2026-06-19')
                            OR ("Id" = '15151515-1515-1515-1515-151515151515' AND "Title" = 'Vacation' AND "StartDate" = DATE '2026-07-12')
                            OR ("Id" = '16161616-1616-1616-1616-161616161616' AND "Title" = 'Put Bins Outside' AND "StartDate" = DATE '2026-06-21')
                           )
                           AND "EventSourceId" = '12121212-1212-1212-1212-121212121212'
                           AND "RecurrenceType" = 'None'
                           AND "CreatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00'
                           AND "UpdatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00') = 4
                    AND NOT EXISTS (SELECT 1 FROM "HouseholdTasks" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "RecurringTaskSeries" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "ShoppingPurchaseHistories" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "HelpfulMoments" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "KnownPeople" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "Floors" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "Rooms" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "ClimateProviders" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "RoomClimateSourceMappings" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "FloorPlanAssets" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "RoomOverlays" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "FloorPlanReplacementReviews" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "RoomClimateObservations" WHERE "HouseholdId" = household_id)
                    AND NOT EXISTS (SELECT 1 FROM "RoomHeatingCommands" WHERE "HouseholdId" = household_id)
                INTO exact_untouched_demo;

                SELECT
                    EXISTS (SELECT 1 FROM "FamilyMembers" WHERE "HouseholdId" = household_id AND "Id" IN ('alex', 'sam', 'riley', 'jordan'))
                    OR EXISTS (SELECT 1 FROM "Lists" WHERE "HouseholdId" = household_id AND "Id" IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'))
                    OR EXISTS (SELECT 1 FROM "MotivationFamilyGoals" WHERE "HouseholdId" = household_id AND "Id" = '8e7e795f-66cf-4c18-87cf-1d33d1b81f01')
                    OR EXISTS (SELECT 1 FROM "EventSeries" WHERE "Id" IN ('13131313-1313-1313-1313-131313131313', '14141414-1414-1414-1414-141414141414', '15151515-1515-1515-1515-151515151515', '16161616-1616-1616-1616-161616161616'))
                INTO contains_legacy_demo;

                IF exact_untouched_demo THEN
                    DELETE FROM "EventSeries"
                    WHERE "Id" IN ('13131313-1313-1313-1313-131313131313', '14141414-1414-1414-1414-141414141414', '15151515-1515-1515-1515-151515151515', '16161616-1616-1616-1616-161616161616');
                    DELETE FROM "MotivationIndividualGoals"
                    WHERE "Id" IN ('e62d5716-a82a-4412-aacf-df78febbe301', 'd4c0882d-bf9a-4d4e-b925-1146e203f102', '7f9ad1f4-5af7-47c8-bf0a-c8232c1c6403', '65489d30-8f51-4181-9fae-e61254f8a4dc');
                    DELETE FROM "MotivationFamilyGoals"
                    WHERE "Id" = '8e7e795f-66cf-4c18-87cf-1d33d1b81f01';
                    DELETE FROM "ListItems"
                    WHERE "Id" IN ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999');
                    DELETE FROM "Lists"
                    WHERE "Id" IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
                    DELETE FROM "FamilyMembers"
                    WHERE "HouseholdId" = household_id AND "Id" IN ('alex', 'sam', 'riley', 'jordan');
                    UPDATE "Households"
                    SET "OnboardingCompleted" = FALSE,
                        "LegacyDemoDataReviewRequired" = FALSE,
                        "UpdatedUtc" = TIMESTAMPTZ '2026-06-19 00:00:00+00'
                    WHERE "Id" = household_id;
                ELSIF contains_legacy_demo THEN
                    UPDATE "Households"
                    SET "LegacyDemoDataReviewRequired" = TRUE
                    WHERE "Id" = household_id;
                END IF;
            END $$;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Restoring household demo rows during downgrade could overwrite or duplicate
        // real data. The production-safe downgrade removes only the review marker.
        migrationBuilder.DropColumn(
            name: "LegacyDemoDataReviewRequired",
            table: "Households");
    }
}
