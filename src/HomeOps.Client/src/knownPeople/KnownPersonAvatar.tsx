import { FamilyAvatar } from '../home/FamilyAvatar';
import type { KnownPerson } from './knownPeople';

export function KnownPersonAvatar({ person }: { person: KnownPerson }) {
  return (
    <FamilyAvatar
      member={{
        id: person.id,
        name: person.displayName,
        displayColor: '#e0f2fe',
        initials: person.initials,
        memberKind: 'adult',
        avatarSelection: person.avatarSelection,
      }}
    />
  );
}
