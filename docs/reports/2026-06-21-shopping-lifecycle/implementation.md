# Shopping Lifecycle Implementation

## Summary
- Added list rename, archive, and soft-delete lifecycle support.
- Added completed-item lifecycle timestamps with 24-hour active-view retention and undo.
- Added deleted-item soft lifecycle with 24-hour visible retention, deleted indicator, strikethrough presentation, and undo.
- Preserved item-name-only Home quick capture and existing Shopping Intelligence preferred-store learning.

## Validation
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `npm test --prefix src/HomeOps.Client -- --run`
- `npm run build --prefix src/HomeOps.Client`
- `npx --yes nswag run nswag.json`

## Notes
- A migration and idempotent SQL script were generated for list and list-item lifecycle columns.
- Shopping Intelligence V2, Reward Economy, notifications, analytics, OCR, barcode scanning, and AI classification were not implemented.
