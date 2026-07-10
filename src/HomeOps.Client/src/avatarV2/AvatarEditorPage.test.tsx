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

  it('exposes eye styles first inside the Face category and applies an eye choice', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Gezicht')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes'));
    const headings = controls.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings.indexOf('Ogen')).toBeLessThan(headings.indexOf('Mond'));
    expect(headings.indexOf('Mond')).toBeLessThan(headings.indexOf('Bril'));

    const eyes = within(controls.getByRole('region', { name: 'Ogen' }));
    expect(eyes.getByRole('button', { name: /Klassiek rond/i }).getAttribute('aria-pressed')).toBe('true');
    expect(eyes.getAllByRole('button')).toHaveLength(4);
    const preview = screen.getByTestId('avatar-v2-live-preview');
    const initial = preview.innerHTML;
    expect(initial).toContain('data-eye-style="classicRound"');

    await user.click(eyes.getByRole('button', { name: /Zacht amandel/i }));
    expect(eyes.getByRole('button', { name: /Zacht amandel/i }).getAttribute('aria-pressed')).toBe('true');
    expect(eyes.getByRole('button', { name: /Klassiek rond/i }).getAttribute('aria-pressed')).toBe('false');
    expect(preview.innerHTML).not.toBe(initial);
    expect(preview.innerHTML).toContain('data-eye-style="softAlmond"');
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

  it('exposes mouth styles inside the Face category and applies a mouth choice', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Gezicht')!);

    const controls = within(screen.getByLabelText('Avatarkeuzes'));
    expect(controls.getByRole('heading', { name: 'Mond' })).not.toBeNull();

    const mouth = within(controls.getByRole('region', { name: 'Mond' }));
    // Mouth defaults to the neutral compatibility expression.
    expect(mouth.getByRole('button', { name: 'Neutrale mond' }).getAttribute('aria-pressed')).toBe('true');
    const preview = screen.getByTestId('avatar-v2-live-preview');
    const initial = preview.innerHTML;
    expect(initial).toContain('data-mouth-style="neutral"');

    await user.click(mouth.getByRole('button', { name: 'Lachende mond' }));
    expect(mouth.getByRole('button', { name: 'Lachende mond' }).getAttribute('aria-pressed')).toBe('true');
    expect(mouth.getByRole('button', { name: 'Neutrale mond' }).getAttribute('aria-pressed')).toBe('false');
    expect(preview.innerHTML).not.toBe(initial);
    expect(preview.innerHTML).toContain('data-mouth-style="laughing"');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('reveals the secondary clothing color only for dual-color garments', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(categoryButton('Kleding')!);
    const controls = within(screen.getByLabelText('Avatarkeuzes'));

    // The default garment (hoodie) is single-color, so no secondary color control is shown.
    expect(controls.queryByRole('heading', { name: 'Tweede kledingkleur' })).toBeNull();

    // Selecting a dual-color garment exposes the secondary clothing color palette.
    await user.click(controls.getByRole('button', { name: /Polo outfit/i }));
    expect(controls.getByRole('heading', { name: 'Tweede kledingkleur' })).not.toBeNull();

    const preview = screen.getByTestId('avatar-v2-live-preview');
    const beforeSecondary = preview.innerHTML;
    await user.click(controls.getByRole('button', { name: /Tweede kledingkleur: Rood/i }));
    expect(preview.innerHTML).not.toBe(beforeSecondary);

    // Switching back to a single-color garment hides the secondary control again.
    await user.click(controls.getByRole('button', { name: /Hoodie outfit/i }));
    expect(controls.queryByRole('heading', { name: 'Tweede kledingkleur' })).toBeNull();
  });
});
