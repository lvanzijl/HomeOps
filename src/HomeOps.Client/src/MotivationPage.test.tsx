import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from './home/familyMembers';
import { FamilyCelebrationStatus } from './api/homeOpsApiClient';
import { MotivationPage } from './MotivationPage';
import { archiveIndividualGoal, createFamilyGoal, createIndividualGoal, loadMotivationSnapshot, markFamilyGoalCelebrated, updateFamilyGoal, updateIndividualGoal } from './motivationData';

vi.mock('./motivationData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./motivationData')>()),
  loadMotivationSnapshot: vi.fn(),
  createFamilyGoal: vi.fn(),
  updateFamilyGoal: vi.fn(),
  createIndividualGoal: vi.fn(),
  updateIndividualGoal: vi.fn(),
  archiveIndividualGoal: vi.fn(),
  markFamilyGoalCelebrated: vi.fn(),
}));

afterEach(() => cleanup());

describe('MotivationPage', () => {
  beforeEach(() => {
    vi.mocked(createFamilyGoal).mockReset();
    vi.mocked(updateFamilyGoal).mockReset();
    vi.mocked(markFamilyGoalCelebrated).mockReset();
    vi.mocked(createIndividualGoal).mockReset();
    vi.mocked(updateIndividualGoal).mockReset();
    vi.mocked(archiveIndividualGoal).mockReset();
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: 'family-goal',
        title: 'Fill the family helper path',
        targetCount: 20,
        currentProgress: 13,
        unitLabel: 'helpful actions',
        celebration: { title: 'Board game night together', status: FamilyCelebrationStatus.Planned },
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
    expect(within(familyGoal).getByText(/Board game night together/)).not.toBeNull();

    const individualGoals = screen.getByLabelText('Individual encouragement goals');
    expect(within(individualGoals).getByText('Alex')).not.toBeNull();
    expect(within(individualGoals).getByText('Finish morning routine')).not.toBeNull();
    expect(within(individualGoals).getByText('Sam')).not.toBeNull();
    expect(within(individualGoals).getByText('Help with dinner')).not.toBeNull();
  });

  it('marks a ready family celebration as celebrated', async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      familyGoal: { id: 'family-goal', title: 'Fill the family helper path', targetCount: 20, currentProgress: 20, unitLabel: 'helpful actions', celebration: { title: 'Movie night', status: FamilyCelebrationStatus.ReadyToCelebrate } },
      individualGoals: [],
    });
    vi.mocked(markFamilyGoalCelebrated).mockResolvedValueOnce({
      id: 'family-goal', title: 'Fill the family helper path', targetCount: 20, currentProgress: 20, unitLabel: 'helpful actions', celebration: { title: 'Movie night', status: FamilyCelebrationStatus.Celebrated },
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText(/Ready to celebrate:/)).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mark celebrated' }));

    expect(markFamilyGoalCelebrated).toHaveBeenCalledWith('family-goal');
    expect(await screen.findByText(/Celebrated:/)).not.toBeNull();
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
      celebration: { title: 'Movie night together', status: FamilyCelebrationStatus.Planned },
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
    await user.type(screen.getByLabelText('Family celebration title, optional'), 'Movie night together');
    await user.click(screen.getByRole('button', { name: 'Save family goal' }));

    expect(vi.mocked(createFamilyGoal)).toHaveBeenCalledWith({ title: 'Complete 10 helpful tasks', targetCount: 10, unitLabel: 'helpful tasks', celebrationTitle: 'Movie night together', celebrationDescription: undefined });
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
      celebration: undefined,
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
    await user.clear(screen.getByLabelText('Family celebration title, optional'));
    await user.click(screen.getByRole('button', { name: 'Save family goal' }));

    expect(vi.mocked(updateFamilyGoal)).toHaveBeenCalledWith('family-goal', { title: 'Complete 15 helpful household tasks', targetCount: 15, unitLabel: 'helpful tasks', celebrationTitle: undefined, celebrationDescription: undefined });
    expect(await screen.findByText('Complete 15 helpful household tasks')).not.toBeNull();
    expect(screen.getByText('13/15')).not.toBeNull();
    expect(screen.queryByText(/coins?|tokens?|shop|leaderboard|negative points/i)).toBeNull();
  });

  it('creates a personal goal for a family member', async () => {
    const user = userEvent.setup();
    vi.mocked(createIndividualGoal).mockResolvedValueOnce({ id: 'read-goal', familyMemberId: 'alex', familyMemberName: 'Alex', title: 'Read books', targetCount: 4, currentProgress: 0, unitLabel: 'books', visualKind: 'stars' });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Personal goals this week')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Add personal goal' }));
    const createForm = screen.getByLabelText('Create individual goal form');
    await user.selectOptions(within(createForm).getByLabelText('Family member'), 'alex');
    await user.type(within(createForm).getByLabelText('Goal title'), 'Read books');
    await user.clear(within(createForm).getByLabelText('Target count'));
    await user.type(within(createForm).getByLabelText('Target count'), '4');
    await user.clear(within(createForm).getByLabelText('Unit label'));
    await user.type(within(createForm).getByLabelText('Unit label'), 'books');
    await user.click(screen.getByRole('button', { name: 'Save personal goal' }));

    expect(createIndividualGoal).toHaveBeenCalledWith({ familyMemberId: 'alex', title: 'Read books', targetCount: 4, unitLabel: 'books' });
    expect(await screen.findByText('Read books')).not.toBeNull();
  });

  it('edits a personal goal and preserves returned progress', async () => {
    const user = userEvent.setup();
    vi.mocked(updateIndividualGoal).mockResolvedValueOnce({ id: 'alex-goal', familyMemberId: 'sam', familyMemberName: 'Sam', title: 'Bedtime routine', targetCount: 2, currentProgress: 2, unitLabel: 'nights', visualKind: 'stars' });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Finish morning routine')).not.toBeNull();
    const alexCard = screen.getByText('Finish morning routine').closest('article')!;
    await user.click(within(alexCard).getByRole('button', { name: 'Edit' }));
    const editForm = screen.getByLabelText('Edit individual goal form');
    await user.selectOptions(within(editForm).getByLabelText('Family member'), 'sam');
    await user.clear(within(editForm).getByLabelText('Goal title'));
    await user.type(within(editForm).getByLabelText('Goal title'), 'Bedtime routine');
    await user.clear(within(editForm).getByLabelText('Target count'));
    await user.type(within(editForm).getByLabelText('Target count'), '2');
    await user.clear(within(editForm).getByLabelText('Unit label'));
    await user.type(within(editForm).getByLabelText('Unit label'), 'nights');
    await user.click(screen.getByRole('button', { name: 'Save personal goal' }));

    expect(updateIndividualGoal).toHaveBeenCalledWith('alex-goal', { familyMemberId: 'sam', title: 'Bedtime routine', targetCount: 2, unitLabel: 'nights' });
    expect(await screen.findByText('Bedtime routine')).not.toBeNull();
    expect(screen.getByLabelText('2 of 2 nights')).not.toBeNull();
  });

  it('retires a personal goal from active motivation display', async () => {
    const user = userEvent.setup();
    vi.mocked(archiveIndividualGoal).mockResolvedValueOnce(undefined);

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText('Finish morning routine')).not.toBeNull();
    const alexCard = screen.getByText('Finish morning routine').closest('article')!;
    await user.click(within(alexCard).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Retire goal' }));

    expect(archiveIndividualGoal).toHaveBeenCalledWith('alex-goal');
    expect(screen.queryByText('Finish morning routine')).toBeNull();
    expect(screen.getByText('Help with dinner')).not.toBeNull();
  });

});
