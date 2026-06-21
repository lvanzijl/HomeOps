# Shopping Intelligence V2 Implementation

## Summary

Shopping Intelligence V2 replaces the single preferred-store learning model with lightweight purchase history. Store context remains optional and non-prescriptive: quick capture still accepts item names only, while store suggestions help recognition when history exists.

## Implemented

- Added purchase history records keyed by household, normalized item text, and store.
- Store selections increment per-store purchase counts instead of overwriting one preferred store.
- Added store suggestion output ordered by most common historical association first.
- Preserved optional per-list-item store context for current-list grouping and user override.
- Added a migration that copies existing preferred-store observations into purchase history before dropping the old preference table.
- Updated generated OpenAPI/NSwag client contracts.
- Updated Shopping UI store inputs to expose historical store suggestions without requiring a store.

## Preserved

- Home quick capture remains item-name only.
- Shopping quick capture remains item-name only.
- Store selection remains optional.
- Existing list lifecycle behavior remains unchanged.
- No AI classification, OCR, barcode scanning, notifications, Reward Economy, analytics, or dashboard changes were added.

## Validation Notes

Automated coverage was added/updated for purchase-history recording, multi-store history, suggestion ordering, API mapping, and optional UI suggestions. The migration preserves existing preferred-store data as initial purchase-history observations.
