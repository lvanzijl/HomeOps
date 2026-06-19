# Family Member Avatar MVP

## Summary
Implemented a safe frontend-only Family Member Avatar MVP for Home using CSS/HTML shapes, local in-memory editing, and documentation updates.

## Implemented / Decisions
- Added a minimal Family Member avatar model with id, name, display color, initials, age group, presentation, skin tone, hair color, hair style, glasses, and shirt color.
- Added reusable avatar rendering with friendly CSS shapes and initials fallback when avatar configuration is missing.
- Replaced Home family initials chips with avatar buttons that keep names visible and open a compact editor.
- Added a household avatar editor with live preview and controls for MVP avatar parts.
- Editor copy explicitly states avatars are not login, account, security, or profile settings.
- Kept changes frontend-only and in-memory; no persistence or backend Family Member boundary was added.

## Verified
- `dotnet restore HomeOps.sln` passed.
- `dotnet build HomeOps.sln` passed with existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet test HomeOps.sln` passed with existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `npm test --prefix src/HomeOps.Client` passed.
- `npm run build --prefix src/HomeOps.Client` passed.
- `npx --yes nswag run nswag.json` was attempted and failed because local PostgreSQL on `localhost:5432` was not running.

## Risks
- Avatar edits reset on reload because persistence is intentionally out of scope.
- CSS shape avatars are intentionally simple and may need later visual review tuning.

## Modified Files
- `src/HomeOps.Client/src/home/FamilyAvatar.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatar.test.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
Next visual review can assess Home screenshots with avatars. Do not add tasks, gamification, points, task counts, badges, authentication, profiles, permissions, persistence, notifications, reminders, Google Calendar, House Status, or Media unless explicitly scoped.
