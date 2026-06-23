import { useMemo, type CSSProperties } from 'react';
import { normalizeAvatarV2Configuration, toAvatarV2RenderConfig } from '../avatarV2/avatarConfig';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarProps {
  member: FamilyMember;
  size?: 'compact' | 'large';
}

export function FamilyAvatar({ member, size = 'compact' }: FamilyAvatarProps) {
  const avatarV2Svg = useMemo(() => {
    if (!member.avatarV2Config) return null;

    return renderAvatarV2Svg(toAvatarV2RenderConfig(normalizeAvatarV2Configuration(member.avatarV2Config))).replace(
      ' role="img" aria-label="HomeOps Avatar V2 sample"',
      ' aria-hidden="true" focusable="false"',
    );
  }, [member.avatarV2Config]);

  if (avatarV2Svg) {
    return (
      <span
        className={`family-avatar-portrait family-avatar-v2 family-avatar-${size}`}
        style={{ '--avatar-bg': member.displayColor } as CSSProperties}
        aria-label={`${member.name} household avatar`}
        role="img"
        dangerouslySetInnerHTML={{ __html: avatarV2Svg }}
      />
    );
  }

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
