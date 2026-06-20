# Remove Family Member

## Implemented
- Added confirmed remove-member flow.
- Removal uses soft delete (`IsDeleted` / `DeletedUtc`) rather than hard delete.
- Normal Family Member lists filter deleted members.
- New Task assignment rejects deleted members while existing Task and Motivation references remain intact.

## Boundaries
- No hard delete or archival management UI was added.
