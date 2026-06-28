import { FormEvent, useEffect, useMemo, useState } from "react";
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
import type {
  HouseholdTask,
  TaskOwnershipKind,
  TaskRecurrenceFrequency,
  TaskTemplate,
} from "./tasksModel";

type TaskDialogQuestion = "title" | "owner" | "date" | "extras";

export function TasksPage({
  members = fallbackFamilyMembers,
  onOpenWeeklyReset,
}: {
  members?: readonly FamilyMember[];
  onOpenWeeklyReset?: () => void;
}) {
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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isWeeklyResetOpen, setIsWeeklyResetOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const groups = useMemo(() => groupTasksByTime(tasks), [tasks]);
  const todaySummary = useMemo(() => {
    const todayIso = toDateInputValue(new Date());
    const todayTasks = groups.find((group) => group.id === "today")?.tasks ?? [];
    return {
      total: todayTasks.length,
      overdue: todayTasks.filter((task) => task.dueDate !== null && task.dueDate < todayIso).length,
      recurring: todayTasks.filter(isRecurringTask).length,
    };
  }, [groups]);

  useEffect(() => {
    if (
      ownership === "FamilyMember" &&
      !members.some((member) => member.id === familyMemberId)
    ) {
      setFamilyMemberId(members[0]?.id ?? "");
    }
  }, [familyMemberId, members, ownership]);

  useEffect(() => {
    if (!isTaskFormOpen && !editingTask) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resetTaskForm();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [editingTask, isTaskFormOpen]);

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
    setDueDate(toDateInputValue(new Date()));
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
    setIsTemplatesOpen(true);
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
    const due = window.prompt(
      "Kies een datum (YYYY-MM-DD)",
      new Date().toISOString().slice(0, 10),
    );
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
    setDueDate(task.dueDate ?? toDateInputValue(new Date()));
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
    } catch {
      setError("Taak kon niet worden bijgewerkt.");
    }
  }

  async function moveTaskToTomorrow(task: HouseholdTask) {
    const tomorrow = toDateInputValue(addDays(new Date(), 1));
    const isRecurring = (task.recurrenceFrequency ?? "None") !== "None" || Boolean(task.recurringTaskSeriesId);
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
    } catch {
      setError("Taak kon niet naar morgen worden verplaatst.");
    }
  }

  return (
    <article className="tasks-page" aria-label="Takenpagina">
      <header className="tasks-header page-header-with-actions">
        <div>
          <p className="widget-type">Familie-acties voor vandaag</p>
          <h3>Taken voor het gezin</h3>
          <p>
            Begin met wat nu aandacht nodig heeft; de rest blijft rustig klaarstaan.
          </p>
        </div>
        {!isLoading && tasks.length > 0 ? (
          <div className="page-header-actions" aria-label="Primaire taakactie">
            <button className="compact-header-action primary" type="button" onClick={openNewTaskDialog}>
              Gezinstaak toevoegen
            </button>
          </div>
        ) : null}
      </header>
      {!isLoading && tasks.length > 0 ? (
        <section className="task-today-summary" aria-label="Vandaag samenvatting">
          <strong>Vandaag in beeld</strong>
          <span>{todaySummary.total} {todaySummary.total === 1 ? "taak" : "taken"}</span>
          <span>{todaySummary.overdue} te laat</span>
          <span>{todaySummary.recurring} routine{todaySummary.recurring === 1 ? "" : "s"}</span>
        </section>
      ) : null}
      {error ? (
        <p className="shopping-empty" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="shopping-empty">Taken laden…</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state-card page-empty-state">
          <strong>Voeg de eerste helpende taak toe</strong>
          <p>
            Taken maken hulp zichtbaar zonder van de dag administratie te maken.
          </p>
          <button type="button" onClick={openNewTaskDialog}>
            Gezinstaak toevoegen
          </button>
        </div>
      ) : (
        groups.map((group) => (
          <TaskGroup
            group={group}
            key={group.id}
            members={members}
            tasks={group.tasks}
            onDeleteSeries={deleteSeries}
            onEdit={startEditing}
            onMoveToTomorrow={moveTaskToTomorrow}
            onUpdate={updateTask}
          />
        ))
      )}

      <div className="task-support-actions" aria-label="Taakplanning acties">
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => setIsTemplatesOpen((open) => !open)}
        >
          Routinestarters
        </button>
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => setIsWeeklyResetOpen((open) => !open)}
        >
          Week plannen
          {reviewTasks.length > 0 ? ` (${reviewTasks.length})` : ""}
        </button>
        {onOpenWeeklyReset ? (
          <button
            type="button"
            className="secondary-action compact-action"
            onClick={onOpenWeeklyReset}
          >
            Gezinsreset openen
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
                        onClick={() => setDueDate(toDateInputValue(new Date()))}
                      >
                        Vandaag
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDueDate(toDateInputValue(addDays(new Date(), 1)))
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

      <section
        className="task-secondary-stack"
        aria-label="Gezinstaken plannen"
      >
        {isTemplatesOpen ? (
          <section
            className="task-templates-panel"
            aria-label="Routinestarters"
          >
            <div>
              <p className="widget-type">Routinestarters</p>
              <h4>Opgeslagen gezinsroutines</h4>
              <p>
                Gebruik vaste klusjes opnieuw nadat duidelijk is wat vandaag nodig is.
              </p>
            </div>
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
                {editingTemplate ? "Routine opslaan" : "Opslaan als routine starter"}
              </button>
            </form>
            {templates.length === 0 ? (
              <p className="shopping-empty">Nog geen opgeslagen routines.</p>
            ) : (
              <ul className="task-list">
                {templates.map((template) => (
                  <li className="task-item" key={template.id}>
                    <div>
                      <strong>{template.name}</strong>
                      <span>
                        {template.description ?? "Herbruikbare gezinsroutine"} ·{" "}
                        {template.items.length} {template.items.length === 1 ? "taak" : "taken"}
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
        {isWeeklyResetOpen ? (
          <section className="task-templates-panel" aria-label="Week plannen">
            <div>
              <p className="widget-type">Weekreset</p>
              <h4>Plan de week samen</h4>
              <p>Bekijk losse taken en kies wat het gezin nog helpt.</p>
            </div>
            {reviewTasks.length === 0 ? (
              <p className="shopping-empty">
                Geen losse taken nodig voor de gezinscheck op dit moment.
              </p>
            ) : (
              <ul className="task-list">
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
        {somedayTasks.length > 0 ? (
          <section className="task-group task-planning-group">
            <h4>Ooit</h4>
            <p className="shopping-empty">
              Ideeën voor later, buiten de druk van vandaag.
            </p>
            <ul className="task-list">
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
          </section>
        ) : null}
      </section>
    </article>
  );
}

function TaskGroup({
  group,
  members,
  tasks,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onUpdate,
}: {
  group: import("./tasksModel").TaskTimeGroup;
  members: readonly FamilyMember[];
  tasks: readonly HouseholdTask[];
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  if (group.id === "completedRecently") {
    return (
      <details className="task-group task-time-group quiet task-completed-history">
        <summary>
          <div>
            <p className="task-group-kicker">Terugkijken</p>
            <h4>{group.title}</h4>
            <p>{group.description}</p>
          </div>
          <span>{tasks.length} {tasks.length === 1 ? "taak" : "taken"}</span>
        </summary>
        {tasks.length === 0 ? (
          <p className="shopping-empty">{group.emptyMessage}</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskCard
                groupId={group.id}
                key={task.id}
                members={members}
                task={task}
                onDeleteSeries={onDeleteSeries}
                onEdit={onEdit}
                onMoveToTomorrow={onMoveToTomorrow}
                onUpdate={onUpdate}
              />
            ))}
          </ul>
        )}
      </details>
    );
  }

  return (
    <section className={`task-group task-time-group ${group.emphasis === "primary" ? "today-focus" : ""} ${group.emphasis === "quiet" ? "quiet" : ""}`}>
      <div className="task-group-heading">
        <div>
          <p className="task-group-kicker">{group.id === "today" ? "Nu eerst" : "Daarna"}</p>
          <h4>{group.title}</h4>
          <p>{group.description}</p>
        </div>
        <span>{tasks.length} {tasks.length === 1 ? "taak" : "taken"}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="shopping-empty">{group.emptyMessage}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskCard
              groupId={group.id}
              key={task.id}
              members={members}
              task={task}
              onDeleteSeries={onDeleteSeries}
              onEdit={onEdit}
              onMoveToTomorrow={onMoveToTomorrow}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskCard({
  groupId,
  members,
  task,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onUpdate,
}: {
  groupId: string;
  members: readonly FamilyMember[];
  task: HouseholdTask;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  const isRecurring = isRecurringTask(task);
  const tomorrow = toDateInputValue(addDays(new Date(), 1));
  const canMoveToTomorrow = !task.isCompleted && !isRecurring && task.dueDate !== tomorrow;
  return (
    <li className={`task-item operational-task-card rich-task-card ${task.isCompleted ? "is-completed" : ""} ${isRecurring ? "is-recurring" : ""}`} key={task.id}>
      <div className="task-card-visual" aria-hidden="true">
        <TaskCardIcon variant={task.isCompleted ? "completed" : isRecurring ? "recurring" : groupId} />
      </div>
      <div className="task-card-content">
        <div className="task-card-main">
          <span className="task-card-status">{task.isCompleted ? "Afgerond" : groupId === "today" ? "Vandaag eerst" : "Gepland"}</span>
          <strong>{task.title}</strong>
        </div>
        <span className="task-card-meta" aria-label="Taakdetails">
          <TaskMetadataChip tone="family" label={formatOwner(task, members)} />
          <TaskMetadataChip tone={groupId === "today" ? "urgent" : "time"} label={formatDue(task, groupId)} />
          {isRecurring ? (
            <TaskMetadataChip tone="recurring" label={formatRecurrence(task.recurrenceFrequency ?? "None")} />
          ) : null}
          <TaskMetadataChip tone={task.isCompleted ? "done" : "open"} label={task.isCompleted ? "Afgerond" : "Openstaand"} />
        </span>
      </div>
      <div className="task-card-actions" aria-label={`Acties voor ${task.title}`}>
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
          <button className="task-action-button tomorrow" onClick={() => onMoveToTomorrow(task)} type="button">
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
            <button className="task-action-button secondary" onClick={() => onEdit(task)} type="button">
              <TaskActionIcon name="edit" />
              <span>Aanpassen</span>
            </button>
            {task.recurringTaskSeriesId ? (
              <button className="task-action-button secondary" onClick={() => onDeleteSeries(task.id)} type="button">
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

function TaskMetadataChip({ label, tone }: { label: string; tone: "family" | "time" | "urgent" | "recurring" | "done" | "open" }) {
  return <span className={`task-meta-chip ${tone}`}>{label}</span>;
}

function TaskCardIcon({ variant }: { variant: string }) {
  const label = variant === "completed" ? "K" : variant === "recurring" ? "R" : variant === "today" ? "V" : "T";
  return <span className="task-card-icon-slot">{label}</span>;
}

function TaskActionIcon({ name }: { name: "complete" | "reopen" | "tomorrow" | "edit" | "more" }) {
  const label = name === "complete" ? "K" : name === "reopen" ? "T" : name === "tomorrow" ? "M" : name === "edit" ? "A" : "Me";
  return <span className="task-action-icon" aria-hidden="true">{label}</span>;
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

function isRecurringTask(task: Pick<HouseholdTask, "recurrenceFrequency" | "recurringTaskSeriesId">): boolean {
  return (task.recurrenceFrequency ?? "None") !== "None" || Boolean(task.recurringTaskSeriesId);
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

function formatDue(task: Pick<HouseholdTask, "dueDate" | "isCompleted">, groupId: string): string {
  if (task.isCompleted) return "Klaar";
  if (!task.dueDate) return "Geen datum";
  if (groupId === "today") return task.dueDate < new Date().toISOString().slice(0, 10) ? `Te laat · ${task.dueDate}` : "Vandaag";
  if (groupId === "tomorrow") return "Morgen";
  return task.dueDate;
}

function formatRecurrence(frequency: TaskRecurrenceFrequency): string {
  if (frequency === "Daily") return "Herhaalt dagelijks";
  if (frequency === "Weekly") return "Herhaalt wekelijks";
  if (frequency === "Monthly") return "Herhaalt maandelijks";
  return "Herhaalt niet";
}
