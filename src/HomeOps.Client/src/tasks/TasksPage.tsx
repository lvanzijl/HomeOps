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
import { groupTasksByUrgency } from "./taskGrouping";
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
  const groups = useMemo(() => groupTasksByUrgency(tasks), [tasks]);

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
        if (!ignore) setError("Tasks could not be loaded.");
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
      setError("Task could not be saved.");
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
      setError("Task template could not be saved.");
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
      setError("Task template could not be applied.");
    }
  }

  async function archiveTemplate(templateId: string) {
    try {
      await archiveTaskTemplate(templateId);
      setTemplates(await loadTaskTemplates());
    } catch {
      setError("Task template could not be archived.");
    }
  }

  function onEditTaskDue(task: HouseholdTask) {
    startEditing(task);
    const due = window.prompt(
      "Choose a due date (YYYY-MM-DD)",
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
        .catch(() => setError("Due date could not be saved."));
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
      setError("Recurring task series could not be deleted.");
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
      setError("Review action could not be saved.");
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
      setError("Task could not be updated.");
    }
  }

  return (
    <article className="tasks-page" aria-label="Tasks page">
      <header className="tasks-header page-header-with-actions">
        <div>
          <p className="widget-type">Today’s family help</p>
          <h3>Tasks for the family</h3>
          <p>
            Start with what needs attention, then keep the rest ready for later.
          </p>
        </div>
        {!isLoading && tasks.length > 0 ? (
          <div className="page-header-actions" aria-label="Task primary action">
            <button className="compact-header-action primary" type="button" onClick={openNewTaskDialog}>
              Add family task
            </button>
          </div>
        ) : null}
      </header>
      {error ? (
        <p className="shopping-empty" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="shopping-empty">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state-card page-empty-state">
          <strong>Add the first thing to help with</strong>
          <p>
            Tasks keep family help visible without turning the day into admin.
          </p>
          <button type="button" onClick={openNewTaskDialog}>
            Add a family task
          </button>
        </div>
      ) : (
        groups.map((group) => (
          <TaskGroup
            groupTitle={group.title}
            key={group.id}
            members={members}
            tasks={group.tasks}
            onDeleteSeries={deleteSeries}
            onEdit={startEditing}
            onUpdate={updateTask}
          />
        ))
      )}

      <div className="task-support-actions" aria-label="Task planning actions">
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => setIsTemplatesOpen((open) => !open)}
        >
          Routine starters
        </button>
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => setIsWeeklyResetOpen((open) => !open)}
        >
          Plan the week
          {reviewTasks.length > 0 ? ` (${reviewTasks.length})` : ""}
        </button>
        {onOpenWeeklyReset ? (
          <button
            type="button"
            className="secondary-action compact-action"
            onClick={onOpenWeeklyReset}
          >
            Open family reset
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
            className="task-dialog task-conversation-dialog task-management-section"
            role="dialog"
            aria-modal="true"
            aria-label={editingTask ? "Adjust task" : "Add family task"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-conversation-heading">
              <p className="widget-type">Family help</p>
              <h4>
                {editingTask
                  ? "Let’s adjust this task"
                  : "Let’s add one helpful thing"}
              </h4>
              <p>
                {taskDialogPrompt(taskDialogQuestion, editingTask !== null)}
              </p>
            </div>
            <form
              className="task-create-form compact-task-form task-conversation-form"
              onSubmit={onCreate}
            >
              <div className="task-conversation-panel" key={taskDialogQuestion}>
                {taskDialogQuestion === "title" ? (
                  <label className="task-conversation-question">
                    <span>What needs to be done?</span>
                    <input
                      id="task-title"
                      autoFocus
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Empty dishwasher"
                      required
                      type="text"
                      value={title}
                    />
                  </label>
                ) : null}

                {taskDialogQuestion === "owner" ? (
                  <fieldset className="task-choice-group">
                    <legend>Who should do this?</legend>
                    <button
                      type="button"
                      className={ownership === "Unassigned" ? "selected" : ""}
                      onClick={() => setOwnership("Unassigned")}
                    >
                      Anyone can help
                    </button>
                    <button
                      type="button"
                      className={
                        ownership === "SharedHousehold" ? "selected" : ""
                      }
                      onClick={() => setOwnership("SharedHousehold")}
                    >
                      Whole family
                    </button>
                    <button
                      type="button"
                      className={ownership === "FamilyMember" ? "selected" : ""}
                      onClick={() => setOwnership("FamilyMember")}
                    >
                      One person
                    </button>
                    {ownership === "FamilyMember" ? (
                      <label className="task-conversation-question compact">
                        <span>Choose someone</span>
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
                      When should it happen?
                    </p>
                    <div
                      className="task-choice-group horizontal"
                      aria-label="Task due date shortcuts"
                    >
                      <button
                        type="button"
                        onClick={() => setDueDate(toDateInputValue(new Date()))}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDueDate(toDateInputValue(addDays(new Date(), 1)))
                        }
                      >
                        Tomorrow
                      </button>
                      <button type="button" onClick={() => setDueDate("")}>
                        Someday
                      </button>
                    </div>
                    <label className="task-conversation-question compact">
                      <span>Or pick a date</span>
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
                    <p className="task-question-label">Anything else?</p>
                    <label className="task-conversation-question compact">
                      <span>Repeats</span>
                      <select
                        autoFocus
                        onChange={(event) =>
                          setRecurrenceFrequency(
                            event.target.value as TaskRecurrenceFrequency,
                          )
                        }
                        value={recurrenceFrequency}
                      >
                        <option value="None">Does not repeat</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
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
                    Back
                  </button>
                ) : null}
                {taskDialogQuestion === "extras" ? (
                  <button type="submit">
                    {editingTask ? "Save task" : "Create task"}
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
                    Continue
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <section
        className="task-secondary-stack"
        aria-label="Family task planning"
      >
        {isTemplatesOpen ? (
          <section
            className="task-templates-panel"
            aria-label="Routine starters"
          >
            <div>
              <p className="widget-type">Routine starters</p>
              <h4>Saved family rhythms</h4>
              <p>
                Reuse common chores and routines after today’s needs are clear.
              </p>
            </div>
            <form
              className="task-create-form compact-task-form"
              onSubmit={onSaveTemplate}
            >
              <label>
                <span>Routine name</span>
                <input
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="Morning routine"
                  required
                  type="text"
                  value={templateName}
                />
              </label>
              <label>
                <span>Description</span>
                <input
                  onChange={(event) =>
                    setTemplateDescription(event.target.value)
                  }
                  placeholder="Optional notes"
                  type="text"
                  value={templateDescription}
                />
              </label>
              <button type="submit">
                {editingTemplate ? "Save routine" : "Save as routine starter"}
              </button>
            </form>
            {templates.length === 0 ? (
              <p className="shopping-empty">No saved routines yet.</p>
            ) : (
              <ul className="task-list">
                {templates.map((template) => (
                  <li className="task-item" key={template.id}>
                    <div>
                      <strong>{template.name}</strong>
                      <span>
                        {template.description ?? "Reusable family routine"} ·{" "}
                        {template.items.length} task
                        {template.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <button
                      onClick={() => applyTemplate(template.id)}
                      type="button"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => startEditingTemplate(template)}
                      type="button"
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => archiveTemplate(template.id)}
                      type="button"
                    >
                      Archive
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        {isWeeklyResetOpen ? (
          <section className="task-templates-panel" aria-label="Plan the week">
            <div>
              <p className="widget-type">Weekly Reset</p>
              <h4>Plan the week together</h4>
              <p>Check loose tasks and decide what still helps the family.</p>
            </div>
            {reviewTasks.length === 0 ? (
              <p className="shopping-empty">
                No loose tasks need a family check-in right now.
              </p>
            ) : (
              <ul className="task-list">
                {reviewTasks.map((task) => (
                  <li className="task-item" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>Family check-in · not shown as urgent</span>
                    </div>
                    <button
                      onClick={() => reviewTask(task.id, "keep")}
                      type="button"
                    >
                      Keep for this week
                    </button>
                    <button onClick={() => onEditTaskDue(task)} type="button">
                      Pick a helpful day
                    </button>
                    <button
                      onClick={() => reviewTask(task.id, "someday")}
                      type="button"
                    >
                      Save for later
                    </button>
                    <button
                      onClick={() => reviewTask(task.id, "complete")}
                      type="button"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => reviewTask(task.id, "archive")}
                      type="button"
                    >
                      Archive
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        {somedayTasks.length > 0 ? (
          <section className="task-group task-planning-group">
            <h4>Someday</h4>
            <p className="shopping-empty">
              Ideas for later, kept away from today’s pressure.
            </p>
            <ul className="task-list">
              {somedayTasks.map((task) => (
                <li className="task-item" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>Someday</span>
                  </div>
                  <button
                    onClick={() => reviewTask(task.id, "keep")}
                    type="button"
                  >
                    Bring back this week
                  </button>
                  <button
                    onClick={() => reviewTask(task.id, "archive")}
                    type="button"
                  >
                    Archive
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
  groupTitle,
  members,
  tasks,
  onDeleteSeries,
  onEdit,
  onUpdate,
}: {
  groupTitle: string;
  members: readonly FamilyMember[];
  tasks: readonly HouseholdTask[];
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  return (
    <section className="task-group">
      <h4>{groupTitle}</h4>
      {tasks.length === 0 ? (
        <p className="shopping-empty">Nothing here right now.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className="task-item" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>
                  {formatOwner(task, members)}
                  {task.dueDate ? ` · Due ${task.dueDate}` : ""}
                  {(task.recurrenceFrequency ?? "None") !== "None"
                    ? ` · Repeats ${(task.recurrenceFrequency ?? "None").toLowerCase()}`
                    : ""}
                </span>
              </div>
              <button onClick={() => onEdit(task)} type="button">
                Adjust
              </button>
              {task.recurringTaskSeriesId ? (
                <button onClick={() => onDeleteSeries(task.id)} type="button">
                  Remove routine
                </button>
              ) : null}
              <button
                onClick={() =>
                  onUpdate(task.id, task.isCompleted ? "reopen" : "complete")
                }
                type="button"
              >
                {task.isCompleted ? "Bring back" : "Done"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
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

function taskDialogPrompt(question: TaskDialogQuestion, isEditing: boolean) {
  if (question === "title")
    return isEditing
      ? "Start with the name so everyone recognizes it."
      : "Start with the one thing that would help the household.";
  if (question === "owner")
    return "Choose a helper, or leave it open for anyone.";
  if (question === "date")
    return "Today is ready by default, but you can move it.";
  return "Optional details stay tucked away unless they help.";
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
        "one person")
      : ownership === "SharedHousehold"
        ? "the whole family"
        : "anyone";
  const when = dueDate ? `on ${dueDate}` : "someday";
  const repeats =
    recurrenceFrequency === "None"
      ? ""
      : ` and repeats ${recurrenceFrequency.toLowerCase()}`;
  return `${title.trim() || "This task"} is for ${owner} ${when}${repeats}.`;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatOwner(
  task: Pick<HouseholdTask, "ownershipKind" | "familyMemberId">,
  members: readonly FamilyMember[] = fallbackFamilyMembers,
): string {
  if (task.ownershipKind === "SharedHousehold") return "Whole family";
  if (task.ownershipKind === "FamilyMember")
    return (
      members.find((member) => member.id === task.familyMemberId)?.name ??
      "Family member"
    );
  return "Anyone";
}
