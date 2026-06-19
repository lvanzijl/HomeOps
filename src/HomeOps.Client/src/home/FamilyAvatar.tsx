import type { CSSProperties } from 'react';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarProps {
  member: FamilyMember;
  size?: 'compact' | 'large';
}

export function FamilyAvatar({ member, size = 'compact' }: FamilyAvatarProps) {
  if (!member.avatar) {
    return <span className={`family-avatar-fallback family-avatar-${size}`} aria-label={`${member.name} avatar fallback`}>{member.initials}</span>;
  }

  const avatar = member.avatar;
  const style = {
    '--avatar-bg': member.displayColor,
    '--avatar-skin': avatar.skinTone,
    '--avatar-hair': avatar.hairColor,
    '--avatar-shirt': avatar.shirtColor,
  } as CSSProperties;

  return (
    <span className={`family-avatar-portrait family-avatar-${size} hair-${avatar.hairStyle} age-${avatar.ageGroup} presentation-${avatar.presentation}`} style={style} aria-label={`${member.name} household avatar`} role="img">
      <span className="avatar-head">
        <span className="avatar-hair" />
        <span className="avatar-face">
          <span className="avatar-eye left" />
          <span className="avatar-eye right" />
          {avatar.glasses ? <span className="avatar-glasses" aria-hidden="true" /> : null}
          <span className="avatar-smile" />
        </span>
      </span>
      <span className="avatar-shirt" />
    </span>
  );
}
