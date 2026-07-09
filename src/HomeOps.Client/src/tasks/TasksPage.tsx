import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  familyMembers as fallbackFamilyMembers,
  type FamilyMember,
} from "../home/familyMembers";
import {
  applyTaskTemplate,
  archiveTask,
  archiveTaskTemplate,
  completeTask,
  createTask,
  createTaskTemplate,
  deleteRecurringTaskSeries,
  keepTaskActive,
  loadTaskTemplates,
  loadTasks,
  moveTaskToSomeday,
  reopenTask,
  updateTask as saveTask,
  updateTaskTemplate,
} from "./tasksApi";
import { groupTasksByTime } from "./taskGrouping";
import { useVisualReviewNow } from "../visualReviewTime";
import type {
  HouseholdTask,
  TaskOwnershipKind,
  TaskRecurrenceFrequency,
  TaskTimeGroup,
  TaskTemplate,
} from "./tasksModel";

type TaskDialogQuestion = "title" | "owner" | "date" | "extras";
type PlanningSection = "tomorrow" | "thisWeek" | "later";
type TasksPanelState =
  | { kind: "planning"; section: PlanningSection }
  | { kind: "today" }
  | { kind: "completed" }
  | { kind: "someday" }
  | { kind: "templates" }
  | { kind: "weeklyReview" };

const defaultVisibleTodayTasks = 6;

export function TasksPage({
  members = fallbackFamilyMembers,
  onOpenWeeklyReset,
}: {
  members?: readonly FamilyMember[];
  onOpenWeeklyReset?: () => void;
}) {
  const visualReviewNow = useVisualReviewNow();
  const todayDate = visualReviewNow ?? new Date();
  const todayIso = toDateInputValue(todayDate);
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [templates, setTemplates] = useState<readonly TaskTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ownership, setOwnership] = useState<TaskOwnershipKind>("Unassigned");
  const [familyMemberId, setFamilyMemberId] = useState(members[0]?.id ?? "");
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<TaskRecurrenceFrequency>("None");
  const [editingTask, setEditingTask] = useState<HouseholdTask | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskDialogQuestion, setTaskDialogQuestion] =
    useState<TaskDialogQuestion>("title");
  const [activePanel, setActivePanel] = useState<TasksPanelState | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const reviewTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.noDateReviewState === "NeedsReview")
        .slice(0, 5),
    [tasks],
  );
  const somedayTasks = useMemo(
    () => tasks.filter((task) => task.noDateReviewState === "Someday"),
    [tasks],
  );
  const groups = useMemo(
    () => groupTasksByTime(tasks, todayIso),
    [tasks, todayIso],
  );
  const todayGroup = useMemo<TaskTimeGroup>(
    () =>
      groups.find((group) => group.id === "today") ??
      createFallbackTaskGroup(
        "today",
        "Vandaag",
        "Pak deze taken vandaag op.",
        "Vandaag is alles gedaan.",
        "primary",
      ),
    [groups],
  );
  const tomorrowGroup = useMemo(
    () =>
      groups.find((group) => group.id === "tomorrow") ??
      createFallbackTaskGroup(
        "tomorrow",
        "Morgen",
        "Kijk wat morgen klaarstaat.",
        "Geen taken gepland voor morgen.",
      ),
    [groups],
  );
  const thisWeekGroup = useMemo(
    () =>
      groups.find((group) => group.id === "thisWeek") ??
      createFallbackTaskGroup(
        "thisWeek",
        "Deze week",
        "Bekijk wat later deze week speelt.",
        "Deze week staat er verder niets open.",
      ),
    [groups],
  );
  const laterQueueGroup = useMemo(() => {
    const laterGroups = groups.filter(
      (group) =>
        group.id !== "today" &&
        group.id !== "tomorrow" &&
        group.id !== "thisWeek" &&
        group.id !== "completedRecently",
    );
    const laterTasks = laterGroups.flatMap((group) => group.tasks);
    return {
      id: "later" as const,
      title: "Later",
      description: "Bewaar taken voor later.",
      emptyMessage: "Niets voor later op dit moment.",
      emphasis: "quiet" as const,
      tasks: laterTasks,
    };
  }, [groups]);
  const completedTaskGroup = useMemo<TaskTimeGroup>(
    () =>
      groups.find((group) => group.id === "completedRecently") ??
      createFallbackTaskGroup(
        "completedRecently",
        "Afgerond",
        "Bekijk wat net is afgerond.",
        "Nog niets afgerond.",
        "quiet",
      ),
    [groups],
  );
  const todaySummary = useMemo(() => {
    const todayTasks =
      groups.find((group) => group.id === "today")?.tasks ?? [];
    return {
      total: todayTasks.length,
      overdue: todayTasks.filter(
        (task) => task.dueDate !== null && task.dueDate < todayIso,
      ).length,
      recurring: todayTasks.filter(isRecurringTask).length,
    };
  }, [groups, todayIso]);
  const laterGroup = useMemo<TaskTimeGroup>(
    () =>
      laterQueueGroup ??
      createFallbackTaskGroup(
        "later",
        "Later",
        "Bewaar taken voor later.",
        "Niets voor later op dit moment.",
        "quiet",
      ),
    [laterQueueGroup],
  );
  const visibleTodayTasks = useMemo(
    () => todayGroup.tasks.slice(0, defaultVisibleTodayTasks),
    [todayGroup.tasks],
  );
  const todayOverflowCount = todayGroup.tasks.length - visibleTodayTasks.length;
  const planningTasks = useMemo(
    () => [...tomorrowGroup.tasks, ...thisWeekGroup.tasks],
    [thisWeekGroup.tasks, tomorrowGroup.tasks],
  );
  const planningSignals = useMemo(() => {
    const signals: string[] = [];
    const unassignedCount = planningTasks.filter(
      (task) => task.ownershipKind === "Unassigned",
    ).length;
    const recurringCount = planningTasks.filter(isRecurringTask).length;
    const nextPlanningTask = tomorrowGroup.tasks[0] ?? thisWeekGroup.tasks[0];

    if (unassignedCount > 0) {
      signals.push(
        `${unassignedCount} zonder eigenaar${
          unassignedCount === 1 ? "" : "s"
        }`,
      );
    }

    if (reviewTasks.length > 0) {
      signals.push(
        `${reviewTasks.length} weekcheck${
          reviewTasks.length === 1 ? "" : "s"
        }`,
      );
    }

    if (recurringCount > 0) {
      signals.push(
        `${recurringCount} routine${
          recurringCount === 1 ? "" : "s"
        } in planning`,
      );
    }

    if (nextPlanningTask) {
      signals.push(`Eerstvolgend: ${nextPlanningTask.title}`);
    }

    return signals.slice(0, 3);
  }, [planningTasks, reviewTasks.length, thisWeekGroup.tasks, tomorrowGroup.tasks]);
  const planningStatus = useMemo(() => {
    if (tomorrowGroup.tasks.length === 0 && thisWeekGroup.tasks.length === 0) {
      return "Morgen en deze week ogen rustig.";
    }

    if (tomorrowGroup.tasks.length > 0 && thisWeekGroup.tasks.length === 0) {
      return `${formatTaskCount(tomorrowGroup.tasks.length)} komt morgen eraan.`;
    }

    if (tomorrowGroup.tasks.length === 0 && thisWeekGroup.tasks.length > 0) {
      return `Morgen is rustig; ${formatTaskCount(thisWeekGroup.tasks.length)} staan later deze week gepland.`;
    }

    return `${formatTaskCount(tomorrowGroup.tasks.length)} morgen, ${formatTaskCount(thisWeekGroup.tasks.length)} later deze week.`;
  }, [thisWeekGroup.tasks.length, tomorrowGroup.tasks.length]);

  useEffect(() => {
    if (
      ownership === "FamilyMember" &&
      !members.some((member) => member.id === familyMemberId)
    ) {
      setFamilyMemberId(members[0]?.id ?? "");
    }
  }, [familyMemberId, members, ownership]);

  useEffect(() => {
    if (!isTaskFormOpen && !editingTask && !activePanel) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isTaskFormOpen || editingTask) {
          resetTaskForm();
          return;
        }

        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [activePanel, editingTask, isTaskFormOpen]);

  function resetTaskForm() {
    setTitle("");
    setDueDate("");
    setOwnership("Unassigned");
    setRecurrenceFrequency("None");
    setEditingTask(null);
    setIsTaskFormOpen(false);
    setTaskDialogQuestion("title");
  }

  function openNewTaskDialog() {
    setEditingTask(null);
    setTitle("");
    setDueDate(todayIso);
    setOwnership("Unassigned");
    setFamilyMemberId(members[0]?.id ?? "");
    setRecurrenceFrequency("None");
    setTaskDialogQuestion("title");
    setIsTaskFormOpen(true);
  }

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setTasks(await loadTasks());
        setTemplates(await loadTaskTemplates());
      } catch {
        if (!ignore) setError("Taken konden niet worden geladen.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void run();
    return () => {
      ignore = true;
    };
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = {
        title,
        dueDate: dueDate || null,
        ownershipKind: ownership,
        familyMemberId: ownership === "FamilyMember" ? familyMemberId : null,
        recurrenceFrequency,
      };
      const saved = editingTask
        ? await saveTask(editingTask.id, payload)
        : await createTask(payload);
      if (saved) setTasks(await loadTasks());
      resetTaskForm();
    } catch {
      setError("Taak kon niet worden opgeslagen.");
    }
  }

  async function onSaveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = {
        name: templateName,
        description: templateDescription || null,
        items: [
          {
            title,
            dueDate: dueDate || null,
            ownershipKind: ownership,
            familyMemberId:
              ownership === "FamilyMember" ? familyMemberId : null,
            recurrenceFrequency,
            dueOffsetDays: dueDate ? 0 : null,
          },
        ],
      };
      if (editingTemplate) await updateTaskTemplate(editingTemplate.id, input);
      else await createTaskTemplate(input);
      setTemplates(await loadTaskTemplates());
      setTemplateName("");
      setTemplateDescription("");
      setEditingTemplate(null);
    } catch {
      setError("Routine kon niet worden opgeslagen.");
    }
  }

  function startEditingTemplate(template: TaskTemplate) {
    const first = template.items[0];
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description ?? "");
    setActivePanel({ kind: "templates" });
    if (first) {
      setTitle(first.title);
      setOwnership(first.ownershipKind);
      setFamilyMemberId(first.familyMemberId ?? members[0]?.id ?? "");
      setRecurrenceFrequency(first.recurrenceFrequency ?? "None");
      setTaskDialogQuestion("title");
      setIsTaskFormOpen(true);
    }
  }

  async function applyTemplate(templateId: string) {
    try {
      await applyTaskTemplate(templateId);
      setTasks(await loadTasks());
    } catch {
      setError("Routine kon niet worden toegepast.");
    }
  }

  async function archiveTemplate(templateId: string) {
    try {
      await archiveTaskTemplate(templateId);
      setTemplates(await loadTaskTemplates());
    } catch {
      setError("Routine kon niet worden gearchiveerd.");
    }
  }

  function onEditTaskDue(task: HouseholdTask) {
    startEditing(task);
    const due = window.prompt("Kies een datum (YYYY-MM-DD)", todayIso);
    if (due)
      void saveTask(task.id, {
        title: task.title,
        dueDate: due,
        ownershipKind: task.ownershipKind,
        familyMemberId: task.familyMemberId,
        recurrenceFrequency: task.recurrenceFrequency ?? "None",
      })
        .then(async () => setTasks(await loadTasks()))
        .catch(() => setError("Datum kon niet worden opgeslagen."));
  }

  function startEditing(task: HouseholdTask) {
    setEditingTask(task);
    setTitle(task.title);
    setDueDate(task.dueDate ?? todayIso);
    setOwnership(task.ownershipKind);
    setFamilyMemberId(task.familyMemberId ?? members[0]?.id ?? "");
    setRecurrenceFrequency(task.recurrenceFrequency ?? "None");
    setTaskDialogQuestion("title");
    setIsTaskFormOpen(true);
  }

  async function deleteSeries(taskId: string) {
    try {
      await deleteRecurringTaskSeries(taskId);
      setTasks(await loadTasks());
    } catch {
      setError("Terugkerende routine kon niet worden verwijderd.");
    }
  }

  async function reviewTask(
    taskId: string,
    action: "keep" | "someday" | "archive" | "complete",
  ) {
    try {
      if (action === "keep") await keepTaskActive(taskId);
      if (action === "someday") await moveTaskToSomeday(taskId);
      if (action === "archive") await archiveTask(taskId);
      if (action === "complete") await completeTask(taskId);
      setTasks(await loadTasks());
    } catch {
      setError("Weekcheck kon niet worden opgeslagen.");
    }
  }

  async function updateTask(taskId: string, action: "complete" | "reopen") {
    try {
      const updated =
        action === "complete"
          ? await completeTask(taskId)
          : await reopenTask(taskId);
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
      setSelectedTaskId(null);
    } catch {
      setError("Taak kon niet worden bijgewerkt.");
    }
  }

  async function moveTaskToTomorrow(task: HouseholdTask) {
    const tomorrow = toDateInputValue(addDays(todayDate, 1));
    const isRecurring =
      (task.recurrenceFrequency ?? "None") !== "None" ||
      Boolean(task.recurringTaskSeriesId);
    if (task.isCompleted || isRecurring || task.dueDate === tomorrow) return;

    try {
      const updated = await saveTask(task.id, {
        title: task.title,
        dueDate: tomorrow,
        ownershipKind: task.ownershipKind,
        familyMemberId: task.familyMemberId,
        recurrenceFrequency: task.recurrenceFrequency ?? "None",
      });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedTaskId(null);
    } catch {
      setError("Taak kon niet naar morgen worden verplaatst.");
    }
  }

  return (
    <article
      className="tasks-page"
      aria-label="Takenpagina"
      onClick={() => setSelectedTaskId(null)}
    >
      <header className="tasks-command-band">
        <div className="tasks-command-copy">
          <p className="widget-type">Vandaag</p>
          <h3>Taken voor het gezin</h3>
          <p>Vandaag eerst.</p>
        </div>
        <div className="tasks-command-status" aria-label="Vandaag samenvatting">
          <span className="task-summary-chip">
            Vandaag {todaySummary.total}
          </span>
          <span className="task-summary-chip">
            {todaySummary.overdue} te laat
          </span>
          <span className="task-summary-chip">
            {todaySummary.recurring} routine
            {todaySummary.recurring === 1 ? "" : "s"}
          </span>
          <span className="task-summary-chip">
            {reviewTasks.length} weekcheck
            {reviewTasks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="page-header-actions" aria-label="Primaire taakactie">
          <button
            className="compact-header-action primary"
            type="button"
            onClick={openNewTaskDialog}
          >
            Gezinstaak toevoegen
          </button>
        </div>
      </header>
      {error ? (
        <p className="shopping-empty" role="alert">
          {error}
        </p>
      ) : null}
      <section className="tasks-dashboard-grid" aria-label="Taken dashboard">
        <TaskGroup
          countOverride={todayGroup.tasks.length}
          density="primary"
          group={todayGroup}
          members={members}
          tasks={isLoading ? [] : visibleTodayTasks}
          todayDate={todayDate}
          todayIso={todayIso}
          onDeleteSeries={deleteSeries}
          onEdit={startEditing}
          onMoveToTomorrow={moveTaskToTomorrow}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onUpdate={updateTask}
          emptyState={
            isLoading ? (
              <p className="shopping-empty">Taken laden…</p>
            ) : tasks.length === 0 ? (
              <div className="task-card-empty-state">
                <strong>Voeg de eerste helpende taak toe</strong>
                <p>
                  Taken maken hulp zichtbaar zonder van de dag administratie te
                  maken.
                </p>
                <button type="button" onClick={openNewTaskDialog}>
                  Gezinstaak toevoegen
                </button>
              </div>
            ) : (
              <p className="shopping-empty">
                Er vraagt nu niets direct aandacht.
              </p>
            )
          }
          footerAction={
            todayOverflowCount > 0 ? (
              <button
                type="button"
                className="task-list-summary"
                onClick={() => setActivePanel({ kind: "today" })}
              >
                +{todayOverflowCount} meer vandaag
              </button>
            ) : null
          }
          scrollable={todayGroup.tasks.length > defaultVisibleTodayTasks}
        />
        <PlanningSummaryPanel
          isLoading={isLoading}
          laterCount={laterGroup.tasks.length}
          planningSignals={planningSignals}
          planningStatus={planningStatus}
          reviewCount={reviewTasks.length}
          thisWeekGroup={thisWeekGroup}
          tomorrowGroup={tomorrowGroup}
          onOpenPlanning={(section) =>
            setActivePanel({ kind: "planning", section })
          }
        />
      </section>

      <div className="task-secondary-rail" aria-label="Taakplanning acties">
        <TaskSecondaryActionTile
          count={laterGroup.tasks.length}
          description="Later oppakken"
          label="Later"
          onClick={() => setActivePanel({ kind: "planning", section: "later" })}
        />
        <TaskSecondaryActionTile
          count={somedayTasks.length}
          description="Idee bewaren"
          label="Ooit"
          onClick={() => setActivePanel({ kind: "someday" })}
        />
        <TaskSecondaryActionTile
          count={completedTaskGroup.tasks.length}
          description="Bekijk en herstel"
          label="Afgerond"
          onClick={() => setActivePanel({ kind: "completed" })}
        />
        <TaskSecondaryActionTile
          count={templates.length}
          description="Snel opnieuw gebruiken"
          label="Routines"
          onClick={() => setActivePanel({ kind: "templates" })}
        />
        <TaskSecondaryActionTile
          count={reviewTasks.length}
          description="Kies voor deze week"
          label={`Week plannen${reviewTasks.length > 0 ? ` (${reviewTasks.length})` : ""}`}
          onClick={() => setActivePanel({ kind: "weeklyReview" })}
        />
        {onOpenWeeklyReset ? (
          <button
            type="button"
            className="task-secondary-tile task-secondary-route"
            onClick={onOpenWeeklyReset}
          >
            <span className="task-secondary-tile-label">Gezinsreset openen</span>
            <span className="task-secondary-tile-detail">
              Naar de vaste weekcheck
            </span>
          </button>
        ) : null}
      </div>

      {isTaskFormOpen || editingTask ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={resetTaskForm}
        >
          <section
            className="task-dialog task-conversation-dialog domain-tasks"
            role="dialog"
            aria-modal="true"
            aria-label={editingTask ? "Taak aanpassen" : "Gezinstaak toevoegen"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-conversation-heading">
              <p className="widget-type">Gezinshulp</p>
              <h4>
                {editingTask
                  ? "Pas deze taak rustig aan"
                  : "Voeg één helpend ding toe"}
              </h4>
            </div>
            <form
              className="task-create-form compact-task-form task-conversation-form"
              onSubmit={onCreate}
            >
              <div className="task-conversation-panel" key={taskDialogQuestion}>
                {taskDialogQuestion === "title" ? (
                  <label className="task-conversation-question">
                    <span>Wat moet er gebeuren?</span>
                    <input
                      id="task-title"
                      autoFocus
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Vaatwasser leegruimen"
                      required
                      type="text"
                      value={title}
                    />
                  </label>
                ) : null}

                {taskDialogQuestion === "owner" ? (
                  <fieldset className="task-choice-group">
                    <legend>Wie pakt dit op?</legend>
                    <button
                      type="button"
                      className={ownership === "Unassigned" ? "selected" : ""}
                      onClick={() => setOwnership("Unassigned")}
                    >
                      Iedereen kan helpen
                    </button>
                    <button
                      type="button"
                      className={
                        ownership === "SharedHousehold" ? "selected" : ""
                      }
                      onClick={() => setOwnership("SharedHousehold")}
                    >
                      Hele gezin
                    </button>
                    <button
                      type="button"
                      className={ownership === "FamilyMember" ? "selected" : ""}
                      onClick={() => setOwnership("FamilyMember")}
                    >
                      Eén persoon
                    </button>
                    {ownership === "FamilyMember" ? (
                      <label className="task-conversation-question compact">
                        <span>Kies iemand</span>
                        <select
                          autoFocus
                          onChange={(event) =>
                            setFamilyMemberId(event.target.value)
                          }
                          value={familyMemberId}
                        >
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </fieldset>
                ) : null}

                {taskDialogQuestion === "date" ? (
                  <div className="task-date-question">
                    <p className="task-question-label">
                      Wanneer moet dit gebeuren?
                    </p>
                    <div
                      className="task-choice-group horizontal"
                      aria-label="Snelle taakdatums"
                    >
                      <button
                        type="button"
                        onClick={() => setDueDate(todayIso)}
                      >
                        Vandaag
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDueDate(toDateInputValue(addDays(todayDate, 1)))
                        }
                      >
                        Morgen
                      </button>
                      <button type="button" onClick={() => setDueDate("")}>
                        Ooit
                      </button>
                    </div>
                    <label className="task-conversation-question compact">
                      <span>Of kies een datum</span>
                      <input
                        autoFocus
                        onChange={(event) => setDueDate(event.target.value)}
                        type="date"
                        value={dueDate}
                      />
                    </label>
                  </div>
                ) : null}

                {taskDialogQuestion === "extras" ? (
                  <div className="task-extras-question">
                    <p className="task-question-label">Nog iets?</p>
                    <label className="task-conversation-question compact">
                      <span>Herhaling</span>
                      <select
                        autoFocus
                        onChange={(event) =>
                          setRecurrenceFrequency(
                            event.target.value as TaskRecurrenceFrequency,
                          )
                        }
                        value={recurrenceFrequency}
                      >
                        <option value="None">Herhaalt niet</option>
                        <option value="Daily">Dagelijks</option>
                        <option value="Weekly">Wekelijks</option>
                        <option value="Monthly">Maandelijks</option>
                      </select>
                    </label>
                    <p className="task-dialog-summary">
                      {taskSummary(
                        title,
                        ownership,
                        familyMemberId,
                        members,
                        dueDate,
                        recurrenceFrequency,
                      )}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="task-conversation-actions">
                {taskDialogQuestion !== "title" ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      setTaskDialogQuestion(
                        previousTaskQuestion(taskDialogQuestion),
                      )
                    }
                  >
                    Terug
                  </button>
                ) : null}
                {taskDialogQuestion === "extras" ? (
                  <button type="submit">
                    {editingTask ? "Taak opslaan" : "Taak maken"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setTaskDialogQuestion(
                        nextTaskQuestion(taskDialogQuestion),
                      )
                    }
                    disabled={taskDialogQuestion === "title" && !title.trim()}
                  >
                    Verder
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {activePanel ? (
        <TaskSurfaceDialog
          title={
            activePanel.kind === "planning"
              ? "Planning"
              : activePanel.kind === "today"
                ? "Vandaag"
                : activePanel.kind === "completed"
                  ? "Afgerond"
                  : activePanel.kind === "someday"
                    ? "Ooit"
                    : activePanel.kind === "templates"
                      ? "Routines"
                      : "Week plannen"
          }
          description={
            activePanel.kind === "planning"
              ? "Bekijk morgen, deze week en later."
              : activePanel.kind === "today"
                ? "Taken voor vandaag."
                : activePanel.kind === "completed"
                  ? "Bekijk wat net is afgerond."
                  : activePanel.kind === "someday"
                    ? "Bewaar ideeën voor later."
                    : activePanel.kind === "templates"
                      ? "Gebruik routines opnieuw."
                      : "Bekijk losse taken en kies wat het gezin nog helpt."
          }
          onClose={() => setActivePanel(null)}
        >
          {activePanel.kind === "planning" ? (
            <PlanningDetailPanel
              activeSection={activePanel.section}
              laterGroup={laterGroup}
              members={members}
              thisWeekGroup={thisWeekGroup}
              todayDate={todayDate}
              todayIso={todayIso}
              tomorrowGroup={tomorrowGroup}
              selectedTaskId={selectedTaskId}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
              onOpenSection={(section) =>
                setActivePanel({ kind: "planning", section })
              }
              onSelectTask={setSelectedTaskId}
              onUpdate={updateTask}
            />
          ) : null}
          {activePanel.kind === "today" ? (
            <TaskGroup
              density="primary"
              group={todayGroup}
              members={members}
              tasks={todayGroup.tasks}
              todayDate={todayDate}
              todayIso={todayIso}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onUpdate={updateTask}
              scrollable
            />
          ) : null}
          {activePanel.kind === "completed" ? (
            <TaskGroup
              density="compact"
              group={completedTaskGroup}
              members={members}
              tasks={completedTaskGroup.tasks}
              todayDate={todayDate}
              todayIso={todayIso}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onUpdate={updateTask}
              scrollable
            />
          ) : null}
          {activePanel.kind === "someday" ? (
            <section className="task-group task-planning-group task-overlay-list-panel">
              <div className="task-group-heading">
                <div>
                  <p className="task-group-kicker">Zonder haast</p>
                  <h4>Ooit</h4>
                  <p>Ideeën voor later, buiten de druk van vandaag.</p>
                </div>
                <span>
                  {somedayTasks.length} {somedayTasks.length === 1 ? "taak" : "taken"}
                </span>
              </div>
              {somedayTasks.length === 0 ? (
                <p className="shopping-empty">Nog niets bewaard voor ooit.</p>
              ) : (
                <ul className="task-list task-list-scroll-region">
                  {somedayTasks.map((task) => (
                    <li className="task-item" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>Ooit</span>
                      </div>
                      <button
                        onClick={() => reviewTask(task.id, "keep")}
                        type="button"
                      >
                        Terughalen voor deze week
                      </button>
                      <button
                        onClick={() => reviewTask(task.id, "archive")}
                        type="button"
                      >
                        Archiveren
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          {activePanel.kind === "templates" ? (
            <section className="task-templates-panel task-overlay-list-panel">
              <form
                className="task-create-form compact-task-form"
                onSubmit={onSaveTemplate}
              >
                <label>
                  <span>Routinenaam</span>
                  <input
                    onChange={(event) => setTemplateName(event.target.value)}
                    placeholder="Ochtendroutine"
                    required
                    type="text"
                    value={templateName}
                  />
                </label>
                <label>
                  <span>Beschrijving</span>
                  <input
                    onChange={(event) =>
                      setTemplateDescription(event.target.value)
                    }
                    placeholder="Optionele notities"
                    type="text"
                    value={templateDescription}
                  />
                </label>
                <button type="submit">
                  {editingTemplate
                    ? "Routine opslaan"
                    : "Opslaan als routine"}
                </button>
              </form>
              {templates.length === 0 ? (
                <p className="shopping-empty">Nog geen opgeslagen routines.</p>
              ) : (
                <ul className="task-list task-list-scroll-region">
                  {templates.map((template) => (
                    <li className="task-item" key={template.id}>
                      <div>
                        <strong>{template.name}</strong>
                        <span>
                          {template.description ?? "Herbruikbare gezinsroutine"} ·{" "}
                          {template.items.length}{" "}
                          {template.items.length === 1 ? "taak" : "taken"}
                        </span>
                      </div>
                      <button
                        onClick={() => applyTemplate(template.id)}
                        type="button"
                      >
                        Toepassen
                      </button>
                      <button
                        onClick={() => startEditingTemplate(template)}
                        type="button"
                      >
                        Aanpassen
                      </button>
                      <button
                        onClick={() => archiveTemplate(template.id)}
                        type="button"
                      >
                        Archiveren
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          {activePanel.kind === "weeklyReview" ? (
            <section className="task-templates-panel task-overlay-list-panel">
              {reviewTasks.length === 0 ? (
                <p className="shopping-empty">
                  Geen losse taken nodig voor de gezinscheck op dit moment.
                </p>
              ) : (
                <ul className="task-list task-list-scroll-region">
                  {reviewTasks.map((task) => (
                    <li className="task-item" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>Gezinscheck · niet als urgent getoond</span>
                      </div>
                      <button
                        onClick={() => reviewTask(task.id, "keep")}
                        type="button"
                      >
                        Deze week houden
                      </button>
                      <button onClick={() => onEditTaskDue(task)} type="button">
                        Kies een handige dag
                      </button>
                      <button
                        onClick={() => reviewTask(task.id, "someday")}
                        type="button"
                      >
                        Bewaren voor later
                      </button>
                      <button
                        onClick={() => reviewTask(task.id, "complete")}
                        type="button"
                      >
                        Klaar
                      </button>
                      <button
                        onClick={() => reviewTask(task.id, "archive")}
                        type="button"
                      >
                        Archiveren
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </TaskSurfaceDialog>
      ) : null}
    </article>
  );
}

function PlanningSummaryPanel({
  isLoading,
  laterCount,
  planningSignals,
  planningStatus,
  reviewCount,
  thisWeekGroup,
  tomorrowGroup,
  onOpenPlanning,
}: {
  isLoading: boolean;
  laterCount: number;
  planningSignals: readonly string[];
  planningStatus: string;
  reviewCount: number;
  thisWeekGroup: TaskTimeGroup;
  tomorrowGroup: TaskTimeGroup;
  onOpenPlanning(section: PlanningSection): void;
}) {
  return (
    <section className="task-group task-planning-summary" aria-label="Planning">
      <div className="task-group-heading">
        <div>
          <p className="task-group-kicker">Daarna</p>
          <h4>Planning</h4>
          <p>Houd zicht op morgen en deze week.</p>
        </div>
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => onOpenPlanning("tomorrow")}
        >
          Planning openen
        </button>
      </div>
      <div className="task-planning-summary-grid">
        <button
          type="button"
          className="task-planning-summary-tile"
          onClick={() => onOpenPlanning("tomorrow")}
        >
          <span className="task-planning-summary-label">Morgen</span>
          <strong>{tomorrowGroup.tasks.length}</strong>
          <span>{summarizePlanningTile(tomorrowGroup.tasks, "Niets gepland")}</span>
        </button>
        <button
          type="button"
          className="task-planning-summary-tile"
          onClick={() => onOpenPlanning("thisWeek")}
        >
          <span className="task-planning-summary-label">Deze week</span>
          <strong>{thisWeekGroup.tasks.length}</strong>
          <span>{summarizePlanningTile(thisWeekGroup.tasks, "Rustig later deze week")}</span>
        </button>
      </div>
      <p className="task-planning-status">
        {isLoading ? "Planning laden…" : planningStatus}
      </p>
      <div className="task-planning-signals">
        {planningSignals.length > 0 ? (
          planningSignals.map((signal) => (
            <span className="task-summary-chip" key={signal}>
              {signal}
            </span>
          ))
        ) : (
          <span className="task-summary-chip">Geen uitzonderingen in beeld</span>
        )}
        <button
          type="button"
          className="task-summary-link"
          onClick={() => onOpenPlanning("later")}
        >
          Later {laterCount}
        </button>
        <button
          type="button"
          className="task-summary-link"
          onClick={() => onOpenPlanning("thisWeek")}
        >
          Weekcheck {reviewCount}
        </button>
      </div>
    </section>
  );
}

function PlanningDetailPanel({
  activeSection,
  laterGroup,
  members,
  thisWeekGroup,
  todayDate,
  todayIso,
  tomorrowGroup,
  selectedTaskId,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onOpenSection,
  onSelectTask,
  onUpdate,
}: {
  activeSection: PlanningSection;
  laterGroup: TaskTimeGroup;
  members: readonly FamilyMember[];
  thisWeekGroup: TaskTimeGroup;
  todayDate: Date;
  todayIso: string;
  tomorrowGroup: TaskTimeGroup;
  selectedTaskId: string | null;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  onOpenSection(section: PlanningSection): void;
  onSelectTask(id: string | null): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  const activeGroup =
    activeSection === "tomorrow"
      ? tomorrowGroup
      : activeSection === "thisWeek"
        ? thisWeekGroup
        : laterGroup;

  return (
    <section className="task-overlay-planning">
      <div
        className="task-planning-segments"
        aria-label="Planning secties"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === "tomorrow"}
          className={activeSection === "tomorrow" ? "selected" : ""}
          onClick={() => onOpenSection("tomorrow")}
        >
          Morgen ({tomorrowGroup.tasks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === "thisWeek"}
          className={activeSection === "thisWeek" ? "selected" : ""}
          onClick={() => onOpenSection("thisWeek")}
        >
          Deze week ({thisWeekGroup.tasks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === "later"}
          className={activeSection === "later" ? "selected" : ""}
          onClick={() => onOpenSection("later")}
        >
          Later ({laterGroup.tasks.length})
        </button>
      </div>
      <TaskGroup
        density={activeSection === "later" ? "compact" : "planning"}
        group={activeGroup}
        members={members}
        tasks={activeGroup.tasks}
        todayDate={todayDate}
        todayIso={todayIso}
        onDeleteSeries={onDeleteSeries}
        onEdit={onEdit}
        onMoveToTomorrow={onMoveToTomorrow}
        selectedTaskId={selectedTaskId}
        onSelectTask={onSelectTask}
        onUpdate={onUpdate}
        scrollable
      />
    </section>
  );
}

function TaskSecondaryActionTile({
  count,
  description,
  label,
  onClick,
}: {
  count: number;
  description: string;
  label: string;
  onClick(): void;
}) {
  return (
    <button type="button" className="task-secondary-tile" onClick={onClick}>
      <span className="task-secondary-tile-label">{label}</span>
      <strong>{count}</strong>
      <span className="task-secondary-tile-detail">{description}</span>
    </button>
  );
}

function TaskSurfaceDialog({
  children,
  description,
  onClose,
  title,
}: {
  children: ReactNode;
  description: string;
  onClose(): void;
  title: string;
}) {
  return (
    <div
      className="task-surface-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="task-surface-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="task-surface-dialog-header">
          <div>
            <p className="widget-type">Gezinstaken</p>
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
          <button
            type="button"
            className="secondary-action compact-action"
            onClick={onClose}
          >
            Sluiten
          </button>
        </header>
        <div className="task-surface-dialog-body">{children}</div>
      </section>
    </div>
  );
}

function TaskGroup({
  countOverride,
  density = "primary",
  emptyState,
  footerAction,
  group,
  members,
  scrollable = false,
  tasks,
  todayDate,
  todayIso,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  selectedTaskId,
  onSelectTask,
  onUpdate,
}: {
  countOverride?: number;
  density?: "primary" | "planning" | "compact";
  emptyState?: ReactNode;
  footerAction?: ReactNode;
  group: import("./tasksModel").TaskTimeGroup;
  members: readonly FamilyMember[];
  scrollable?: boolean;
  tasks: readonly HouseholdTask[];
  todayDate: Date;
  todayIso: string;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  selectedTaskId: string | null;
  onSelectTask(id: string | null): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  const taskCount = countOverride ?? tasks.length;
  return (
    <section
      className={`task-group task-time-group task-time-group-${group.id} ${group.emphasis === "primary" ? "today-focus" : ""} ${group.emphasis === "quiet" ? "quiet" : ""}`}
    >
      <div className="task-group-heading">
        <div>
          <p className="task-group-kicker">
            {group.id === "today" ? "Nu eerst" : "Daarna"}
          </p>
          <h4>{group.title}</h4>
          <p>{group.description}</p>
        </div>
        <span>
          {taskCount} {taskCount === 1 ? "taak" : "taken"}
        </span>
      </div>
      {tasks.length === 0 ? (
        emptyState ?? <p className="shopping-empty">{group.emptyMessage}</p>
      ) : (
        <ul className={`task-list ${scrollable ? "task-list-scroll-region" : ""}`}>
          {tasks.map((task) => (
            <TaskCard
              density={density}
              groupId={group.id}
              key={task.id}
              members={members}
              task={task}
              todayDate={todayDate}
              todayIso={todayIso}
              onDeleteSeries={onDeleteSeries}
              onEdit={onEdit}
              onMoveToTomorrow={onMoveToTomorrow}
              selectedTaskId={selectedTaskId}
              onSelectTask={onSelectTask}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}
      {footerAction}
    </section>
  );
}

function TaskCard({
  density,
  groupId,
  members,
  task,
  todayDate,
  todayIso,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  selectedTaskId,
  onSelectTask,
  onUpdate,
}: {
  density: "primary" | "planning" | "compact";
  groupId: string;
  members: readonly FamilyMember[];
  task: HouseholdTask;
  todayDate: Date;
  todayIso: string;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  selectedTaskId: string | null;
  onSelectTask(id: string | null): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  const isRecurring = isRecurringTask(task);
  const tomorrow = toDateInputValue(addDays(todayDate, 1));
  const canMoveToTomorrow =
    !task.isCompleted && !isRecurring && task.dueDate !== tomorrow;
  const isSelected = selectedTaskId === task.id;
  return (
    <li
      className={`task-item operational-task-card rich-task-card ${density === "compact" ? "is-compact-card" : density === "planning" ? "is-planning-card" : "is-primary-card"} ${task.isCompleted ? "is-completed" : ""} ${isRecurring ? "is-recurring" : ""} ${isSelected ? "is-selected" : ""}`}
      key={task.id}
      onClick={(event) => {
        event.stopPropagation();
        onSelectTask(isSelected ? null : task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectTask(isSelected ? null : task.id);
        }
      }}
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="task-card-visual" aria-hidden="true">
        <TaskCardIcon
          variant={
            task.isCompleted ? "completed" : isRecurring ? "recurring" : groupId
          }
        />
      </div>
      <div className="task-card-content">
        <div className="task-card-main">
          <span className="task-card-status">
            {task.isCompleted
              ? "Afgerond"
              : groupId === "today"
                ? "Vandaag eerst"
                : "Gepland"}
          </span>
          <strong>{task.title}</strong>
        </div>
        <span className="task-card-meta" aria-label="Taakdetails">
          <TaskMetadataChip tone="family" label={formatOwner(task, members)} />
          <TaskMetadataChip
            tone={groupId === "today" ? "urgent" : "time"}
            label={formatDue(task, groupId, todayIso)}
          />
          {isRecurring ? (
            <TaskMetadataChip
              tone="recurring"
              label={formatRecurrence(task.recurrenceFrequency ?? "None")}
            />
          ) : null}
          <TaskMetadataChip
            tone={task.isCompleted ? "done" : "open"}
            label={task.isCompleted ? "Afgerond" : "Openstaand"}
          />
        </span>
      </div>
      <div
        className="task-card-actions"
        aria-label={`Acties voor ${task.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        {!task.isCompleted ? (
          <button
            className="task-action-button primary"
            onClick={() => onUpdate(task.id, "complete")}
            type="button"
          >
            <TaskActionIcon name="complete" />
            <span>Klaar</span>
          </button>
        ) : (
          <button
            className="task-action-button"
            onClick={() => onUpdate(task.id, "reopen")}
            type="button"
          >
            <TaskActionIcon name="reopen" />
            <span>Terugzetten</span>
          </button>
        )}
        {canMoveToTomorrow ? (
          <button
            className="task-action-button tomorrow"
            onClick={() => onMoveToTomorrow(task)}
            type="button"
          >
            <TaskActionIcon name="tomorrow" />
            <span>Morgen</span>
          </button>
        ) : null}
        <details className="task-more-actions">
          <summary>
            <TaskActionIcon name="more" />
            <span>Meer</span>
          </summary>
          <div>
            <button
              className="task-action-button secondary"
              onClick={() => onEdit(task)}
              type="button"
            >
              <TaskActionIcon name="edit" />
              <span>Aanpassen</span>
            </button>
            {task.recurringTaskSeriesId ? (
              <button
                className="task-action-button secondary"
                onClick={() => onDeleteSeries(task.id)}
                type="button"
              >
                <TaskActionIcon name="more" />
                <span>Routine verwijderen</span>
              </button>
            ) : null}
          </div>
        </details>
      </div>
    </li>
  );
}

function TaskMetadataChip({
  label,
  tone,
}: {
  label: string;
  tone: "family" | "time" | "urgent" | "recurring" | "done" | "open";
}) {
  return <span className={`task-meta-chip ${tone}`}>{label}</span>;
}

function TaskCardIcon({ variant }: { variant: string }) {
  const label =
    variant === "completed"
      ? "K"
      : variant === "recurring"
        ? "R"
        : variant === "today"
          ? "V"
          : "T";
  return <span className="task-card-icon-slot">{label}</span>;
}

function TaskActionIcon({
  name,
}: {
  name: "complete" | "reopen" | "tomorrow" | "edit" | "more";
}) {
  const label =
    name === "complete"
      ? "K"
      : name === "reopen"
        ? "T"
        : name === "tomorrow"
          ? "M"
          : name === "edit"
            ? "A"
            : "Me";
  return (
    <span className="task-action-icon" aria-hidden="true">
      {label}
    </span>
  );
}

function createFallbackTaskGroup(
  id: TaskTimeGroup["id"],
  title: string,
  description: string,
  emptyMessage: string,
  emphasis: TaskTimeGroup["emphasis"] = "normal",
): TaskTimeGroup {
  return {
    id,
    title,
    description,
    emptyMessage,
    emphasis,
    tasks: [],
  };
}

function summarizePlanningTile(
  tasks: readonly HouseholdTask[],
  emptyMessage: string,
): string {
  if (tasks.length === 0) return emptyMessage;

  const unassignedCount = tasks.filter(
    (task) => task.ownershipKind === "Unassigned",
  ).length;
  if (unassignedCount > 0) {
    return `${unassignedCount} zonder eigenaar${
      unassignedCount === 1 ? "" : "s"
    }`;
  }

  const recurringCount = tasks.filter(isRecurringTask).length;
  if (recurringCount > 0) {
    return `${recurringCount} routine${recurringCount === 1 ? "" : "s"}`;
  }

  return tasks[0]?.title ?? emptyMessage;
}

function formatTaskCount(count: number): string {
  return `${count} ${count === 1 ? "taak" : "taken"}`;
}

function nextTaskQuestion(question: TaskDialogQuestion): TaskDialogQuestion {
  if (question === "title") return "owner";
  if (question === "owner") return "date";
  return "extras";
}

function previousTaskQuestion(
  question: TaskDialogQuestion,
): TaskDialogQuestion {
  if (question === "extras") return "date";
  if (question === "date") return "owner";
  return "title";
}

function taskSummary(
  title: string,
  ownership: TaskOwnershipKind,
  familyMemberId: string,
  members: readonly FamilyMember[],
  dueDate: string,
  recurrenceFrequency: TaskRecurrenceFrequency,
) {
  const owner =
    ownership === "FamilyMember"
      ? (members.find((member) => member.id === familyMemberId)?.name ??
        "één persoon")
      : ownership === "SharedHousehold"
        ? "het hele gezin"
        : "iedereen";
  const when = dueDate ? `op ${dueDate}` : "ooit";
  const repeats =
    recurrenceFrequency === "None"
      ? ""
      : ` en herhaalt ${formatRecurrence(recurrenceFrequency).toLowerCase()}`;
  return `${title.trim() || "Deze taak"} is voor ${owner}, ${when}${repeats}.`;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isRecurringTask(
  task: Pick<HouseholdTask, "recurrenceFrequency" | "recurringTaskSeriesId">,
): boolean {
  return (
    (task.recurrenceFrequency ?? "None") !== "None" ||
    Boolean(task.recurringTaskSeriesId)
  );
}

export function formatOwner(
  task: Pick<HouseholdTask, "ownershipKind" | "familyMemberId">,
  members: readonly FamilyMember[] = fallbackFamilyMembers,
): string {
  if (task.ownershipKind === "SharedHousehold") return "Hele gezin";
  if (task.ownershipKind === "FamilyMember")
    return (
      members.find((member) => member.id === task.familyMemberId)?.name ??
      "Gezinslid"
    );
  return "Iedereen";
}

function formatDue(
  task: Pick<HouseholdTask, "dueDate" | "isCompleted">,
  groupId: string,
  todayIso: string,
): string {
  if (task.isCompleted) return "Klaar";
  if (!task.dueDate) return "Geen datum";
  if (groupId === "today")
    return task.dueDate < todayIso ? `Te laat · ${task.dueDate}` : "Vandaag";
  if (groupId === "tomorrow") return "Morgen";
  return task.dueDate;
}

function formatRecurrence(frequency: TaskRecurrenceFrequency): string {
  if (frequency === "Daily") return "Herhaalt dagelijks";
  if (frequency === "Weekly") return "Herhaalt wekelijks";
  if (frequency === "Monthly") return "Herhaalt maandelijks";
  return "Herhaalt niet";
}
