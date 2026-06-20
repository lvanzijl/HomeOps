import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from './home/familyMembers';
import { HelpfulMomentsSection } from './HelpfulMoments';
import { createHelpfulMoment, loadHelpfulMoments } from './helpfulMomentsData';

vi.mock('./helpfulMomentsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./helpfulMomentsData')>()),
  loadHelpfulMoments: vi.fn(),
  createHelpfulMoment: vi.fn(),
}));

afterEach(() => cleanup());

describe('HelpfulMomentsSection', () => {
  beforeEach(() => {
    vi.mocked(createHelpfulMoment).mockReset();
    vi.mocked(loadHelpfulMoments).mockResolvedValue([
      { id: 'moment-1', householdId: 'household', familyMemberId: 'riley', familyMemberName: 'Riley', familyMemberDisplayColor: '#bbf7d0', familyMemberInitials: 'R', title: 'Helped Jordan clean up', description: 'Kindly joined without being asked.', recognitionTag: 'Kindness', createdUtc: '2026-06-20T12:00:00Z' },
    ]);
  });

  it('renders a warm recognition feed without points or reward economy concepts', async () => {
    render(<HelpfulMomentsSection members={familyMembers} title="Recent Helpful Moments" />);

    const section = screen.getByLabelText('Recent Helpful Moments');
    expect(await within(section).findByText('Helped Jordan clean up')).not.toBeNull();
    expect(within(section).getByText('Riley')).not.toBeNull();
    expect(within(section).getByText('Kindness')).not.toBeNull();
    expect(screen.queryByText(/points?|tokens?|gems?|shop|leaderboard|balance|reward value/i)).toBeNull();
  });

  it('creates a parent-entered helpful moment from the lightweight form', async () => {
    const user = userEvent.setup();
    vi.mocked(createHelpfulMoment).mockResolvedValueOnce({ id: 'moment-2', householdId: 'household', familyMemberId: 'riley', familyMemberName: 'Riley', familyMemberDisplayColor: '#bbf7d0', familyMemberInitials: 'R', title: 'Took initiative', description: undefined, recognitionTag: 'Initiative', createdUtc: '2026-06-20T12:05:00Z' });

    render(<HelpfulMomentsSection members={familyMembers} showCreate title="Recent Helpful Moments" />);

    await user.selectOptions(screen.getByLabelText('Family member'), 'riley');
    await user.type(screen.getByLabelText('What happened?'), 'Took initiative');
    await user.selectOptions(screen.getByLabelText('Recognition tag'), 'Initiative');
    await user.click(screen.getByRole('button', { name: 'Save Helpful Moment' }));

    expect(vi.mocked(createHelpfulMoment)).toHaveBeenCalledWith({ familyMemberId: 'riley', title: 'Took initiative', description: undefined, recognitionTag: 'Initiative' });
    expect(await screen.findByText('Took initiative')).not.toBeNull();
  });
});
