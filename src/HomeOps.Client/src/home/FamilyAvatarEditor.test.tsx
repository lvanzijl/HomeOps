import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { avatarSelectionToAvatarV2Configuration } from '../avatarCatalog/avatarCatalogAdapter';
import { FamilyAvatarEditor } from './FamilyAvatarEditor';
import type { FamilyMember } from './familyMembers';

afterEach(() => cleanup());

function navButton(label: string) {
  return within(screen.getByLabelText(/Avatarkeuzes voor Riley navigatie/i)).getByText(label).closest('button');
}

const member: FamilyMember = {
  id: 'riley',
  name: 'Riley',
  displayColor: '#bbf7d0',
  initials: 'R',
  memberKind: 'child',
  dateOfBirth: '2018-04-12',
  avatarSelection: createAvatarSelectionFixture({
    hairStyle: 'hair.style.long-soft',
    accessoryStyle: 'accessory.style.flower',
  }),
  avatarV2Config: avatarSelectionToAvatarV2Configuration(createAvatarSelectionFixture({
    hairStyle: 'hair.style.long-soft',
    accessoryStyle: 'accessory.style.flower',
  })),
};

describe('FamilyAvatarEditor', () => {
  it('loads all catalog categories and saves AvatarSelection for the selected FamilyMember', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyAvatarEditor member={member} onChange={onChange} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Avatar van Riley bewerken/i })).not.toBeNull();
    expect(screen.queryByText('Gezinslidavatar')).toBeNull();
    expect(screen.queryByText(/Bekijk wijzigingen voor Riley/i)).toBeNull();
    expect(screen.queryByText('Live voorbeeld')).toBeNull();
    expect(screen.queryByText('Categorie')).toBeNull();
    expect(navButton('Kapsel')).not.toBeNull();
    expect(navButton('Haarkleur')).not.toBeNull();
    expect(navButton('Kledingstijl')).not.toBeNull();
    expect(navButton('Kledingkleur')).not.toBeNull();
    expect(navButton('Accessoires')).not.toBeNull();
    const skinToneButtons = screen.getAllByRole('button', { name: /Huidskleur: Midden/i });
    expect(skinToneButtons.length).toBeGreaterThan(0);
    expect(skinToneButtons[0].textContent).toBe('');

    await user.click(navButton('Accessoires')!);
    await user.click(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Strik accessoire/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      id: 'riley',
      avatarSelection: expect.objectContaining({
        selections: expect.objectContaining({ accessoryStyle: 'accessory.style.bow' }),
      }),
      avatarV2Config: expect.objectContaining({ accessory: 'bow' }),
    }));
  });

  it('cancels draft changes back to persisted FamilyMember state', async () => {
    const user = userEvent.setup();
    render(<FamilyAvatarEditor member={member} onChange={vi.fn()} onClose={vi.fn()} />);

    await user.click(navButton('Accessoires')!);
    await user.click(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Strik accessoire/i }));
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Bloemspeld accessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Opgeslagen')).not.toBeNull();
  });

  it('resets the draft to Avatar V2 defaults without saving automatically', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyAvatarEditor member={member} onChange={onChange} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Avatar resetten' }));

    await user.click(navButton('Kapsel')!);
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Kapsel kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(navButton('Accessoires')!);
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Steraccessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('focuses the close button and closes with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FamilyAvatarEditor member={member} onChange={vi.fn()} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: 'Avatarbewerker sluiten' });
    expect(document.activeElement).toBe(closeButton);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
