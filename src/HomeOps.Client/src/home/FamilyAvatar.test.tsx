import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FamilyAvatar } from './FamilyAvatar';
import type { FamilyMember } from './familyMembers';

const member: FamilyMember = {
  id: 'test',
  name: 'Taylor',
  displayColor: '#c7d2fe',
  initials: 'T',
  avatar: { ageGroup: 'adult', presentation: 'neutral', skinTone: '#f1c27d', hairColor: '#111827', hairStyle: 'short', glasses: false, shirtColor: '#60a5fa' },
};

describe('FamilyAvatar', () => {
  it('renders a configured household avatar', () => {
    render(<FamilyAvatar member={member} />);

    expect(screen.getByRole('img', { name: 'Taylor household avatar' })).not.toBeNull();
  });

  it('falls back to initials when avatar configuration is missing', () => {
    render(<FamilyAvatar member={{ id: 'fallback', name: 'Casey', displayColor: '#fde68a', initials: 'C' }} />);

    expect(screen.getByLabelText('Casey avatar fallback')).not.toBeNull();
    expect(screen.getByText('C')).not.toBeNull();
  });
});
