# Child Journey Implementation

## Summary
- Added the Child Journey flow inside Child Mode: Hero, Today, This Week, Family Goal, Helpful Moments, then Parent Mode access.
- Added a Today section that shows child-owned active tasks with a small friendly count summary and no management controls.
- Reframed individual goal progress as This Week so children can quickly understand what they are working on.
- Reframed family goal participation as Family Goal with shared progress, contribution copy, and celebration context.
- Preserved existing Child Mode, Child Hero Area, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, Parent Mode, and avatar editing.

## Validation
- `dotnet restore HomeOps.sln` passed.
- `dotnet build HomeOps.sln` passed with existing NU1903 vulnerability warnings for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet test HomeOps.sln` passed with existing NU1903 vulnerability warnings for `SQLitePCLRaw.lib.e_sqlite3`.
- `npm test --prefix src/HomeOps.Client` passed.
- `npm run build --prefix src/HomeOps.Client` passed.
- `npx --yes nswag run nswag.json` passed.
