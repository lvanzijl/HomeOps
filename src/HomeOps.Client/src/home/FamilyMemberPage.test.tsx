import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FamilyMemberPage } from './FamilyMemberPage';
import { familyMembers } from './familyMembers';

afterEach(cleanup);

describe('FamilyMemberPage', () => {
  it('renders member management details and avatar configuration', () => {
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByLabelText('Alex family member page')).not.toBeNull();
    expect(screen.getByText('Manage member')).not.toBeNull();
    expect(screen.getAllByText('Date of birth').length).toBeGreaterThan(0);
    expect(screen.getByText('Current avatar configuration')).not.toBeNull();
  });

  it('edits member details and requires child date of birth', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={onChange} onRemove={vi.fn()} />);

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Alex Parent');
    await user.selectOptions(screen.getByLabelText('Member type'), 'child');
    await user.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByText('Date of birth is required for children.')).not.toBeNull();

    await user.type(screen.getByLabelText('Date of birth'), '2015-05-06');
    await user.click(screen.getByRole('button', { name: 'Save details' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alex Parent', memberKind: 'child', dateOfBirth: '2015-05-06' }));
  });

  it('confirms removal before notifying the shell', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Remove member' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'alex' }));
  });

  it('owns avatar editing with live editor controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={onChange} onRemove={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Edit avatar' }));

    expect(screen.getByRole('dialog', { name: 'Alex household member avatar editor' })).not.toBeNull();
    await user.selectOptions(screen.getByLabelText('Hair style'), 'curly');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'alex', avatar: expect.objectContaining({ hairStyle: 'curly' }) }));
  });
});
