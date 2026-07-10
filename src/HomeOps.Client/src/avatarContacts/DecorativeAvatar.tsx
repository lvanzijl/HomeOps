import { FamilyAvatar } from '../home/FamilyAvatar';
import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson } from '../knownPeople/knownPeople';

export type DecorativeAvatarIdentity =
  | { kind: 'familyMember'; member: FamilyMember }
  | { kind: 'knownPerson'; person: KnownPerson };

interface DecorativeAvatarProps {
  identity: DecorativeAvatarIdentity | null | undefined;
  size?: 'compact' | 'large';
}

interface DecorativeAvatarBadgeProps extends DecorativeAvatarProps {
  label?: string;
}

export function DecorativeAvatar({ identity, size = 'compact' }: DecorativeAvatarProps) {
  if (!identity) return null;

  return <FamilyAvatar member={toFamilyAvatarMember(identity)} size={size} />;
}

export function DecorativeAvatarBadge({ identity, size = 'compact', label }: DecorativeAvatarBadgeProps) {
  if (!identity) return null;

  const displayName = identity.kind === 'familyMember' ? identity.member.name : identity.person.displayName;
  return (
    <span className="decorative-avatar-badge" aria-label={label ?? `Decoratieve avatar: ${displayName}`}>
      <DecorativeAvatar identity={identity} size={size} />
    </span>
  );
}

function toFamilyAvatarMember(identity: DecorativeAvatarIdentity): FamilyMember {
  if (identity.kind === 'familyMember') return identity.member;

  return knownPersonToFamilyAvatarMember(identity.person);
}

function knownPersonToFamilyAvatarMember(person: KnownPerson): FamilyMember {
  return {
    id: person.id,
    name: person.displayName,
    displayColor: '#e0f2fe',
    initials: person.initials,
    memberKind: 'adult',
    avatarSelection: person.avatarSelection,
  };
}
