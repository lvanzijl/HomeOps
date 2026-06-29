import { HelpfulMomentsSection } from "../HelpfulMoments";
import { loadTasks } from "../tasks/tasksApi";
import type { HouseholdTask } from "../tasks/tasksModel";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { FamilyCelebrationStatus } from "../api/homeOpsApiClient";
import { HomeOpsIcon } from "../icons/homeOpsIcons";
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
import { useVisualReviewNow } from "../visualReviewTime";

interface FamilyMemberPageProps {
  member: FamilyMember;
  onAddFamilyMember?: () => void;
  onBack: () => void;
  onChange: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
}

export function FamilyMemberPage({
  member,
  onAddFamilyMember,
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
  const [motivationSnapshot, setMotivationSnapshot] =
    useState<MotivationSnapshot>({ individualGoals: [] });
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [tasksStatus, setTasksStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    setDraft(member);
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
      setStatus("Geboortedatum is verplicht voor kinderen.");
      return;
    }
    onChange({
      ...draft,
      dateOfBirth:
        draft.memberKind === "adult"
          ? draft.dateOfBirth || null
          : draft.dateOfBirth,
    });
    setStatus("Gegevens opgeslagen.");
  }

  function requestRemove() {
    if (
      window.confirm(
        `${member.name} uit het gezin verwijderen? Bestaande taak- en motivatieverwijzingen blijven bewaard.`,
      )
    )
      onRemove(member);
  }

  const visualReviewNow = useVisualReviewNow();
  const todayIso = (visualReviewNow ?? new Date()).toISOString().slice(0, 10);
  const age = calculateAge(member.dateOfBirth, visualReviewNow ?? undefined);
  const ageBand =
    member.memberKind === "child" && age !== null && age <= 5
      ? "early-child"
      : "school-age";
  const memberGoals = goalsForMembers(motivationSnapshot, [member]);

  return (
    <section
      className="family-member-page"
      aria-label={`${member.name} gezinslidpagina`}
    >
      <div className="page-header-with-actions family-member-page-heading">
        <div>
          <p className="eyebrow">Familie</p>
          <h1>
            {member.memberKind === "child"
              ? `Pagina van ${member.name}`
              : member.name}
          </h1>
        </div>
        <nav className="page-header-actions family-member-navigation" aria-label="Gezinslidnavigatie">
          <button className="compact-header-action" type="button" onClick={onBack}>
            <HomeOpsIcon name="arrowBack" />
            <span>Terug</span>
          </button>
        </nav>
      </div>
      <header
        className="family-member-hero family-member-identity-header"
        style={{ "--member-color": member.displayColor } as CSSProperties}
      >
        <div className="family-member-hero-avatar">
          <FamilyAvatar member={member} size="large" />
        </div>
        <div className="family-member-identity-copy">
          <p className="eyebrow">
            {member.memberKind === "child" ? "Mijn pagina" : "Gezinslid"}
          </p>
          <h2>{member.name}</h2>
          <p>{ageContext(member, age)}</p>
          <div className="family-member-header-actions">
            <button
              className="secondary-action compact-action"
              type="button"
              onClick={() => setIsEditingAvatar(true)}
            >
              Avatar bewerken
            </button>
          </div>
        </div>
      </header>

      {member.memberKind === "child" ? (
        <div className="member-mode-shell">
          <section
            className={`child-progress-view child-mode ${ageBand}`}
            aria-label={`${member.name} kindmodus`}
          >
            <TodaySection
              member={member}
              tasks={tasks}
              status={tasksStatus}
              todayIso={todayIso}
            />
            <HelpfulMomentsSection
              members={[member]}
              familyMemberId={member.id}
              title="Nieuwste waardering"
              compact
            />
            <ChildHeroArea
              member={member}
              goals={memberGoals}
              familyGoal={motivationSnapshot.familyGoal}
              status={motivationStatus}
              ageBand={ageBand}
            />
            <details className="child-detail-disclosure">
              <summary>Mijn voortgang bekijken</summary>
              <IndividualGoalProgress
                goals={memberGoals}
                ageBand={ageBand}
                member={member}
              />
            </details>
            <details className="child-detail-disclosure">
              <summary>Ons gezinsdoel bekijken</summary>
              <FamilyGoalParticipation
                familyGoal={motivationSnapshot.familyGoal}
                status={motivationStatus}
                ageBand={ageBand}
              />
            </details>
            <details className="child-detail-disclosure">
              <summary>Herinneringen bekijken</summary>
              <ChildCelebrationMemories
                memories={motivationSnapshot.celebrationMemories ?? []}
                ageBand={ageBand}
              />
            </details>
          </section>
          <details className="parent-admin-disclosure">
            <summary>Ouderinstellingen</summary>
            <ParentAdministration
              member={member}
              draft={draft}
              setDraft={setDraft}
              status={status}
              submit={submit}
              requestRemove={requestRemove}
              onAddFamilyMember={onAddFamilyMember}
            />
          </details>
        </div>
      ) : (
        <>
          <HelpfulMomentsSection
            members={[member]}
            familyMemberId={member.id}
            title="Wat mijn gezin waardeert"
          />
          <ParentAdministration
            member={member}
            draft={draft}
            setDraft={setDraft}
            status={status}
            submit={submit}
            requestRemove={requestRemove}
            onAddFamilyMember={onAddFamilyMember}
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
  onAddFamilyMember,
}: {
  member: FamilyMember;
  draft: FamilyMember;
  setDraft: (member: FamilyMember) => void;
  status: string | null;
  submit: (event: FormEvent) => void;
  requestRemove: () => void;
  onAddFamilyMember?: () => void;
}) {
  return (
    <section
      className="parent-administration"
      aria-label={`${member.name} instellingen voor volwassenen`}
    >
      <div className="parent-administration-intro">
        <div>
          <p className="eyebrow">Oudermodus</p>
          <h3>Instellingen voor {member.name}</h3>
          <p>Werk het profiel van {member.name} en gezinsopties bij.</p>
        </div>
      </div>

      <form className="parent-settings-form" onSubmit={submit}>
        <div className="family-member-detail-grid parent-administration-grid">
          <article className="family-member-detail-card parent-identity-card">
            <div className="parent-section-heading">
              <div>
                <p className="eyebrow">Identiteit</p>
                <h3>Uiterlijk</h3>
              </div>
            </div>
            <p className="parent-identity-note">
              De avatar blijft bovenaan deze pagina zichtbaar. Gebruik hier alleen
              de administratieve kleurinstelling.
            </p>
            <label className="family-member-color-field">
              Weergavekleur
              <input
                type="color"
                value={draft.displayColor}
                onChange={(event) =>
                  setDraft({ ...draft, displayColor: event.target.value })
                }
              />
            </label>
          </article>

          <article className="family-member-detail-card parent-basic-card">
            <div className="parent-section-heading">
              <div>
                <p className="eyebrow">Basisinformatie</p>
                <h3>Persoonlijke gegevens</h3>
              </div>
            </div>
            <div className="family-member-form">
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
                Volwassene / kind
                <select
                  value={draft.memberKind}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      memberKind: event.target.value as FamilyMemberKind,
                    })
                  }
                >
                  <option value="adult">Volwassene</option>
                  <option value="child">Kind</option>
                </select>
              </label>
              <label>
                Verjaardag
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
              <div className="family-member-actions parent-primary-actions">
                <button type="submit">Gegevens opslaan</button>
              </div>
              {status ? <p role="status">{status}</p> : null}
            </div>
          </article>
        </div>
      </form>

      <div className="parent-support-grid">
        <article className="family-member-detail-card parent-household-card">
          <div className="parent-section-heading">
            <div>
              <p className="eyebrow">Gezin</p>
              <h3>Gezin</h3>
              <p>Voeg iemand toe aan het gezin.</p>
            </div>
            {onAddFamilyMember ? (
              <button
                className="secondary-action compact-action"
                type="button"
                onClick={onAddFamilyMember}
              >
                <HomeOpsIcon name="add" />
                <span>Gezinslid toevoegen</span>
              </button>
            ) : null}
          </div>
        </article>

        <article className="family-member-detail-card parent-safety-card">
          <div className="parent-section-heading">
            <div>
              <p className="eyebrow">Veiligheid</p>
              <h3>Uit gezin verwijderen</h3>
              <p>Gebruik dit alleen wanneer {member.name} niet meer in het gezin moet verschijnen.</p>
            </div>
            <button
              className="danger-button compact-action"
              type="button"
              onClick={requestRemove}
            >
              Gezinslid verwijderen
            </button>
          </div>
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
      ? "Samen gevierd"
      : celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
          celebrationComplete
        ? "Gelukt — klaar om te vieren"
        : "Als we klaar zijn"
    : undefined;

  return (
    <section
      className={`child-hero-area ${ageBand}`}
      aria-label="Kindoverzicht"
      style={{ "--member-color": member.displayColor } as CSSProperties}
    >
      <div className="child-hero-main" aria-label="Huidig doel en voortgang">
        <p className="eyebrow">Hoe gaat het?</p>
        <h2>
          {primaryGoal?.title ?? familyGoal?.title ?? "Er komt een nieuw doel"}
        </h2>
        {progressGoal ? (
          <>
            <div className="hero-progress-visual" aria-label="Voortgang">
              <div
                className="hero-progress-ring"
                style={{ "--progress": `${percent}%` } as CSSProperties}
              >
                <strong>{percent}%</strong>
                <span>klaar</span>
              </div>
              <div>
                <p className="hero-progress-copy">
                  {remaining > 0
                    ? childAnticipationMessage(progressGoal, familyGoal)
                    : "Doel gehaald!"}
                </p>
                {ageBand === "school-age" ? (
                  <p className="hero-progress-detail">
                    {progressGoal.currentProgress} of {progressGoal.targetCount}{" "}
                    {progressGoal.unitLabel} afgerond
                  </p>
                ) : null}
              </div>
            </div>
            <div
              className="progress-bar hero-progress-bar"
              aria-label={`${progressGoal.currentProgress} van ${progressGoal.targetCount} ${progressGoal.unitLabel}`}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          </>
        ) : (
          <p className="hero-progress-copy">
            {status === "loading"
              ? "Voortgang voor vandaag ophalen…"
              : "Een volwassene kan een doel toevoegen."}
          </p>
        )}
      </div>

      <aside className="child-hero-family" aria-label="Family goal">
        <HomeOpsIcon
          className="child-section-asset"
          name="childFamilyParticipation"
          variant="group"
        />
        <p className="eyebrow">Gezinsdoel</p>
        {familyGoal ? (
          <>
            <h4>{familyGoal.title}</h4>
            <p>Hier werken we samen naartoe.</p>
            <strong>
              {familyGoal.currentProgress}/{familyGoal.targetCount}{" "}
              {familyGoal.unitLabel}
            </strong>
          </>
        ) : (
          <p>Nog geen gezinsdoel.</p>
        )}
        {celebration ? (
          <p className="child-family-cue" aria-label="Samenvatting gezinsviering">
            {celebrationStatus}: {celebration.title}
          </p>
        ) : null}
      </aside>
    </section>
  );
}

function childAnticipationMessage(
  progressGoal: MotivationIndividualGoal | MotivationFamilyGoal,
  familyGoal?: MotivationFamilyGoal,
) {
  const remaining = Math.max(
    0,
    progressGoal.targetCount - progressGoal.currentProgress,
  );
  const celebration = familyGoal?.celebration;
  if (
    celebration &&
    familyGoal &&
    familyGoal.currentProgress < familyGoal.targetCount
  ) {
    const familyRemaining = familyGoal.targetCount - familyGoal.currentProgress;
    return `${familyRemaining === 1 ? "Nog maar 1" : `Nog maar ${familyRemaining}`} ${familyGoal.unitLabel} tot ${celebration.title}.`;
  }
  return `${remaining} ${progressGoal.unitLabel} te gaan.`;
}

function TodaySection({
  member,
  tasks,
  status,
  todayIso,
}: {
  member: FamilyMember;
  tasks: readonly HouseholdTask[];
  status: "loading" | "ready" | "error";
  todayIso: string;
}) {
  const childTasks = tasks
    .filter(
      (task) =>
        !task.isCompleted &&
        task.noDateReviewState !== "NeedsReview" &&
        task.noDateReviewState !== "Someday" &&
        task.noDateReviewState !== "Archived" &&
        task.ownershipKind === "FamilyMember" &&
        task.familyMemberId === member.id,
    )
    .sort(
      (a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
        a.createdUtc.localeCompare(b.createdUtc),
    );
  const visibleTasks = childTasks.slice(0, 3);
  const dueTodayCount = childTasks.filter(
    (task) => task.dueDate === null || task.dueDate <= todayIso,
  ).length;

  return (
    <article
      className="child-progress-card child-journey-today"
      aria-label="Vandaag"
    >
      <HomeOpsIcon
        className="child-card-asset"
        name="childToday"
        variant="section"
      />
      <p className="eyebrow">Vandaag</p>
      <h3>Wat kan ik vandaag doen?</h3>
      {status === "loading" ? <p>Je helptaken ophalen…</p> : null}
      {status === "error" ? <p>Taken zijn nu niet beschikbaar.</p> : null}
      {status === "ready" && childTasks.length === 0 ? (
        <p>Nu geen taken. Een volwassene kan er één toevoegen.</p>
      ) : null}
      {childTasks.length > 0 ? (
        <>
          <p className="child-journey-summary">
            {dueTodayCount > 0
              ? `${dueTodayCount} ${
                  dueTodayCount === 1 ? "ding" : "dingen"
                } om vandaag te proberen.`
              : `${childTasks.length} active ${
                  childTasks.length === 1 ? "taak" : "taken"
                } wachten op je.`}
          </p>
          <ul className="child-task-list">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <HomeOpsIcon name="completed" />
                <div>
                  <strong>{task.title}</strong>
                  <p>{friendlyTaskDue(task, todayIso)}</p>
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
        <h3>Gezinsdoel ophalen…</h3>
      </article>
    );
  if (!familyGoal)
    return (
      <article className="child-progress-card">
        <p className="eyebrow">Family goal</p>
        <h3>
          {status === "error"
            ? "Gezinsdoel niet beschikbaar"
            : "No family goal yet"}
        </h3>
        <p>Een volwassene kan er één toevoegen.</p>
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
      aria-label="Meedoen met gezinsdoel"
    >
      <HomeOpsIcon
        className="child-card-asset"
        name="childFamilyParticipation"
        variant="spot"
      />
      <p className="eyebrow">Gezinsdoel</p>
      <h3>{familyGoal.title}</h3>
      <p>
        {remaining > 0
          ? familyGoal.celebration
            ? `${remaining === 1 ? "Nog maar 1" : `Only ${remaining} more`} ${familyGoal.unitLabel} tot ${familyGoal.celebration.title}. Jij hebt geholpen.`
            : `${remaining} more ${familyGoal.unitLabel} te gaan.`
          : "Samen gelukt!"}
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
  const afgerond = familyGoal.currentProgress >= familyGoal.targetCount;
  const statusText =
    celebration.status === FamilyCelebrationStatus.Celebrated
      ? "Samen gevierd"
      : celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
          afgerond
        ? "Gelukt — klaar om te vieren"
        : "Als we klaar zijn";
  const detail =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || afgerond
      ? `${celebration.title} is nu klaar.`
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "We hebben samen gevierd."
        : `Blijf helpen — ${celebration.title} komt dichterbij.`;
  const statusClass =
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || afgerond
      ? "ready"
      : celebration.status === FamilyCelebrationStatus.Celebrated
        ? "celebrated"
        : "planned";
  return (
    <aside
      className={`family-celebration-card ${statusClass}`}
      aria-label="Gezinsviering"
    >
      <HomeOpsIcon
        name={
          statusClass === "ready"
            ? "celebrationReady"
            : statusClass === "celebrated"
              ? "celebrationCelebrated"
              : "celebrationUpcoming"
        }
        variant={ageBand === "early-child" ? "spot" : "icon"}
      />
      <div>
        <p className="eyebrow">{statusText}</p>
        <h4>{celebration.title}</h4>
        <p>
          {ageBand === "early-child"
            ? celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
              afgerond
              ? "Nu klaar!"
              : "Komt dichterbij."
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
    <article
      className="child-progress-card child-memory-card"
      aria-label="Vieringsherinneringen"
    >
      <p className="eyebrow">Gezinsherinneringen</p>
      <h3>
        {ageBand === "early-child"
          ? "Samen gelukt"
          : "Vieringen om te onthouden"}
      </h3>
      <p>Dit hebben we samen bereikt.</p>
      <div className="child-memory-list">
        {recent.map((memory) => (
          <div key={`${memory.familyGoalId}-${memory.celebratedUtc}`}>
            <HomeOpsIcon name="memory" variant="keepsake" />
            <div>
              <strong>{memory.title}</strong>
              <p>We hebben geholpen om dit mogelijk te maken.</p>
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
    <article className="child-progress-card" aria-label="Deze week">
      <HomeOpsIcon
        className="child-card-asset"
        name="childThisWeek"
        variant="section"
      />
      <p className="eyebrow">Deze week</p>
      <h3>{ageBand === "early-child" ? "Sterren om te verzamelen" : "Mijn voortgang"}</h3>
      {goals.length === 0 ? (
        <p>No personal goal right now. Een volwassene kan er één toevoegen.</p>
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
              <HomeOpsIcon
                className="child-goal-asset"
                name="childMyProgress"
              />
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
                    <HomeOpsIcon
                      name={
                        index < goal.currentProgress
                          ? "childMyProgress"
                          : "completed"
                      }
                    />
                  </span>
                ))}
              </div>
              {ageBand === "school-age" ? (
                <div
                  className="progress-bar"
                  aria-label={`Voortgang voor ${goal.title}`}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
              ) : null}
              <p>
                {remaining > 0
                  ? `${remaining} ${goal.unitLabel} te gaan. Ga zo door!`
                  : "Doel gehaald!"}
              </p>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function friendlyTaskDue(task: HouseholdTask, todayIso: string) {
  if (!task.dueDate) return "Klaar wanneer jij dat bent.";
  if (task.dueDate < todayIso) return "Deze wacht op jou.";
  if (task.dueDate === todayIso) return "Voor vandaag.";
  return `Komt eraan op ${task.dueDate}.`;
}

function calculateAge(dateOfBirth?: string | null, todayOverride?: Date) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = todayOverride ?? new Date();
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
    return "Gezinsleden horen bij het gedeelde gezinsbord. Ze zijn geen gebruikers, accounts of permissies.";
  if (age === null) return "Een eenvoudige voortgangspagina voor dit kind.";
  if (age <= 5) return `${age} jaar · sterren en eenvoudige doelen.`;
  if (age <= 12) return `${age} jaar · doelen en voortgang.`;
  return `${age} jaar · doelen en voortgang.`;
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
