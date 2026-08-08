export type WeeklyResetStatus = 'Open' | 'Completed';
export type WeeklyResetOutcome = 'Reviewed' | 'Skipped';
export type WeeklyResetCandidateType = 'Task' | 'FamilyGoal' | 'IndividualGoal' | 'ShoppingList';
export type WeeklyResetDecision = 'CarryForward' | 'Later' | 'Archive' | 'Acknowledge';

export interface WeeklyResetSession {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: WeeklyResetStatus;
  outcome?: WeeklyResetOutcome;
  createdUtc: string;
  completedUtc?: string;
  resolvedCount: number;
  totalCount: number;
}

export interface WeeklyResetCandidate {
  id: string;
  candidateType: WeeklyResetCandidateType;
  sourceId: string;
  displayLabel: string;
  contextLabel: string;
  decision?: WeeklyResetDecision;
  actorLabel?: string;
  decidedUtc?: string;
  sourceAvailable: boolean;
  allowedDecisions: WeeklyResetDecision[];
}

export interface HelpfulMomentRecap {
  id: string;
  familyMemberName: string;
  title: string;
  description?: string;
  recognitionTag: string;
  createdUtc: string;
}

export interface CelebrationMemory {
  familyGoalId: string;
  title: string;
  description?: string;
  celebratedUtc: string;
}

export interface WeeklyContributionRecap {
  completedTaskCount: number;
  helpfulMomentCount: number;
  helpfulMoments: HelpfulMomentRecap[];
  celebrationMemories: CelebrationMemory[];
}

export interface WeeklyReset {
  session: WeeklyResetSession;
  candidates: WeeklyResetCandidate[];
  contributionRecap: WeeklyContributionRecap;
}

export interface WeeklyResetHistory { sessions: WeeklyResetSession[] }
export interface WeeklyResetHistoryDetail { session: WeeklyResetSession; candidates: WeeklyResetCandidate[] }

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; title?: string } | null;
    throw new Error(body?.error ?? body?.title ?? fallback);
  }
  return response.json() as Promise<T>;
}

export function loadWeeklyReset(): Promise<WeeklyReset> {
  return fetch(`${apiBaseUrl}/api/weekly-reset`, { headers: { Accept: 'application/json' } })
    .then((response) => readJson<WeeklyReset>(response, 'Het weekritueel kon niet worden geladen.'));
}

export function decideWeeklyResetCandidate(candidateId: string, decision: WeeklyResetDecision): Promise<WeeklyResetCandidate> {
  return fetch(`${apiBaseUrl}/api/weekly-reset/candidates/${candidateId}/decision`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, actorLabel: null }),
  }).then((response) => readJson<WeeklyResetCandidate>(response, 'De keuze kon niet worden opgeslagen.'));
}

export function completeWeeklyReset(): Promise<WeeklyResetSession> {
  return fetch(`${apiBaseUrl}/api/weekly-reset/complete`, { method: 'POST', headers: { Accept: 'application/json' } })
    .then((response) => readJson<WeeklyResetSession>(response, 'De week kon niet worden afgerond.'));
}

export function skipWeeklyReset(): Promise<WeeklyResetSession> {
  return fetch(`${apiBaseUrl}/api/weekly-reset/skip`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed: true, actorLabel: null }),
  }).then((response) => readJson<WeeklyResetSession>(response, 'Het weekritueel kon niet worden overgeslagen.'));
}

export function loadWeeklyResetHistory(): Promise<WeeklyResetHistory> {
  return fetch(`${apiBaseUrl}/api/weekly-reset/history`, { headers: { Accept: 'application/json' } })
    .then((response) => readJson<WeeklyResetHistory>(response, 'De geschiedenis kon niet worden geladen.'));
}

export function loadWeeklyResetHistoryDetail(sessionId: string): Promise<WeeklyResetHistoryDetail> {
  return fetch(`${apiBaseUrl}/api/weekly-reset/history/${sessionId}`, { headers: { Accept: 'application/json' } })
    .then((response) => readJson<WeeklyResetHistoryDetail>(response, 'Deze week kon niet worden geladen.'));
}
