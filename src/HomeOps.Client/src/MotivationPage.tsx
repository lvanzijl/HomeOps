import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { FamilyAvatar } from "./home/FamilyAvatar";
import { HelpfulMomentsSection } from "./HelpfulMoments";
import { HomeOpsIcon, type HomeOpsIconName } from "./icons/homeOpsIcons";
import type { FamilyMember } from "./home/familyMembers";
import {
  FamilyCelebrationStatus,
  MotivationProgressSourceType,
} from "./api/homeOpsApiClient";
import {
  archiveIndividualGoal,
  archiveFamilyGoal,
  clampProgress,
  createFamilyGoalProgressCorrection,
  createFamilyGoal,
  createIndividualGoal,
  goalsForMembers,
  loadMotivationSnapshot,
  loadFamilyGoalHistory,
  loadFamilyGoalProgress,
  markFamilyGoalCelebrated,
  restoreFamilyGoal,
  updateFamilyGoal,
  updateIndividualGoal,
  type MotivationCelebrationMemory,
  type MotivationFamilyGoal,
  type MotivationFamilyGoalHistoryItem,
  type MotivationIndividualGoal,
  type MotivationProgressLedger,
  type MotivationSnapshot,
} from "./motivationData";

interface MotivationPageProps {
  members: readonly FamilyMember[];
}

export function MotivationPage({ members }: MotivationPageProps) {
  const [snapshot, setSnapshot] = useState<MotivationSnapshot>({
    individualGoals: [],
  });
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit" | "stop">(
    "closed",
  );
  const [individualFormGoal, setIndividualFormGoal] = useState<
    MotivationIndividualGoal | undefined
  >();
  const [formError, setFormError] = useState<string | null>(null);
  const [showMemoriesDetail, setShowMemoriesDetail] = useState(false);
  const [familyGoalHistory, setFamilyGoalHistory] = useState<MotivationFamilyGoalHistoryItem[]>([]);
  const [familyGoalHistoryStatus, setFamilyGoalHistoryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showPersonalGoalsDetail, setShowPersonalGoalsDetail] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [progressDetailMode, setProgressDetailMode] = useState<"ledger" | "correction">("ledger");
  const [progressLedger, setProgressLedger] = useState<MotivationProgressLedger>();
  const [progressLedgerStatus, setProgressLedgerStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    loadMotivationSnapshot()
      .then((loaded) => {
        if (!ignore) {
          setSnapshot(loaded);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const { familyGoal } = snapshot;
  const percent = familyGoal
    ? clampProgress(familyGoal.currentProgress, familyGoal.targetCount)
    : 0;
  const individualGoals = goalsForMembers(snapshot, members);
  const memories = snapshot.celebrationMemories ?? [];

  function handleFormSaved(goal: MotivationFamilyGoal) {
    setSnapshot((current) => {
      const celebratedMemory = memoryFromFamilyGoal(goal);
      const memories = celebratedMemory
        ? [
            celebratedMemory,
            ...(current.celebrationMemories ?? []).filter(
              (memory) => memory.familyGoalId !== celebratedMemory.familyGoalId,
            ),
          ].slice(0, 6)
        : current.celebrationMemories;
      return { ...current, familyGoal: goal, celebrationMemories: memories };
    });
    setFormMode("closed");
    setFormError(null);
  }

  function handleIndividualGoalSaved(goal: MotivationIndividualGoal) {
    setSnapshot((current) => ({
      ...current,
      individualGoals: current.individualGoals.some(
        (item) => item.id === goal.id,
      )
        ? current.individualGoals.map((item) =>
            item.id === goal.id ? goal : item,
          )
        : [...current.individualGoals, goal],
    }));
    setIndividualFormGoal(undefined);
    setShowPersonalGoalsDetail(true);
    setFormError(null);
  }

  async function openProgressDetail() {
    if (!familyGoal) return;
    setShowStatsDetail(true);
    setProgressDetailMode("ledger");
    setProgressLedger(undefined);
    setProgressLedgerStatus("loading");
    try {
      setProgressLedger(await loadFamilyGoalProgress(familyGoal.id));
      setProgressLedgerStatus("ready");
    } catch {
      setProgressLedgerStatus("error");
    }
  }

  async function openFamilyStoryHistory() {
    setShowMemoriesDetail(true);
    setFamilyGoalHistoryStatus("loading");
    try {
      setFamilyGoalHistory(await loadFamilyGoalHistory());
      setFamilyGoalHistoryStatus("ready");
    } catch {
      setFamilyGoalHistoryStatus("error");
    }
  }

  useEffect(() => {
    if (formMode === "closed" && !individualFormGoal) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormMode("closed");
        setIndividualFormGoal(undefined);
        setFormError(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [formMode, individualFormGoal]);

  return (
    <section
      className="motivation-page motivation-dashboard-page"
      aria-label="Motivatiedashboard"
    >
      <div className="motivation-dashboard motivation-story-grid">
        <article
          className="family-goal-card motivation-dashboard-card motivation-dashboard-primary"
          aria-label="Gedeeld familiedoel"
        >
          {!familyGoal ? (
            <div className="empty-state-card page-empty-state">
              <p className="eyebrow">
                {status === "error"
                  ? "Motivatie is niet beschikbaar"
                  : "Familiedoel"}
              </p>
              <h3>Nog geen familiedoel.</h3>
              <p>Maak één gezamenlijk doel.</p>
              <button type="button" onClick={() => setFormMode("create")}>
                Familiedoel maken
              </button>
            </div>
          ) : (
            <>
              <div className="family-goal-summary">
                <div className="family-goal-title-row">
                  <HomeOpsIcon
                    className="motivation-ownership-asset family-goal-illustration"
                    name="childFamilyParticipation"
                    variant="spot"
                  />
                  <div>
                    <p className="eyebrow">Familiedoel</p>
                    <h3>{familyGoal.title}</h3>
                    <p className="motivation-copy">
                      {familyGoalAnticipationMessage(familyGoal)}
                    </p>
                  </div>
                </div>
                <div className="family-purpose-progress">
                  <div
                    className="family-progress"
                    aria-label={`${familyGoal.currentProgress} van ${familyGoal.targetCount} ${familyGoal.unitLabel}`}
                  >
                    <div className="family-progress-number">
                      <strong>{familyGoal.currentProgress}</strong>
                      <span>
                        / {familyGoal.targetCount} {familyGoal.unitLabel}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
                <p className="family-progress-source">
                  Voltooide gedeelde taken tellen automatisch mee. Correcties blijven zichtbaar in het logboek.
                </p>
              </div>
              <div className="family-goal-primary-actions">
                <button
                  type="button"
                  className="secondary-action familyboard-card-action family-goal-primary-action"
                  onClick={() => setFormMode("edit")}
                >
                  <HomeOpsIcon name="childMyProgress" />
                  Familiedoel aanpassen
                </button>
                <button
                  type="button"
                  className="secondary-action compact-action familyboard-card-action"
                  onClick={openProgressDetail}
                >
                  <HomeOpsIcon name="childMyProgress" />
                  Meer voortgang
                </button>
              </div>
            </>
          )}
        </article>

        <HelpfulMomentsSection
          members={members}
          showCreate
          compact
          contextualHistory
          previewCount={2}
          title="Aanmoediging en waardering"
        />

        <CelebrationStoryCard
          familyGoal={familyGoal}
          memories={memories}
          individualGoals={individualGoals}
          onOpenMemories={openFamilyStoryHistory}
          onOpenPersonalGoals={() => setShowPersonalGoalsDetail(true)}
          onOpenStats={openProgressDetail}
          onCelebrated={handleFormSaved}
        />
      </div>

      {formMode !== "closed" ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => {
            setFormMode("closed");
            setFormError(null);
          }}
        >
          <section
            className="motivation-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              formMode === "stop"
                ? "Familiedoel stoppen"
                : formMode === "edit"
                ? "Familiedoel aanpassen"
                : "Familiedoel maken"
            }
            onClick={(event) => event.stopPropagation()}
          >
            {formMode === "stop" && familyGoal ? (
              <section className="motivation-confirmation" aria-label="Familiedoel stoppen bevestigen">
                <div>
                  <p className="eyebrow">Familiedoel stoppen</p>
                  <h3>‘{familyGoal.title}’ stoppen?</h3>
                  <p>
                    Nieuwe gedeelde taken tellen niet meer mee. De voortgang, het logboek en een eventuele viering blijven in de doelgeschiedenis bewaard.
                  </p>
                </div>
                {formError ? <p className="form-error">{formError}</p> : null}
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await archiveFamilyGoal(familyGoal.id);
                        setSnapshot((current) => ({ ...current, familyGoal: undefined }));
                        setFamilyGoalHistory((current) => [
                          { goal: familyGoal, archivedUtc: new Date().toISOString() },
                          ...current.filter((item) => item.goal.id !== familyGoal.id),
                        ]);
                        setFormMode("closed");
                        setFormError(null);
                      } catch {
                        setFormError("We konden dit familiedoel niet stoppen. Probeer het opnieuw.");
                      }
                    }}
                  >
                    Familiedoel stoppen
                  </button>
                  <button type="button" className="secondary-action" onClick={() => setFormMode("edit")}>
                    Doorgaan met doel
                  </button>
                </div>
              </section>
            ) : (
              <FamilyGoalForm
                familyGoal={formMode === "edit" ? familyGoal : undefined}
                error={formError}
                onAnnuleren={() => {
                  setFormMode("closed");
                  setFormError(null);
                }}
                onArchive={formMode === "edit" && familyGoal ? () => {
                  setFormMode("stop");
                  setFormError(null);
                } : undefined}
                onSubmit={async (values) => {
                  try {
                    const saved =
                      formMode === "edit" && familyGoal
                        ? await updateFamilyGoal(familyGoal.id, values)
                        : await createFamilyGoal(values);
                    handleFormSaved(saved);
                  } catch {
                    setFormError(
                      "We konden dit familiedoel niet bewaren. Probeer het opnieuw.",
                    );
                  }
                }}
              />
            )}
          </section>
        </div>
      ) : null}

      {showMemoriesDetail ? (
        <MotivationDetailDialog
          label="Gezinsverhaal en doelgeschiedenis"
          title="Wat we samen hebben opgebouwd"
          description={`${memories.length} vieringen en ${familyGoalHistory.length} gestopte doelen om later samen terug te lezen.`}
          onClose={() => setShowMemoriesDetail(false)}
          className="motivation-family-history-dialog"
        >
          <FamilyStoryHistory
            memories={memories}
            history={familyGoalHistory}
            historyStatus={familyGoalHistoryStatus}
            canRestore={!familyGoal}
            onRetry={openFamilyStoryHistory}
            onRestore={async (item) => {
              const restored = await restoreFamilyGoal(item.goal.id);
              setSnapshot((current) => ({ ...current, familyGoal: restored }));
              setFamilyGoalHistory((current) => current.filter((historyItem) => historyItem.goal.id !== restored.id));
            }}
          />
        </MotivationDetailDialog>
      ) : null}

      {showPersonalGoalsDetail ? (
        <MotivationDetailDialog
          label="Persoonlijke aanmoedigingsdoelen"
          title="Persoonlijke doelen deze week"
          description={`${individualGoals.length} actief · ${personalGoalSummary(individualGoals)}`}
          onClose={() => setShowPersonalGoalsDetail(false)}
          actions={
            <button
              type="button"
              className="secondary-action compact-action"
              onClick={() =>
                setIndividualFormGoal({
                  id: "",
                  familyMemberId: members[0]?.id ?? "",
                  familyMemberName: members[0]?.name ?? "",
                  title: "",
                  targetCount: 4,
                  currentProgress: 0,
                  unitLabel: "keer",
                  visualKind: "stars",
                })
              }
            >
              <HomeOpsIcon name="add" />
              Persoonlijk doel toevoegen
            </button>
          }
        >
          <div className="individual-goal-grid">
            {individualGoals.length === 0 ? (
              <p className="motivation-copy">Nog geen persoonlijke doelen.</p>
            ) : null}
            {individualGoals.map((goal) => {
              const member = members.find(
                (item) => item.id === goal.familyMemberId,
              );
              if (!member) return null;
              return (
                <article
                  className="individual-goal-card"
                  key={goal.id}
                  style={
                    { "--member-color": member.displayColor } as CSSProperties
                  }
                >
                  <div className="individual-goal-heading">
                    <FamilyAvatar member={member} />
                    <HomeOpsIcon
                      className="motivation-ownership-asset"
                      name="childMyProgress"
                    />
                    <div>
                      <strong>{member.name}</strong>
                      <span>{goal.title}</span>
                    </div>
                    <button
                      type="button"
                      className="secondary-action compact-action"
                      onClick={() => setIndividualFormGoal(goal)}
                    >
                      Aanpassen
                    </button>
                  </div>
                  <div
                    className="star-row"
                    aria-label={`${goal.currentProgress} of ${goal.targetCount} ${goal.unitLabel}`}
                  >
                    {Array.from({ length: goal.targetCount }, (_, index) => (
                      <HomeOpsIcon
                        className={index < goal.currentProgress ? "filled" : ""}
                        key={index}
                        name={
                          index < goal.currentProgress
                            ? "childMyProgress"
                            : "completed"
                        }
                      />
                    ))}
                  </div>
                  <p>
                    {goal.targetCount - goal.currentProgress > 0
                      ? `${goal.targetCount - goal.currentProgress} te gaan — blijf elkaar aanmoedigen.`
                      : "Doel gehaald — vier de routine!"}
                  </p>
                </article>
              );
            })}
          </div>
        </MotivationDetailDialog>
      ) : null}

      {showStatsDetail && familyGoal ? (
        <MotivationDetailDialog
          label="Voortgangsdetails"
          title="Voortgangslogboek"
          description="Elke taak en correctie blijft zichtbaar; bestaande regels veranderen nooit."
          onClose={() => setShowStatsDetail(false)}
          className="motivation-progress-dialog"
          actions={
            progressDetailMode === "ledger" && progressLedgerStatus === "ready" ? (
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => setProgressDetailMode("correction")}
              >
                Correctie toevoegen
              </button>
            ) : undefined
          }
        >
          <ProgressLedgerWorkspace
            familyGoal={familyGoal}
            ledger={progressLedger}
            status={progressLedgerStatus}
            mode={progressDetailMode}
            onBack={() => setProgressDetailMode("ledger")}
            onRetry={openProgressDetail}
            onCorrected={(ledger) => {
              setProgressLedger(ledger);
              setProgressDetailMode("ledger");
              setSnapshot((current) => ({
                ...current,
                familyGoal: current.familyGoal
                  ? {
                      ...current.familyGoal,
                      currentProgress: ledger.currentProgress,
                      celebration: current.familyGoal.celebration
                        ? {
                            ...current.familyGoal.celebration,
                            status:
                              current.familyGoal.celebration.status === FamilyCelebrationStatus.Celebrated
                                ? FamilyCelebrationStatus.Celebrated
                                : ledger.currentProgress >= current.familyGoal.targetCount
                                  ? FamilyCelebrationStatus.ReadyToCelebrate
                                  : FamilyCelebrationStatus.Planned,
                          }
                        : undefined,
                    }
                  : undefined,
              }));
            }}
          />
        </MotivationDetailDialog>
      ) : null}

      {individualFormGoal ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => {
            setIndividualFormGoal(undefined);
            setFormError(null);
          }}
        >
          <section
            className="motivation-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              individualFormGoal.id
                ? "Persoonlijk doel aanpassen"
                : "Persoonlijk doel maken"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <IndividualGoalForm
              goal={individualFormGoal.id ? individualFormGoal : undefined}
              members={members}
              error={formError}
              onAnnuleren={() => {
                setIndividualFormGoal(undefined);
                setFormError(null);
              }}
              onArchive={
                individualFormGoal.id
                  ? async () => {
                      try {
                        await archiveIndividualGoal(individualFormGoal.id);
                        setSnapshot((current) => ({
                          ...current,
                          individualGoals: current.individualGoals.filter(
                            (goal) => goal.id !== individualFormGoal.id,
                          ),
                        }));
                        setIndividualFormGoal(undefined);
                      } catch {
                        setFormError(
                          "We konden dit doel niet stoppen. Probeer het opnieuw.",
                        );
                      }
                    }
                  : undefined
              }
              onSubmit={async (values) => {
                try {
                  const saved = individualFormGoal.id
                    ? await updateIndividualGoal(individualFormGoal.id, values)
                    : await createIndividualGoal(values);
                  handleIndividualGoalSaved(saved);
                } catch {
                  setFormError(
                    "We konden dit persoonlijke doel niet bewaren. Probeer het opnieuw.",
                  );
                }
              }}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}

function CelebrationStoryCard({
  familyGoal,
  memories,
  individualGoals,
  onOpenMemories,
  onOpenPersonalGoals,
  onOpenStats,
  onCelebrated,
}: {
  familyGoal?: MotivationFamilyGoal;
  memories: readonly MotivationCelebrationMemory[];
  individualGoals: readonly MotivationIndividualGoal[];
  onOpenMemories: () => void;
  onOpenPersonalGoals: () => void;
  onOpenStats: () => void;
  onCelebrated: (goal: MotivationFamilyGoal) => void;
}) {
  const [savingCelebration, setSavingCelebration] = useState(false);
  const celebration = familyGoal?.celebration;
  const latestMemory = memories[0];
  const celebrationLabel =
    celebration?.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? "Klaar om te vieren"
      : celebration?.status === FamilyCelebrationStatus.Celebrated
        ? "Samen gevierd"
        : celebration
          ? "Volgende gezinsmoment"
          : "Kies samen een viering";
  const celebrationMessage =
    celebration && familyGoal
      ? familyGoalAnticipationMessage(familyGoal)
      : "Geef jullie doel straks een warm moment om samen naar uit te kijken.";
  const celebrationIcon: HomeOpsIconName =
    celebration?.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? "celebrationReady"
      : celebration?.status === FamilyCelebrationStatus.Celebrated
        ? "celebrationCelebrated"
        : "celebrationUpcoming";

  return (
    <section
      className="motivation-dashboard-card celebration-story-card"
      aria-label="Gezinsviering"
    >
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Gezinsviering</p>
          <h3>Wat we straks samen vieren</h3>
        </div>
        <HomeOpsIcon name={celebrationIcon} variant="spot" />
      </div>
      <div className="celebration-story-layout">
        <article className="celebration-story-focus">
          <p className="eyebrow">{celebrationLabel}</p>
          <h4>{celebration?.title ?? "Nog geen volgende viering"}</h4>
          <p>{celebrationMessage}</p>
        </article>
        <div className="celebration-story-support">
          <article className="celebration-mini-item">
            <HomeOpsIcon name="celebrationMemory" />
            <div className="celebration-mini-copy">
              <strong>{latestMemory?.title ?? "Nog geen herinnering bewaard"}</strong>
              <span>
                {latestMemory
                  ? `${memories.length} herinneringen om te bewaren`
                  : "Jullie eerste viering kan hier straks blijven hangen."}
              </span>
            </div>
          </article>
          <article className="celebration-mini-item">
            <HomeOpsIcon name="childMyProgress" />
            <div className="celebration-mini-copy">
              <strong>{individualGoals.length} persoonlijke doelen actief</strong>
              <span>{personalGoalSummary(individualGoals)}</span>
            </div>
          </article>
        </div>
      </div>
      <div className="family-story-actions familyboard-card-actions">
        {familyGoal?.celebration?.status === FamilyCelebrationStatus.ReadyToCelebrate ? (
          <button
            type="button"
            className="secondary-action compact-action familyboard-card-action"
            disabled={savingCelebration}
            onClick={async () => {
              setSavingCelebration(true);
              try {
                onCelebrated(await markFamilyGoalCelebrated(familyGoal.id));
              } finally {
                setSavingCelebration(false);
              }
            }}
          >
            {savingCelebration ? "Opslaan…" : "Als gevierd markeren"}
          </button>
        ) : null}
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onOpenMemories}
        >
          <HomeOpsIcon name="celebrationMemory" />
          Historie bekijken
        </button>
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onOpenPersonalGoals}
        >
          <HomeOpsIcon name="childMyProgress" />
          Doelen beheren
        </button>
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onOpenStats}
        >
          <HomeOpsIcon name="childMyProgress" />
          Details
        </button>
      </div>
    </section>
  );
}

function personalGoalSummary(goals: readonly MotivationIndividualGoal[]) {
  if (goals.length === 0) return "klaar zodra jullie er één toevoegen.";
  const complete = goals.filter(
    (goal) => goal.currentProgress >= goal.targetCount,
  ).length;
  const totalRemaining = goals.reduce(
    (sum, goal) => sum + Math.max(0, goal.targetCount - goal.currentProgress),
    0,
  );
  if (complete === goals.length) return "alle doelen gehaald.";
  return `${totalRemaining} stappen over voor het gezin.`;
}

function familyGoalAnticipationMessage(familyGoal: MotivationFamilyGoal) {
  const remaining = Math.max(
    0,
    familyGoal.targetCount - familyGoal.currentProgress,
  );
  const celebrationTitle = familyGoal.celebration?.title;
  if (
    familyGoal.celebration?.status ===
      FamilyCelebrationStatus.ReadyToCelebrate ||
    remaining === 0
  ) {
    return celebrationTitle
      ? `${celebrationTitle} staat klaar.`
      : "Familiedoel gehaald.";
  }
  if (celebrationTitle) {
    return remaining === 1
      ? `Nog 1 ${familyGoal.unitLabel} tot ${celebrationTitle}.`
      : `Nog ${remaining} ${familyGoal.unitLabel} tot ${celebrationTitle}.`;
  }
  return `Nog ${remaining} ${familyGoal.unitLabel} voor dit familiedoel.`;
}

interface IndividualGoalFormProps {
  goal?: MotivationIndividualGoal;
  members: readonly FamilyMember[];
  error: string | null;
  onAnnuleren: () => void;
  onSubmit: (values: {
    familyMemberId: string;
    title: string;
    targetCount: number;
    unitLabel: string;
  }) => Promise<void>;
  onArchive?: () => Promise<void>;
}

function IndividualGoalForm({
  goal,
  members,
  error,
  onAnnuleren,
  onSubmit,
  onArchive,
}: IndividualGoalFormProps) {
  const [familyMemberId, setFamilyMemberId] = useState(
    goal?.familyMemberId ?? members[0]?.id ?? "",
  );
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetCount, setTargetCount] = useState(
    String(goal?.targetCount ?? 4),
  );
  const [unitLabel, setUnitLabel] = useState(goal?.unitLabel ?? "keer");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedTarget = Number.parseInt(targetCount, 10);
    if (
      !familyMemberId ||
      !title.trim() ||
      !unitLabel.trim() ||
      !Number.isFinite(parsedTarget) ||
      parsedTarget < 1
    )
      return;
    setSaving(true);
    await onSubmit({
      familyMemberId,
      title: title.trim(),
      targetCount: parsedTarget,
      unitLabel: unitLabel.trim(),
    });
    setSaving(false);
  }

  return (
    <form
      className="family-goal-form"
      aria-label={
        goal
          ? "Persoonlijk doel aanpassen formulier"
          : "Persoonlijk doel maken formulier"
      }
      onSubmit={handleSubmit}
    >
      <div>
        <p className="eyebrow">Persoonlijk doel</p>
        <h3>
          {goal ? "Persoonlijk doel aanpassen" : "Persoonlijk doel toevoegen"}
        </h3>
        <p className="motivation-copy">
          Kies één gezinslid en één eenvoudig doel.
        </p>
      </div>
      <label>
        Gezinslid
        <select
          autoFocus
          value={familyMemberId}
          onChange={(event) => setFamilyMemberId(event.target.value)}
          required
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Doeltitel
        <input
          autoFocus
          value={title}
          maxLength={240}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Boeken lezen"
          required
        />
      </label>
      <label>
        Doelaantal
        <input
          type="number"
          min="1"
          max="99"
          value={targetCount}
          onChange={(event) => setTargetCount(event.target.value)}
          required
        />
      </label>
      <label>
        Eenheid
        <input
          value={unitLabel}
          maxLength={80}
          onChange={(event) => setUnitLabel(event.target.value)}
          placeholder="boeken"
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Opslaan…" : "Persoonlijk doel bewaren"}
        </button>
        {onArchive ? (
          <button
            type="button"
            className="secondary-action"
            onClick={onArchive}
          >
            Doel stoppen
          </button>
        ) : null}
        <button type="button" onClick={onAnnuleren}>
          Annuleren
        </button>
      </div>
    </form>
  );
}

interface FamilyGoalFormProps {
  familyGoal?: MotivationFamilyGoal;
  error: string | null;
  onAnnuleren: () => void;
  onArchive?: () => void;
  onSubmit: (values: {
    title: string;
    targetCount: number;
    unitLabel: string;
    celebrationTitle?: string;
    celebrationDescription?: string;
  }) => Promise<void>;
}

function FamilyGoalForm({
  familyGoal,
  error,
  onAnnuleren,
  onArchive,
  onSubmit,
}: FamilyGoalFormProps) {
  const [step, setStep] = useState<
    "title" | "progress" | "celebration" | "review"
  >("title");
  const [title, setTitle] = useState(familyGoal?.title ?? "");
  const [targetCount, setTargetCount] = useState(
    String(familyGoal?.targetCount ?? 10),
  );
  const [unitLabel, setUnitLabel] = useState(
    familyGoal?.unitLabel ?? "helpende acties",
  );
  const [celebrationTitle, setCelebrationTitle] = useState(
    familyGoal?.celebration?.title ?? "",
  );
  const [celebrationDescription, setCelebrationDescription] = useState(
    familyGoal?.celebration?.description ?? "",
  );
  const [saving, setSaving] = useState(false);

  const parsedTarget = Number.parseInt(targetCount, 10);
  const hasValidTitle = title.trim().length > 0;
  const hasValidProgress =
    unitLabel.trim().length > 0 &&
    Number.isFinite(parsedTarget) &&
    parsedTarget >= 1 &&
    parsedTarget <= 999;
  const actionLabel = familyGoal ? "Doel bewaren" : "Doel maken";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step !== "review") return;
    if (!hasValidTitle || !hasValidProgress) return;
    setSaving(true);
    await onSubmit({
      title: title.trim(),
      targetCount: parsedTarget,
      unitLabel: unitLabel.trim(),
      celebrationTitle: celebrationTitle.trim() || undefined,
      celebrationDescription: celebrationDescription.trim() || undefined,
    });
    setSaving(false);
  }

  function goBack() {
    if (step === "progress") setStep("title");
    if (step === "celebration") setStep("progress");
    if (step === "review") setStep("celebration");
  }

  return (
    <form
      className="family-goal-form conversational-goal-form"
      aria-label={
        familyGoal ? "Familiedoel aanpassen formulier" : "Familiedoel maken formulier"
      }
      onSubmit={handleSubmit}
    >
      <div>
        <p className="eyebrow">
          {familyGoal ? "Familieplan bijwerken" : "Familieplan starten"}
        </p>
        <h3>{familyGoal ? "Familiedoel aanpassen" : "Familiedoel maken"}</h3>
        <p className="motivation-copy">
          {familyGoal
            ? "We bewaren de voortgang die jullie al hebben verdiend."
            : "Kies één ding waar jullie samen voor kunnen juichen."}
        </p>
      </div>

      {step === "title" ? (
        <section
          className="dialog-question"
          aria-label="Vraag over familiedoel"
        >
          <h4>Waar werken we samen naartoe?</h4>
          <p className="motivation-copy">
            Houd het kort, zodat iedereen weet wat we aanmoedigen.
          </p>
          <label>
            Titel van familiedoel
            <input
              autoFocus
              value={title}
              maxLength={240}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Helpende klusjes afronden"
              required
            />
          </label>
        </section>
      ) : null}

      {step === "progress" ? (
        <section className="dialog-question" aria-label="Voortgang familiedoel">
          <h4>Hoe zien we dat we vooruitgaan?</h4>
          <p className="motivation-copy">
            Kies een duidelijk aantal en de woorden die jullie tellen.
          </p>
          <div className="conversation-field-row">
            <label>
              Doelaantal
              <input
                autoFocus
                type="number"
                min="1"
                max="999"
                value={targetCount}
                onChange={(event) => setTargetCount(event.target.value)}
                required
              />
            </label>
            <label>
              Voortgangslabel
              <input
                value={unitLabel}
                maxLength={80}
                onChange={(event) => setUnitLabel(event.target.value)}
                placeholder="helpende acties"
                required
              />
            </label>
          </div>
          {!hasValidProgress ? (
            <p className="form-error">
              Gebruik een doel van 1 tot 999 en een voortgangslabel.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === "celebration" ? (
        <section className="dialog-question" aria-label="Viering familiedoel">
          <h4>Waar kijken we naar uit?</h4>
          <p className="motivation-copy">
            Voeg nu een viering toe, of beslis later.
          </p>
          <label>
            Titel van familieviering, optioneel
            <input
              autoFocus
              value={celebrationTitle}
              maxLength={240}
              onChange={(event) => setCelebrationTitle(event.target.value)}
              placeholder="Samen filmavond"
            />
          </label>
          <label>
            Beschrijving van viering, optioneel
            <input
              value={celebrationDescription}
              maxLength={500}
              onChange={(event) =>
                setCelebrationDescription(event.target.value)
              }
              placeholder="Kies samen een film en maak popcorn"
            />
          </label>
        </section>
      ) : null}

      {step === "review" ? (
        <section
          className="dialog-question goal-review"
          aria-label="Controle familiedoel"
        >
          <h4>Klopt dit zo?</h4>
          <dl>
            <div>
              <dt>Doel</dt>
              <dd>{title.trim()}</dd>
            </div>
            <div>
              <dt>Voortgangsdoel</dt>
              <dd>
                {parsedTarget} {unitLabel.trim()}
              </dd>
            </div>
            <div>
              <dt>Viering</dt>
              <dd>
                {celebrationTitle.trim()
                  ? `${celebrationTitle.trim()}${
                      celebrationDescription.trim()
                        ? ` — ${celebrationDescription.trim()}`
                        : ""
                    }`
                  : "Nog geen viering — die kunnen we later toevoegen."}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        {familyGoal && step === "title" && onArchive ? (
          <button type="button" className="secondary-action" onClick={onArchive}>
            Familiedoel stoppen
          </button>
        ) : null}
        {step !== "title" ? (
          <button type="button" className="secondary-action" onClick={goBack}>
            Terug
          </button>
        ) : null}
        {step === "title" ? (
          <button
            type="button"
            disabled={!hasValidTitle}
            onClick={() => setStep("progress")}
          >
            Verder
          </button>
        ) : null}
        {step === "progress" ? (
          <button
            type="button"
            disabled={!hasValidProgress}
            onClick={() => setStep("celebration")}
          >
            Verder
          </button>
        ) : null}
        {step === "celebration" ? (
          <button type="button" onClick={() => setStep("review")}>
            Verder
          </button>
        ) : null}
        {step === "review" ? (
          <button
            type="submit"
            disabled={saving || !hasValidTitle || !hasValidProgress}
          >
            {saving ? "Opslaan…" : actionLabel}
          </button>
        ) : null}
        <button type="button" onClick={onAnnuleren}>
          Annuleren
        </button>
      </div>
    </form>
  );
}

function memoryFromFamilyGoal(
  goal: MotivationFamilyGoal,
): MotivationCelebrationMemory | undefined {
  if (
    goal.celebration?.status !== FamilyCelebrationStatus.Celebrated ||
    !goal.celebration.title
  )
    return undefined;
  return {
    familyGoalId: goal.id,
    title: goal.celebration.title,
    description: goal.celebration.description,
    celebratedUtc: goal.celebration.celebratedUtc ?? new Date().toISOString(),
  };
}

function ProgressLedgerWorkspace({
  familyGoal,
  ledger,
  status,
  mode,
  onBack,
  onRetry,
  onCorrected,
}: {
  familyGoal: MotivationFamilyGoal;
  ledger?: MotivationProgressLedger;
  status: "loading" | "ready" | "error";
  mode: "ledger" | "correction";
  onBack: () => void;
  onRetry: () => void;
  onCorrected: (ledger: MotivationProgressLedger) => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [correctionOfEntryId, setCorrectionOfEntryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return <p className="motivation-copy">Voortgangslogboek laden…</p>;
  }
  if (status === "error" || !ledger) {
    return (
      <div className="progress-ledger-state" role="alert">
        <p>We konden het voortgangslogboek niet laden.</p>
        <button type="button" className="secondary-action" onClick={onRetry}>
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (mode === "correction") {
    const parsedDelta = Number.parseInt(delta, 10);
    const valid = Number.isInteger(parsedDelta) && parsedDelta !== 0 && parsedDelta >= -999 && parsedDelta <= 999 && reason.trim().length > 0;
    return (
      <form
        className="progress-correction-form"
        aria-label="Voortgangscorrectie toevoegen"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!valid) return;
          setSaving(true);
          setError(null);
          try {
            const updated = await createFamilyGoalProgressCorrection(familyGoal.id, {
              delta: parsedDelta,
              reason: reason.trim(),
              correctionOfEntryId: correctionOfEntryId || undefined,
            });
            setDelta("");
            setReason("");
            setCorrectionOfEntryId("");
            onCorrected(updated);
          } catch {
            setError("De correctie kon niet worden bewaard. Je invoer is behouden; probeer het opnieuw.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="progress-correction-body">
          <div>
            <p className="eyebrow">Alleen corrigeren</p>
            <h4>Voeg een compenserende regel toe</h4>
            <p className="motivation-copy">
              Een correctie verandert oude regels niet. Gebruik een positief getal om toe te voegen en een negatief getal om af te trekken.
            </p>
          </div>
          <label>
            Koppel aan een bestaande regel, optioneel
            <select
              value={correctionOfEntryId}
              onChange={(event) => {
                const entryId = event.target.value;
                setCorrectionOfEntryId(entryId);
                const entry = ledger.entries.find((item) => item.id === entryId);
                if (entry) setDelta(String(-entry.delta));
              }}
            >
              <option value="">Geen specifieke regel</option>
              {ledger.entries.filter((entry) => entry.delta !== 0).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {progressSourceLabel(entry.sourceType)} · {entry.delta > 0 ? "+" : ""}{entry.delta} · {entry.reason}
                </option>
              ))}
            </select>
          </label>
          <label>
            Aanpassing
            <input
              type="number"
              min="-999"
              max="999"
              value={delta}
              onChange={(event) => {
                setDelta(event.target.value);
                if (correctionOfEntryId) setCorrectionOfEntryId("");
              }}
              placeholder="Bijvoorbeeld -1 of 2"
              required
            />
          </label>
          <label>
            Reden
            <textarea
              value={reason}
              maxLength={300}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Leg kort uit waarom deze correctie nodig is"
              required
            />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        <div className="form-actions progress-correction-actions">
          <button type="submit" disabled={!valid || saving}>{saving ? "Opslaan…" : "Correctie bewaren"}</button>
          <button type="button" className="secondary-action" onClick={onBack}>Terug naar logboek</button>
        </div>
      </form>
    );
  }

  return (
    <div className="progress-ledger-workspace">
      <section className="progress-ledger-summary" aria-label="Huidige voortgang">
        <div>
          <strong>{ledger.currentProgress}</strong>
          <span>/ {ledger.targetCount} {ledger.unitLabel}</span>
        </div>
        <p>Voltooide gedeelde taken tellen automatisch mee. Correcties zijn uitsluitend zichtbare, compenserende regels.</p>
      </section>
      <ol className="progress-ledger-list" aria-label="Voortgangsregels">
        {ledger.entries.length === 0 ? <li className="progress-ledger-empty">Nog geen voortgangsregels.</li> : null}
        {ledger.entries.map((entry) => (
          <li className="progress-ledger-entry" key={entry.id}>
            <div className="progress-ledger-entry-heading">
              <strong>{progressSourceLabel(entry.sourceType)}</strong>
              <span className={entry.delta >= 0 ? "positive" : "negative"}>{entry.delta > 0 ? "+" : ""}{entry.delta}</span>
            </div>
            <p>{entry.reason}</p>
            <small>
              {formatLedgerDate(entry.occurredUtc)} · bron {entry.sourceId}
              {entry.correctionOfEntryId ? ` · corrigeert ${entry.correctionOfEntryId}` : ""}
            </small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function progressSourceLabel(sourceType: MotivationProgressSourceType) {
  if (sourceType === MotivationProgressSourceType.TaskCompletion) return "Taak voltooid";
  if (sourceType === MotivationProgressSourceType.TaskReopen) return "Taak heropend";
  if (sourceType === MotivationProgressSourceType.Correction) return "Correctie";
  return "Startstand";
}

function formatLedgerDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function MotivationDetailDialog({
  label,
  title,
  description,
  onClose,
  children,
  actions,
  className,
}: {
  label: string;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="avatar-editor-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`motivation-dialog motivation-detail-dialog${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Motivatie</p>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <div className="motivation-detail-header-actions">
            {actions}
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label={`${label} sluiten`}
            >
              <HomeOpsIcon name="close" />
            </button>
          </div>
        </header>
        <div className="motivation-detail-content">{children}</div>
      </section>
    </div>
  );
}

function CelebrationMemorySection({
  memories,
}: {
  memories: readonly MotivationCelebrationMemory[];
}) {
  if (memories.length === 0) {
    return (
      <p className="motivation-copy">
        Nog geen herinneringen — de eerstvolgende viering kan hier straks landen.
      </p>
    );
  }
  return (
    <section className="celebration-memory-section">
      <div className="celebration-memory-grid">
        {memories.map((memory) => (
          <article
            className="celebration-memory-card"
            key={`${memory.familyGoalId}-${memory.celebratedUtc}`}
          >
            <HomeOpsIcon name="celebrationMemory" variant="keepsake" />
            <div>
              <h4>{memory.title}</h4>
              <p>
                <HomeOpsIcon name="childMyHelpMattered" /> Dit hebben we samen
                gedaan.
              </p>
              {memory.description ? <small>{memory.description}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FamilyStoryHistory({
  memories,
  history,
  historyStatus,
  canRestore,
  onRetry,
  onRestore,
}: {
  memories: readonly MotivationCelebrationMemory[];
  history: readonly MotivationFamilyGoalHistoryItem[];
  historyStatus: "loading" | "ready" | "error";
  canRestore: boolean;
  onRetry: () => void;
  onRestore: (item: MotivationFamilyGoalHistoryItem) => Promise<void>;
}) {
  const [restoringId, setRestoringId] = useState<string>();
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoredTitle, setRestoredTitle] = useState<string | null>(null);

  return (
    <div className="family-story-history-content">
      {restoredTitle ? <p className="form-success">‘{restoredTitle}’ is weer het actieve familiedoel.</p> : null}
      <section aria-label="Gestopte familiedoelen">
        <div className="dashboard-card-heading">
          <div>
            <p className="eyebrow">Doelgeschiedenis</p>
            <h4>Gestopte familiedoelen</h4>
          </div>
        </div>
        {historyStatus === "loading" ? <p className="motivation-copy">Doelgeschiedenis laden…</p> : null}
        {historyStatus === "error" ? (
          <div className="inline-error-state">
            <p>De doelgeschiedenis kon niet worden geladen.</p>
            <button type="button" className="secondary-action compact-action" onClick={onRetry}>Opnieuw proberen</button>
          </div>
        ) : null}
        {historyStatus === "ready" && history.length === 0 ? (
          <p className="motivation-copy">Nog geen gestopte familiedoelen.</p>
        ) : null}
        <div className="family-goal-history-list">
          {history.map((item) => (
            <article className="family-goal-history-card" key={item.goal.id}>
              <div>
                <strong>{item.goal.title}</strong>
                <span>{item.goal.currentProgress} van {item.goal.targetCount} {item.goal.unitLabel}</span>
                <small>
                  Gestopt {item.archivedUtc ? new Intl.DateTimeFormat("nl-NL").format(new Date(item.archivedUtc)) : "(datum niet vastgelegd)"}. Voortgang en logboek zijn bewaard.
                </small>
              </div>
              {canRestore ? (
                <button
                  type="button"
                  className="secondary-action compact-action"
                  disabled={restoringId === item.goal.id}
                  onClick={async () => {
                    setRestoringId(item.goal.id);
                    setRestoreError(null);
                    try {
                      await onRestore(item);
                      setRestoredTitle(item.goal.title);
                    } catch {
                      setRestoreError("Dit doel kon niet worden hervat. Controleer of er al een actief familiedoel is en probeer opnieuw.");
                    } finally {
                      setRestoringId(undefined);
                    }
                  }}
                >
                  {restoringId === item.goal.id ? "Hervatten…" : "Doel hervatten"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
        {!canRestore && history.length > 0 ? (
          <p className="motivation-copy">Stop eerst het actieve familiedoel als je een oud doel wilt hervatten.</p>
        ) : null}
        {restoreError ? <p className="form-error">{restoreError}</p> : null}
      </section>
      <section aria-label="Vieringsherinneringen">
        <div className="dashboard-card-heading">
          <div>
            <p className="eyebrow">Vieringen</p>
            <h4>Vieringen die we onthouden</h4>
          </div>
        </div>
        <CelebrationMemorySection memories={memories} />
      </section>
    </div>
  );
}
