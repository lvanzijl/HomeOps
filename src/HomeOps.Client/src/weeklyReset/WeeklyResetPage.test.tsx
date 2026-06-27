import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeeklyResetPage } from './WeeklyResetPage';

const payload = { reviewCandidates: [{ id: 'task-1', title: 'Review library books', dueDate: null, ownershipKind: 'Unassigned', familyMemberId: null, isCompleted: false, completedUtc: null, createdUtc: '', updatedUtc: '', noDateReviewState: 'NeedsReview' }], familyGoal: { id: 'goal-1', title: 'Fill the helper path', targetCount: 20, currentProgress: 12, unitLabel: 'helps' }, individualGoals: [{ id: 'child-goal-1', familyMemberId: 'riley', familyMemberName: 'Riley', title: 'Read together', targetCount: 5, currentProgress: 3, unitLabel: 'reads', visualKind: 'stars' }], shoppingReviewCandidates: [{ id: 'list-1', name: 'Old Shopping', reason: 'Archived list to keep in history or delete later', updatedUtc: '', itemCount: 2 }], contributionRecap: { completedTaskCount: 4, helpfulMomentCount: 1, individualGoals: [], helpfulMoments: [{ id: 'moment-1', familyMemberName: 'Riley', title: 'Helped clean up', recognitionTag: 'teamwork', createdUtc: '' }], celebrationMemories: [] } };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('WeeklyResetPage', () => {
  it('renders the weekly reset as a Dutch family ritual using existing data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    render(<WeeklyResetPage />);
    await waitFor(() => expect(screen.getByText('Zijn we klaar voor volgende week?')).toBeTruthy());
    expect(screen.getByText('Wat schuift door?')).toBeTruthy();
    expect(screen.getByText('Review library books')).toBeTruthy();
    expect(screen.getByText('Fill the helper path')).toBeTruthy();
    expect(screen.getByText('Riley: Read together')).toBeTruthy();
    expect(screen.getByText('Old Shopping')).toBeTruthy();
    expect(screen.getByText('Riley: Helped clean up')).toBeTruthy();
    expect(screen.getByText('Undo blijft beschikbaar waar dat vandaag al bestaat.')).toBeTruthy();
  });

  it('keeps the skip confirmation intentional and non-destructive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    render(<WeeklyResetPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Deze week overslaan' }));
    expect(screen.getByText('Vandaag slaan we over')).toBeTruthy();
    expect(screen.getByText('Prima. Alles blijft zoals het nu is: taken, doelen en lijstjes veranderen niet.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Open het weekritueel weer' }));
    expect(await screen.findByText('Zijn we klaar voor volgende week?')).toBeTruthy();
  });
});
