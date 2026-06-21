import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyResetPage } from './WeeklyResetPage';

const payload = { reviewCandidates: [{ id: 'task-1', title: 'Review library books', dueDate: null, ownershipKind: 'Unassigned', familyMemberId: null, isCompleted: false, completedUtc: null, createdUtc: '', updatedUtc: '', noDateReviewState: 'NeedsReview' }], familyGoal: { id: 'goal-1', title: 'Fill the helper path', targetCount: 20, currentProgress: 12, unitLabel: 'helps' }, individualGoals: [{ id: 'child-goal-1', familyMemberId: 'riley', familyMemberName: 'Riley', title: 'Read together', targetCount: 5, currentProgress: 3, unitLabel: 'reads', visualKind: 'stars' }], shoppingReviewCandidates: [{ id: 'list-1', name: 'Old Shopping', reason: 'Archived list to keep in history or delete later', updatedUtc: '', itemCount: 2 }], contributionRecap: { completedTaskCount: 4, helpfulMomentCount: 1, individualGoals: [], helpfulMoments: [{ id: 'moment-1', familyMemberName: 'Riley', title: 'Helped clean up', recognitionTag: 'teamwork', createdUtc: '' }], celebrationMemories: [] } };

describe('WeeklyResetPage', () => {
  it('renders review candidates, goals, shopping review, and contribution recap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    render(<WeeklyResetPage />);
    await waitFor(() => expect(screen.getByText('Weekly Household Reset')).toBeTruthy());
    expect(screen.getByText('Review library books')).toBeTruthy();
    expect(screen.getByText('Fill the helper path')).toBeTruthy();
    expect(screen.getByText('Riley: Read together')).toBeTruthy();
    expect(screen.getByText('Old Shopping')).toBeTruthy();
    expect(screen.getByText('Riley: Helped clean up')).toBeTruthy();
  });
});
