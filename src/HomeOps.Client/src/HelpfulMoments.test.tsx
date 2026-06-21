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

  it('renders warm family appreciation without points or reward economy concepts', async () => {
    render(<HelpfulMomentsSection members={familyMembers} title="Things My Family Appreciates" />);

    const section = screen.getByLabelText('Things My Family Appreciates');
    expect(await within(section).findByText('Helped Jordan clean up')).not.toBeNull();
    expect(within(section).getByText('We noticed Riley')).not.toBeNull();
    expect(within(section).getByText('My Family Appreciates')).not.toBeNull();
    expect(within(section).getByText('Kindness')).not.toBeNull();
    expect(within(section).getByText('Kind things your family noticed.')).not.toBeNull();
    expect(within(section).getByText('You helped.')).not.toBeNull();
    expect(section.querySelector("img[src*='helpful-kindness']")).not.toBeNull();
    expect(screen.queryByText(/points?|tokens?|gems?|shop|leaderboard|balance|reward value/i)).toBeNull();
  });

  it('creates a parent-entered helpful moment from the lightweight form', async () => {
    const user = userEvent.setup();
    vi.mocked(createHelpfulMoment).mockResolvedValueOnce({ id: 'moment-2', householdId: 'household', familyMemberId: 'riley', familyMemberName: 'Riley', familyMemberDisplayColor: '#bbf7d0', familyMemberInitials: 'R', title: 'Took initiative', description: undefined, recognitionTag: 'Initiative', createdUtc: '2026-06-20T12:05:00Z' });

    render(<HelpfulMomentsSection members={familyMembers} showCreate title="Things My Family Appreciates" />);

    await user.selectOptions(screen.getByLabelText('Family member'), 'riley');
    await user.type(screen.getByLabelText('What happened?'), 'Took initiative');
    await user.selectOptions(screen.getByLabelText('We appreciated'), 'Initiative');
    await user.click(screen.getByRole('button', { name: 'Save appreciation' }));

    expect(vi.mocked(createHelpfulMoment)).toHaveBeenCalledWith({ familyMemberId: 'riley', title: 'Took initiative', description: undefined, recognitionTag: 'Initiative' });
    expect(await screen.findByText('Took initiative')).not.toBeNull();
  });
});
