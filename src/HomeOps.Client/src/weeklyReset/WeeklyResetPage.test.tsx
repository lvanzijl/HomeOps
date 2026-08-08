import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeeklyResetPage } from './WeeklyResetPage';
import type { WeeklyReset } from './weeklyResetApi';

const openPayload: WeeklyReset = {
  session: { id: 'reset-1', weekStart: '2026-08-03', weekEnd: '2026-08-09', status: 'Open', createdUtc: '2026-08-08T08:00:00Z', resolvedCount: 0, totalCount: 4 },
  candidates: [
    { id: 'task-1', candidateType: 'Task', sourceId: 'source-task', displayLabel: 'Bibliotheekboeken terugbrengen', contextLabel: 'Taak zonder datum', sourceAvailable: true, allowedDecisions: ['CarryForward', 'Later', 'Archive'] },
    { id: 'family-1', candidateType: 'FamilyGoal', sourceId: 'source-family', displayLabel: 'Samen helpen', contextLabel: 'Gezinsdoel · 12 / 20 momenten', sourceAvailable: true, allowedDecisions: ['CarryForward', 'Archive'] },
    { id: 'child-1', candidateType: 'IndividualGoal', sourceId: 'source-child', displayLabel: 'Samen lezen', contextLabel: 'Riley · 3 / 5 keer', sourceAvailable: true, allowedDecisions: ['CarryForward', 'Archive'] },
    { id: 'list-1', candidateType: 'ShoppingList', sourceId: 'source-list', displayLabel: 'Oude boodschappen', contextLabel: '2 items · is oud', sourceAvailable: true, allowedDecisions: ['CarryForward', 'Archive'] },
  ],
  contributionRecap: {
    completedTaskCount: 4,
    helpfulMomentCount: 1,
    helpfulMoments: [{ id: 'moment-1', familyMemberName: 'Riley', title: 'Hielp opruimen', recognitionTag: 'teamwork', createdUtc: '2026-08-07T10:00:00Z' }],
    celebrationMemories: [],
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('WeeklyResetPage', () => {
  it('gives every counted candidate a valid persisted action in the bounded workflow', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(openPayload)));
    render(<WeeklyResetPage />);

    expect(await screen.findByText('Kies bewust wat meegaat')).toBeTruthy();
    expect(screen.getByLabelText('0 van 4 keuzes opgeslagen')).toBeTruthy();
    expect(screen.getByText('Bibliotheekboeken terugbrengen')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Gezinsdoel' }));
    expect(screen.getByText('Samen helpen')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gaat mee' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Afronden' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Boodschappen' }));
    expect(screen.getByText('Oude boodschappen')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bewaren' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archiveren' })).toBeTruthy();
  });

  it('saves a decision and derives progress from the refreshed server aggregate', async () => {
    let payload = structuredClone(openPayload);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/candidates/task-1/decision')) {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ decision: 'Later', actorLabel: null });
        payload = {
          ...payload,
          session: { ...payload.session, resolvedCount: 1 },
          candidates: payload.candidates.map((candidate) => candidate.id === 'task-1'
            ? { ...candidate, decision: 'Later', decidedUtc: '2026-08-08T09:00:00Z' }
            : candidate),
        };
        return json(payload.candidates[0]);
      }
      return json(payload);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<WeeklyResetPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Later bewaren' }));

    await waitFor(() => expect(screen.getByLabelText('1 van 4 keuzes opgeslagen')).toBeTruthy());
    await userEvent.click(screen.getByRole('button', { name: 'Alles (4)' }));
    expect(screen.getByText('Opgeslagen: later bewaren')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/weekly-reset'), expect.anything());
  });

  it('retains a failed decision with an actionable retry message', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/candidates/')
      ? json({ error: 'Opslaan tijdelijk mislukt.' }, false, 500)
      : json(openPayload));
    vi.stubGlobal('fetch', fetchMock);
    render(<WeeklyResetPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Later bewaren' }));

    expect(await screen.findByText('Opslaan tijdelijk mislukt.')).toBeTruthy();
    expect(screen.getByText('Bibliotheekboeken terugbrengen')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Later bewaren' })).toBeTruthy();
  });

  it('completes an all-resolved week and exposes its read-only history', async () => {
    const ready: WeeklyReset = { ...structuredClone(openPayload), session: { ...openPayload.session, resolvedCount: 0, totalCount: 0 }, candidates: [] };
    const completedSession = { ...ready.session, status: 'Completed' as const, outcome: 'Reviewed' as const, completedUtc: '2026-08-08T10:00:00Z' };
    let current: WeeklyReset = ready;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/complete')) { current = { ...ready, session: completedSession }; return json(completedSession); }
      if (url.endsWith('/history')) return json({ sessions: [completedSession] });
      if (url.endsWith(`/history/${completedSession.id}`)) return json({ session: completedSession, candidates: [] });
      return json(current);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<WeeklyResetPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Week afronden' }));
    expect(await screen.findByText('Deze week is afgerond')).toBeTruthy();
    expect(screen.getByText('Alleen-lezen')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Eerdere weken' }));
    const dialog = await screen.findByRole('dialog', { name: 'Eerdere weken' });
    expect(await within(dialog).findByText('Week afgerond')).toBeTruthy();
  });

  it('persists an intentional skip instead of hiding the page locally', async () => {
    const skippedSession = { ...openPayload.session, status: 'Completed' as const, outcome: 'Skipped' as const, completedUtc: '2026-08-08T10:00:00Z' };
    let current = openPayload;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/skip')) {
        expect(JSON.parse(String(init?.body))).toEqual({ confirmed: true, actorLabel: null });
        current = { ...openPayload, session: skippedSession };
        return json(skippedSession);
      }
      return json(current);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<WeeklyResetPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Deze week overslaan' }));
    const dialog = screen.getByRole('dialog', { name: 'Deze week overslaan?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ja, deze week overslaan' }));

    expect(await screen.findByText('Deze week is bewust overgeslagen')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/weekly-reset/skip'), expect.objectContaining({ method: 'POST' }));
  });
});

function json(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => body } as Response);
}
