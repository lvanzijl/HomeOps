import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { avatarSelectionToAvatarV2Configuration } from '../avatarCatalog/avatarCatalogAdapter';
import { FamilyAvatarEditor } from './FamilyAvatarEditor';
import type { FamilyMember } from './familyMembers';

afterEach(() => cleanup());

function categoryButton(label: string) {
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
    expect(screen.queryByText('Live voorbeeld')).toBeNull();
    expect(categoryButton('Huid')).not.toBeNull();
    expect(categoryButton('Haar')).not.toBeNull();
    expect(categoryButton('Gezicht')).not.toBeNull();
    expect(categoryButton('Kleding')).not.toBeNull();
    expect(categoryButton('Accessoires')).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('heading', { name: 'Menselijk' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('heading', { name: 'Fantasy' })).not.toBeNull();
    const skinToneButtons = screen.getAllByRole('button', { name: /Huidskleur: Midden/i });
    expect(skinToneButtons.length).toBeGreaterThan(0);
    expect(skinToneButtons[0].textContent).toBe('');

    await user.click(categoryButton('Haar')!);
    expect(screen.getByRole('button', { name: /Kapsel lang zacht/i }).textContent).toBe('');
    expect(screen.getByRole('button', { name: /Haarkleur: Natuurlijk zwart/i }).textContent).toBe('');

    await user.click(categoryButton('Accessoires')!);
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

    await user.click(categoryButton('Accessoires')!);
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

    await user.click(categoryButton('Haar')!);
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Kapsel kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(categoryButton('Accessoires')!);
    expect(within(screen.getByLabelText('Avatarkeuzes voor Riley')).getByRole('button', { name: /Steraccessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows style and color together in one surface without a sub-tab hop', async () => {
    const user = userEvent.setup();
    render(<FamilyAvatarEditor member={member} onChange={vi.fn()} onClose={vi.fn()} />);

    await user.click(categoryButton('Accessoires')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes voor Riley'));
    expect(controls.queryByRole('heading', { name: 'Accessoires' })).not.toBeNull();
    expect(controls.getByRole('heading', { name: 'Haaraccessoires' })).not.toBeNull();
    expect(controls.getByRole('heading', { name: 'Hoofddeksels' })).not.toBeNull();
    expect(controls.getByRole('heading', { name: 'Halsaccessoires' })).not.toBeNull();
    expect(controls.getByRole('heading', { name: 'Accessoirekleur' })).not.toBeNull();
    expect(controls.getByRole('button', { name: /Bloemspeld accessoire/i }).textContent).toContain('Bloemspeld');
    expect(controls.getByRole('button', { name: /Pet accessoire/i })).not.toBeNull();
    expect(controls.getByRole('button', { name: /Accessoirekleur: Mintgroen/i }).textContent).toBe('');
  });

  it('surfaces eyewear under the Face category', async () => {
    const user = userEvent.setup();
    render(<FamilyAvatarEditor member={member} onChange={vi.fn()} onClose={vi.fn()} />);

    await user.click(categoryButton('Gezicht')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes voor Riley'));
    expect(controls.getByRole('heading', { name: 'Bril' })).not.toBeNull();
    const eyewear = within(controls.getByRole('region', { name: 'Bril' }));
    expect(eyewear.getByRole('button', { name: /Geen bril/i }).getAttribute('aria-pressed')).toBe('true');
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
