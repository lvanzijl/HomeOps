import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { familyMembers } from './home/familyMembers';
import { MotivationPage } from './MotivationPage';

afterEach(() => cleanup());

describe('MotivationPage', () => {
  it('renders the family goal and individual family member goal cards', () => {
    render(<MotivationPage members={familyMembers} />);

    expect(screen.getByLabelText('Motivation page')).not.toBeNull();
    const familyGoal = screen.getByLabelText('Active family goal');
    expect(within(familyGoal).getByText('Fill the family helper path')).not.toBeNull();
    expect(within(familyGoal).getByText('13/20')).not.toBeNull();
    expect(within(familyGoal).getByText('When we finish: Board game night together')).not.toBeNull();

    const individualGoals = screen.getByLabelText('Individual encouragement goals');
    expect(within(individualGoals).getByText('Alex')).not.toBeNull();
    expect(within(individualGoals).getByText('Finish morning routine')).not.toBeNull();
    expect(within(individualGoals).getByText('Sam')).not.toBeNull();
    expect(within(individualGoals).getByText('Help with dinner')).not.toBeNull();
  });

  it('does not render reward economy or competitive wording', () => {
    render(<MotivationPage members={familyMembers} />);

    expect(screen.queryByText(/shop/i)).toBeNull();
    expect(screen.queryByText(/^gems?$/i)).toBeNull();
    expect(screen.queryByText(/leaderboard/i)).toBeNull();
    expect(screen.queryByText(/balance/i)).toBeNull();
  });
});
