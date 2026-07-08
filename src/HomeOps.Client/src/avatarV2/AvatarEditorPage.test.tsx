import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarEditorPage } from './AvatarEditorPage';

afterEach(() => cleanup());


describe('AvatarEditorPage', () => {
  it('updates the live preview immediately when choices change', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    const preview = screen.getByTestId('avatar-v2-live-preview');
    const initial = preview.innerHTML;

    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));

    expect(preview.innerHTML).not.toBe(initial);
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });

  it('saves and cancels changes against the last saved configuration', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(screen.getByRole('button', { name: /Bloemspeld/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(screen.getByText('Opgeslagen')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /Strik/i }));
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(screen.getByRole('button', { name: /Bloemspeld/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Opgeslagen')).not.toBeNull();
  });

  it('resets the draft to Avatar V2 defaults without saving automatically', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole('button', { name: /Lang zacht/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    await user.click(screen.getByRole('button', { name: 'Resetten' }));

    expect(screen.getByRole('button', { name: /Kort speels/i }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Hoodie/i }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByLabelText('Avatarkeuzes')).getByRole('button', { name: /Accessoirekleur: Mintgroen/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
  });
});
