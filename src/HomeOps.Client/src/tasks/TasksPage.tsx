import {
  FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  deleteArchivedTask,
  deleteArchivedTaskTemplate,
  deleteRecurringTaskSeries,
  keepTaskActive,
  loadArchivedTasks,
  loadArchivedTaskTemplates,
  loadTaskTemplates,
  loadTasks,
  moveTaskToSomeday,
  reopenTask,
  restoreArchivedTask,
  restoreTaskTemplate,
  updateTask as saveTask,
  updateTaskTemplate,
} from "./tasksApi";
import { groupTasksByTime } from "./taskGrouping";
import { DecorativeAvatarBadge } from "../avatarContacts/DecorativeAvatar";
import { listKnownPeople } from "../knownPeople/knownPeopleApi";
import type { KnownPerson } from "../knownPeople/knownPeople";
import { DecorativeAvatarPicker, resolveDecorativeAvatar } from "../avatarContacts/DecorativeAvatarPicker";
import { useVisualReviewNow } from "../visualReviewTime";
import type {
  HouseholdTask,
  TaskOwnershipKind,
  TaskRecurrenceFrequency,
  TaskDecorativeAvatarReference,
  TaskTimeGroup,
  TaskTemplate,
} from "./tasksModel";

type TaskDialogQuestion = "title" | "owner" | "date" | "extras";
type PlanningSection = "tomorrow" | "thisWeek" | "later";
type RoutineView = "active" | "archive";
type RoutineItemDraft = {
  key: string;
  title: string;
  ownershipKind: TaskOwnershipKind;
  familyMemberId: string;
  recurrenceFrequency: TaskRecurrenceFrequency;
  dueOffsetDays: string;
};
type TasksPanelState =
  | { kind: "planning"; section: PlanningSection }
  | { kind: "today" }
  | { kind: "completed" }
  | { kind: "someday" }
  | { kind: "templates" }
  | { kind: "archive" }
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
  const [archivedTasks, setArchivedTasks] = useState<readonly HouseholdTask[]>([]);
  const [templates, setTemplates] = useState<readonly TaskTemplate[]>([]);
  const [archivedTemplates, setArchivedTemplates] = useState<readonly TaskTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ownership, setOwnership] = useState<TaskOwnershipKind>("Unassigned");
  const [familyMemberId, setFamilyMemberId] = useState(members[0]?.id ?? "");
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<TaskRecurrenceFrequency>("None");
  const [decorativeAvatar, setDecorativeAvatar] = useState<TaskDecorativeAvatarReference | null>(null);
  const [knownPeople, setKnownPeople] = useState<readonly KnownPerson[]>([]);
  const [editingTask, setEditingTask] = useState<HouseholdTask | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskDialogQuestion, setTaskDialogQuestion] =
    useState<TaskDialogQuestion>("title");
  const [activePanel, setActivePanel] = useState<TasksPanelState | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<HouseholdTask | null>(null);
  const [pendingLifecycleTaskId, setPendingLifecycleTaskId] = useState<string | null>(null);
  const [taskLifecycleError, setTaskLifecycleError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateItems, setTemplateItems] = useState<readonly RoutineItemDraft[]>([
    createRoutineItemDraft(),
  ]);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [routineView, setRoutineView] = useState<RoutineView>("active");
  const [templateDeleteCandidate, setTemplateDeleteCandidate] = useState<TaskTemplate | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [templateLifecycleError, setTemplateLifecycleError] = useState<string | null>(null);
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
    if (!isTaskFormOpen && !editingTask && !activePanel && !deleteCandidate && !templateDeleteCandidate && !isTemplateEditorOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (deleteCandidate) {
          setDeleteCandidate(null);
          setTaskLifecycleError(null);
          return;
        }
        if (templateDeleteCandidate) {
          setTemplateDeleteCandidate(null);
          setTemplateLifecycleError(null);
          return;
        }
        if (isTemplateEditorOpen) {
          resetTemplateEditor();
          return;
        }
        if (isTaskFormOpen || editingTask) {
          resetTaskForm();
          return;
        }

        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [activePanel, deleteCandidate, editingTask, isTaskFormOpen, isTemplateEditorOpen, templateDeleteCandidate]);

  function resetTaskForm() {
    setTitle("");
    setDueDate("");
    setOwnership("Unassigned");
    setRecurrenceFrequency("None");
    setDecorativeAvatar(null);
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
    setDecorativeAvatar(null);
    setTaskDialogQuestion("title");
    setIsTaskFormOpen(true);
  }

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        const [loadedTasks, loadedArchivedTasks, loadedTemplates, loadedArchivedTemplates, loadedKnownPeople] = await Promise.all([
          loadTasks(),
          loadArchivedTasks(),
          loadTaskTemplates(),
          loadArchivedTaskTemplates(),
          listKnownPeople(),
        ]);
        if (!ignore) {
          setTasks(loadedTasks);
          setArchivedTasks(loadedArchivedTasks);
          setTemplates(loadedTemplates);
          setArchivedTemplates(loadedArchivedTemplates);
          setKnownPeople(loadedKnownPeople);
        }
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
        ...(decorativeAvatar || editingTask?.decorativeAvatar ? { decorativeAvatar } : {}),
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
    setTemplateLifecycleError(null);
    try {
      const input = {
        name: templateName,
        description: templateDescription || null,
        items: templateItems.map((item) => ({
          title: item.title,
          ownershipKind: item.ownershipKind,
          familyMemberId: item.ownershipKind === "FamilyMember" ? item.familyMemberId : null,
          recurrenceFrequency: item.recurrenceFrequency,
          dueOffsetDays: item.dueOffsetDays === "" ? null : Number(item.dueOffsetDays),
        })),
      };
      if (editingTemplate) await updateTaskTemplate(editingTemplate.id, input);
      else await createTaskTemplate(input);
      setTemplates(await loadTaskTemplates());
      resetTemplateEditor();
    } catch {
      setTemplateLifecycleError("Routine kon niet worden opgeslagen. Controleer unieke titels, eigenaars en planning.");
    }
  }

  function resetTemplateEditor() {
    setTemplateName("");
    setTemplateDescription("");
    setTemplateItems([createRoutineItemDraft()]);
    setEditingTemplate(null);
    setIsTemplateEditorOpen(false);
    setTemplateLifecycleError(null);
  }

  function openNewTemplateEditor() {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setTemplateItems([createRoutineItemDraft()]);
    setTemplateLifecycleError(null);
    setIsTemplateEditorOpen(true);
  }

  function startEditingTemplate(template: TaskTemplate) {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description ?? "");
    setActivePanel({ kind: "templates" });
    setTemplateItems(template.items.map((item) => createRoutineItemDraft(item)));
    setTemplateLifecycleError(null);
    setIsTemplateEditorOpen(true);
  }

  function updateTemplateItem(key: string, patch: Partial<RoutineItemDraft>) {
    setTemplateItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  function moveTemplateItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= templateItems.length) return;
    setTemplateItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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
    setPendingTemplateId(templateId);
    setTemplateLifecycleError(null);
    try {
      await archiveTaskTemplate(templateId);
      const [active, archived] = await Promise.all([loadTaskTemplates(), loadArchivedTaskTemplates()]);
      setTemplates(active);
      setArchivedTemplates(archived);
    } catch {
      setTemplateLifecycleError("Routine kon niet worden gearchiveerd.");
    } finally {
      setPendingTemplateId(null);
    }
  }

  async function restoreTemplate(templateId: string) {
    setPendingTemplateId(templateId);
    setTemplateLifecycleError(null);
    try {
      await restoreTaskTemplate(templateId);
      const [active, archived] = await Promise.all([loadTaskTemplates(), loadArchivedTaskTemplates()]);
      setTemplates(active);
      setArchivedTemplates(archived);
    } catch {
      setTemplateLifecycleError("Herstellen is niet gelukt. De routine blijft veilig in het archief.");
    } finally {
      setPendingTemplateId(null);
    }
  }

  async function permanentlyDeleteTemplate(template: TaskTemplate) {
    setPendingTemplateId(template.id);
    setTemplateLifecycleError(null);
    try {
      await deleteArchivedTaskTemplate(template.id);
      setArchivedTemplates(await loadArchivedTaskTemplates());
      setTemplateDeleteCandidate(null);
    } catch {
      setTemplateLifecycleError("Permanent verwijderen is niet gelukt. De gearchiveerde routine is behouden.");
    } finally {
      setPendingTemplateId(null);
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
        ...(task.decorativeAvatar ? { decorativeAvatar: task.decorativeAvatar } : {}),
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
    setDecorativeAvatar(task.decorativeAvatar ?? null);
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
      if (action === "archive") setArchivedTasks(await loadArchivedTasks());
    } catch {
      setError("Weekcheck kon niet worden opgeslagen.");
    }
  }

  async function archiveNormalTask(taskId: string) {
    setPendingLifecycleTaskId(taskId);
    setTaskLifecycleError(null);
    try {
      await archiveTask(taskId);
      const [active, archived] = await Promise.all([loadTasks(), loadArchivedTasks()]);
      setTasks(active);
      setArchivedTasks(archived);
    } catch {
      setError("Taak kon niet worden gearchiveerd.");
    } finally {
      setPendingLifecycleTaskId(null);
    }
  }

  async function restoreNormalTask(taskId: string) {
    setPendingLifecycleTaskId(taskId);
    setTaskLifecycleError(null);
    try {
      await restoreArchivedTask(taskId);
      const [active, archived] = await Promise.all([loadTasks(), loadArchivedTasks()]);
      setTasks(active);
      setArchivedTasks(archived);
    } catch {
      setTaskLifecycleError("Herstellen is niet gelukt. De taak blijft veilig in het archief.");
    } finally {
      setPendingLifecycleTaskId(null);
    }
  }

  async function permanentlyDeleteTask(task: HouseholdTask) {
    setPendingLifecycleTaskId(task.id);
    setTaskLifecycleError(null);
    try {
      await deleteArchivedTask(task.id);
      setArchivedTasks(await loadArchivedTasks());
      setDeleteCandidate(null);
    } catch {
      setTaskLifecycleError("Permanent verwijderen is niet gelukt. De gearchiveerde taak is behouden.");
    } finally {
      setPendingLifecycleTaskId(null);
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
        ...(task.decorativeAvatar ? { decorativeAvatar: task.decorativeAvatar } : {}),
      });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setError("Taak kon niet naar morgen worden verplaatst.");
    }
  }

  return (
    <article
      className="tasks-page"
      aria-label="Takenpagina"
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
          knownPeople={knownPeople}
          members={members}
          tasks={isLoading ? [] : visibleTodayTasks}
          todayDate={todayDate}
          todayIso={todayIso}
          onArchive={archiveNormalTask}
          onDeleteSeries={deleteSeries}
          onEdit={startEditing}
          onMoveToTomorrow={moveTaskToTomorrow}
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
          onClick={() => {
            setRoutineView("active");
            setTemplateDeleteCandidate(null);
            setTemplateLifecycleError(null);
            setActivePanel({ kind: "templates" });
          }}
        />
        <TaskSecondaryActionTile
          count={archivedTasks.length}
          description="Herstellen of verwijderen"
          label="Archief"
          onClick={() => {
            setDeleteCandidate(null);
            setTaskLifecycleError(null);
            setActivePanel({ kind: "archive" });
          }}
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
                    <DecorativeAvatarPicker familyMembers={members} knownPeople={knownPeople} suggestionText={title} onChange={setDecorativeAvatar} value={decorativeAvatar} label="Decoratieve avatar voor taak" />
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
                      : activePanel.kind === "archive"
                        ? "Archief"
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
                      : activePanel.kind === "archive"
                        ? "Gearchiveerde taken blijven herstelbaar. Permanent verwijderen kan alleen hier."
                        : "Bekijk losse taken en kies wat het gezin nog helpt."
          }
          onClose={() => {
            setDeleteCandidate(null);
            setTaskLifecycleError(null);
            resetTemplateEditor();
            setTemplateDeleteCandidate(null);
            setTemplateLifecycleError(null);
            setActivePanel(null);
          }}
        >
          {activePanel.kind === "planning" ? (
            <PlanningDetailPanel
              activeSection={activePanel.section}
              laterGroup={laterGroup}
              knownPeople={knownPeople}
              members={members}
              thisWeekGroup={thisWeekGroup}
              todayDate={todayDate}
              todayIso={todayIso}
              tomorrowGroup={tomorrowGroup}
              onArchive={archiveNormalTask}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
              onOpenSection={(section) =>
                setActivePanel({ kind: "planning", section })
              }
              onUpdate={updateTask}
            />
          ) : null}
          {activePanel.kind === "today" ? (
            <TaskGroup
              density="primary"
              group={todayGroup}
              knownPeople={knownPeople}
              members={members}
              tasks={todayGroup.tasks}
              todayDate={todayDate}
              todayIso={todayIso}
              onArchive={archiveNormalTask}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
              onUpdate={updateTask}
              scrollable
            />
          ) : null}
          {activePanel.kind === "completed" ? (
            <TaskGroup
              density="compact"
              group={completedTaskGroup}
              knownPeople={knownPeople}
              members={members}
              tasks={completedTaskGroup.tasks}
              todayDate={todayDate}
              todayIso={todayIso}
              onArchive={archiveNormalTask}
              onDeleteSeries={deleteSeries}
              onEdit={startEditing}
              onMoveToTomorrow={moveTaskToTomorrow}
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
            <section className="task-templates-panel task-overlay-list-panel" aria-label="Routines beheren">
              <div className="task-routine-toolbar">
                <div className="task-planning-segments" role="tablist" aria-label="Routineweergave">
                  <button type="button" role="tab" aria-selected={routineView === "active"} className={routineView === "active" ? "selected" : ""} onClick={() => {
                    resetTemplateEditor();
                    setTemplateDeleteCandidate(null);
                    setRoutineView("active");
                  }}>Actief ({templates.length})</button>
                  <button type="button" role="tab" aria-selected={routineView === "archive"} className={routineView === "archive" ? "selected" : ""} onClick={() => {
                    resetTemplateEditor();
                    setTemplateDeleteCandidate(null);
                    setRoutineView("archive");
                  }}>Archief ({archivedTemplates.length})</button>
                </div>
                {routineView === "active" && !isTemplateEditorOpen ? <button type="button" onClick={openNewTemplateEditor}>Nieuwe routine</button> : null}
              </div>
              {templateLifecycleError ? <p className="shopping-empty" role="alert">{templateLifecycleError}</p> : null}
              {isTemplateEditorOpen ? (
              <form
                className="task-routine-editor"
                aria-label={editingTemplate ? `Routine ${editingTemplate.name} aanpassen` : "Nieuwe routine maken"}
                onSubmit={onSaveTemplate}
              >
                <div className="task-routine-editor-meta">
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
                </div>
                <ol className="task-routine-items-editor task-list-scroll-region" aria-label="Geordende routinestappen">
                  {templateItems.map((item, index) => (
                    <li className="task-routine-item-editor" key={item.key}>
                      <span className="task-routine-position">{index + 1}</span>
                      <label className="task-routine-title-field">
                        <span>Titel stap {index + 1}</span>
                        <input required value={item.title} onChange={(event) => updateTemplateItem(item.key, { title: event.target.value })} />
                      </label>
                      <label>
                        <span>Eigenaar stap {index + 1}</span>
                        <select value={item.ownershipKind} onChange={(event) => updateTemplateItem(item.key, { ownershipKind: event.target.value as TaskOwnershipKind, familyMemberId: event.target.value === "FamilyMember" ? item.familyMemberId || members[0]?.id || "" : "" })}>
                          <option value="Unassigned">Iedereen</option>
                          <option value="SharedHousehold">Hele gezin</option>
                          <option value="FamilyMember">Eén persoon</option>
                        </select>
                      </label>
                      {item.ownershipKind === "FamilyMember" ? (
                        <label>
                          <span>Gezinslid stap {index + 1}</span>
                          <select required value={item.familyMemberId} onChange={(event) => updateTemplateItem(item.key, { familyMemberId: event.target.value })}>
                            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                          </select>
                        </label>
                      ) : null}
                      <label>
                        <span>Herhaling stap {index + 1}</span>
                        <select value={item.recurrenceFrequency} onChange={(event) => updateTemplateItem(item.key, { recurrenceFrequency: event.target.value as TaskRecurrenceFrequency })}>
                          <option value="None">Niet herhalen</option>
                          <option value="Daily">Dagelijks</option>
                          <option value="Weekly">Wekelijks</option>
                          <option value="Monthly">Maandelijks</option>
                        </select>
                      </label>
                      <label>
                        <span>Startoffset stap {index + 1}</span>
                        <input min="0" max="365" type="number" value={item.dueOffsetDays} onChange={(event) => updateTemplateItem(item.key, { dueOffsetDays: event.target.value })} placeholder="Geen datum" />
                      </label>
                      <div className="task-routine-item-actions">
                        <button type="button" disabled={index === 0} aria-label={`Stap ${index + 1} omhoog`} onClick={() => moveTemplateItem(index, -1)}>Omhoog</button>
                        <button type="button" disabled={index === templateItems.length - 1} aria-label={`Stap ${index + 1} omlaag`} onClick={() => moveTemplateItem(index, 1)}>Omlaag</button>
                        <button type="button" disabled={templateItems.length === 1} aria-label={`Stap ${index + 1} verwijderen`} onClick={() => setTemplateItems((current) => current.filter((candidate) => candidate.key !== item.key))}>Verwijderen</button>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="task-routine-editor-actions">
                  <button type="button" className="secondary-action" onClick={() => setTemplateItems((current) => [...current, createRoutineItemDraft()])}>Stap toevoegen</button>
                  <span>Wijzigingen gelden alleen voor toekomstige toepassingen.</span>
                  <button type="button" className="secondary-action" onClick={resetTemplateEditor}>Annuleren</button>
                  <button type="submit">{editingTemplate ? "Routine opslaan" : "Routine maken"}</button>
                </div>
              </form>
              ) : null}
              {!isTemplateEditorOpen && templateDeleteCandidate ? (
                <div className="task-delete-confirmation">
                  <p className="widget-type">Routine definitief verwijderen</p>
                  <h5>{templateDeleteCandidate.name}</h5>
                  <p>De routine en haar stappen verdwijnen permanent. Eerder aangemaakte taken blijven bestaan.</p>
                  <div className="task-delete-confirmation-actions">
                    <button type="button" className="secondary-action" disabled={pendingTemplateId === templateDeleteCandidate.id} onClick={() => {
                      setTemplateDeleteCandidate(null);
                      setTemplateLifecycleError(null);
                    }}>Annuleren</button>
                    <button type="button" className="danger-button" disabled={pendingTemplateId === templateDeleteCandidate.id} onClick={() => void permanentlyDeleteTemplate(templateDeleteCandidate)}>
                      {pendingTemplateId === templateDeleteCandidate.id ? "Verwijderen…" : "Definitief verwijderen"}
                    </button>
                  </div>
                </div>
              ) : null}
              {!isTemplateEditorOpen && !templateDeleteCandidate && routineView === "archive" ? (
                archivedTemplates.length === 0 ? <p className="shopping-empty">Het routinearchief is leeg.</p> : (
                  <ul className="task-list task-list-scroll-region">
                    {archivedTemplates.map((template) => (
                      <li className="task-item task-routine-list-item" key={template.id}>
                        <div><strong>{template.name}</strong><span>{template.items.length} {template.items.length === 1 ? "stap" : "stappen"}</span></div>
                        <button type="button" disabled={pendingTemplateId === template.id} onClick={() => void restoreTemplate(template.id)}>Herstellen</button>
                        <button type="button" className="danger-button" disabled={pendingTemplateId === template.id} onClick={() => {
                          setTemplateLifecycleError(null);
                          setTemplateDeleteCandidate(template);
                        }}>Permanent verwijderen</button>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
              {!isTemplateEditorOpen && !templateDeleteCandidate && routineView === "active" && (templates.length === 0 ? (
                <p className="shopping-empty">Nog geen opgeslagen routines.</p>
              ) : (
                <ul className="task-list task-list-scroll-region">
                  {templates.map((template) => (
                    <li className="task-item task-routine-list-item" key={template.id}>
                      <div>
                        <strong>{template.name}</strong>
                        <span>
                          {template.description ?? "Herbruikbare gezinsroutine"} ·{" "}
                          {template.items.length}{" "}
                          {template.items.length === 1 ? "stap" : "stappen"}
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
                        disabled={pendingTemplateId === template.id}
                        onClick={() => void archiveTemplate(template.id)}
                        type="button"
                      >
                        Archiveren
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </section>
          ) : null}
          {activePanel.kind === "archive" ? (
            <section className="task-archive-panel task-overlay-list-panel" aria-label="Gearchiveerde taken">
              {taskLifecycleError ? <p className="shopping-empty" role="alert">{taskLifecycleError}</p> : null}
              {deleteCandidate ? (
                <div className="task-delete-confirmation">
                  <p className="widget-type">Definitief verwijderen</p>
                  <h5>{deleteCandidate.title}</h5>
                  <p>Deze taak verdwijnt permanent. Dit kan niet ongedaan worden gemaakt.</p>
                  <div className="task-delete-confirmation-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      disabled={pendingLifecycleTaskId === deleteCandidate.id}
                      onClick={() => {
                        setDeleteCandidate(null);
                        setTaskLifecycleError(null);
                      }}
                    >
                      Annuleren
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={pendingLifecycleTaskId === deleteCandidate.id}
                      onClick={() => void permanentlyDeleteTask(deleteCandidate)}
                    >
                      {pendingLifecycleTaskId === deleteCandidate.id ? "Verwijderen…" : "Definitief verwijderen"}
                    </button>
                  </div>
                </div>
              ) : archivedTasks.length === 0 ? (
                <p className="shopping-empty">Het archief is leeg.</p>
              ) : (
                <ul className="task-list task-list-scroll-region">
                  {archivedTasks.map((task) => (
                    <li className="task-item task-archive-item" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.isCompleted ? "Afgerond · " : ""}{formatOwner(task, members)} · {task.dueDate ?? "Zonder datum"}</span>
                      </div>
                      <button
                        type="button"
                        disabled={pendingLifecycleTaskId === task.id}
                        onClick={() => void restoreNormalTask(task.id)}
                      >
                        {pendingLifecycleTaskId === task.id ? "Bezig…" : "Herstellen"}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        disabled={pendingLifecycleTaskId === task.id}
                        onClick={() => {
                          setTaskLifecycleError(null);
                          setDeleteCandidate(task);
                        }}
                      >
                        Permanent verwijderen
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
  knownPeople,
  members,
  thisWeekGroup,
  todayDate,
  todayIso,
  tomorrowGroup,
  onArchive,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onOpenSection,
  onUpdate,
}: {
  activeSection: PlanningSection;
  laterGroup: TaskTimeGroup;
  knownPeople: readonly KnownPerson[];
  members: readonly FamilyMember[];
  thisWeekGroup: TaskTimeGroup;
  todayDate: Date;
  todayIso: string;
  tomorrowGroup: TaskTimeGroup;
  onArchive(id: string): void;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  onOpenSection(section: PlanningSection): void;
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
        knownPeople={knownPeople}
        members={members}
        tasks={activeGroup.tasks}
        todayDate={todayDate}
        todayIso={todayIso}
        onArchive={onArchive}
        onDeleteSeries={onDeleteSeries}
        onEdit={onEdit}
        onMoveToTomorrow={onMoveToTomorrow}
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
  knownPeople,
  members,
  scrollable = false,
  tasks,
  todayDate,
  todayIso,
  onArchive,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onUpdate,
}: {
  countOverride?: number;
  density?: "primary" | "planning" | "compact";
  emptyState?: ReactNode;
  footerAction?: ReactNode;
  group: import("./tasksModel").TaskTimeGroup;
  knownPeople: readonly KnownPerson[];
  members: readonly FamilyMember[];
  scrollable?: boolean;
  tasks: readonly HouseholdTask[];
  todayDate: Date;
  todayIso: string;
  onArchive(id: string): void;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
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
              knownPeople={knownPeople}
              members={members}
              task={task}
              todayDate={todayDate}
              todayIso={todayIso}
              onArchive={onArchive}
              onDeleteSeries={onDeleteSeries}
              onEdit={onEdit}
              onMoveToTomorrow={onMoveToTomorrow}
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
  knownPeople,
  members,
  task,
  todayDate,
  todayIso,
  onArchive,
  onDeleteSeries,
  onEdit,
  onMoveToTomorrow,
  onUpdate,
}: {
  density: "primary" | "planning" | "compact";
  groupId: string;
  knownPeople: readonly KnownPerson[];
  members: readonly FamilyMember[];
  task: HouseholdTask;
  todayDate: Date;
  todayIso: string;
  onArchive(id: string): void;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
  onMoveToTomorrow(task: HouseholdTask): void;
  onUpdate(id: string, action: "complete" | "reopen"): void;
}) {
  const isRecurring = isRecurringTask(task);
  const tomorrow = toDateInputValue(addDays(todayDate, 1));
  const canMoveToTomorrow =
    !task.isCompleted && !isRecurring && task.dueDate !== tomorrow;
  return (
    <li
      className={`task-item operational-task-card rich-task-card ${density === "compact" ? "is-compact-card" : density === "planning" ? "is-planning-card" : "is-primary-card"} ${task.isCompleted ? "is-completed" : ""} ${isRecurring ? "is-recurring" : ""}`}
      key={task.id}
    >
      <div className="task-card-visual" aria-hidden="true">
        <DecorativeAvatarBadge identity={resolveDecorativeAvatar(task.decorativeAvatar, members, knownPeople)} label={`Decoratieve avatar voor ${task.title}`} />
        <TaskCardIcon
          variant={
            task.isCompleted ? "completed" : isRecurring ? "recurring" : groupId
          }
        />
      </div>
      <button
        type="button"
        className="task-card-details"
        aria-label={`Details van ${task.title} openen`}
        onClick={() => onEdit(task)}
      >
        <span className="task-card-content">
          <span className="task-card-main">
            <span className="task-card-status">
              {task.isCompleted
                ? "Afgerond"
                : groupId === "today"
                  ? "Vandaag eerst"
                  : "Gepland"}
            </span>
            <strong>{task.title}</strong>
          </span>
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
        </span>
      </button>
      <div className="task-card-actions" aria-label={`Acties voor ${task.title}`}>
        {!task.isCompleted ? (
          <button
            className="task-action-button primary"
            onClick={() => onUpdate(task.id, "complete")}
            type="button"
            aria-label={`Klaar: ${task.title}`}
          >
            <TaskActionIcon name="complete" />
            <span>Klaar</span>
          </button>
        ) : (
          <button
            className="task-action-button"
            onClick={() => onUpdate(task.id, "reopen")}
            type="button"
            aria-label={`Terugzetten: ${task.title}`}
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
            aria-label={`Morgen plannen: ${task.title}`}
          >
            <TaskActionIcon name="tomorrow" />
            <span>Morgen</span>
          </button>
        ) : null}
        <TaskActionsMenu
          task={task}
          onArchive={onArchive}
          onDeleteSeries={onDeleteSeries}
          onEdit={onEdit}
        />
      </div>
    </li>
  );
}

type TaskMenuPosition = {
  top: number;
  left: number;
  maxHeight: number;
  visibility: "hidden" | "visible";
};

function TaskActionsMenu({
  task,
  onArchive,
  onDeleteSeries,
  onEdit,
}: {
  task: HouseholdTask;
  onArchive(id: string): void;
  onDeleteSeries(id: string): void;
  onEdit(task: HouseholdTask): void;
}) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TaskMenuPosition>({
    top: 0,
    left: 0,
    maxHeight: 0,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) {
        return;
      }

      const viewportMargin = 8;
      const triggerGap = 6;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const maxHeight = Math.max(96, window.innerHeight - viewportMargin * 2);
      const renderedMenuHeight = Math.min(menuRect.height, maxHeight);
      const renderedMenuWidth = Math.min(
        menuRect.width,
        window.innerWidth - viewportMargin * 2,
      );
      const preferredLeft = triggerRect.right - renderedMenuWidth;
      const left = Math.min(
        Math.max(viewportMargin, preferredLeft),
        window.innerWidth - renderedMenuWidth - viewportMargin,
      );
      const fitsBelow =
        triggerRect.bottom + triggerGap + renderedMenuHeight <=
        window.innerHeight - viewportMargin;
      const preferredTop = fitsBelow
        ? triggerRect.bottom + triggerGap
        : triggerRect.top - triggerGap - renderedMenuHeight;
      const top = Math.min(
        Math.max(viewportMargin, preferredTop),
        window.innerHeight - renderedMenuHeight - viewportMargin,
      );

      setPosition({ top, left, maxHeight, visibility: "visible" });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || position.visibility !== "visible") {
      return;
    }

    firstItemRef.current?.focus({ preventScroll: true });
  }, [isOpen, position.visibility]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    const handleUserScroll = () => setIsOpen(false);

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleUserScroll, true);
    window.addEventListener("touchmove", handleUserScroll, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleUserScroll, true);
      window.removeEventListener("touchmove", handleUserScroll, true);
    };
  }, [isOpen]);

  const closeBefore = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="task-action-button more"
        aria-label={`Meer acties voor ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => {
          setPosition({ top: 0, left: 0, maxHeight: 0, visibility: "hidden" });
          setIsOpen((current) => !current);
        }}
      >
        <TaskActionIcon name="more" />
        <span>Meer</span>
      </button>
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="task-actions-menu"
              role="menu"
              aria-label={`Meer acties voor ${task.title}`}
              style={position}
            >
              <button
                ref={firstItemRef}
                className="task-action-button secondary"
                onClick={() => closeBefore(() => onEdit(task))}
                type="button"
                role="menuitem"
                aria-label={`Aanpassen: ${task.title}`}
              >
                <TaskActionIcon name="edit" />
                <span>Aanpassen</span>
              </button>
              {!isRecurringTask(task) ? (
                <button
                  className="task-action-button secondary"
                  onClick={() => closeBefore(() => onArchive(task.id))}
                  type="button"
                  role="menuitem"
                  aria-label={`Archiveren: ${task.title}`}
                >
                  <TaskActionIcon name="more" />
                  <span>Archiveren</span>
                </button>
              ) : null}
              {task.recurringTaskSeriesId ? (
                <button
                  className="task-action-button secondary"
                  onClick={() => closeBefore(() => onDeleteSeries(task.id))}
                  type="button"
                  role="menuitem"
                  aria-label={`Routine verwijderen: ${task.title}`}
                >
                  <TaskActionIcon name="more" />
                  <span>Routine verwijderen</span>
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
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

let routineDraftSequence = 0;

function createRoutineItemDraft(item?: TaskTemplate["items"][number]): RoutineItemDraft {
  routineDraftSequence += 1;
  return {
    key: item?.id ?? `routine-draft-${routineDraftSequence}`,
    title: item?.title ?? "",
    ownershipKind: item?.ownershipKind ?? "Unassigned",
    familyMemberId: item?.familyMemberId ?? "",
    recurrenceFrequency: item?.recurrenceFrequency ?? "None",
    dueOffsetDays: item?.dueOffsetDays === null || item?.dueOffsetDays === undefined ? "" : String(item.dueOffsetDays),
  };
}
