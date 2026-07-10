import type { AvatarCatalogSelection } from '../avatarCatalog/avatarCatalog';

export type KnownPersonRelationshipType = 'friend' | 'familyFriend' | 'grandparent' | 'uncle' | 'aunt' | 'cousin' | 'teacher' | 'coach' | 'babysitter' | 'classmate' | 'neighbour' | 'other';
export type KnownPersonScope = 'shared' | 'privateToMember';

export interface KnownPerson {
  id: string;
  displayName: string;
  nickname?: string | null;
  relationshipType: KnownPersonRelationshipType;
  customRelationshipLabel?: string | null;
  scope: KnownPersonScope;
  familyMemberId?: string | null;
  initials: string;
  avatarSelection: AvatarCatalogSelection;
  createdUtc?: string;
  updatedUtc?: string;
}

export type KnownPersonInput = Omit<KnownPerson, 'id' | 'createdUtc' | 'updatedUtc'>;
