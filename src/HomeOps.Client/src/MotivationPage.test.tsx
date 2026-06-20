import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from './home/familyMembers';
import { MotivationPage } from './MotivationPage';
import { createFamilyGoal, loadMotivationSnapshot, updateFamilyGoal } from './motivationData';

vi.mock('./motivationData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./motivationData')>()),
  loadMotivationSnapshot: vi.fn(),
  createFamilyGoal: vi.fn(),
  updateFamilyGoal: vi.fn(),
}));

afterEach(() => cleanup());

describe('MotivationPage', () => {
  beforeEach(() => {
    vi.mocked(createFamilyGoal).mockReset();
    vi.mocked(updateFamilyGoal).mockReset();
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: 'family-goal',
        title: 'Fill the family helper path',
        targetCount: 20,
        currentProgress: 13,
        unitLabel: 'helpful actions',
        rewardLabel: 'Board game night together',
      },
      individualGoals: [
        { id: 'alex-goal', familyMemberId: 'alex', familyMemberName: 'Alex', title: 'Finish morning routine', targetCount: 5, currentProgress: 3, unitLabel: 'checkmarks', visualKind: 'checkmarks' },
        { id: 'sam-goal', familyMemberId: 'sam', familyMemberName: 'Sam', title: 'Help with dinner', targetCount: 3, currentProgress: 2, unitLabel: 'stars', visualKind: 'stars' },
      ],
    });
  });

  it('renders the family goal and individual family member goal cards', async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(screen.getByLabelText('Motivation page')).not.toBeNull();
    const familyGoal = screen.getByLabelText('Active family goal');
    expect(await within(familyGoal).findByText('Fill the family helper path')).not.toBeNull();
    expect(within(familyGoal).getByText('13/20')).not.toBeNull();
    expect(within(familyGoal).getByText('When we finish: Board game night together')).not.toBeNull();

    const individualGoals = screen.getByLabelText('Individual encouragement goals');
    expect(within(individualGoals).getByText('Alex')).not.toBeNull();
    expect(within(individualGoals).getByText('Finish morning routine')).not.toBeNull();
    expect(within(individualGoals).getByText('Sam')).not.toBeNull();
    expect(within(individualGoals).getByText('Help with dinner')).not.toBeNull();
  });

  it('does not render reward economy or competitive wording', async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Fill the family helper path')).not.toBeNull();
    expect(screen.queryByText(/shop/i)).toBeNull();
    expect(screen.queryByText(/^gems?$/i)).toBeNull();
    expect(screen.queryByText(/leaderboard/i)).toBeNull();
    expect(screen.queryByText(/balance/i)).toBeNull();
  });

  it('renders an actionable empty state that creates the first family goal', async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({ individualGoals: [] });
    vi.mocked(createFamilyGoal).mockResolvedValueOnce({
      id: 'new-family-goal',
      title: 'Complete 10 helpful tasks',
      targetCount: 10,
      currentProgress: 0,
      unitLabel: 'helpful tasks',
      rewardLabel: 'Movie night together',
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Create your first family goal')).not.toBeNull();
    expect(screen.getByText(/Pick one shared target/)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Create family goal' }));
    await user.clear(screen.getByLabelText('Goal title'));
    await user.type(screen.getByLabelText('Goal title'), 'Complete 10 helpful tasks');
    await user.clear(screen.getByLabelText('Target count'));
    await user.type(screen.getByLabelText('Target count'), '10');
    await user.clear(screen.getByLabelText('Progress words'));
    await user.type(screen.getByLabelText('Progress words'), 'helpful tasks');
    await user.type(screen.getByLabelText('Family celebration, optional'), 'Movie night together');
    await user.click(screen.getByRole('button', { name: 'Save family goal' }));

    expect(vi.mocked(createFamilyGoal)).toHaveBeenCalledWith({ title: 'Complete 10 helpful tasks', targetCount: 10, unitLabel: 'helpful tasks', rewardLabel: 'Movie night together' });
    expect(await screen.findByText('Complete 10 helpful tasks')).not.toBeNull();
    expect(screen.getByText('0/10')).not.toBeNull();
  });

  it('edits the active family goal without introducing reward economy concepts', async () => {
    const user = userEvent.setup();
    vi.mocked(updateFamilyGoal).mockResolvedValueOnce({
      id: 'family-goal',
      title: 'Complete 15 helpful household tasks',
      targetCount: 15,
      currentProgress: 13,
      unitLabel: 'helpful tasks',
      rewardLabel: undefined,
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Fill the family helper path')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Edit family goal' }));
    await user.clear(screen.getByLabelText('Goal title'));
    await user.type(screen.getByLabelText('Goal title'), 'Complete 15 helpful household tasks');
    await user.clear(screen.getByLabelText('Target count'));
    await user.type(screen.getByLabelText('Target count'), '15');
    await user.clear(screen.getByLabelText('Progress words'));
    await user.type(screen.getByLabelText('Progress words'), 'helpful tasks');
    await user.clear(screen.getByLabelText('Family celebration, optional'));
    await user.click(screen.getByRole('button', { name: 'Save family goal' }));

    expect(vi.mocked(updateFamilyGoal)).toHaveBeenCalledWith('family-goal', { title: 'Complete 15 helpful household tasks', targetCount: 15, unitLabel: 'helpful tasks', rewardLabel: undefined });
    expect(await screen.findByText('Complete 15 helpful household tasks')).not.toBeNull();
    expect(screen.getByText('13/15')).not.toBeNull();
    expect(screen.queryByText(/coins?|tokens?|shop|leaderboard|negative points/i)).toBeNull();
  });
});
