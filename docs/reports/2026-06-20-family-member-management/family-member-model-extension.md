# Family Member Model Extension

## Implemented
- Added explicit `MemberKind` for Adult/Child instead of deriving member type from avatar age group, because avatar presentation remains editable and should not be the domain source of truth.
- Added nullable `DateOfBirth`; children require it through API validation, adults may omit it.
- Preserved existing seeded members and avatar fields; seeded adults have no date of birth and seeded children now include dates of birth.

## Boundaries
- Family Members remain household entities, not users or authentication identities.
