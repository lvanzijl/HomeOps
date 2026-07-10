import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { KnownPersonAvatarEditor } from './KnownPersonAvatarEditor';
import type { KnownPerson } from './knownPeople';

afterEach(() => cleanup());

const person: KnownPerson = {
  id: 'person-1',
  displayName: 'Oma Joke',
  nickname: 'Oma',
  relationshipType: 'grandparent',
  customRelationshipLabel: 'Oma',
  scope: 'shared',
  familyMemberId: null,
  initials: 'OJ',
  avatarSelection: createAvatarSelectionFixture({ accessoryStyle: 'accessory.style.flower' }),
};

describe('KnownPersonAvatarEditor', () => {
  it('loads KnownPerson selection and renders labels', () => {
    render(<KnownPersonAvatarEditor person={person} onChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Avatar van Oma Joke bewerken' })).not.toBeNull();
    expect(screen.getByLabelText('Live avatarvoorbeeld voor Oma Joke')).not.toBeNull();
    expect(within(screen.getByLabelText(/Avatarkeuzes voor Oma Joke navigatie/i)).getByText('Accessoires').closest('button')?.textContent).toContain('Bloemspeld');
  });

  it('saves KnownPerson AvatarSelection through the wrapper', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(<KnownPersonAvatarEditor person={person} onChange={onChange} onClose={onClose} />);

    await user.click(within(screen.getByLabelText(/Avatarkeuzes voor Oma Joke navigatie/i)).getByText('Accessoires').closest('button')!);
    await user.click(within(screen.getByLabelText('Avatarkeuzes voor Oma Joke')).getByRole('button', { name: /Strik accessoire/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      id: 'person-1',
      avatarSelection: expect.objectContaining({ selections: expect.objectContaining({ accessoryStyle: 'accessory.style.bow' }) }),
    }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
