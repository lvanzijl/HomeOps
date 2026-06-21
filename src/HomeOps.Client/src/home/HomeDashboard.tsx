import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  createCalendarAgendaEvent,
  loadCalendarAgendaData,
} from "../agenda/calendarEventsApi";
import { formatEventTime, hydrateAgendaEvents } from "../agenda/agendaUtils";
import {
  demoReadOnlyEvents,
  demoReadOnlyEventSources,
} from "../demo/demoAgendaData";
import type { EventSource, NormalizedEvent } from "../events/eventSourceModel";
import {
  addShoppingListItem,
  createListsApiClient,
  loadShoppingList,
} from "../shopping/listsApi";
import {
  loadListSummaries,
  type ListSummary,
} from "../shopping/listsSummaryApi";
import { loadTasks } from "../tasks/tasksApi";
import { groupTasksByUrgency } from "../tasks/taskGrouping";
import type { HouseholdTask } from "../tasks/tasksModel";
import { FamilyAvatar } from "./FamilyAvatar";
import { FamilyCelebrationStatus } from "../api/homeOpsApiClient";
import { clampProgress, loadMotivationSnapshot, type MotivationFamilyGoal } from "../motivationData";
import type { FamilyMember } from "./familyMembers";

interface HomeDashboardProps {
  members: readonly FamilyMember[];
  onNavigate: (destination: "agenda" | "lists" | "tasks" | "motivation") => void;
  onSelectFamilyMember: (memberId: string) => void;
  onAddFamilyMember: () => void;
}

type AgendaBucket = "Today" | "Tomorrow" | "Later / Next";
type AgendaSummaryItem = ReturnType<typeof hydrateAgendaEvents>[number] & {
  bucket: AgendaBucket;
};

const visibleAgendaLimit = 5;
const visibleListLimit = 4;
const visibleTaskLimit = 4;

const agendaBucketOrder: readonly AgendaBucket[] = [
  "Today",
  "Tomorrow",
  "Later / Next",
];

export function HomeDashboard({
  members,
  onNavigate,
  onSelectFamilyMember,
  onAddFamilyMember,
}: HomeDashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [motivationFamilyGoal, setMotivationFamilyGoal] = useState<MotivationFamilyGoal | undefined>();
  const [motivationStatus, setMotivationStatus] = useState<"loading" | "ready" | "error">("loading");
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [sources, setSources] = useState<EventSource[]>([
    ...demoReadOnlyEventSources,
  ]);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [shoppingText, setShoppingText] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventWhen, setEventWhen] = useState<"today" | "tomorrow" | "pick">(
    "today",
  );
  const [eventDate, setEventDate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [quickStatus, setQuickStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => loadShoppingHistory());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let ignore = false;
    setMotivationStatus("loading");
    loadMotivationSnapshot()
      .then((snapshot) => {
        if (!ignore) {
          setMotivationFamilyGoal(snapshot.familyGoal);
          setMotivationStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) setMotivationStatus("error");
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    const refreshAgenda = () =>
      loadCalendarAgendaData()
        .then((data) => {
          if (ignore) return;
          setSources([...data.sources, ...demoReadOnlyEventSources]);
          setEvents([...data.events, ...demoReadOnlyEvents]);
          setAgendaError(null);
        })
        .catch(() => {
          if (!ignore) setAgendaError("Agenda summary could not be loaded.");
        });
    const refreshLists = () =>
      loadListSummaries()
        .then((data) => {
          if (ignore) return;
          setLists(data);
          setHistory((current) =>
            mergeShoppingHistory(
              current,
              data.flatMap((list) => list.activeItems.map((item) => item.text)),
            ),
          );
          setListsError(null);
        })
        .catch(() => {
          if (!ignore) setListsError("Lists summary could not be loaded.");
        });
    const refreshTasks = () =>
      loadTasks()
        .then((data) => {
          if (ignore) return;
          setTasks(data);
          setTasksError(null);
        })
        .catch(() => {
          if (!ignore) setTasksError("Tasks summary could not be loaded.");
        });
    refreshAgenda();
    refreshLists();
    refreshTasks();
    return () => {
      ignore = true;
    };
  }, []);

  async function refreshHomeData() {
    const [agendaData, listData, taskData] = await Promise.all([
      loadCalendarAgendaData(),
      loadListSummaries(),
      loadTasks(),
    ]);
    setSources([...agendaData.sources, ...demoReadOnlyEventSources]);
    setEvents([...agendaData.events, ...demoReadOnlyEvents]);
    setLists(listData);
    setTasks(taskData);
  }

  async function handleShoppingSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = shoppingText.trim();
    if (!trimmed) return;
    try {
      const client = createListsApiClient();
      const shopping = await loadShoppingList(client);
      if (!shopping.listId) throw new Error("Shopping list id is required.");
      await addShoppingListItem(client, shopping.listId, trimmed);
      const nextHistory = rememberShoppingItem(history, trimmed);
      setHistory(nextHistory);
      setShoppingText("");
      setQuickStatus(`Added ${trimmed} to Shopping.`);
      await refreshHomeData();
    } catch {
      setListsError("Shopping item could not be added from Home.");
    }
  }

  async function handleCalendarSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = eventTitle.trim();
    if (!trimmed) return;
    try {
      const startsAt = quickEventDate(eventWhen, eventDate, now);
      await createCalendarAgendaEvent({
        title: trimmed,
        startsAt: startsAt.toISOString(),
        allDay: true,
      });
      setEventTitle("");
      setQuickStatus(`Added ${trimmed} to Agenda.`);
      await refreshHomeData();
    } catch {
      setAgendaError("Calendar event could not be added from Home.");
    }
  }

  const agendaItems = useMemo(
    () => buildAgendaSummary(events, sources, now),
    [events, sources, now],
  );
  const visibleAgenda = agendaItems.slice(0, visibleAgendaLimit);
  const agendaGroups = groupAgendaItems(visibleAgenda);
  const hiddenAgendaCount = Math.max(
    0,
    agendaItems.length - visibleAgenda.length,
  );
  const activeListItems = lists.flatMap((list) =>
    list.activeItems.map((item) => ({
      ...item,
      listId: list.id,
      listName: list.name,
    })),
  );
  const visibleListItems = activeListItems.slice(0, visibleListLimit);
  const hiddenListCount = Math.max(
    0,
    activeListItems.length - visibleListItems.length,
  );
  const primaryListName = getPrimaryListName(lists);
  const taskGroups = groupTasksByUrgency(tasks, toDateInputValue(now)).filter(
    (group) => ["overdue", "today", "upcoming"].includes(group.id),
  );
  const summaryTasks = taskGroups.flatMap((group) =>
    group.tasks.map((task) => ({ ...task, groupTitle: group.title })),
  );
  const visibleTasks = summaryTasks.slice(0, visibleTaskLimit);
  const hiddenTaskCount = Math.max(
    0,
    summaryTasks.length - visibleTasks.length,
  );
  const motivationProgress = motivationFamilyGoal ? clampProgress(motivationFamilyGoal.currentProgress, motivationFamilyGoal.targetCount) : 0;

  return (
    <section className="home-dashboard" aria-label="Home dashboard">
      <header className="home-hero">
        <div className="home-date-card" aria-label="Home date and time">
          <p className="eyebrow">Today</p>
          <h2>
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="home-time" aria-label="Current time">
            {now.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="weather-placeholder">Weather ready when connected</p>
        </div>
        <section className="family-strip" aria-label="Family Members">
          {members.map((member) => (
            <button
              className="family-chip"
              key={member.id}
              type="button"
              style={{ "--member-color": member.displayColor } as CSSProperties}
              onClick={() => onSelectFamilyMember(member.id)}
              aria-label={`Open ${member.name} family member page`}
            >
              <FamilyAvatar member={member} />
              <strong>{member.name}</strong>
            </button>
          ))}
        <button className="family-chip add-family-chip" type="button" onClick={onAddFamilyMember} aria-label="Add Family Member"><span aria-hidden="true">＋</span><strong>Add</strong></button>
        </section>
        <section className="quick-capture" aria-label="Quick capture">
          <form className="home-quick-form" onSubmit={handleShoppingSubmit}>
            <label htmlFor="home-shopping-capture">Shopping</label>
            <div className="home-quick-row">
              <input
                id="home-shopping-capture"
                list="home-shopping-suggestions"
                value={shoppingText}
                onChange={(event) => setShoppingText(event.target.value)}
                placeholder="Milk"
                aria-label="Shopping item"
              />
              <button type="submit">Add</button>
            </div>
            <datalist id="home-shopping-suggestions">
              {history
                .filter((item) =>
                  item
                    .toLowerCase()
                    .includes(shoppingText.trim().toLowerCase()),
                )
                .slice(0, 6)
                .map((item) => (
                  <option key={item} value={item} label={getShoppingSuggestionLabel(item, activeListItems)} />
                ))}
            </datalist>
          </form>
          <form className="home-quick-form" onSubmit={handleCalendarSubmit}>
            <label htmlFor="home-event-title">Event</label>
            <div className="home-quick-row">
              <input
                id="home-event-title"
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                placeholder="Swimming lesson"
                aria-label="What"
              />
              <select
                value={eventWhen}
                onChange={(event) =>
                  setEventWhen(
                    event.target.value as "today" | "tomorrow" | "pick",
                  )
                }
                aria-label="When"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="pick">Pick date</option>
              </select>
              {eventWhen === "pick" ? (
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  aria-label="Pick date"
                />
              ) : null}
              <button type="submit">Save</button>
            </div>
          </form>
          {quickStatus ? (
            <p className="home-quick-status" role="status">
              {quickStatus}
            </p>
          ) : null}
        </section>
      </header>

      <div className="home-summary-grid">
        <article
          className="home-summary-card agenda-summary"
          onClick={() => onNavigate("agenda")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("agenda")}
          aria-label="Agenda summary"
        >
          <CardHeader
            title="Agenda"
            action="Open agenda"
            meta={`${visibleAgenda.length} showing`}
          />
          {agendaError ? <p role="alert">{agendaError}</p> : null}
          <div className="agenda-group-list">
            {agendaGroups.map((group) => (
              <section
                className="agenda-summary-group"
                key={group.bucket}
                aria-label={group.bucket}
              >
                <h4>{group.bucket}</h4>
                <ul className="home-summary-list">
                  {group.items.map((event) => (
                    <li key={event.id}>
                      <span>{event.title}</span>
                      <small>{formatEventTime(event)}</small>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {visibleAgenda.length === 0 && !agendaError ? (
            <div className="empty-state-card">
              <strong>Create your first event</strong>
              <p>Events help the household remember important dates and activities.</p>
              <button type="button" onClick={() => onNavigate("agenda")}>Open Agenda</button>
            </div>
          ) : null}
          {hiddenAgendaCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("agenda")}
            >
              +{hiddenAgendaCount} more
            </button>
          ) : null}
        </article>

        <article
          className="home-summary-card lists-summary"
          onClick={() => onNavigate("lists")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("lists")}
          aria-label="Lists summary"
        >
          <CardHeader
            title={primaryListName ? `${primaryListName} lists` : "Lists"}
            action="Open lists"
            meta={`${activeListItems.length} active`}
          />
          {listsError ? <p role="alert">{listsError}</p> : null}
          <ul className="home-summary-list">
            {visibleListItems.map((item) => (
              <li key={`${item.listId}-${item.id}`}>
                <strong>{item.listName}</strong>
                <span>{item.text}{item.preferredStore ? ` (${item.preferredStore})` : ""}</span>
              </li>
            ))}
          </ul>
          {visibleListItems.length === 0 && !listsError ? (
            <div className="empty-state-card">
              <strong>Add your first shopping item</strong>
              <p>Lists help remember shopping, packing, and household items.</p>
              <button type="button" onClick={() => onNavigate("lists")}>Open Lists</button>
            </div>
          ) : null}
          {hiddenListCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("lists")}
            >
              +{hiddenListCount} more
            </button>
          ) : null}
          <p className="home-context-note">
            Shared for {members.length} household members.
          </p>
        </article>

        <article
          className="home-summary-card motivation-summary"
          onClick={() => onNavigate("motivation")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("motivation")}
          aria-label="Motivation summary"
        >
          <CardHeader
            title="Motivation"
            action="View Motivation"
            meta={motivationFamilyGoal ? `${motivationFamilyGoal.currentProgress}/${motivationFamilyGoal.targetCount} ${motivationFamilyGoal.unitLabel}` : motivationStatus === "error" ? "Unavailable" : "Loading"}
          />
          {motivationFamilyGoal ? (
            <>
              <p className="motivation-tile-title">{motivationFamilyGoal.title}</p>
              <div className="progress-bar" aria-label={`Family goal progress ${motivationFamilyGoal.currentProgress} of ${motivationFamilyGoal.targetCount}`}>
                <span style={{ width: `${motivationProgress}%` }} />
              </div>
              {motivationFamilyGoal.celebration ? (
                <div className={`home-celebration-surface ${motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ? "ready" : motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.Celebrated ? "celebrated" : "planned"}`} aria-label="Home celebration">
                  <span aria-hidden="true">🎉</span>
                  <div>
                    <strong>{motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ? "We did it — ready to celebrate" : motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.Celebrated ? "Celebrated together" : "Getting closer"}</strong>
                    <p>{homeCelebrationMessage(motivationFamilyGoal)}</p>
                  </div>
                </div>
              ) : <p className="home-context-note">A shared encouragement goal for the household.</p>}
            </>
          ) : (
            <div className="empty-state-card">
              <strong>Create your first family goal</strong>
              <p>Family goals help everyone work toward something together.</p>
              <button type="button" onClick={() => onNavigate("motivation")}>Open Motivation</button>
            </div>
          )}
        </article>

        <article
          className="home-summary-card tasks-summary"
          onClick={() => onNavigate("tasks")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("tasks")}
          aria-label="Tasks summary"
        >
          <CardHeader
            title="Tasks"
            action="Open tasks"
            meta={`${summaryTasks.length} due soon`}
          />
          {tasksError ? <p role="alert">{tasksError}</p> : null}
          <div className="task-summary-groups">
            {taskGroups.map((group) => {
              const groupVisibleTasks = visibleTasks.filter(
                (task) => task.groupTitle === group.title,
              );
              if (groupVisibleTasks.length === 0) return null;
              return (
                <section
                  className="task-summary-group"
                  key={group.id}
                  aria-label={group.title}
                >
                  <h4>{group.title}</h4>
                  <ul className="home-summary-list task-summary-list">
                    {groupVisibleTasks.map((task) => (
                      <li key={task.id}>
                        <span>{task.title}</span>
                        <small>
                          {formatTaskOwner(task, members)} ·{" "}
                          {formatTaskDue(task)}
                        </small>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          {visibleTasks.length === 0 && !tasksError ? (
            <div className="empty-state-card">
              <strong>Create your first task</strong>
              <p>Tasks help organize household responsibilities.</p>
              <button type="button" onClick={() => onNavigate("tasks")}>Open Tasks</button>
            </div>
          ) : null}
          {hiddenTaskCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("tasks")}
            >
              +{hiddenTaskCount} more
            </button>
          ) : (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("tasks")}
            >
              View Tasks
            </button>
          )}
        </article>
      </div>
    </section>
  );
}

function homeCelebrationMessage(goal: MotivationFamilyGoal) {
  const celebration = goal.celebration;
  if (!celebration) return goal.title;
  const remaining = Math.max(0, goal.targetCount - goal.currentProgress);
  if (celebration.status === FamilyCelebrationStatus.ReadyToCelebrate || remaining === 0) return `${celebration.title} is ready now.`;
  if (celebration.status === FamilyCelebrationStatus.Celebrated) return celebration.title;
  return remaining === 1
    ? `Only 1 more ${goal.unitLabel} until ${celebration.title}.`
    : `Only ${remaining} more ${goal.unitLabel} until ${celebration.title}.`;
}

function CardHeader({
  title,
  action,
  meta,
}: {
  title: string;
  action: string;
  meta?: string;
}) {
  return (
    <div className="home-card-header">
      <div>
        <h3>{title}</h3>
        {meta ? <small>{meta}</small> : null}
      </div>
      <span>{action}</span>
    </div>
  );
}

function buildAgendaSummary(
  events: NormalizedEvent[],
  sources: EventSource[],
  now: Date,
): AgendaSummaryItem[] {
  const hydrated = hydrateAgendaEvents(events, sources).filter(
    (event) => new Date(event.startsAt) >= startOfDay(now),
  );
  const tomorrow = addDays(startOfDay(now), 1);
  const afterTomorrow = addDays(startOfDay(now), 2);
  return hydrated
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .map((event) => ({
      ...event,
      bucket:
        new Date(event.startsAt) < tomorrow
          ? "Today"
          : new Date(event.startsAt) < afterTomorrow
            ? "Tomorrow"
            : "Later / Next",
    }));
}

function groupAgendaItems(items: AgendaSummaryItem[]) {
  return agendaBucketOrder
    .map((bucket) => ({
      bucket,
      items: items.filter((item) => item.bucket === bucket),
    }))
    .filter((group) => group.items.length > 0);
}

function getPrimaryListName(lists: ListSummary[]) {
  return (
    lists.find((list) =>
      ["shopping", "boodschappen"].includes(list.name.trim().toLowerCase()),
    )?.name ?? lists[0]?.name
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const shoppingHistoryKey = "homeops.shopping.history.v1";

function loadShoppingHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(shoppingHistoryKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberShoppingItem(history: string[], item: string): string[] {
  return persistShoppingHistory(mergeShoppingHistory(history, [item]));
}

function mergeShoppingHistory(history: string[], items: string[]): string[] {
  const seen = new Set<string>();
  return [...items, ...history]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);
}

function persistShoppingHistory(history: string[]): string[] {
  try {
    window.localStorage.setItem(shoppingHistoryKey, JSON.stringify(history));
  } catch {
    /* local history is best effort */
  }
  return history;
}

function quickEventDate(
  when: "today" | "tomorrow" | "pick",
  pickedDate: string,
  now: Date,
): Date {
  if (when === "pick" && pickedDate) return localDateFromInput(pickedDate);
  const date = startOfDay(now);
  if (when === "tomorrow") date.setDate(date.getDate() + 1);
  return date;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateFromInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTaskOwner(
  task: HouseholdTask,
  members: readonly FamilyMember[],
) {
  if (task.ownershipKind === "SharedHousehold") return "Shared Household";
  if (task.ownershipKind === "FamilyMember") {
    return (
      members.find((member) => member.id === task.familyMemberId)?.name ??
      "Family Member"
    );
  }
  return "Unassigned";
}

function formatTaskDue(task: HouseholdTask) {
  if (!task.dueDate) return "No due date";
  return `Due ${task.dueDate}`;
}


function getShoppingSuggestionLabel(item: string, activeItems: { text: string; preferredStore?: string | null }[]): string {
  const match = activeItems.find((activeItem) => activeItem.text.toLowerCase() === item.toLowerCase());
  return match?.preferredStore ? `${item} (${match.preferredStore})` : item;
}
