import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { AvatarSelectionEditor } from './AvatarSelectionEditor';

afterEach(() => cleanup());

function categoryButton(label: string) {
  return within(screen.getByLabelText(/Reusable choices navigatie/i)).getByText(label).closest('button');
}

const selection = createAvatarSelectionFixture({ accessoryStyle: 'accessory.style.flower' });

function renderEditor(onSave = vi.fn(), onCancel = vi.fn()) {
  render(<AvatarSelectionEditor title="Reusable avatar" previewLabel="Reusable preview" controlsLabel="Reusable choices" currentSelection={selection} onSave={onSave} onCancel={onCancel} />);
  return { onSave, onCancel };
}

describe('AvatarSelectionEditor', () => {
  it('renders the existing selection and stable renderer output', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: 'Reusable avatar' })).not.toBeNull();
    expect(within(screen.getByLabelText('Reusable choices')).getByRole('button', { name: /^Huidskleur: Midden$/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('avatar-selection-live-preview').innerHTML).toContain('<svg');
    expect(screen.getByTestId('avatar-selection-live-preview').innerHTML).toContain('avatar-v2-layer-base');
  });

  it('tracks selection changes and saves the updated AvatarSelection', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderEditor(onSave);

    await user.click(categoryButton('Accessoires')!);
    await user.click(within(screen.getByLabelText('Reusable choices')).getByRole('button', { name: /Strik accessoire/i }));

    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      selections: expect.objectContaining({ accessoryStyle: 'accessory.style.bow' }),
    }));
  });

  it('cancel restores the original state without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderEditor(onSave);

    await user.click(categoryButton('Accessoires')!);
    await user.click(within(screen.getByLabelText('Reusable choices')).getByRole('button', { name: /Strik accessoire/i }));
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(within(screen.getByLabelText('Reusable choices')).getByRole('button', { name: /Bloemspeld accessoire/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Opgeslagen')).not.toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });
});
