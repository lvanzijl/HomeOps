import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarEditorPage } from './AvatarEditorPage';

afterEach(() => cleanup());

function categoryButton(label: string) {
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

    await user.click(categoryButton('Haar')!);
    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));

    expect(preview.innerHTML).not.toBe(initial);
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('saves and cancels changes against the last saved configuration', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Accessoires')!);
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
    await user.click(categoryButton('Haar')!);
    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    await user.click(screen.getByRole('button', { name: 'Avatar resetten' }));

    await user.click(categoryButton('Haar')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Kapsel kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(categoryButton('Kleding')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Hoodie outfit/i }).getAttribute('aria-pressed')).toBe('true');
    await user.click(categoryButton('Accessoires')!);
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Accessoirekleur: Mintgroen/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('shows grouped visual palettes and visual-only style tiles', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    // Skin is the default category and renders grouped, visual-only swatches.
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Menselijk' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Fantasy' })).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /Huidskleur: Midden/i })[0].textContent).toBe('');

    await user.click(categoryButton('Haar')!);
    expect(screen.getByRole('button', { name: /Lang zacht/i }).textContent).toBe('');
    expect(screen.getByRole('button', { name: /Haarkleur: Natuurlijk zwart/i }).textContent).toBe('');

    await user.click(categoryButton('Kleding')!);

    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Neutraal' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Zacht' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Helder' })).not.toBeNull();
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('heading', { name: 'Seizoen' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Kledingkleur: Hemelsblauw/i }).textContent).toBe('');
  });

  it('exposes eyewear inside the Face category and applies a glasses choice', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Gezicht')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes'));
    expect(controls.getByRole('heading', { name: 'Bril' })).not.toBeNull();

    // Eyewear defaults to "no glasses" and lets a single pair be chosen at a time.
    const eyewear = within(controls.getByRole('region', { name: 'Bril' }));
    expect(eyewear.getByRole('button', { name: /Geen bril/i }).getAttribute('aria-pressed')).toBe('true');
    const preview = screen.getByTestId('avatar-v2-live-preview');
    const initial = preview.innerHTML;

    await user.click(eyewear.getByRole('button', { name: /Ronde bril/i }));
    expect(eyewear.getByRole('button', { name: /Ronde bril/i }).getAttribute('aria-pressed')).toBe('true');
    expect(eyewear.getByRole('button', { name: /Geen bril/i }).getAttribute('aria-pressed')).toBe('false');
    expect(preview.innerHTML).not.toBe(initial);
    expect(preview.innerHTML).toContain('avatar-v2-layer-glasses');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('groups head accessories and their colors under the Accessories category', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Accessoires')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes'));
    expect(controls.getByRole('heading', { name: 'Accessoire' })).not.toBeNull();
    expect(controls.getByRole('button', { name: /Bloemspeld accessoire/i }).textContent).toBe('');

    expect(controls.getByRole('heading', { name: 'Accessoirekleur' })).not.toBeNull();
    expect(controls.getByRole('button', { name: /Accessoirekleur: Mintgroen/i }).textContent).toBe('');
  });
});
