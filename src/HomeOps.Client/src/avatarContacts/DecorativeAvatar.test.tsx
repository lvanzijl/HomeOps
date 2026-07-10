import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson } from '../knownPeople/knownPeople';
import { DecorativeAvatar, DecorativeAvatarBadge } from './DecorativeAvatar';

const avatarSelection = createAvatarSelectionFixture({ skinTone: 'skin.tone.deep' });

const familyMember: FamilyMember = {
  id: 'member-riley',
  name: 'Riley',
  displayColor: '#bbf7d0',
  initials: 'R',
  memberKind: 'child',
  avatarSelection,
};

const knownPerson: KnownPerson = {
  id: 'person-sam',
  displayName: 'Samira',
  nickname: null,
  relationshipType: 'friend',
  customRelationshipLabel: null,
  scope: 'shared',
  familyMemberId: null,
  initials: 'S',
  avatarSelection,
};

afterEach(cleanup);

describe('DecorativeAvatar', () => {
  it('renders a resolved FamilyMember identity through the existing FamilyAvatar renderer', () => {
    render(<DecorativeAvatar identity={{ kind: 'familyMember', member: familyMember }} />);

    const avatar = screen.getByRole('img', { name: 'Avatar van Riley' });
    expect(avatar.className).toContain('family-avatar-v2');
    expect(avatar.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a resolved KnownPerson identity through the existing FamilyAvatar renderer', () => {
    render(<DecorativeAvatar identity={{ kind: 'knownPerson', person: knownPerson }} />);

    const avatar = screen.getByRole('img', { name: 'Avatar van Samira' });
    expect(avatar.className).toContain('family-avatar-v2');
    expect(avatar.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders nothing when no resolved identity is supplied', () => {
    const { container, rerender } = render(<DecorativeAvatar identity={null} />);
    expect(container.innerHTML).toBe('');

    rerender(<DecorativeAvatar identity={undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('wraps decorative avatars in a presentation-only badge label', () => {
    render(<DecorativeAvatarBadge identity={{ kind: 'knownPerson', person: knownPerson }} />);

    expect(screen.getByLabelText('Decoratieve avatar: Samira')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Avatar van Samira' })).not.toBeNull();
  });
});
