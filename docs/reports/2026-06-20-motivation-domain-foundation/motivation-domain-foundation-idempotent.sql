CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    CREATE TABLE "Households" (
        "Id" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Households" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    CREATE TABLE "Lists" (
        "Id" uuid NOT NULL,
        "Name" character varying(160) NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        "HouseholdId" uuid NOT NULL,
        CONSTRAINT "PK_Lists" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Lists_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    CREATE TABLE "ListItems" (
        "Id" uuid NOT NULL,
        "ListId" uuid NOT NULL,
        "Text" character varying(240) NOT NULL,
        "IsCompleted" boolean NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ListItems" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ListItems_Lists_ListId" FOREIGN KEY ("ListId") REFERENCES "Lists" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    INSERT INTO "Households" ("Id", "CreatedUtc", "Name", "UpdatedUtc")
    VALUES ('11111111-1111-1111-1111-111111111111', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'Home', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    INSERT INTO "Lists" ("Id", "CreatedUtc", "HouseholdId", "Name", "UpdatedUtc")
    VALUES ('22222222-2222-2222-2222-222222222222', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', 'Shopping', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "Lists" ("Id", "CreatedUtc", "HouseholdId", "Name", "UpdatedUtc")
    VALUES ('33333333-3333-3333-3333-333333333333', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', 'Vacation Packing', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('44444444-4444-4444-4444-444444444444', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '22222222-2222-2222-2222-222222222222', 'Bread', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('55555555-5555-5555-5555-555555555555', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '22222222-2222-2222-2222-222222222222', 'Milk', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('66666666-6666-6666-6666-666666666666', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '22222222-2222-2222-2222-222222222222', 'Coffee', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('77777777-7777-7777-7777-777777777777', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '33333333-3333-3333-3333-333333333333', 'Passport', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('88888888-8888-8888-8888-888888888888', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '33333333-3333-3333-3333-333333333333', 'Chargers', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ListItems" ("Id", "CreatedUtc", "IsCompleted", "ListId", "Text", "UpdatedUtc")
    VALUES ('99999999-9999-9999-9999-999999999999', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', FALSE, '33333333-3333-3333-3333-333333333333', 'Swimwear', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    CREATE INDEX "IX_ListItems_ListId_CreatedUtc" ON "ListItems" ("ListId", "CreatedUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    CREATE UNIQUE INDEX "IX_Lists_HouseholdId_Name" ON "Lists" ("HouseholdId", "Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619080043_InitialListsPersistence') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619080043_InitialListsPersistence', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    CREATE TABLE "WorkspaceLayouts" (
        "Id" uuid NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "WorkspaceKey" character varying(80) NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_WorkspaceLayouts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_WorkspaceLayouts_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    CREATE TABLE "WidgetPlacements" (
        "Id" uuid NOT NULL,
        "WorkspaceLayoutId" uuid NOT NULL,
        "WidgetType" character varying(120) NOT NULL,
        "Position" integer NOT NULL,
        "Size" character varying(40) NOT NULL,
        "ConfigurationJson" jsonb NOT NULL,
        CONSTRAINT "PK_WidgetPlacements" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_WidgetPlacements_WorkspaceLayouts_WorkspaceLayoutId" FOREIGN KEY ("WorkspaceLayoutId") REFERENCES "WorkspaceLayouts" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    INSERT INTO "WorkspaceLayouts" ("Id", "CreatedUtc", "HouseholdId", "UpdatedUtc", "WorkspaceKey")
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'home');
    INSERT INTO "WorkspaceLayouts" ("Id", "CreatedUtc", "HouseholdId", "UpdatedUtc", "WorkspaceKey")
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'house');
    INSERT INTO "WorkspaceLayouts" ("Id", "CreatedUtc", "HouseholdId", "UpdatedUtc", "WorkspaceKey")
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'media');
    INSERT INTO "WorkspaceLayouts" ("Id", "CreatedUtc", "HouseholdId", "UpdatedUtc", "WorkspaceKey")
    VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'settings');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('a1111111-1111-1111-1111-111111111111', '{}', 0, 'large', 'agenda-mvp', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('a2222222-2222-2222-2222-222222222222', '{}', 1, 'medium', 'shopping-list-mvp', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('a3333333-3333-3333-3333-333333333333', '{}', 2, 'medium', 'welcome-text', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('b1111111-1111-1111-1111-111111111111', '{}', 0, 'medium', 'house-placeholder', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('c1111111-1111-1111-1111-111111111111', '{}', 0, 'medium', 'media-placeholder', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
    INSERT INTO "WidgetPlacements" ("Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId")
    VALUES ('d1111111-1111-1111-1111-111111111111', '{}', 0, 'medium', 'settings-placeholder', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    CREATE UNIQUE INDEX "IX_WidgetPlacements_WorkspaceLayoutId_Position" ON "WidgetPlacements" ("WorkspaceLayoutId", "Position");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    CREATE UNIQUE INDEX "IX_WorkspaceLayouts_HouseholdId_WorkspaceKey" ON "WorkspaceLayouts" ("HouseholdId", "WorkspaceKey");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619082528_AddWidgetLayoutPersistence') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619082528_AddWidgetLayoutPersistence', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    CREATE TABLE "EventSources" (
        "Id" uuid NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "Name" character varying(160) NOT NULL,
        "SourceType" character varying(80) NOT NULL,
        "IsWritable" boolean NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_EventSources" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EventSources_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    CREATE TABLE "ManualEvents" (
        "Id" uuid NOT NULL,
        "EventSourceId" uuid NOT NULL,
        "Title" character varying(240) NOT NULL,
        "Description" character varying(1000),
        "StartUtc" timestamp with time zone NOT NULL,
        "EndUtc" timestamp with time zone,
        "IsAllDay" boolean NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ManualEvents" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ManualEvents_EventSources_EventSourceId" FOREIGN KEY ("EventSourceId") REFERENCES "EventSources" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    INSERT INTO "EventSources" ("Id", "CreatedUtc", "HouseholdId", "IsWritable", "Name", "SourceType", "UpdatedUtc")
    VALUES ('12121212-1212-1212-1212-121212121212', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', '11111111-1111-1111-1111-111111111111', TRUE, 'HomeOps Manual Events', 'manual', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    INSERT INTO "ManualEvents" ("Id", "CreatedUtc", "Description", "EndUtc", "EventSourceId", "IsAllDay", "StartUtc", "Title", "UpdatedUtc")
    VALUES ('13131313-1313-1313-1313-131313131313', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'Routine check-up', TIMESTAMPTZ '2026-06-18T10:15:00+00:00', '12121212-1212-1212-1212-121212121212', FALSE, TIMESTAMPTZ '2026-06-18T09:30:00+00:00', 'Dentist Appointment', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ManualEvents" ("Id", "CreatedUtc", "Description", "EndUtc", "EventSourceId", "IsAllDay", "StartUtc", "Title", "UpdatedUtc")
    VALUES ('14141414-1414-1414-1414-141414141414', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'School hall', TIMESTAMPTZ '2026-06-19T20:00:00+00:00', '12121212-1212-1212-1212-121212121212', FALSE, TIMESTAMPTZ '2026-06-19T18:30:00+00:00', 'Parent Evening', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ManualEvents" ("Id", "CreatedUtc", "Description", "EndUtc", "EventSourceId", "IsAllDay", "StartUtc", "Title", "UpdatedUtc")
    VALUES ('15151515-1515-1515-1515-151515151515', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', 'Family trip', TIMESTAMPTZ '2026-07-19T00:00:00+00:00', '12121212-1212-1212-1212-121212121212', TRUE, TIMESTAMPTZ '2026-07-12T00:00:00+00:00', 'Vacation', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    INSERT INTO "ManualEvents" ("Id", "CreatedUtc", "Description", "EndUtc", "EventSourceId", "IsAllDay", "StartUtc", "Title", "UpdatedUtc")
    VALUES ('16161616-1616-1616-1616-161616161616', TIMESTAMPTZ '2026-06-19T00:00:00+00:00', NULL, TIMESTAMPTZ '2026-06-21T20:10:00+00:00', '12121212-1212-1212-1212-121212121212', FALSE, TIMESTAMPTZ '2026-06-21T20:00:00+00:00', 'Put Bins Outside', TIMESTAMPTZ '2026-06-19T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    CREATE UNIQUE INDEX "IX_EventSources_HouseholdId_SourceType" ON "EventSources" ("HouseholdId", "SourceType");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    CREATE INDEX "IX_ManualEvents_EventSourceId_StartUtc" ON "ManualEvents" ("EventSourceId", "StartUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619091807_AddManualEventsSource') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619091807_AddManualEventsSource', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619124022_AddAgendaLayerSettings') THEN
    CREATE TABLE "AgendaLayerSettings" (
        "Id" uuid NOT NULL,
        "DeviceKey" character varying(160) NOT NULL,
        "ViewType" character varying(40) NOT NULL,
        "SourceId" character varying(160) NOT NULL,
        "IsEnabled" boolean NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AgendaLayerSettings" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619124022_AddAgendaLayerSettings') THEN
    CREATE UNIQUE INDEX "IX_AgendaLayerSettings_DeviceKey_ViewType_SourceId" ON "AgendaLayerSettings" ("DeviceKey", "ViewType", "SourceId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619124022_AddAgendaLayerSettings') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619124022_AddAgendaLayerSettings', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619162011_AddEventSeriesContract') THEN
    CREATE TABLE "EventSeries" (
        "Id" uuid NOT NULL,
        "EventSourceId" uuid NOT NULL,
        "Title" character varying(240) NOT NULL,
        "Description" character varying(1000),
        "IsAllDay" boolean NOT NULL,
        "StartDate" date NOT NULL,
        "StartTime" time without time zone,
        "EndDate" date NOT NULL,
        "EndTime" time without time zone,
        "TimeZoneId" character varying(80) NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_EventSeries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EventSeries_EventSources_EventSourceId" FOREIGN KEY ("EventSourceId") REFERENCES "EventSources" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619162011_AddEventSeriesContract') THEN
    INSERT INTO "EventSeries" ("Id", "EventSourceId", "Title", "Description", "IsAllDay", "StartDate", "StartTime", "EndDate", "EndTime", "TimeZoneId", "CreatedUtc", "UpdatedUtc")
    SELECT
        "Id",
        "EventSourceId",
        "Title",
        "Description",
        "IsAllDay",
        ("StartUtc" AT TIME ZONE 'UTC')::date AS "StartDate",
        CASE WHEN "IsAllDay" THEN NULL ELSE ("StartUtc" AT TIME ZONE 'UTC')::time END AS "StartTime",
        (COALESCE("EndUtc", "StartUtc") AT TIME ZONE 'UTC')::date AS "EndDate",
        CASE WHEN "IsAllDay" THEN NULL ELSE (COALESCE("EndUtc", "StartUtc") AT TIME ZONE 'UTC')::time END AS "EndTime",
        'Europe/Amsterdam' AS "TimeZoneId",
        "CreatedUtc",
        "UpdatedUtc"
    FROM "ManualEvents";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619162011_AddEventSeriesContract') THEN
    CREATE INDEX "IX_EventSeries_EventSourceId_StartDate" ON "EventSeries" ("EventSourceId", "StartDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619162011_AddEventSeriesContract') THEN
    DROP TABLE "ManualEvents";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619162011_AddEventSeriesContract') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619162011_AddEventSeriesContract', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619165032_AddHouseholdTimezoneFoundation') THEN
    ALTER TABLE "EventSeries" DROP COLUMN "TimeZoneId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619165032_AddHouseholdTimezoneFoundation') THEN
    ALTER TABLE "Households" ADD "TimeZoneId" character varying(80) NOT NULL DEFAULT 'Europe/Amsterdam';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619165032_AddHouseholdTimezoneFoundation') THEN
    UPDATE "EventSources" SET "Name" = 'HomeOps Calendar'
    WHERE "Id" = '12121212-1212-1212-1212-121212121212';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619165032_AddHouseholdTimezoneFoundation') THEN
    UPDATE "Households" SET "TimeZoneId" = 'Europe/Amsterdam'
    WHERE "Id" = '11111111-1111-1111-1111-111111111111';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619165032_AddHouseholdTimezoneFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619165032_AddHouseholdTimezoneFoundation', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    ALTER TABLE "EventSeries" ADD "RecurrenceType" character varying(16) NOT NULL DEFAULT 'None';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    CREATE TABLE "EventExceptions" (
        "Id" uuid NOT NULL,
        "EventSeriesId" uuid NOT NULL,
        "OccurrenceDate" date NOT NULL,
        "IsSkipped" boolean NOT NULL,
        "Title" character varying(240),
        "Description" character varying(1000),
        "StartDate" date,
        "StartTime" time without time zone,
        "EndDate" date,
        "EndTime" time without time zone,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_EventExceptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EventExceptions_EventSeries_EventSeriesId" FOREIGN KEY ("EventSeriesId") REFERENCES "EventSeries" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    UPDATE "EventSeries" SET "RecurrenceType" = 'None'
    WHERE "Id" = '13131313-1313-1313-1313-131313131313';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    UPDATE "EventSeries" SET "RecurrenceType" = 'None'
    WHERE "Id" = '14141414-1414-1414-1414-141414141414';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    UPDATE "EventSeries" SET "RecurrenceType" = 'None'
    WHERE "Id" = '15151515-1515-1515-1515-151515151515';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    UPDATE "EventSeries" SET "RecurrenceType" = 'None'
    WHERE "Id" = '16161616-1616-1616-1616-161616161616';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    CREATE UNIQUE INDEX "IX_EventExceptions_EventSeriesId_OccurrenceDate" ON "EventExceptions" ("EventSeriesId", "OccurrenceDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260619185937_AddCalendarRecurrenceRuntime') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260619185937_AddCalendarRecurrenceRuntime', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620055002_AddTaskDomainFoundation') THEN
    CREATE TABLE "HouseholdTasks" (
        "Id" uuid NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "Title" character varying(240) NOT NULL,
        "DueDate" date,
        "OwnershipKind" character varying(32) NOT NULL,
        "FamilyMemberId" character varying(120),
        "IsCompleted" boolean NOT NULL,
        "CompletedUtc" timestamp with time zone,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_HouseholdTasks" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_HouseholdTasks_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620055002_AddTaskDomainFoundation') THEN
    CREATE INDEX "IX_HouseholdTasks_HouseholdId_IsCompleted_DueDate" ON "HouseholdTasks" ("HouseholdId", "IsCompleted", "DueDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620055002_AddTaskDomainFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260620055002_AddTaskDomainFoundation', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    CREATE TABLE "FamilyMembers" (
        "Id" character varying(120) NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "DisplayColor" character varying(32) NOT NULL,
        "Initials" character varying(8) NOT NULL,
        "AgeGroup" character varying(16) NOT NULL,
        "Presentation" character varying(16) NOT NULL,
        "SkinTone" character varying(32) NOT NULL,
        "HairColor" character varying(32) NOT NULL,
        "HairStyle" character varying(16) NOT NULL,
        "Glasses" boolean NOT NULL,
        "ShirtColor" character varying(32) NOT NULL,
        "CreatedUtc" timestamp with time zone NOT NULL,
        "UpdatedUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_FamilyMembers" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_FamilyMembers_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    INSERT INTO "FamilyMembers" ("Id", "AgeGroup", "CreatedUtc", "DisplayColor", "Glasses", "HairColor", "HairStyle", "HouseholdId", "Initials", "Name", "Presentation", "ShirtColor", "SkinTone", "UpdatedUtc")
    VALUES ('alex', 'Adult', TIMESTAMPTZ '2026-06-20T00:00:00+00:00', '#f8c8dc', FALSE, '#3b2416', 'Long', '11111111-1111-1111-1111-111111111111', 'A', 'Alex', 'Feminine', '#f472b6', '#c68642', TIMESTAMPTZ '2026-06-20T00:00:00+00:00');
    INSERT INTO "FamilyMembers" ("Id", "AgeGroup", "CreatedUtc", "DisplayColor", "Glasses", "HairColor", "HairStyle", "HouseholdId", "Initials", "Name", "Presentation", "ShirtColor", "SkinTone", "UpdatedUtc")
    VALUES ('jordan', 'Child', TIMESTAMPTZ '2026-06-20T00:00:00+00:00', '#fde68a', TRUE, '#92400e', 'Top', '11111111-1111-1111-1111-111111111111', 'J', 'Jordan', 'Neutral', '#fbbf24', '#ffdbac', TIMESTAMPTZ '2026-06-20T00:00:00+00:00');
    INSERT INTO "FamilyMembers" ("Id", "AgeGroup", "CreatedUtc", "DisplayColor", "Glasses", "HairColor", "HairStyle", "HouseholdId", "Initials", "Name", "Presentation", "ShirtColor", "SkinTone", "UpdatedUtc")
    VALUES ('riley', 'Child', TIMESTAMPTZ '2026-06-20T00:00:00+00:00', '#bbf7d0', FALSE, '#111827', 'Curly', '11111111-1111-1111-1111-111111111111', 'R', 'Riley', 'Neutral', '#34d399', '#8d5524', TIMESTAMPTZ '2026-06-20T00:00:00+00:00');
    INSERT INTO "FamilyMembers" ("Id", "AgeGroup", "CreatedUtc", "DisplayColor", "Glasses", "HairColor", "HairStyle", "HouseholdId", "Initials", "Name", "Presentation", "ShirtColor", "SkinTone", "UpdatedUtc")
    VALUES ('sam', 'Adult', TIMESTAMPTZ '2026-06-20T00:00:00+00:00', '#c7d2fe', TRUE, '#4b5563', 'Short', '11111111-1111-1111-1111-111111111111', 'S', 'Sam', 'Masculine', '#60a5fa', '#f1c27d', TIMESTAMPTZ '2026-06-20T00:00:00+00:00');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    CREATE INDEX "IX_HouseholdTasks_FamilyMemberId" ON "HouseholdTasks" ("FamilyMemberId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    CREATE UNIQUE INDEX "IX_FamilyMembers_HouseholdId_Name" ON "FamilyMembers" ("HouseholdId", "Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    ALTER TABLE "HouseholdTasks" ADD CONSTRAINT "FK_HouseholdTasks_FamilyMembers_FamilyMemberId" FOREIGN KEY ("FamilyMemberId") REFERENCES "FamilyMembers" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620084548_AddFamilyMemberPersistence') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260620084548_AddFamilyMemberPersistence', '10.0.4');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE TABLE "MotivationFamilyGoals" (
        "Id" uuid NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "Title" character varying(240) NOT NULL,
        "TargetCount" integer NOT NULL,
        "CurrentProgress" integer NOT NULL,
        "UnitLabel" character varying(80) NOT NULL,
        "RewardLabel" character varying(240),
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_MotivationFamilyGoals" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_MotivationFamilyGoals_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE TABLE "MotivationIndividualGoals" (
        "Id" uuid NOT NULL,
        "HouseholdId" uuid NOT NULL,
        "FamilyMemberId" character varying(120) NOT NULL,
        "Title" character varying(240) NOT NULL,
        "TargetCount" integer NOT NULL,
        "CurrentProgress" integer NOT NULL,
        "UnitLabel" character varying(80) NOT NULL,
        "VisualKind" character varying(40) NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_MotivationIndividualGoals" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_MotivationIndividualGoals_FamilyMembers_FamilyMemberId" FOREIGN KEY ("FamilyMemberId") REFERENCES "FamilyMembers" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_MotivationIndividualGoals_Households_HouseholdId" FOREIGN KEY ("HouseholdId") REFERENCES "Households" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    INSERT INTO "MotivationFamilyGoals" ("Id", "CurrentProgress", "HouseholdId", "IsActive", "RewardLabel", "TargetCount", "Title", "UnitLabel")
    VALUES ('8e7e795f-66cf-4c18-87cf-1d33d1b81f01', 13, '11111111-1111-1111-1111-111111111111', TRUE, 'Board game night together', 20, 'Fill the family helper path', 'helpful actions');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    INSERT INTO "MotivationIndividualGoals" ("Id", "CurrentProgress", "FamilyMemberId", "HouseholdId", "IsActive", "TargetCount", "Title", "UnitLabel", "VisualKind")
    VALUES ('65489d30-8f51-4181-9fae-e61254f8a4dc', 1, 'jordan', '11111111-1111-1111-1111-111111111111', TRUE, 3, 'Notice one helpful thing', 'stars', 'stars');
    INSERT INTO "MotivationIndividualGoals" ("Id", "CurrentProgress", "FamilyMemberId", "HouseholdId", "IsActive", "TargetCount", "Title", "UnitLabel", "VisualKind")
    VALUES ('7f9ad1f4-5af7-47c8-bf0a-c8232c1c6403', 2, 'riley', '11111111-1111-1111-1111-111111111111', TRUE, 4, 'Tidy bedroom corner', 'steps', 'progress');
    INSERT INTO "MotivationIndividualGoals" ("Id", "CurrentProgress", "FamilyMemberId", "HouseholdId", "IsActive", "TargetCount", "Title", "UnitLabel", "VisualKind")
    VALUES ('d4c0882d-bf9a-4d4e-b925-1146e203f102', 2, 'sam', '11111111-1111-1111-1111-111111111111', TRUE, 3, 'Help with dinner', 'stars', 'stars');
    INSERT INTO "MotivationIndividualGoals" ("Id", "CurrentProgress", "FamilyMemberId", "HouseholdId", "IsActive", "TargetCount", "Title", "UnitLabel", "VisualKind")
    VALUES ('e62d5716-a82a-4412-aacf-df78febbe301', 3, 'alex', '11111111-1111-1111-1111-111111111111', TRUE, 5, 'Finish morning routine', 'checkmarks', 'checkmarks');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE INDEX "IX_MotivationFamilyGoals_HouseholdId_IsActive" ON "MotivationFamilyGoals" ("HouseholdId", "IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE INDEX "IX_MotivationIndividualGoals_FamilyMemberId" ON "MotivationIndividualGoals" ("FamilyMemberId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE INDEX "IX_MotivationIndividualGoals_HouseholdId_FamilyMemberId_IsActi~" ON "MotivationIndividualGoals" ("HouseholdId", "FamilyMemberId", "IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    CREATE INDEX "IX_MotivationIndividualGoals_HouseholdId_IsActive" ON "MotivationIndividualGoals" ("HouseholdId", "IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260620145207_AddMotivationDomainFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260620145207_AddMotivationDomainFoundation', '10.0.4');
    END IF;
END $EF$;
COMMIT;

