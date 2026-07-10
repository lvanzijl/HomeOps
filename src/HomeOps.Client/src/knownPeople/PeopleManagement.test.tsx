import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson } from './knownPeople';
import { PeopleManagement } from './PeopleManagement';

const { listKnownPeople, createKnownPerson, updateKnownPerson, deleteKnownPerson } = vi.hoisted(() => ({ listKnownPeople: vi.fn(), createKnownPerson: vi.fn(), updateKnownPerson: vi.fn(), deleteKnownPerson: vi.fn() }));
vi.mock('./knownPeopleApi', () => ({ listKnownPeople, createKnownPerson, updateKnownPerson, deleteKnownPerson }));

const avatarSelection = createAvatarSelectionFixture();
const members: readonly FamilyMember[] = [
  { id: 'thomas', name: 'Thomas', displayColor: '#ddd', initials: 'T', memberKind: 'child', avatarSelection },
  { id: 'robin', name: 'Robin', displayColor: '#eee', initials: 'R', memberKind: 'child', avatarSelection },
];
const people: readonly KnownPerson[] = [
  { id: 'shared-1', displayName: 'Oma Els', nickname: 'Oma', relationshipType: 'grandparent', customRelationshipLabel: null, scope: 'shared', familyMemberId: null, initials: 'OE', avatarSelection },
  { id: 'private-1', displayName: 'Juf Noor', nickname: null, relationshipType: 'teacher', customRelationshipLabel: null, scope: 'privateToMember', familyMemberId: 'thomas', initials: 'JN', avatarSelection },
  { id: 'private-2', displayName: 'Mila', nickname: 'Mi', relationshipType: 'friend', customRelationshipLabel: null, scope: 'privateToMember', familyMemberId: 'robin', initials: 'M', avatarSelection },
];
function renderPeople(data: readonly KnownPerson[] = people) { listKnownPeople.mockResolvedValue(data); render(<PeopleManagement members={members} />); }
beforeEach(() => { vi.clearAllMocks(); createKnownPerson.mockImplementation(async (input) => ({ ...input, id: 'created-1' })); updateKnownPerson.mockImplementation(async (input) => input); deleteKnownPerson.mockResolvedValue(undefined); });
afterEach(() => cleanup());

describe('PeopleManagement', () => {
  it('shows loading, family summary, shared and private relationship groups', async () => {
    renderPeople();
    expect(screen.getByText('People laden…')).not.toBeNull();
    expect(await screen.findByRole('heading', { name: 'Family Members' })).not.toBeNull();
    expect(within(screen.getByLabelText('Family Members')).getByText('Thomas')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Shared People' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Family' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Teachers' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Friends' })).not.toBeNull();
  });
  it('shows empty and error states', async () => {
    renderPeople([]);
    expect(await screen.findByText('Nog geen People toegevoegd.')).not.toBeNull();
    cleanup();
    listKnownPeople.mockRejectedValue(new Error('nope'));
    render(<PeopleManagement members={members} />);
    expect((await screen.findByRole('alert')).textContent).toContain('niet worden geladen');
  });
  it('searches display, nickname, custom label and relationship display text', async () => {
    renderPeople([{ ...people[0], customRelationshipLabel: 'Pianoles', relationshipType: 'other' }]);
    await screen.findByText('Oma Els');
    const search = screen.getByPlaceholderText('Zoek op naam, bijnaam of relatie');
    await userEvent.type(search, 'piano');
    expect(screen.getByText('Oma Els')).not.toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, 'teacher');
    expect(screen.getByText('Geen People gevonden voor deze zoekopdracht.')).not.toBeNull();
  });
  it('creates, edits, deletes, switches scope and toggles FamilyMember selector visibility', async () => {
    const user = userEvent.setup();
    renderPeople();
    await screen.findByText('Oma Els');
    await user.click(screen.getByRole('button', { name: 'Add person' }));
    expect(screen.queryByText('FamilyMember')).toBeNull();
    await user.click(screen.getByLabelText('PrivateToMember'));
    expect(screen.getByText('FamilyMember')).not.toBeNull();
    await user.click(screen.getByLabelText('Shared'));
    expect(screen.queryByText('FamilyMember')).toBeNull();
    await user.type(screen.getByLabelText('DisplayName'), 'Coach Bas');
    await user.selectOptions(screen.getByLabelText('RelationshipType'), 'coach');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(createKnownPerson).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Coach Bas', scope: 'shared', familyMemberId: null })));
    await user.click(screen.getByRole('button', { name: /Oma Els/ }));
    await user.clear(screen.getByLabelText('Nickname'));
    await user.type(screen.getByLabelText('Nickname'), 'Lieve oma');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(updateKnownPerson).toHaveBeenCalledWith(expect.objectContaining({ id: 'shared-1', nickname: 'Lieve oma' })));
    await user.click(screen.getByRole('button', { name: /Oma Els/ }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteKnownPerson).toHaveBeenCalledWith('shared-1'));
  });
  it('reuses KnownPersonAvatarEditor and AvatarSelectionEditor for avatar editing', async () => {
    const user = userEvent.setup();
    renderPeople();
    await user.click(await screen.findByRole('button', { name: /Oma Els/ }));
    await user.click(screen.getByRole('button', { name: 'Avatar edit' }));
    expect(within(screen.getByRole('dialog', { name: /Avatar van Oma Els bewerken/ })).getByTestId('avatar-selection-live-preview').innerHTML).toContain('<svg');
  });
});
