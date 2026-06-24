import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { FamilyAvatar } from "./home/FamilyAvatar";
import { HelpfulMomentsSection } from "./HelpfulMoments";
import { HomeOpsIcon } from "./icons/homeOpsIcons";
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
    <section className="motivation-page" aria-label="Motivation page">
      <header className="motivation-header">
        <p className="widget-type">Motivation</p>
        <h3>Family goals</h3>
        <p>Progress, appreciation, and celebrations.</p>
      </header>

      <article className="family-goal-card" aria-label="Active family goal">
        {!familyGoal ? (
          <div className="empty-state-card page-empty-state">
            <p className="eyebrow">
              {status === "error" ? "Motivation is unavailable" : "Family goal"}
            </p>
            <h3>No family goal yet.</h3>
            <p>Create one shared goal.</p>
            <button type="button" onClick={() => setFormMode("create")}>
              Create family goal
            </button>
          </div>
        ) : (
          <>
            <div>
              <HomeOpsIcon
                className="motivation-ownership-asset"
                name="childFamilyParticipation"
                variant="spot"
              />
              <p className="eyebrow">Family goal</p>
              <h3>{familyGoal.title}</h3>
              <p className="motivation-copy">
                {familyGoalAnticipationMessage(familyGoal)}
              </p>
              <FamilyCelebrationDisplay
                familyGoal={familyGoal}
                onCelebrated={handleFormSaved}
              />
              <button
                type="button"
                className="secondary-action"
                onClick={() => setFormMode("edit")}
              >
                Edit family goal
              </button>
            </div>
            <div
              className="family-progress"
              aria-label={`${familyGoal.currentProgress} of ${familyGoal.targetCount} ${familyGoal.unitLabel}`}
            >
              <strong>
                {familyGoal.currentProgress}/{familyGoal.targetCount}
              </strong>
              <span>{familyGoal.unitLabel}</span>
              <div className="progress-bar">
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>
          </>
        )}
      </article>

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
              formMode === "edit" ? "Edit family goal" : "Create family goal"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <FamilyGoalForm
              familyGoal={formMode === "edit" ? familyGoal : undefined}
              error={formError}
              onCancel={() => {
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
                    "We could not save this family goal. Please try again.",
                  );
                }
              }}
            />
          </section>
        </div>
      ) : null}

      <CelebrationMemorySection
        memories={snapshot.celebrationMemories ?? []}
        expanded={showMemoriesDetail}
        onToggle={() => setShowMemoriesDetail((current) => !current)}
      />

      <HelpfulMomentsSection
        members={members}
        showCreate
        compact
        title="Things My Family Appreciates"
      />

      <section
        className="individual-goals compact-overview-section"
        aria-label="Individual encouragement goals"
      >
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Personal goals</p>
            <h3>Personal goals this week</h3>
            <p className="motivation-copy">
              {individualGoals.length} active{" "}
              {individualGoals.length === 1 ? "goal" : "goals"} ·{" "}
              {personalGoalSummary(individualGoals)}
            </p>
          </div>
          <div className="overview-actions">
            <button
              type="button"
              className="secondary-action"
              onClick={() => setShowPersonalGoalsDetail((current) => !current)}
            >
              {showPersonalGoalsDetail
                ? "Show preview"
                : "Manage personal goals"}
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setIndividualFormGoal({
                  id: "",
                  familyMemberId: members[0]?.id ?? "",
                  familyMemberName: members[0]?.name ?? "",
                  title: "",
                  targetCount: 4,
                  currentProgress: 0,
                  unitLabel: "times",
                  visualKind: "stars",
                })
              }
            >
              Add personal goal
            </button>
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
                  ? "Edit personal goal"
                  : "Create personal goal"
              }
              onClick={(event) => event.stopPropagation()}
            >
              <IndividualGoalForm
                goal={individualFormGoal.id ? individualFormGoal : undefined}
                members={members}
                error={formError}
                onCancel={() => {
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
                            "We could not retire this goal. Please try again.",
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
                      "We could not save this personal goal. Please try again.",
                    );
                  }
                }}
              />
            </section>
          </div>
        ) : null}
        <div className="individual-goal-grid">
          {individualGoals.length === 0 ? (
            <p className="motivation-copy">No personal goals yet.</p>
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
                      Edit
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
                    ? `${goal.targetCount - goal.currentProgress} to go — keep cheering each other on.`
                    : "Goal reached — celebrate the routine!"}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function personalGoalSummary(goals: readonly MotivationIndividualGoal[]) {
  if (goals.length === 0) return "ready when your family adds one.";
  const complete = goals.filter(
    (goal) => goal.currentProgress >= goal.targetCount,
  ).length;
  const totalRemaining = goals.reduce(
    (sum, goal) => sum + Math.max(0, goal.targetCount - goal.currentProgress),
    0,
  );
  if (complete === goals.length) return "all goals reached.";
  return `${totalRemaining} steps left across the family.`;
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
      ? `${celebrationTitle} is ready.`
      : "Family goal complete.";
  }
  if (celebrationTitle) {
    return remaining === 1
      ? `Only 1 more ${familyGoal.unitLabel} until ${celebrationTitle}.`
      : `Only ${remaining} more ${familyGoal.unitLabel} until ${celebrationTitle}.`;
  }
  return `${remaining} more ${familyGoal.unitLabel} to reach this family goal.`;
}

interface IndividualGoalFormProps {
  goal?: MotivationIndividualGoal;
  members: readonly FamilyMember[];
  error: string | null;
  onCancel: () => void;
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
  onCancel,
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
  const [unitLabel, setUnitLabel] = useState(goal?.unitLabel ?? "times");
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
        goal ? "Edit individual goal form" : "Create individual goal form"
      }
      onSubmit={handleSubmit}
    >
      <div>
        <p className="eyebrow">Personal goal</p>
        <h3>{goal ? "Edit personal goal" : "Add personal goal"}</h3>
        <p className="motivation-copy">
          Choose one family member and one simple target.
        </p>
      </div>
      <label>
        Family member
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
        Goal title
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
        Target count
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
        Unit label
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
          {saving ? "Saving…" : "Save personal goal"}
        </button>
        {onArchive ? (
          <button
            type="button"
            className="secondary-action"
            onClick={onArchive}
          >
            Retire goal
          </button>
        ) : null}
        <button type="button" onClick={onCancel}>
          Cancel
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
      ? "We did it — ready to celebrate"
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "Celebrated together"
        : "Coming up when we finish";
  const message =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
      ? `${celebration.title} is ready now.`
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "Celebrated together."
        : remaining === 1
          ? `Only 1 more ${familyGoal.unitLabel} until ${celebration.title}.`
          : `Only ${remaining} more ${familyGoal.unitLabel} until ${celebration.title}.`;
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
          {saving ? "Saving…" : "Mark celebrated"}
        </button>
      ) : null}
    </div>
  );
}

interface FamilyGoalFormProps {
  familyGoal?: MotivationFamilyGoal;
  error: string | null;
  onCancel: () => void;
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
  onCancel,
  onSubmit,
}: FamilyGoalFormProps) {
  const [step, setStep] = useState<"title" | "progress" | "celebration" | "review">("title");
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
  const actionLabel = familyGoal ? "Save goal" : "Create goal";

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
        familyGoal ? "Edit family goal form" : "Create family goal form"
      }
      onSubmit={handleSubmit}
    >
      <div>
        <p className="eyebrow">
          {familyGoal ? "Tune the family plan" : "Start a family plan"}
        </p>
        <h3>{familyGoal ? "Edit family goal" : "Create a family goal"}</h3>
        <p className="motivation-copy">
          {familyGoal
            ? "We’ll keep the progress your family has already earned."
            : "Let’s pick one thing everyone can cheer for together."}
        </p>
      </div>

      {step === "title" ? (
        <section className="dialog-question" aria-label="Family goal title question">
          <h4>What are we working toward?</h4>
          <p className="motivation-copy">
            Keep it short enough that everyone knows what we’re cheering on.
          </p>
          <label>
            Family goal title
            <input
              autoFocus
              value={title}
              maxLength={240}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Complete helpful household tasks"
              required
            />
          </label>
        </section>
      ) : null}

      {step === "progress" ? (
        <section className="dialog-question" aria-label="Family goal progress">
          <h4>How will we know we made progress?</h4>
          <p className="motivation-copy">
            Choose a clear number and the words your family will count.
          </p>
          <div className="conversation-field-row">
            <label>
              Target count
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
              Progress label
              <input
                value={unitLabel}
                maxLength={80}
                onChange={(event) => setUnitLabel(event.target.value)}
                placeholder="helpful tasks"
                required
              />
            </label>
          </div>
          {!hasValidProgress ? (
            <p className="form-error">Use a target from 1 to 999 and a progress label.</p>
          ) : null}
        </section>
      ) : null}

      {step === "celebration" ? (
        <section className="dialog-question" aria-label="Family goal celebration">
          <h4>What should we look forward to?</h4>
          <p className="motivation-copy">
            Add a celebration now, or skip it and decide later.
          </p>
          <label>
            Family celebration title, optional
            <input
              autoFocus
              value={celebrationTitle}
              maxLength={240}
              onChange={(event) => setCelebrationTitle(event.target.value)}
              placeholder="Movie night together"
            />
          </label>
          <label>
            Celebration description, optional
            <input
              value={celebrationDescription}
              maxLength={500}
              onChange={(event) => setCelebrationDescription(event.target.value)}
              placeholder="Choose a movie and make popcorn together"
            />
          </label>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="dialog-question goal-review" aria-label="Family goal review">
          <h4>Does this feel right?</h4>
          <dl>
            <div>
              <dt>Goal</dt>
              <dd>{title.trim()}</dd>
            </div>
            <div>
              <dt>Progress target</dt>
              <dd>
                {parsedTarget} {unitLabel.trim()}
              </dd>
            </div>
            <div>
              <dt>Celebration</dt>
              <dd>
                {celebrationTitle.trim()
                  ? `${celebrationTitle.trim()}${
                      celebrationDescription.trim()
                        ? ` — ${celebrationDescription.trim()}`
                        : ""
                    }`
                  : "No celebration yet — we can add one later."}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        {step !== "title" ? (
          <button type="button" className="secondary-action" onClick={goBack}>
            Back
          </button>
        ) : null}
        {step === "title" ? (
          <button
            type="button"
            disabled={!hasValidTitle}
            onClick={() => setStep("progress")}
          >
            Continue
          </button>
        ) : null}
        {step === "progress" ? (
          <button
            type="button"
            disabled={!hasValidProgress}
            onClick={() => setStep("celebration")}
          >
            Continue
          </button>
        ) : null}
        {step === "celebration" ? (
          <button type="button" onClick={() => setStep("review")}>
            Continue
          </button>
        ) : null}
        {step === "review" ? (
          <button type="submit" disabled={saving || !hasValidTitle || !hasValidProgress}>
            {saving ? "Saving…" : actionLabel}
          </button>
        ) : null}
        <button type="button" onClick={onCancel}>
          Cancel
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
          <p className="eyebrow">Family memories</p>
          <h3>Celebrations we remember</h3>
        </div>
        <div className="overview-actions">
          <span>{memories.length} remembered</span>
          <button
            type="button"
            className="secondary-action compact-action"
            onClick={onToggle}
          >
            {expanded ? "Show recent memory" : "View memory history"}
          </button>
        </div>
      </div>
      <div className="celebration-memory-grid">
        {(expanded ? memories : memories.slice(0, 1)).map((memory) => (
          <article
            className="celebration-memory-card"
            key={`${memory.familyGoalId}-${memory.celebratedUtc}`}
          >
            <HomeOpsIcon name="memory" variant="keepsake" />
            <div>
              <h4>{memory.title}</h4>
              <p>
                <HomeOpsIcon name="childMyHelpMattered" /> We made this happen
                together.
              </p>
              {memory.description ? <small>{memory.description}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
