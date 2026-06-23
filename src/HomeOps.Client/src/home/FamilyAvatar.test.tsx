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
};

afterEach(cleanup);

describe('FamilyAvatar', () => {
  it('renders Avatar V2 when avatarV2Config exists', () => {
    render(<FamilyAvatar member={{ ...member, avatarV2Config: avatarV2DefaultConfiguration }} />);

    const avatar = screen.getByRole('img', { name: 'Taylor household avatar' });
    expect(avatar.className).toContain('family-avatar-v2');
    expect(avatar.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders initials fallback when avatarV2Config is missing', () => {
    render(<FamilyAvatar member={member} />);

    expect(screen.getByLabelText('Taylor avatar fallback')).not.toBeNull();
    expect(screen.getByText('T')).not.toBeNull();
  });

  it('renders initials fallback when avatarV2Config is invalid', () => {
    render(<FamilyAvatar member={{ ...member, avatarV2Config: { ...avatarV2DefaultConfiguration, hairStyle: 'legacy-short' } as unknown as FamilyMember['avatarV2Config'] }} />);

    expect(screen.getByLabelText('Taylor avatar fallback')).not.toBeNull();
    expect(screen.getByText('T')).not.toBeNull();
  });

  it('does not render legacy visual parts for initials fallback', () => {
    render(<FamilyAvatar member={member} />);

    expect(document.querySelector('.avatar-head')).toBeNull();
    expect(document.querySelector('.avatar-hair')).toBeNull();
    expect(document.querySelector('.avatar-shirt')).toBeNull();
    expect(document.querySelector('.hair-short')).toBeNull();
  });
});
