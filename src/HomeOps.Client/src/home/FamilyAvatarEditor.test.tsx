import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarV2DefaultConfiguration } from '../avatarV2/avatarConfig';
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
  avatarV2Config: { ...avatarV2DefaultConfiguration, hairStyle: 'longSoft', accessory: 'flower' },
};

describe('FamilyAvatarEditor', () => {
  it('loads and saves Avatar V2 config for the selected FamilyMember', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyAvatarEditor member={member} onChange={onChange} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Avatar van Riley bewerken/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Lang zacht/i }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: /Strik/i }));
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'riley', avatarV2Config: expect.objectContaining({ accessory: 'bow' }) }));
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
    expect(screen.getByText('Niet-opgeslagen wijzigingen')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
