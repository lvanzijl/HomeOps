import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarEditorPage } from './AvatarEditorPage';

afterEach(() => cleanup());

function navButton(label: string) {
  return within(screen.getByLabelText('Avatarkeuzes navigatie')).getByText(label).closest('button');
}

describe('AvatarEditorPage', () => {
  it('updates the live preview immediately when choices change', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    const preview = screen.getByTestId('avatar-v2-live-preview');
    const initial = preview.innerHTML;
    expect(screen.queryByText('Live voorbeeld')).toBeNull();
    expect(screen.queryByText('Categorie')).toBeNull();

    await user.click(navButton('Kapsel')!);
    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));

    expect(preview.innerHTML).not.toBe(initial);
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('saves and cancels changes against the last saved configuration', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(navButton('Accessoires')!);
    await user.click(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Bloemspeld accessoire/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(screen.getByText('Opgeslagen')).not.toBeNull();

    await user.click(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Strik accessoire/i }));
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Bloemspeld accessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Opgeslagen')).not.toBeNull();
  });

  it('resets the draft to Avatar V2 defaults without saving automatically', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(navButton('Kapsel')!);
    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    await user.click(screen.getByRole('button', { name: 'Avatar resetten' }));

    await user.click(navButton('Kapsel')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Kapsel kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(navButton('Kledingstijl')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Hoodie outfit/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(navButton('Accessoires')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Accessoirekleur: Mintgroen/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('shows grouped labeled palettes while keeping skin tones visual-first', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    expect(screen.getAllByRole('button', { name: /Huidskleur: Midden/i })[0].textContent).toBe('');

    await user.click(navButton('Kledingkleur')!);

    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Neutraal' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Zacht' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Helder' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Seizoen' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Kledingkleur: Hemelsblauw/i })).not.toBeNull();
  });
});
