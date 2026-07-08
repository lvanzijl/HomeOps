import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { avatarSelectionToAvatarV2Configuration } from '../avatarCatalog/avatarCatalogAdapter';
import { FamilyAvatarEditor } from './FamilyAvatarEditor';
import type { FamilyMember } from './familyMembers';

afterEach(() => cleanup());

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
    expect(screen.getByRole('button', { name: /Lang zacht/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Hoofdvorm' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Huidskleur' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Perzikkleurige huidskleur/i })).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /Strik/i }));
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

    await user.click(screen.getByRole('button', { name: /Strik/i }));
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(screen.getByRole('button', { name: /Bloemspeld/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Opgeslagen')).not.toBeNull();
  });

  it('resets the draft to Avatar V2 defaults without saving automatically', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyAvatarEditor member={member} onChange={onChange} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Resetten' }));

    expect(screen.getByRole('button', { name: /Kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Steraccessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
