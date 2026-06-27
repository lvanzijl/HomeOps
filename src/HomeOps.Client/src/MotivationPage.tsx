import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { FamilyAvatar } from "./home/FamilyAvatar";
import { HelpfulMomentsSection } from "./HelpfulMoments";
import { HomeOpsIcon, type HomeOpsIconName } from "./icons/homeOpsIcons";
import type { FamilyMember } from "./home/familyMembers";
import { FamilyCelebrationStatus } from "./api/homeOpsApiClient";
import {
  archiveIndividualGoal,
  clampProgress,
  createFamilyGoal,
  createIndividualGoal,
  goalsForMembers,
  loadMotivationSnapshot,
  markFamilyGoalCelebrated,
  updateFamilyGoal,
  updateIndividualGoal,
  type MotivationCelebrationMemory,
  type MotivationFamilyGoal,
  type MotivationIndividualGoal,
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
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [individualFormGoal, setIndividualFormGoal] = useState<
    MotivationIndividualGoal | undefined
  >();
  const [formError, setFormError] = useState<string | null>(null);
  const [showMemoriesDetail, setShowMemoriesDetail] = useState(false);
  const [showPersonalGoalsDetail, setShowPersonalGoalsDetail] = useState(false);

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
      aria-label="Motivation dashboard"
    >
      <div className="motivation-dashboard familyboard-dashboard-grid">
        <article
          className="family-goal-card motivation-dashboard-card motivation-dashboard-primary"
          aria-label="Actief familiedoel"
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
                <FamilyCelebrationDisplay
                  familyGoal={familyGoal}
                  onCelebrated={handleFormSaved}
                />
              </div>
              <button
                type="button"
                className="secondary-action familyboard-card-action family-goal-primary-action"
                onClick={() => setFormMode("edit")}
              >
                <HomeOpsIcon name="childMyProgress" />
                Familiedoel aanpassen
              </button>
            </>
          )}
        </article>

        <HelpfulMomentsSection
          members={members}
          showCreate
          compact
          title="Recente waardering"
        />

        <UpcomingCelebrationsCard
          familyGoal={familyGoal}
          memories={snapshot.celebrationMemories ?? []}
          expanded={showMemoriesDetail}
          onToggleMemories={() => setShowMemoriesDetail((current) => !current)}
        />

        <FamilyStatsCard
          familyGoal={familyGoal}
          members={members}
          individualGoals={individualGoals}
          showPersonalGoalsDetail={showPersonalGoalsDetail}
          onTogglePersonalGoals={() =>
            setShowPersonalGoalsDetail((current) => !current)
          }
          onAddPersonalGoal={() =>
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
              formMode === "edit"
                ? "Familiedoel aanpassen"
                : "Familiedoel maken"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <FamilyGoalForm
              familyGoal={formMode === "edit" ? familyGoal : undefined}
              error={formError}
              onAnnuleren={() => {
                setFormMode("closed");
                setFormError(null);
              }}
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
          </section>
        </div>
      ) : null}

      {showMemoriesDetail ? (
        <CelebrationMemorySection
          memories={snapshot.celebrationMemories ?? []}
          expanded
          onToggle={() => setShowMemoriesDetail(false)}
        />
      ) : null}

      {showPersonalGoalsDetail || individualFormGoal ? (
        <section
          className="individual-goals compact-overview-section"
          aria-label="Persoonlijke aanmoedigingsdoelen"
        >
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Persoonlijke doelen</p>
              <h3>Persoonlijke doelen deze week</h3>
              <p className="motivation-copy">
                {individualGoals.length} actief ·{" "}
                {personalGoalSummary(individualGoals)}
              </p>
            </div>
          </div>
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
                        ? await updateIndividualGoal(
                            individualFormGoal.id,
                            values,
                          )
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
          <div className="individual-goal-grid">
            {individualGoals.length === 0 ? (
              <p className="motivation-copy">Nog geen persoonlijke doelen.</p>
            ) : null}
            {(showPersonalGoalsDetail
              ? individualGoals
              : individualGoals.slice(0, 2)
            ).map((goal) => {
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
                    {showPersonalGoalsDetail ? (
                      <button
                        type="button"
                        className="secondary-action compact-action"
                        onClick={() => setIndividualFormGoal(goal)}
                      >
                        Aanpassen
                      </button>
                    ) : null}
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
        </section>
      ) : null}
    </section>
  );
}

function UpcomingCelebrationsCard({
  familyGoal,
  memories,
  expanded,
  onToggleMemories,
}: {
  familyGoal?: MotivationFamilyGoal;
  memories: readonly MotivationCelebrationMemory[];
  expanded: boolean;
  onToggleMemories: () => void;
}) {
  const celebration = familyGoal?.celebration;
  const items = [
    celebration
      ? {
          title: celebration.title,
          label:
            celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
              ? "Klaar om te vieren"
              : celebration.status === FamilyCelebrationStatus.Celebrated
                ? "Net gevierd"
                : "Komt eraan",
          icon:
            celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
              ? "celebrationReady"
              : celebration.status === FamilyCelebrationStatus.Celebrated
                ? "celebrationCelebrated"
                : "celebrationUpcoming",
        }
      : undefined,
    ...memories.slice(0, 1).map((memory) => ({
      title: memory.title,
      label: "Mooie herinnering",
      icon: "celebrationMemory",
    })),
  ].filter(Boolean) as {
    title: string;
    label: string;
    icon: HomeOpsIconName;
  }[];

  return (
    <section
      className="motivation-dashboard-card celebration-mini-card"
      aria-label="Aankomende vieringen"
    >
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Vieringen</p>
          <h3>Aankomende momenten</h3>
        </div>
        <HomeOpsIcon name="celebrationUpcoming" variant="spot" />
      </div>
      <div className="celebration-mini-list">
        {items.length === 0 ? (
          <p className="motivation-copy">
            Kies een viering bij het familiedoel.
          </p>
        ) : null}
        {items.map((item) => (
          <article
            className="celebration-mini-item"
            key={`${item.label}-${item.title}`}
          >
            <HomeOpsIcon name={item.icon} />
            <div>
              <strong>{item.title}</strong>
              <span>{item.label}</span>
            </div>
          </article>
        ))}
      </div>
      {memories.length > 0 ? (
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onToggleMemories}
        >
          <HomeOpsIcon name="celebrationMemory" />
          {expanded ? "Historie sluiten" : "Historie bekijken"}
        </button>
      ) : null}
    </section>
  );
}

function FamilyStatsCard({
  familyGoal,
  members,
  individualGoals,
  showPersonalGoalsDetail,
  onTogglePersonalGoals,
  onAddPersonalGoal,
}: {
  familyGoal?: MotivationFamilyGoal;
  members: readonly FamilyMember[];
  individualGoals: readonly MotivationIndividualGoal[];
  showPersonalGoalsDetail: boolean;
  onTogglePersonalGoals: () => void;
  onAddPersonalGoal: () => void;
}) {
  const progress = familyGoal
    ? clampProgress(familyGoal.currentProgress, familyGoal.targetCount)
    : 0;
  const stats = [
    { label: "Helpacties", value: familyGoal?.currentProgress ?? 0 },
    { label: "Gezinsleden", value: members.length },
    { label: "Persoonlijke doelen", value: individualGoals.length },
    { label: "Voortgang", value: `${progress}%` },
  ];
  return (
    <section
      className="motivation-dashboard-card family-stats-card"
      aria-label="Gezinsstatistieken"
    >
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Statistieken</p>
          <h3>In één oogopslag</h3>
        </div>
        <HomeOpsIcon name="childMyProgress" variant="spot" />
      </div>
      <div className="family-stat-grid">
        {stats.map((stat) => (
          <div className="family-stat-tile" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="family-stat-actions familyboard-card-actions">
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onTogglePersonalGoals}
        >
          <HomeOpsIcon name="childMyProgress" />
          {showPersonalGoalsDetail ? "Doelen sluiten" : "Doelen beheren"}
        </button>
        <button
          type="button"
          className="secondary-action compact-action familyboard-card-action"
          onClick={onAddPersonalGoal}
        >
          <HomeOpsIcon name="add" />
          Doel toevoegen
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
          placeholder="Read books"
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
          placeholder="books"
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

function FamilyCelebrationDisplay({
  familyGoal,
  onCelebrated,
}: {
  familyGoal: MotivationFamilyGoal;
  onCelebrated: (goal: MotivationFamilyGoal) => void;
}) {
  const [saving, setSaving] = useState(false);
  const celebration = familyGoal.celebration;
  if (!celebration) return null;

  const remaining = Math.max(
    0,
    familyGoal.targetCount - familyGoal.currentProgress,
  );
  const label =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? "Gelukt — klaar om te vieren"
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "Samen gevierd"
        : "Straks als we klaar zijn";
  const message =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? `${celebration.title} staat nu klaar.`
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "Samen gevierd."
        : remaining === 1
          ? `Nog 1 ${familyGoal.unitLabel} tot ${celebration.title}.`
          : `Nog ${remaining} ${familyGoal.unitLabel} tot ${celebration.title}.`;
  const statusClass =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? "ready"
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "celebrated"
        : "planned";

  return (
    <div
      className={`celebration-surface ${statusClass}`}
      aria-label="Celebration surface"
    >
      <HomeOpsIcon
        className="celebration-surface-icon"
        name={
          statusClass === "ready"
            ? "celebrationReady"
            : statusClass === "celebrated"
              ? "celebrationCelebrated"
              : "celebrationUpcoming"
        }
        variant={statusClass === "ready" ? "hero" : "spot"}
      />
      <div>
        <p className="eyebrow">{label}</p>
        <h4>{celebration.title}</h4>
        <p>{message}</p>
        {celebration.description ? (
          <span>{celebration.description}</span>
        ) : null}
      </div>
      {celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ? (
        <button
          type="button"
          className="secondary-action compact-action"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              onCelebrated(await markFamilyGoalCelebrated(familyGoal.id));
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Opslaan…" : "Als gevierd markeren"}
        </button>
      ) : null}
    </div>
  );
}

interface FamilyGoalFormProps {
  familyGoal?: MotivationFamilyGoal;
  error: string | null;
  onAnnuleren: () => void;
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
    familyGoal?.unitLabel ?? "helpful tasks",
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
        familyGoal ? "Familiedoel aanpassen form" : "Familiedoel maken form"
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
              placeholder="Movie night together"
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

function CelebrationMemorySection({
  memories,
  expanded,
  onToggle,
}: {
  memories: readonly MotivationCelebrationMemory[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (memories.length === 0) return null;
  return (
    <section
      className="celebration-memory-section"
      aria-label="Celebration memories"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Familieherinneringen</p>
          <h3>Vieringen die we onthouden</h3>
        </div>
        <div className="overview-actions">
          <span>{memories.length} remembered</span>
          <button
            type="button"
            className="secondary-action compact-action"
            onClick={onToggle}
          >
            {expanded ? "Recente herinnering tonen" : "Geschiedenis bekijken"}
          </button>
        </div>
      </div>
      <div className="celebration-memory-grid">
        {(expanded ? memories : memories.slice(0, 1)).map((memory) => (
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
