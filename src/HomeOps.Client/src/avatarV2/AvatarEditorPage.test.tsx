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

    await user.click(screen.getByRole('button', { name: /Long Soft/i }));

    expect(preview.innerHTML).not.toBe(initial);
    expect(screen.getByText('Unsaved changes')).not.toBeNull();
  });

  it('saves and cancels changes against the last saved configuration', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);

    await user.click(screen.getByRole('button', { name: /Flower Clip/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /Bow/i }));
    expect(screen.getByText('Unsaved changes')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: /Flower Clip/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Saved')).not.toBeNull();
  });

  it('resets the draft to Avatar V2 defaults without saving automatically', async () => {
    const user = userEvent.setup();
    render(<AvatarEditorPage />);
    await user.click(screen.getByRole('button', { name: /Long Soft/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('button', { name: /Short Messy/i }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByLabelText('Avatar choices')).getByRole('button', { name: /Hoodie/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Unsaved changes')).not.toBeNull();
  });
});
