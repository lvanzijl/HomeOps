import { HelpfulMomentsSection } from "../HelpfulMoments";
import { loadTasks } from "../tasks/tasksApi";
import type { HouseholdTask } from "../tasks/tasksModel";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
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
  onBack?: () => void;
  onChange: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
}

type FamilyMemberContextSurface = "goals" | "history" | "settings" | null;

export function FamilyMemberPage({
  member,
  onAddFamilyMember,
  onChange,
  onRemove,
}: FamilyMemberPageProps) {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [activeSurface, setActiveSurface] =
    useState<FamilyMemberContextSurface>(null);
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
    setStatus(null);
    setActiveSurface(null);
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
  const ageBand: "early-child" | "school-age" =
    member.memberKind === "child" && age !== null && age <= 5
      ? "early-child"
      : "school-age";
  const memberGoals = goalsForMembers(motivationSnapshot, [member]);
  const personalTasks = getPersonalTasks(tasks, member);
  const dueTodayCount = personalTasks.filter(
    (task) => task.dueDate === null || task.dueDate <= todayIso,
  ).length;
  const primaryGoal = memberGoals[0];
  const progressGoal = primaryGoal ?? motivationSnapshot.familyGoal;
  const dashboardStatus = buildDashboardStatus({
    member,
    tasksStatus,
    motivationStatus,
    personalTasks,
    progressGoal,
    todayIso,
  });

  return (
    <section
      className={`family-member-page family-member-page-${member.memberKind} ${ageBand}`}
      aria-label={`${member.name} gezinslidpagina`}
    >
      <header
        className="family-member-identity-strip"
        style={{ "--member-color": member.displayColor } as CSSProperties}
      >
        <button
          className="family-member-avatar-entry"
          type="button"
          onClick={() => setIsEditingAvatar(true)}
          aria-label="Avatar bewerken"
        >
          <FamilyAvatar member={member} size="compact" />
          <span className="family-member-avatar-edit-badge">Bewerken</span>
        </button>

        <div className="family-member-identity-copy">
          <p className="eyebrow">
            {member.memberKind === "child" ? "Mijn pagina" : "Mijn overzicht"}
          </p>
          <div className="family-member-identity-title-row">
            <h1>{member.name}</h1>
            <p className="family-member-identity-context">{ageContext(member, age)}</p>
          </div>
          <div className="family-member-daily-status">
            <strong>Hoe gaat het vandaag?</strong>
            <p>{dashboardStatus}</p>
          </div>
        </div>

        <div className="family-member-identity-actions">
          <button
            className="secondary-action compact-action"
            type="button"
            onClick={() => setActiveSurface("goals")}
          >
            Doelen bekijken
          </button>
          <button
            className="secondary-action compact-action"
            type="button"
            onClick={() => setActiveSurface("history")}
          >
            Geschiedenis
          </button>
        </div>
      </header>

      <div
        className={`family-member-dashboard ${member.memberKind === "child" ? "child-mode" : "adult-mode"}`}
        aria-label={
          member.memberKind === "child"
            ? `${member.name} kindmodus`
            : `${member.name} overzicht vandaag`
        }
      >
        <TodaySection
          member={member}
          tasks={tasks}
          status={tasksStatus}
          todayIso={todayIso}
        />
        <PersonalJourneySection
          member={member}
          goals={memberGoals}
          familyGoal={motivationSnapshot.familyGoal}
          status={motivationStatus}
          ageBand={ageBand}
          dueTodayCount={dueTodayCount}
        />
      </div>

      <nav
        className="family-member-action-rail"
        aria-label={`${member.name} contextacties`}
      >
        <button
          className="family-member-rail-button"
          type="button"
          onClick={() => setIsEditingAvatar(true)}
        >
          Avatar bewerken
        </button>
        <button
          className="family-member-rail-button"
          type="button"
          onClick={() => setActiveSurface("goals")}
        >
          Voortgang en doelen
        </button>
        <button
          className="family-member-rail-button"
          type="button"
          onClick={() => setActiveSurface("history")}
        >
          Herinneringen
        </button>
        <button
          className="family-member-rail-button"
          type="button"
          onClick={() => setActiveSurface("settings")}
        >
          {member.memberKind === "child" ? "Ouderinstellingen" : "Instellingen"}
        </button>
      </nav>

      {activeSurface === "goals" ? (
        <FamilyMemberContextDialog
          title={`Voortgang en doelen voor ${member.name}`}
          eyebrow="Mijn voortgang"
          description="Persoonlijke voortgang en gezinsdoel."
          onClose={() => setActiveSurface(null)}
        >
          <div className="family-member-context-stack">
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
          </div>
        </FamilyMemberContextDialog>
      ) : null}

      {activeSurface === "history" ? (
        <FamilyMemberContextDialog
          title={`Herinneringen voor ${member.name}`}
          eyebrow="Geschiedenis"
          description="Waarderingen en vieringen."
          onClose={() => setActiveSurface(null)}
        >
          <div className="family-member-context-stack">
            <ChildCelebrationMemories
              memories={motivationSnapshot.celebrationMemories ?? []}
              ageBand={ageBand}
            />
            <HelpfulMomentsSection
              members={[member]}
              familyMemberId={member.id}
              title="Waarderingen"
            />
          </div>
        </FamilyMemberContextDialog>
      ) : null}

      {activeSurface === "settings" ? (
        <FamilyMemberContextDialog
          title={`Instellingen voor ${member.name}`}
          eyebrow="Oudermodus"
          description="Werk profielgegevens en gezinsopties bij."
          onClose={() => setActiveSurface(null)}
        >
          <ParentAdministration
            member={member}
            draft={draft}
            setDraft={setDraft}
            status={status}
            submit={submit}
            requestRemove={requestRemove}
            onAddFamilyMember={onAddFamilyMember}
          />
        </FamilyMemberContextDialog>
      ) : null}

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

function FamilyMemberContextDialog({
  eyebrow,
  title,
  description,
  children,
  onClose,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="avatar-editor-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="motivation-dialog family-member-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={
          {
            "--domain-tint": "#fff7ed",
            "--domain-accent": "#f59e0b",
            "--domain-border": "rgba(251, 191, 36, 0.32)",
          } as CSSProperties
        }
      >
        <header>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={`${title} sluiten`}
          >
            <HomeOpsIcon name="close" />
          </button>
        </header>
        <div className="family-member-context-content">{children}</div>
      </section>
    </div>
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
              <p>
                Gebruik dit alleen wanneer {member.name} niet meer in het gezin
                moet verschijnen.
              </p>
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

function PersonalJourneySection({
  member,
  goals,
  familyGoal,
  status,
  ageBand,
  dueTodayCount,
}: {
  member: FamilyMember;
  goals: readonly MotivationIndividualGoal[];
  familyGoal?: MotivationFamilyGoal;
  status: "loading" | "ready" | "error";
  ageBand: "early-child" | "school-age";
  dueTodayCount: number;
}) {
  const primaryGoal = goals[0];
  const progressGoal = primaryGoal ?? familyGoal;
  const percent = progressGoal
    ? clampProgress(progressGoal.currentProgress, progressGoal.targetCount)
    : 0;
  const remaining = progressGoal
    ? Math.max(0, progressGoal.targetCount - progressGoal.currentProgress)
    : 0;
  const familyGoalIsContext = familyGoal && familyGoal.id !== primaryGoal?.id;

  return (
    <article
      className="child-progress-card family-member-journey-card"
      aria-label="Kindoverzicht"
      style={{ "--member-color": member.displayColor } as CSSProperties}
    >
      <div className="family-member-journey-header">
        <div>
          <p className="eyebrow">
            {ageBand === "early-child" ? "Mijn sterren" : "Mijn voortgang"}
          </p>
          <h3>
            {progressGoal?.title ??
              (member.memberKind === "child"
                ? "Er komt een nieuw doel"
                : "Mijn persoonlijke overzicht")}
          </h3>
          <p className="family-member-journey-lead">
            {journeyLead({
              member,
              status,
              progressGoal,
              dueTodayCount,
            })}
          </p>
        </div>
        <div
          className="hero-progress-ring family-member-progress-ring"
          aria-label={
            progressGoal
              ? `${progressGoal.currentProgress} van ${progressGoal.targetCount} ${progressGoal.unitLabel}`
              : "Nog geen voortgang beschikbaar"
          }
          style={{ "--progress": `${percent}%` } as CSSProperties}
        >
          <strong>{percent}%</strong>
          <span>klaar</span>
        </div>
      </div>

      {progressGoal ? (
        <>
          <div
            className="progress-bar hero-progress-bar"
            aria-label={`${progressGoal.currentProgress} van ${progressGoal.targetCount} ${progressGoal.unitLabel}`}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="family-member-journey-support">
            {remaining > 0
              ? progressEncouragement(progressGoal, familyGoal)
              : "Doel gehaald! Tijd voor een klein trots moment."}
          </p>
        </>
      ) : (
        <p className="family-member-journey-support">
          {status === "loading"
            ? "We halen je voortgang op voor vandaag."
            : member.memberKind === "child"
              ? "Een volwassene kan een doel toevoegen wanneer jullie er klaar voor zijn."
              : "Gebruik de actierail voor meer details of instellingen."}
        </p>
      )}

      {familyGoalIsContext ? (
        <div className="family-member-mini-context" aria-label="Gezinsdoel">
          <span className="family-member-mini-context-label">Gezinsdoel</span>
          <strong>{familyGoal.title}</strong>
          <span>
            {familyGoal.currentProgress}/{familyGoal.targetCount}{" "}
            {familyGoal.unitLabel}
          </span>
        </div>
      ) : null}

      <div className="family-member-journey-appreciation">
        <HelpfulMomentsSection
          members={[member]}
          familyMemberId={member.id}
          title="Nieuwste waardering"
          compact
          contextualHistory
          previewCount={1}
        />
      </div>
    </article>
  );
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
  const personalTasks = getPersonalTasks(tasks, member);
  const visibleTasks = personalTasks.slice(0, 3);
  const hiddenTasks = Math.max(0, personalTasks.length - visibleTasks.length);
  const dueTodayCount = personalTasks.filter(
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
      <h3>
        {member.memberKind === "child"
          ? "Wat kan ik vandaag doen?"
          : "Wat vraagt vandaag aandacht?"}
      </h3>
      {status === "loading" ? (
        <p>
          {member.memberKind === "child"
            ? "Je helptaken ophalen…"
            : "Je persoonlijke taken ophalen…"}
        </p>
      ) : null}
      {status === "error" ? <p>Taken zijn nu niet beschikbaar.</p> : null}
      {status === "ready" && personalTasks.length === 0 ? (
        <p>
          {member.memberKind === "child"
            ? "Nu geen taken. Een volwassene kan er één toevoegen."
            : "Vandaag zijn er nog geen persoonlijke taken zichtbaar."}
        </p>
      ) : null}
      {personalTasks.length > 0 ? (
        <>
          <p className="child-journey-summary">
            {dueTodayCount > 0
              ? `${dueTodayCount} ${
                  dueTodayCount === 1 ? "ding" : "dingen"
                } om vandaag op te pakken.`
              : `${personalTasks.length} actieve ${
                  personalTasks.length === 1 ? "taak wacht" : "taken wachten"
                } op je.`}
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
          {hiddenTasks > 0 ? (
            <p className="family-member-more-count">+{hiddenTasks} meer klaar</p>
          ) : null}
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
        <p className="eyebrow">Gezinsdoel</p>
        <h3>Gezinsdoel ophalen…</h3>
      </article>
    );
  if (!familyGoal)
    return (
      <article className="child-progress-card">
        <p className="eyebrow">Gezinsdoel</p>
        <h3>
          {status === "error"
            ? "Gezinsdoel niet beschikbaar"
            : "Nog geen gezinsdoel"}
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
      aria-label="Gezinsdoel"
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
            ? `${remaining === 1 ? "Nog maar 1" : `Nog ${remaining}`} ${familyGoal.unitLabel} tot ${familyGoal.celebration.title}.`
            : `${remaining} ${familyGoal.unitLabel} te gaan.`
          : "Samen gelukt!"}
      </p>
      <div
        className="progress-bar"
        aria-label={`${familyGoal.currentProgress} van ${familyGoal.targetCount} ${familyGoal.unitLabel}`}
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
  if (recent.length === 0) {
    return (
      <article
        className="child-progress-card child-memory-card"
        aria-label="Vieringsherinneringen"
      >
        <p className="eyebrow">Gezinsherinneringen</p>
        <h3>
          {ageBand === "early-child" ? "Samen gelukt" : "Vieringen om te onthouden"}
        </h3>
        <p>Nog geen herinneringen om terug te lezen.</p>
      </article>
    );
  }
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
      <h3>
        {ageBand === "early-child" ? "Sterren om te verzamelen" : "Mijn voortgang"}
      </h3>
      {goals.length === 0 ? (
        <p>Nog geen persoonlijk doel. Een volwassene kan er één toevoegen.</p>
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

function getPersonalTasks(
  tasks: readonly HouseholdTask[],
  member: FamilyMember,
) {
  return tasks
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
}

function buildDashboardStatus({
  member,
  tasksStatus,
  motivationStatus,
  personalTasks,
  progressGoal,
  todayIso,
}: {
  member: FamilyMember;
  tasksStatus: "loading" | "ready" | "error";
  motivationStatus: "loading" | "ready" | "error";
  personalTasks: readonly HouseholdTask[];
  progressGoal?: MotivationIndividualGoal | MotivationFamilyGoal;
  todayIso: string;
}) {
  const dueTodayCount = personalTasks.filter(
    (task) => task.dueDate === null || task.dueDate <= todayIso,
  ).length;

  if (tasksStatus === "loading" || motivationStatus === "loading") {
    return member.memberKind === "child"
      ? "We zetten je dag klaar."
      : "We laden je overzicht voor vandaag.";
  }

  if (tasksStatus === "error" && motivationStatus === "error") {
    return "Vandaag lukt het ophalen van taken en voortgang niet helemaal.";
  }

  const taskText =
    dueTodayCount > 0
      ? `${dueTodayCount} ${
          dueTodayCount === 1 ? "taak" : "taken"
        } voor vandaag`
      : personalTasks.length > 0
        ? `${personalTasks.length} actieve ${
            personalTasks.length === 1 ? "taak" : "taken"
          }`
        : member.memberKind === "child"
          ? "geen helptaken"
          : "geen persoonlijke taken";
  const progressText = progressGoal
    ? `${clampProgress(progressGoal.currentProgress, progressGoal.targetCount)}% op weg naar ${progressGoal.title}`
    : "ruimte voor een nieuw doel";
  return `${taskText} · ${progressText}.`;
}

function journeyLead({
  member,
  status,
  progressGoal,
  dueTodayCount,
}: {
  member: FamilyMember;
  status: "loading" | "ready" | "error";
  progressGoal?: MotivationIndividualGoal | MotivationFamilyGoal;
  dueTodayCount: number;
}) {
  if (status === "loading") return "We halen je voortgang op.";
  if (!progressGoal) {
    return member.memberKind === "child"
      ? "Vandaag begint rustig en overzichtelijk."
      : "Vandaag staat in het teken van overzicht en kleine stappen.";
  }
  if (dueTodayCount > 0) {
    return `${dueTodayCount} ${
      dueTodayCount === 1 ? "focuspunt helpt" : "focuspunten helpen"
    } je vooruit.`;
  }
  return `Je blijft vandaag op weg naar ${progressGoal.title}.`;
}

function progressEncouragement(
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
    return `${familyRemaining === 1 ? "Nog maar 1" : `Nog ${familyRemaining}`} ${familyGoal.unitLabel} tot ${celebration.title}.`;
  }
  return `${remaining} ${progressGoal.unitLabel} te gaan. Ga zo door!`;
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
