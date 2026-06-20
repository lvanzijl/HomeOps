import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FamilyMemberPage } from './FamilyMemberPage';
import { familyMembers } from './familyMembers';

afterEach(cleanup);

describe('FamilyMemberPage', () => {
  it('renders member details, avatar configuration, and future placeholders', () => {
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Alex family member page')).not.toBeNull();
    expect(screen.getByText('Household member')).not.toBeNull();
    expect(screen.getByText('Color')).not.toBeNull();
    expect(screen.getByText('Current avatar configuration')).not.toBeNull();
    expect(screen.getByText('Tasks')).not.toBeNull();
    expect(screen.getByText('Points')).not.toBeNull();
    expect(screen.getAllByText('Coming later. Not implemented in this slice.')).toHaveLength(2);
  });

  it('owns avatar editing with live editor controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FamilyMemberPage member={familyMembers[0]} onBack={vi.fn()} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Edit avatar' }));

    expect(screen.getByRole('dialog', { name: 'Alex household member avatar editor' })).not.toBeNull();
    await user.selectOptions(screen.getByLabelText('Hair style'), 'curly');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'alex', avatar: expect.objectContaining({ hairStyle: 'curly' }) }));
  });
});
