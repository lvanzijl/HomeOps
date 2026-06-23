import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { avatarV2DefaultConfiguration } from '../avatarV2/avatarConfig';
import { FamilyAvatar } from './FamilyAvatar';
import type { FamilyMember } from './familyMembers';

const member: FamilyMember = {
  id: 'test',
  name: 'Taylor',
  displayColor: '#c7d2fe',
  initials: 'T',
  memberKind: 'adult',
  dateOfBirth: null,
  avatar: { ageGroup: 'adult', presentation: 'neutral', skinTone: '#f1c27d', hairColor: '#111827', hairStyle: 'short', glasses: false, shirtColor: '#60a5fa' },
};

afterEach(cleanup);

describe('FamilyAvatar', () => {
  it('renders Avatar V2 when avatarV2Config exists', () => {
    render(<FamilyAvatar member={{ ...member, avatarV2Config: avatarV2DefaultConfiguration }} />);

    const avatar = screen.getByRole('img', { name: 'Taylor household avatar' });
    expect(avatar.className).toContain('family-avatar-v2');
    expect(avatar.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('preserves legacy fallback when avatarV2Config is missing', () => {
    render(<FamilyAvatar member={member} />);

    const avatar = screen.getByRole('img', { name: 'Taylor household avatar' });
    expect(avatar.className).toContain('family-avatar-portrait');
    expect(avatar.className).toContain('hair-short');
    expect(avatar.querySelector('svg')).toBeNull();
  });

  it('preserves initials fallback when avatar configuration is missing', () => {
    render(<FamilyAvatar member={{ id: 'fallback', name: 'Casey', displayColor: '#fde68a', initials: 'C', memberKind: 'adult', dateOfBirth: null }} />);

    expect(screen.getByLabelText('Casey avatar fallback')).not.toBeNull();
    expect(screen.getByText('C')).not.toBeNull();
  });
});
