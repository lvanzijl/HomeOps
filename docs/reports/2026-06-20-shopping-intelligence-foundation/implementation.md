# Shopping Intelligence Foundation

## Summary
- Added optional preferred-store metadata to shopping list items.
- Added deterministic shopping item preference storage keyed by normalized item name.
- Store assignment on an item now teaches future additions of that item to inherit the same preferred store.
- Shopping remains frictionless: capture stays item-name only on Home and Shopping.
- Shopping list presentation now groups items with stores, keeps uncategorized items visible, and shows store context in suggestions/summaries.

## Validation
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `npm test --prefix src/HomeOps.Client -- --run`
- `npm run build --prefix src/HomeOps.Client`
- `npx --yes nswag run nswag.json`

## Migration
- Generated idempotent migration script: `shopping-intelligence-foundation-idempotent.sql`.

## Boundaries Preserved
- No mandatory store selection.
- No Home quick-capture store field.
- No AI classification, OCR, barcode scanning, notifications, automation, or Reward Economy behavior.
