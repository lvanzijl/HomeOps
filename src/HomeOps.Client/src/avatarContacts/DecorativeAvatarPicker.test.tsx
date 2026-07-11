import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson } from '../knownPeople/knownPeople';
import { DecorativeAvatarPicker, resolveDecorativeAvatar } from './DecorativeAvatarPicker';

const members: FamilyMember[] = [
  { id: 'riley', name: 'Riley', displayColor: '#bbf7d0', initials: 'R', memberKind: 'child', avatarSelection: undefined },
];

const knownPeople: KnownPerson[] = [
  { id: 'known-1', displayName: 'Grandma', nickname: null, relationshipType: 'grandparent', customRelationshipLabel: null, scope: 'shared', familyMemberId: null, initials: 'G', avatarSelection: { schemaVersion: 'avatar-catalog-v1', selections: {} as never } },
];

describe('DecorativeAvatarPicker', () => {
  it('keeps manual groups, suggestions, and clear behavior shared for consumers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DecorativeAvatarPicker familyMembers={members} knownPeople={knownPeople} label="Decoratieve avatar" onChange={onChange} suggestionText="Grandma gift" value={null} />);

    const select = screen.getByLabelText('Decoratieve avatar');
    expect(within(select).getByRole('option', { name: 'Geen avatar' })).not.toBeNull();
    expect(within(select).getByRole('group', { name: 'Suggested' })).not.toBeNull();
    expect(within(select).getByRole('group', { name: 'Family Members' })).not.toBeNull();
    expect(within(select).getByRole('group', { name: 'Shared People' })).not.toBeNull();

    await user.selectOptions(select, 'knownPerson:known-1');
    expect(onChange).toHaveBeenCalledWith({ referenceType: 'knownPerson', referenceId: 'known-1' });
    await user.selectOptions(select, '');
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('resolves FamilyMember and KnownPerson identities without Shopping ownership', () => {
    expect(resolveDecorativeAvatar({ referenceType: 'familyMember', referenceId: 'riley' }, members, knownPeople)?.kind).toBe('familyMember');
    expect(resolveDecorativeAvatar({ referenceType: 'knownPerson', referenceId: 'known-1' }, members, knownPeople)?.kind).toBe('knownPerson');
    expect(resolveDecorativeAvatar({ referenceType: 'knownPerson', referenceId: 'missing' }, members, knownPeople)).toBeNull();
  });
});
