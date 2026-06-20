import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from './home/familyMembers';
import { MotivationPage } from './MotivationPage';
import { loadMotivationSnapshot } from './motivationData';

vi.mock('./motivationData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./motivationData')>()),
  loadMotivationSnapshot: vi.fn(),
}));

afterEach(() => cleanup());

describe('MotivationPage', () => {
  beforeEach(() => {
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

  it('renders a neutral state when no motivation records are active', async () => {
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({ individualGoals: [] });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('No active family goal yet')).not.toBeNull();
    expect(screen.getByText('No active personal encouragement goals yet.')).not.toBeNull();
  });
});
