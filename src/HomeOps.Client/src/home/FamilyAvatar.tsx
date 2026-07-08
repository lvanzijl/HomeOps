import { useMemo, type CSSProperties } from 'react';
import { avatarSelectionToAvatarV2RenderConfig } from '../avatarCatalog/avatarCatalogAdapter';
import { normalizeAvatarV2Configuration, toAvatarV2RenderConfig, type AvatarV2Configuration } from '../avatarV2/avatarConfig';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarProps {
  member: FamilyMember;
  size?: 'compact' | 'large';
}

const avatarV2RequiredKeys: readonly (keyof AvatarV2Configuration)[] = [
  'headVariant',
  'hairStyle',
  'hairColor',
  'clothingStyle',
  'clothingColor',
  'accessory',
  'accessoryColor',
];

function normalizeCompleteAvatarV2Configuration(value: unknown): AvatarV2Configuration | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<AvatarV2Configuration>;
  const normalized = normalizeAvatarV2Configuration(candidate);
  const isCompleteAndValid = avatarV2RequiredKeys.every(
    (key) => Object.prototype.hasOwnProperty.call(candidate, key) && candidate[key] === normalized[key],
  );

  return isCompleteAndValid ? normalized : null;
}

export function FamilyAvatar({ member, size = 'compact' }: FamilyAvatarProps) {
  const avatarV2Svg = useMemo(() => {
    if (member.avatarSelection) {
      return renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(member.avatarSelection)).replace(
        ' role="img" aria-label="HomeOps Avatar V2 sample"',
        ' aria-hidden="true" focusable="false"',
      );
    }

    const normalizedConfiguration = normalizeCompleteAvatarV2Configuration(member.avatarV2Config);
    if (!normalizedConfiguration) return null;

    return renderAvatarV2Svg(toAvatarV2RenderConfig(normalizedConfiguration)).replace(
      ' role="img" aria-label="HomeOps Avatar V2 sample"',
      ' aria-hidden="true" focusable="false"',
    );
  }, [member.avatarSelection, member.avatarV2Config]);

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

  return <span className={`family-avatar-fallback family-avatar-${size}`} aria-label={`${member.name} avatar fallback`}>{member.initials}</span>;
}
