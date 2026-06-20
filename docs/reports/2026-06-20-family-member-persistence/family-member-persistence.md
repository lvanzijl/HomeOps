# Family Member Persistence

Implemented persistence for Family Members using the existing EF Core household persistence boundary.

- Added `FamilyMembers` table with household ownership and seeded household members.
- Added minimal read and update API endpoints.
- Home and Family Member page now load members from the API and retain frontend fallback behavior when loading fails.
