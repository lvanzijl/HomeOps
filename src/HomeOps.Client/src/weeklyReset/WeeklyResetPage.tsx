import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getHelpfulMomentIconName, HomeOpsIcon } from '../icons/homeOpsIcons';
import {
  completeWeeklyReset,
  decideWeeklyResetCandidate,
  loadWeeklyReset,
  loadWeeklyResetHistory,
  loadWeeklyResetHistoryDetail,
  skipWeeklyReset,
  type WeeklyReset,
  type WeeklyResetCandidate,
  type WeeklyResetCandidateType,
  type WeeklyResetDecision,
  type WeeklyResetHistoryDetail,
  type WeeklyResetSession,
} from './weeklyResetApi';

type CandidateFilter = 'Open' | 'All' | WeeklyResetCandidateType;

const candidateTypeLabels: Record<WeeklyResetCandidateType, string> = {
  Task: 'Taken',
  FamilyGoal: 'Gezinsdoel',
  IndividualGoal: 'Kinddoelen',
  ShoppingList: 'Boodschappen',
};

export function WeeklyResetPage() {
  const [reset, setReset] = useState<WeeklyReset | null>(null);
  const [filter, setFilter] = useState<CandidateFilter>('Open');
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const [pendingTerminalAction, setPendingTerminalAction] = useState<'complete' | 'skip' | null>(null);
  const [status, setStatus] = useState('Weekritueel laden…');
  const [error, setError] = useState<string | null>(null);
  const [isSkipOpen, setIsSkipOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    loadWeeklyReset()
      .then((data) => {
        if (!ignore) {
          setReset(data);
          setStatus(data.session.status === 'Completed' ? 'Deze week is vastgelegd.' : 'Klaar voor jullie check-in.');
        }
      })
      .catch((loadError: unknown) => {
        if (!ignore) setError(messageFrom(loadError, 'Het weekritueel kon niet worden geladen.'));
      });
    return () => { ignore = true; };
  }, []);

  const filteredCandidates = useMemo(() => {
    if (!reset) return [];
    if (filter === 'Open') return reset.candidates.filter((candidate) => !candidate.decision);
    if (filter === 'All') return reset.candidates;
    return reset.candidates.filter((candidate) => candidate.candidateType === filter);
  }, [filter, reset]);

  async function refresh(message: string) {
    const data = await loadWeeklyReset();
    setReset(data);
    setStatus(message);
  }

  async function decide(candidate: WeeklyResetCandidate, decision: WeeklyResetDecision) {
    setPendingCandidateId(candidate.id);
    setError(null);
    try {
      await decideWeeklyResetCandidate(candidate.id, decision);
      await refresh('Keuze opgeslagen. Jullie kunnen hier later op terugkomen zolang de week open is.');
    } catch (decisionError) {
      setError(messageFrom(decisionError, 'De keuze kon niet worden opgeslagen. Probeer het opnieuw.'));
    } finally {
      setPendingCandidateId(null);
    }
  }

  async function complete() {
    setPendingTerminalAction('complete');
    setError(null);
    try {
      await completeWeeklyReset();
      await refresh('Week afgerond. De terugblik staat nu alleen-lezen in de geschiedenis.');
      setFilter('All');
    } catch (completionError) {
      setError(messageFrom(completionError, 'De week kon niet worden afgerond.'));
    } finally {
      setPendingTerminalAction(null);
    }
  }

  async function skip() {
    setPendingTerminalAction('skip');
    setError(null);
    try {
      await skipWeeklyReset();
      await refresh('Deze week is bewust overgeslagen en staat in de geschiedenis.');
      setFilter('All');
      setIsSkipOpen(false);
    } catch (skipError) {
      setError(messageFrom(skipError, 'Het weekritueel kon niet worden overgeslagen.'));
    } finally {
      setPendingTerminalAction(null);
    }
  }

  if (!reset) {
    return (
      <section className="weekly-reset-page weekly-reset-loading">
        <p role="status">{error ?? status}</p>
        {error ? <button type="button" onClick={() => window.location.reload()}>Opnieuw laden</button> : null}
      </section>
    );
  }

  const { session } = reset;
  const isOpen = session.status === 'Open';
  const remaining = session.totalCount - session.resolvedCount;
  const canComplete = isOpen && remaining === 0;

  return (
    <section className="weekly-reset-page" aria-labelledby="weekly-reset-heading">
      <header className="weekly-reset-command-band">
        <div className="weekly-reset-command-copy">
          <p className="eyebrow">Week van {formatDate(session.weekStart)} tot {formatDate(session.weekEnd)}</p>
          <h3 id="weekly-reset-heading">{session.status === 'Completed' ? terminalTitle(session) : 'Kies bewust wat meegaat'}</h3>
          <p>{session.status === 'Completed' ? terminalDescription(session) : 'Elke keuze wordt bewaard; na verversen gaan jullie verder waar jullie waren.'}</p>
        </div>
        <div className="weekly-reset-progress" aria-label={`${session.resolvedCount} van ${session.totalCount} keuzes opgeslagen`}>
          <strong>{session.resolvedCount}/{session.totalCount}</strong>
          <span>{remaining === 1 ? 'keuze open' : `${remaining} keuzes open`}</span>
        </div>
        <div className="weekly-reset-command-actions">
          <button type="button" className="secondary-action" onClick={() => setIsHistoryOpen(true)}>Eerdere weken</button>
          {isOpen ? <button type="button" className="secondary-action" onClick={() => setIsSkipOpen(true)}>Deze week overslaan</button> : null}
        </div>
      </header>

      <div className="weekly-reset-workspace">
        <section className="weekly-reset-candidates" aria-labelledby="weekly-reset-candidates-title">
          <div className="weekly-reset-section-heading">
            <div>
              <p className="eyebrow">Samen kiezen</p>
              <h3 id="weekly-reset-candidates-title">Afspraken voor volgende week</h3>
            </div>
            <span>{filteredCandidates.length} zichtbaar</span>
          </div>
          <div className="weekly-reset-filters" aria-label="Filter weekkeuzes">
            <FilterButton active={filter === 'Open'} onClick={() => setFilter('Open')}>Open ({remaining})</FilterButton>
            <FilterButton active={filter === 'All'} onClick={() => setFilter('All')}>Alles ({session.totalCount})</FilterButton>
            {(Object.keys(candidateTypeLabels) as WeeklyResetCandidateType[]).map((type) => (
              <FilterButton key={type} active={filter === type} onClick={() => setFilter(type)}>{candidateTypeLabels[type]}</FilterButton>
            ))}
          </div>
          <div className="weekly-reset-candidate-scroll" tabIndex={0}>
            {filteredCandidates.length === 0 ? (
              <div className="weekly-reset-empty">
                <strong>{session.totalCount === 0 ? 'Geen keuzes nodig' : 'Dit overzicht is rustig'}</strong>
                <p>{session.totalCount === 0 ? 'Er zijn deze week geen taken, doelen of lijstjes die aandacht vragen.' : 'Kies een ander filter om opgeslagen keuzes terug te zien.'}</p>
              </div>
            ) : filteredCandidates.map((candidate) => (
              <CandidateRow
                candidate={candidate}
                disabled={!isOpen || pendingCandidateId === candidate.id}
                key={candidate.id}
                onDecision={(decision) => decide(candidate, decision)}
              />
            ))}
          </div>
        </section>

        <aside className="weekly-reset-recap" aria-labelledby="weekly-reset-recap-title">
          <div className="weekly-reset-section-heading">
            <div>
              <p className="eyebrow">Vieren</p>
              <h3 id="weekly-reset-recap-title">Wat lukte deze week?</h3>
            </div>
          </div>
          <div className="weekly-reset-recap-metrics">
            <span><strong>{reset.contributionRecap.completedTaskCount}</strong> afgeronde taken</span>
            <span><strong>{reset.contributionRecap.helpfulMomentCount}</strong> helpmomenten</span>
          </div>
          <div className="weekly-reset-recap-scroll" tabIndex={0}>
            {reset.contributionRecap.helpfulMoments.length === 0 && reset.contributionRecap.celebrationMemories.length === 0 ? (
              <p className="weekly-reset-muted">Geen helpmomenten of vieringen in deze terugblik.</p>
            ) : null}
            {reset.contributionRecap.helpfulMoments.map((moment) => (
              <article className="weekly-reset-recap-row" key={moment.id}>
                <strong><HomeOpsIcon name={getHelpfulMomentIconName(moment.recognitionTag)} /> {moment.familyMemberName}: {moment.title}</strong>
                {moment.description ? <p>{moment.description}</p> : null}
              </article>
            ))}
            {reset.contributionRecap.celebrationMemories.map((memory) => (
              <article className="weekly-reset-recap-row" key={memory.familyGoalId}>
                <strong>Gevierd: {memory.title}</strong>
                {memory.description ? <p>{memory.description}</p> : null}
              </article>
            ))}
          </div>
        </aside>
      </div>

      <footer className={`weekly-reset-completion${session.status === 'Completed' ? ' is-completed' : ''}`}>
        <div>
          <p className="eyebrow">Afronden</p>
          <strong>{completionHeading(session, remaining)}</strong>
          <p>{completionCopy(session, remaining)}</p>
        </div>
        {isOpen ? (
          <button type="button" disabled={!canComplete || pendingTerminalAction !== null} onClick={complete}>
            {pendingTerminalAction === 'complete' ? 'Week afronden…' : 'Week afronden'}
          </button>
        ) : <span className="weekly-reset-completed-badge">Alleen-lezen</span>}
      </footer>

      <p role="status" className={`weekly-reset-status${error ? ' is-error' : ''}`}>{error ?? status}</p>

      {isSkipOpen ? <SkipDialog pending={pendingTerminalAction === 'skip'} onCancel={() => setIsSkipOpen(false)} onConfirm={skip} /> : null}
      {isHistoryOpen ? <HistoryDialog onClose={() => setIsHistoryOpen(false)} /> : null}
    </section>
  );
}

function CandidateRow({ candidate, disabled, onDecision }: { candidate: WeeklyResetCandidate; disabled: boolean; onDecision: (decision: WeeklyResetDecision) => void }) {
  return (
    <article className={`weekly-reset-candidate${candidate.decision ? ' is-resolved' : ''}`}>
      <div className="weekly-reset-candidate-copy">
        <span>{candidateTypeLabels[candidate.candidateType]}</span>
        <strong>{candidate.displayLabel}</strong>
        <p>{candidate.contextLabel}</p>
      </div>
      {candidate.decision ? (
        <div className="weekly-reset-saved-decision">
          <span>Opgeslagen: {decisionLabel(candidate.decision)}</span>
          {candidate.decidedUtc ? <small>{formatDateTime(candidate.decidedUtc)}</small> : null}
        </div>
      ) : null}
      {candidate.allowedDecisions.length > 0 ? (
        <div className="weekly-reset-candidate-actions">
          {candidate.allowedDecisions.map((decision) => (
            <button type="button" className={decision === 'Archive' ? 'secondary-action' : undefined} disabled={disabled} key={decision} onClick={() => onDecision(decision)}>
              {actionLabel(candidate.candidateType, decision)}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick}>{children}</button>;
}

function SkipDialog({ pending, onCancel, onConfirm }: { pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="weekly-reset-dialog-backdrop" role="presentation">
      <section className="weekly-reset-dialog weekly-reset-skip-dialog" role="dialog" aria-modal="true" aria-labelledby="weekly-reset-skip-title">
        <p className="eyebrow">Bewuste keuze</p>
        <h3 id="weekly-reset-skip-title">Deze week overslaan?</h3>
        <p>De open keuzes veranderen niet. HomeOps legt vast dat jullie dit weekritueel hebben overgeslagen, zodat verversen of opnieuw openen dezelfde uitkomst laat zien.</p>
        <div className="weekly-reset-dialog-actions">
          <button type="button" className="secondary-action" disabled={pending} onClick={onCancel}>Terug</button>
          <button type="button" disabled={pending} onClick={onConfirm}>{pending ? 'Overslaan…' : 'Ja, deze week overslaan'}</button>
        </div>
      </section>
    </div>
  );
}

function HistoryDialog({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<WeeklyResetSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WeeklyResetHistoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    loadWeeklyResetHistory().then(({ sessions: loaded }) => {
      if (ignore) return;
      setSessions(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    }).catch((historyError: unknown) => { if (!ignore) setError(messageFrom(historyError, 'De geschiedenis kon niet worden geladen.')); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let ignore = false;
    setDetail(null);
    loadWeeklyResetHistoryDetail(selectedId)
      .then((loaded) => { if (!ignore) setDetail(loaded); })
      .catch((detailError: unknown) => { if (!ignore) setError(messageFrom(detailError, 'Deze week kon niet worden geladen.')); });
    return () => { ignore = true; };
  }, [selectedId]);

  return (
    <div className="weekly-reset-dialog-backdrop" role="presentation">
      <section className="weekly-reset-dialog weekly-reset-history-dialog" role="dialog" aria-modal="true" aria-labelledby="weekly-reset-history-title">
        <header>
          <div><p className="eyebrow">Alleen-lezen</p><h3 id="weekly-reset-history-title">Eerdere weken</h3></div>
          <button type="button" className="secondary-action" onClick={onClose}>Sluiten</button>
        </header>
        {error ? <p role="alert" className="weekly-reset-status is-error">{error}</p> : null}
        <div className="weekly-reset-history-grid">
          <nav aria-label="Afgeronde weekrituelen">
            {sessions.length === 0 ? <p className="weekly-reset-muted">Nog geen afgeronde weken.</p> : sessions.map((session) => (
              <button type="button" aria-current={selectedId === session.id ? 'page' : undefined} key={session.id} onClick={() => setSelectedId(session.id)}>
                <strong>{formatDate(session.weekStart)} – {formatDate(session.weekEnd)}</strong>
                <span>{session.outcome === 'Skipped' ? 'Overgeslagen' : `${session.resolvedCount}/${session.totalCount} besproken`}</span>
              </button>
            ))}
          </nav>
          <div className="weekly-reset-history-detail" tabIndex={0}>
            {selectedId && !detail ? <p>Week laden…</p> : null}
            {detail ? (
              <>
                <h4>{detail.session.outcome === 'Skipped' ? 'Bewust overgeslagen' : 'Week afgerond'}</h4>
                <p>{detail.session.completedUtc ? formatDateTime(detail.session.completedUtc) : null}</p>
                {detail.candidates.map((candidate) => (
                  <article key={candidate.id}>
                    <strong>{candidate.displayLabel}</strong>
                    <span>{candidate.contextLabel}</span>
                    <em>{candidate.decision ? decisionLabel(candidate.decision) : 'Geen keuze — week overgeslagen'}</em>
                  </article>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function actionLabel(type: WeeklyResetCandidateType, decision: WeeklyResetDecision) {
  if (decision === 'Acknowledge') return 'Gezien';
  if (decision === 'Later') return 'Later bewaren';
  if (decision === 'Archive') return type === 'FamilyGoal' || type === 'IndividualGoal' ? 'Afronden' : 'Archiveren';
  return type === 'ShoppingList' ? 'Bewaren' : 'Gaat mee';
}

function decisionLabel(decision: WeeklyResetDecision) {
  return ({ CarryForward: 'gaat mee', Later: 'later bewaren', Archive: 'gearchiveerd', Acknowledge: 'gezien' } as const)[decision];
}

function terminalTitle(session: WeeklyResetSession) { return session.outcome === 'Skipped' ? 'Deze week is bewust overgeslagen' : 'Deze week is afgerond'; }
function terminalDescription(session: WeeklyResetSession) { return session.completedUtc ? `Vastgelegd op ${formatDateTime(session.completedUtc)}. De terugblik is alleen-lezen.` : 'Deze terugblik is alleen-lezen.'; }
function completionHeading(session: WeeklyResetSession, remaining: number) {
  if (session.status === 'Completed') return session.outcome === 'Skipped' ? 'Het ritueel is overgeslagen' : 'Klaar voor volgende week';
  return remaining === 0 ? 'Alle keuzes zijn opgeslagen' : remaining === 1 ? 'Nog één keuze te gaan' : `Nog ${remaining} keuzes te gaan`;
}
function completionCopy(session: WeeklyResetSession, remaining: number) {
  if (session.status === 'Completed') return 'Deze uitkomst blijft na verversen beschikbaar bij Eerdere weken.';
  return remaining === 0 ? 'Rond de week expliciet af om deze terugblik in de geschiedenis vast te leggen.' : 'Week afronden wordt beschikbaar zodra iedere kandidaat een bewaarde keuze heeft.';
}
function formatDate(value: string) { return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(dateOnly(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function dateOnly(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }
function messageFrom(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }
