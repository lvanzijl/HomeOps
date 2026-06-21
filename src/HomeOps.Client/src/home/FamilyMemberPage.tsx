import { HelpfulMomentsSection } from "../HelpfulMoments";
import { loadTasks } from "../tasks/tasksApi";
import type { HouseholdTask } from "../tasks/tasksModel";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { FamilyCelebrationStatus } from "../api/homeOpsApiClient";
import {
  clampProgress,
  goalsForMembers,
  loadMotivationSnapshot,
  type MotivationCelebrationMemory,
  type MotivationFamilyGoal,
  type MotivationIndividualGoal,
  type MotivationSnapshot,
} from "../motivationData";
import { FamilyAvatar } from "./FamilyAvatar";
import { FamilyAvatarEditor } from "./FamilyAvatarEditor";
import type { FamilyMember, FamilyMemberKind } from "./familyMembers";

interface FamilyMemberPageProps {
  member: FamilyMember;
  onBack: () => void;
  onChange: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
}

export function FamilyMemberPage({
  member,
  onBack,
  onChange,
  onRemove,
}: FamilyMemberPageProps) {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [draft, setDraft] = useState(member);
  const [status, setStatus] = useState<string | null>(null);
  const [motivationStatus, setMotivationStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [activeMode, setActiveMode] = useState<"child" | "parent">(
    member.memberKind === "child" ? "child" : "parent",
  );
  const [motivationSnapshot, setMotivationSnapshot] =
    useState<MotivationSnapshot>({ individualGoals: [] });
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [tasksStatus, setTasksStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");

  useEffect(() => {
    setDraft(member);
    setActiveMode(member.memberKind === "child" ? "child" : "parent");
  }, [member]);

  useEffect(() => {
    let ignore = false;
    setMotivationStatus("loading");
    loadMotivationSnapshot()
      .then((snapshot) => {
        if (!ignore) {
          setMotivationSnapshot(snapshot);
          setMotivationStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) setMotivationStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setTasksStatus("loading");
    loadTasks()
      .then((loadedTasks) => {
        if (!ignore) {
          setTasks(loadedTasks);
          setTasksStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) setTasksStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.memberKind === "child" && !draft.dateOfBirth) {
      setStatus("Date of birth is required for children.");
      return;
    }
    onChange({
      ...draft,
      dateOfBirth:
        draft.memberKind === "adult"
          ? draft.dateOfBirth || null
          : draft.dateOfBirth,
    });
    setStatus("Saved member details.");
  }

  function requestRemove() {
    if (
      window.confirm(
        `Remove ${member.name} from normal household lists? Existing task and motivation references are kept.`,
      )
    )
      onRemove(member);
  }

  const age = calculateAge(member.dateOfBirth);
  const ageBand =
    member.memberKind === "child" && age !== null && age <= 5
      ? "early-child"
      : "school-age";
  const memberGoals = goalsForMembers(motivationSnapshot, [member]);

  return (
    <section
      className="family-member-page"
      aria-label={`${member.name} family member page`}
    >
      <button className="back-link" type="button" onClick={onBack}>
        ← Back to Home
      </button>
      <header
        className="family-member-hero child-progress-hero"
        style={{ "--member-color": member.displayColor } as CSSProperties}
      >
        <div className="family-member-hero-avatar">
          <FamilyAvatar member={member} size="large" />
        </div>
        <div>
          <p className="eyebrow">
            {member.memberKind === "child"
              ? "My page"
              : "Household member"}
          </p>
          <h2>{member.name}</h2>
          <p>{ageContext(member, age)}</p>
          {member.memberKind === "child" ? (
            <p className="child-mode-question">What is next?</p>
          ) : null}
        </div>
      </header>

      {member.memberKind === "child" ? (
        <div className="member-mode-shell">
          {activeMode === "child" ? (
            <section
              className={`child-progress-view child-mode ${ageBand}`}
              aria-label={`${member.name} Child Mode`}
            >
              <ChildHeroArea
                member={member}
                goals={memberGoals}
                familyGoal={motivationSnapshot.familyGoal}
                status={motivationStatus}
                ageBand={ageBand}
              />
              <TodaySection
                member={member}
                tasks={tasks}
                status={tasksStatus}
              />
              <IndividualGoalProgress
                goals={memberGoals}
                ageBand={ageBand}
                member={member}
              />
              <FamilyGoalParticipation
                familyGoal={motivationSnapshot.familyGoal}
                status={motivationStatus}
                ageBand={ageBand}
              />
              <ChildCelebrationMemories memories={motivationSnapshot.celebrationMemories ?? []} ageBand={ageBand} />
              <HelpfulMomentsSection
                members={[member]}
                familyMemberId={member.id}
                title="Things My Family Appreciates"
              />
            </section>
          ) : (
            <ParentAdministration
              member={member}
              draft={draft}
              setDraft={setDraft}
              status={status}
              submit={submit}
              requestRemove={requestRemove}
              onEditAvatar={() => setIsEditingAvatar(true)}
            />
          )}
          <div
            className="member-mode-switch"
            role="tablist"
            aria-label="Family member page mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "child"}
              className={activeMode === "child" ? "active" : ""}
              onClick={() => setActiveMode("child")}
            >
              Child Mode
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "parent"}
              className={activeMode === "parent" ? "active" : ""}
              onClick={() => setActiveMode("parent")}
            >
              Parent Mode
            </button>
          </div>
        </div>
      ) : (
        <>
          <HelpfulMomentsSection
            members={[member]}
            familyMemberId={member.id}
            title="Things My Family Appreciates"
          />
          <ParentAdministration
            member={member}
            draft={draft}
            setDraft={setDraft}
            status={status}
            submit={submit}
            requestRemove={requestRemove}
            onEditAvatar={() => setIsEditingAvatar(true)}
          />
        </>
      )}

      {isEditingAvatar ? (
        <FamilyAvatarEditor
          member={member}
          onChange={onChange}
          onClose={() => setIsEditingAvatar(false)}
        />
      ) : null}
    </section>
  );
}

function ParentAdministration({
  member,
  draft,
  setDraft,
  status,
  submit,
  requestRemove,
  onEditAvatar,
}: {
  member: FamilyMember;
  draft: FamilyMember;
  setDraft: (member: FamilyMember) => void;
  status: string | null;
  submit: (event: FormEvent) => void;
  requestRemove: () => void;
  onEditAvatar: () => void;
}) {
  return (
    <section
      className="parent-administration"
      aria-label="Parent administration"
    >
      <div className="parent-administration-intro">
        <div>
          <p className="eyebrow">Parent Mode</p>
          <h3>Administration</h3>
          <p>
            Edit household records, avatar setup, and management details here so
            the child experience can stay encouraging first.
          </p>
        </div>
        <button type="button" onClick={onEditAvatar}>
          Edit avatar
        </button>
      </div>
      <div className="family-member-detail-grid parent-administration-grid">
        <article className="family-member-detail-card">
          <h3>Edit member</h3>
          <form className="family-member-form" onSubmit={submit}>
            <label>
              Name
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    name: event.target.value,
                    initials: buildInitials(event.target.value),
                  })
                }
                required
              />
            </label>
            <label>
              Member type
              <select
                value={draft.memberKind}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    memberKind: event.target.value as FamilyMemberKind,
                    avatar: draft.avatar
                      ? {
                          ...draft.avatar,
                          ageGroup: event.target.value as FamilyMemberKind,
                        }
                      : draft.avatar,
                  })
                }
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={draft.dateOfBirth ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    dateOfBirth: event.target.value || null,
                  })
                }
                aria-required={draft.memberKind === "child"}
              />
            </label>
            <label>
              Display color
              <input
                type="color"
                value={draft.displayColor}
                onChange={(event) =>
                  setDraft({ ...draft, displayColor: event.target.value })
                }
              />
            </label>
            <div className="family-member-actions">
              <button type="submit">Save details</button>
              <button
                className="danger-button"
                type="button"
                onClick={requestRemove}
              >
                Remove member
              </button>
            </div>
            {status ? <p role="status">{status}</p> : null}
          </form>
        </article>
        <article className="family-member-detail-card">
          <h3>Member details</h3>
          <dl className="family-member-detail-list">
            <div>
              <dt>Name</dt>
              <dd>{member.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{member.memberKind}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{member.dateOfBirth ?? "Not set"}</dd>
            </div>
            <div>
              <dt>Initials</dt>
              <dd>{member.initials}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>
                <span
                  className="color-swatch"
                  style={{ background: member.displayColor }}
                  aria-hidden="true"
                />
                {member.displayColor}
              </dd>
            </div>
          </dl>
        </article>
        <article className="family-member-detail-card">
          <h3>Current avatar configuration</h3>
          {member.avatar ? (
            <dl className="family-member-detail-list">
              <div>
                <dt>Age group</dt>
                <dd>{member.avatar.ageGroup}</dd>
              </div>
              <div>
                <dt>Presentation</dt>
                <dd>{member.avatar.presentation}</dd>
              </div>
              <div>
                <dt>Skin tone</dt>
                <dd>{member.avatar.skinTone}</dd>
              </div>
              <div>
                <dt>Hair</dt>
                <dd>
                  {member.avatar.hairStyle} · {member.avatar.hairColor}
                </dd>
              </div>
              <div>
                <dt>Glasses</dt>
                <dd>{member.avatar.glasses ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Shirt color</dt>
                <dd>{member.avatar.shirtColor}</dd>
              </div>
            </dl>
          ) : (
            <p>
              No avatar configuration yet. Initials are used as the fallback.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

function ChildHeroArea({
  member,
  goals,
  familyGoal,
  status,
  ageBand,
}: {
  member: FamilyMember;
  goals: readonly MotivationIndividualGoal[];
  familyGoal?: MotivationFamilyGoal;
  status: "loading" | "ready" | "error";
  ageBand: "early-child" | "school-age";
}) {
  const primaryGoal = goals[0];
  const progressGoal = primaryGoal ?? familyGoal;
  const percent = progressGoal
    ? clampProgress(progressGoal.currentProgress, progressGoal.targetCount)
    : 0;
  const remaining = progressGoal
    ? Math.max(0, progressGoal.targetCount - progressGoal.currentProgress)
    : 0;
  const celebration = familyGoal?.celebration;
  const celebrationComplete = familyGoal
    ? familyGoal.currentProgress >= familyGoal.targetCount
    : false;
  const celebrationStatus = celebration
    ? celebration.status === FamilyCelebrationStatus.Celebrated
      ? "Celebrated together"
      : celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
          celebrationComplete
        ? "We did it — ready to celebrate"
        : "When we finish"
    : undefined;

  return (
    <section
      className={`child-hero-area ${ageBand}`}
      aria-label="Child hero area"
      style={{ "--member-color": member.displayColor } as CSSProperties}
    >
      <div className="child-hero-identity" aria-label="Who I am">
        <FamilyAvatar member={member} size="large" />
        <div>
          <p className="eyebrow">This is me</p>
          <h3>{member.name}</h3>
          <p>My jobs and goals</p>
        </div>
      </div>

      <div className="child-hero-main" aria-label="Current goal and progress">
        <p className="eyebrow">My goal</p>
        <h2>
          {primaryGoal?.title ?? familyGoal?.title ?? "A new goal is coming"}
        </h2>
        {progressGoal ? (
          <>
            <div className="hero-progress-visual" aria-label="Hero progress">
              <div
                className="hero-progress-ring"
                style={{ "--progress": `${percent}%` } as CSSProperties}
              >
                <strong>{percent}%</strong>
                <span>done</span>
              </div>
              <div>
                <p className="hero-progress-copy">
                  {remaining > 0
                    ? childAnticipationMessage(progressGoal, familyGoal)
                    : "Goal done!"}
                </p>
                {ageBand === "school-age" ? (
                  <p className="hero-progress-detail">
                    {progressGoal.currentProgress} of {progressGoal.targetCount}{" "}
                    {progressGoal.unitLabel} complete
                  </p>
                ) : null}
              </div>
            </div>
            <div
              className="progress-bar hero-progress-bar"
              aria-label={`${progressGoal.currentProgress} of ${progressGoal.targetCount} ${progressGoal.unitLabel}`}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          </>
        ) : (
          <p className="hero-progress-copy">
            {status === "loading"
              ? "Finding today’s encouraging progress…"
              : "A grown-up can add a goal."}
          </p>
        )}
      </div>

      <aside
        className="child-hero-family"
        aria-label="Family goal"
      >
        <p className="eyebrow">Family Goal</p>
        {familyGoal ? (
          <>
            <h4>{familyGoal.title}</h4>
            <p>
              You helped. The family is getting closer.
            </p>
            <strong>
              {familyGoal.currentProgress}/{familyGoal.targetCount}{" "}
              {familyGoal.unitLabel} together
            </strong>
          </>
        ) : (
          <p>No family goal yet.</p>
        )}
        {celebration ? (
          <div
            className={`child-hero-celebration ${celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || celebrationComplete ? "ready" : celebration.status === FamilyCelebrationStatus.Celebrated ? "celebrated" : "planned"}`}
            aria-label="Hero celebration"
          >
            <span aria-hidden="true">🎉</span>
            <div>
              <p className="eyebrow">{celebrationStatus}</p>
              <strong>{celebration.title}</strong>
              <p>
                {celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || celebrationComplete
                  ? `We did it — ${celebration.title} is ready now.`
                  : celebration.status === FamilyCelebrationStatus.Celebrated
                    ? "We celebrated together."
                    : familyGoal
                      ? `${celebration.title} is getting closer.`
                      : "This is what your family is working toward."}
              </p>
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function childAnticipationMessage(progressGoal: MotivationIndividualGoal | MotivationFamilyGoal, familyGoal?: MotivationFamilyGoal) {
  const remaining = Math.max(0, progressGoal.targetCount - progressGoal.currentProgress);
  const celebration = familyGoal?.celebration;
  if (celebration && familyGoal && familyGoal.currentProgress < familyGoal.targetCount) {
    const familyRemaining = familyGoal.targetCount - familyGoal.currentProgress;
    return `${familyRemaining === 1 ? "Only 1 more" : `Only ${familyRemaining} more`} ${familyGoal.unitLabel} until ${celebration.title}.`;
  }
  return `${remaining} ${progressGoal.unitLabel} to go.`;
}

function TodaySection({
  member,
  tasks,
  status,
}: {
  member: FamilyMember;
  tasks: readonly HouseholdTask[];
  status: "loading" | "ready" | "error";
}) {
  const childTasks = tasks
    .filter(
      (task) =>
        !task.isCompleted &&
        task.noDateReviewState !== 'NeedsReview' &&
        task.noDateReviewState !== 'Someday' &&
        task.noDateReviewState !== 'Archived' &&
        task.ownershipKind === "FamilyMember" &&
        task.familyMemberId === member.id,
    )
    .sort(
      (a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(
          b.dueDate ?? "9999-12-31",
        ) || a.createdUtc.localeCompare(b.createdUtc),
    );
  const visibleTasks = childTasks.slice(0, 3);
  const todayIso = new Date().toISOString().slice(0, 10);
  const dueTodayCount = childTasks.filter(
    (task) => task.dueDate === null || task.dueDate <= todayIso,
  ).length;

  return (
    <article
      className="child-progress-card child-journey-today"
      aria-label="Today"
    >
      <p className="eyebrow">Today</p>
      <h3>What should I do today?</h3>
      {status === "loading" ? <p>Finding your helpful jobs…</p> : null}
      {status === "error" ? (
        <p>Tasks are unavailable right now.</p>
      ) : null}
      {status === "ready" && childTasks.length === 0 ? (
        <p>
          No jobs right now. A grown-up can add one.
        </p>
      ) : null}
      {childTasks.length > 0 ? (
        <>
          <p className="child-journey-summary">
            {dueTodayCount > 0
              ? `${dueTodayCount} ${
                  dueTodayCount === 1 ? "thing" : "things"
                } to try today.`
              : `${childTasks.length} active ${
                  childTasks.length === 1 ? "task" : "tasks"
                } waiting for you.`}
          </p>
          <ul className="child-task-list">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>{task.title}</strong>
                  <p>{friendlyTaskDue(task)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}

function FamilyGoalParticipation({
  familyGoal,
  status,
  ageBand,
}: {
  familyGoal?: MotivationFamilyGoal;
  status: "loading" | "ready" | "error";
  ageBand: "early-child" | "school-age";
}) {
  if (status === "loading")
    return (
      <article className="child-progress-card">
        <p className="eyebrow">Family goal</p>
        <h3>Finding family goal…</h3>
      </article>
    );
  if (!familyGoal)
    return (
      <article className="child-progress-card">
        <p className="eyebrow">Family goal</p>
        <h3>
          {status === "error"
            ? "Family goal unavailable"
            : "No family goal yet"}
        </h3>
        <p>
          A grown-up can add one.
        </p>
      </article>
    );
  const percent = clampProgress(
    familyGoal.currentProgress,
    familyGoal.targetCount,
  );
  const remaining = Math.max(
    0,
    familyGoal.targetCount - familyGoal.currentProgress,
  );
  return (
    <article
      className="child-progress-card family-goal-participation"
      aria-label="Family goal participation"
    >
      <p className="eyebrow">Family Goal</p>
      <h3>{familyGoal.title}</h3>
      <p>
        {remaining > 0
          ? familyGoal.celebration
            ? `${remaining === 1 ? "Only 1 more" : `Only ${remaining} more`} ${familyGoal.unitLabel} until ${familyGoal.celebration.title}. You helped.`
            : `${remaining} more ${familyGoal.unitLabel} to go.`
          : "We did it together!"}
      </p>
      <div
        className="progress-bar"
        aria-label={`${familyGoal.currentProgress} of ${familyGoal.targetCount} ${familyGoal.unitLabel}`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <strong>
        {familyGoal.currentProgress}/{familyGoal.targetCount}{" "}
        {familyGoal.unitLabel}
      </strong>
      {familyGoal.celebration ? (
        <FamilyCelebrationCard familyGoal={familyGoal} ageBand={ageBand} />
      ) : null}
    </article>
  );
}

function FamilyCelebrationCard({
  familyGoal,
  ageBand,
}: {
  familyGoal: MotivationFamilyGoal;
  ageBand: "early-child" | "school-age";
}) {
  const celebration = familyGoal.celebration;
  if (!celebration) return null;
  const complete = familyGoal.currentProgress >= familyGoal.targetCount;
  const statusText =
    celebration.status === FamilyCelebrationStatus.Celebrated
      ? "Celebrated together"
      : celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
          complete
        ? "We did it — ready to celebrate"
        : "When we finish";
  const detail = celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || complete
    ? `${celebration.title} is ready now.`
    : celebration.status === FamilyCelebrationStatus.Celebrated
      ? "We celebrated together."
      : `Keep helping — ${celebration.title} is getting closer.`;
  const statusClass = celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || complete
    ? "ready"
    : celebration.status === FamilyCelebrationStatus.Celebrated
      ? "celebrated"
      : "planned";
  return (
    <aside
      className={`family-celebration-card ${statusClass}`}
      aria-label="Family celebration"
    >
      <span aria-hidden="true">{ageBand === "early-child" ? "🎉" : "✨"}</span>
      <div>
        <p className="eyebrow">{statusText}</p>
        <h4>{celebration.title}</h4>
        <p>
          {ageBand === "early-child"
            ? celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || complete
              ? "Ready now!"
              : "Getting closer."
            : detail}
        </p>
        {ageBand === "school-age" && celebration.description ? (
          <p>{celebration.description}</p>
        ) : null}
      </div>
    </aside>
  );
}

function ChildCelebrationMemories({
  memories,
  ageBand,
}: {
  memories: readonly MotivationCelebrationMemory[];
  ageBand: "early-child" | "school-age";
}) {
  const recent = memories.slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <article className="child-progress-card child-memory-card" aria-label="Celebration memories">
      <p className="eyebrow">Family Memories</p>
      <h3>{ageBand === "early-child" ? "We did it together" : "Celebrations we remember"}</h3>
      <p>We made these happen together.</p>
      <div className="child-memory-list">
        {recent.map((memory) => (
          <div key={`${memory.familyGoalId}-${memory.celebratedUtc}`}>
            <span aria-hidden="true">💛</span>
            <div>
              <strong>{memory.title}</strong>
              <p>We helped make this happen.</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function IndividualGoalProgress({
  goals,
  ageBand,
  member,
}: {
  goals: readonly MotivationIndividualGoal[];
  ageBand: "early-child" | "school-age";
  member: FamilyMember;
}) {
  return (
    <article className="child-progress-card" aria-label="This Week">
      <p className="eyebrow">This Week</p>
      <h3>
        {ageBand === "early-child"
          ? "Stars to collect"
          : "My progress"}
      </h3>
      {goals.length === 0 ? (
        <p>
          No personal goal right now. A grown-up can add one.
        </p>
      ) : null}
      <div className="child-goal-list">
        {goals.map((goal) => {
          const percent = clampProgress(goal.currentProgress, goal.targetCount);
          const remaining = Math.max(
            0,
            goal.targetCount - goal.currentProgress,
          );
          return (
            <section
              className="child-goal-card"
              key={goal.id}
              style={{ "--member-color": member.displayColor } as CSSProperties}
            >
              <h4>{goal.title}</h4>
              <div
                className="star-row"
                aria-label={`${goal.currentProgress} of ${goal.targetCount} ${goal.unitLabel}`}
              >
                {Array.from({ length: goal.targetCount }, (_, index) => (
                  <span
                    className={index < goal.currentProgress ? "filled" : ""}
                    key={index}
                    aria-hidden="true"
                  >
                    {index < goal.currentProgress ? "★" : "✓"}
                  </span>
                ))}
              </div>
              {ageBand === "school-age" ? (
                <div
                  className="progress-bar"
                  aria-label={`Progress for ${goal.title}`}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
              ) : null}
              <p>
                {remaining > 0
                  ? `${remaining} ${goal.unitLabel} to go. Keep going!`
                  : "Goal done!"}
              </p>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function friendlyTaskDue(task: HouseholdTask) {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (!task.dueDate) return "Ready when you are.";
  if (task.dueDate < todayIso) return "This one is waiting for you.";
  if (task.dueDate === todayIso) return "For today.";
  return `Coming up on ${task.dueDate}.`;
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function ageContext(member: FamilyMember, age: number | null) {
  if (member.memberKind !== "child")
    return "Family Members are household entities for shared home context. They are not users, login identities, profiles, or permission holders.";
  if (age === null)
    return "A simple progress view for this child.";
  if (age <= 5)
    return `${age} years old · stars and simple goals.`;
  if (age <= 12)
    return `${age} years old · goals and progress.`;
  return `${age} years old · goals and progress.`;
}

function buildInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "M";
}
