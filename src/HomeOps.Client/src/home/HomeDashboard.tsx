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
  loadShoppingListSummary,
  type ListSummary,
} from "../shopping/listsSummaryApi";
import {
  groupShoppingItemsByPreferredStore,
  isActiveShoppingItem,
} from "../shopping/shoppingGrouping";
import { createTask, loadTasks } from "../tasks/tasksApi";
import { groupTasksByUrgency } from "../tasks/taskGrouping";
import type { HouseholdTask } from "../tasks/tasksModel";
import { HomeOpsIcon } from "../icons/homeOpsIcons";
import { CardHeader, SummaryCard } from "../components/cards/Card";
import { FamilyAvatar } from "./FamilyAvatar";
import { FamilyCelebrationStatus } from "../api/homeOpsApiClient";
import {
  clampProgress,
  loadMotivationSnapshot,
  type MotivationFamilyGoal,
} from "../motivationData";
import type { FamilyMember } from "./familyMembers";

interface HomeDashboardProps {
  members: readonly FamilyMember[];
  onNavigate: (
    destination: "agenda" | "lists" | "tasks" | "motivation",
  ) => void;
  onSelectFamilyMember: (memberId: string) => void;
}

type AgendaBucket = "Vandaag" | "Morgen" | "Later / Volgende";
type AgendaSummaryItem = ReturnType<typeof hydrateAgendaEvents>[number] & {
  bucket: AgendaBucket;
};

const visibleAgendaLimit = 5;
const visibleListLimit = 4;
const visibleTaskLimit = 4;

const agendaBucketOrder: readonly AgendaBucket[] = [
  "Vandaag",
  "Morgen",
  "Later / Volgende",
];

export function HomeDashboard({
  members,
  onNavigate,
  onSelectFamilyMember,
}: HomeDashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [motivationFamilyGoal, setMotivationFamilyGoal] = useState<
    MotivationFamilyGoal | undefined
  >();
  const [motivationStatus, setMotivationStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
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
  const [taskTitle, setTaskTitle] = useState("");
  const [taskOwnerId, setTaskOwnerId] = useState("unassigned");
  const [taskCaptureStep, setTaskCaptureStep] = useState<"title" | "owner">("title");
  const [eventCaptureStep, setEventCaptureStep] = useState<"title" | "when">("title");
  const [eventWhen, setEventWhen] = useState<"today" | "tomorrow" | "pick">(
    "today",
  );
  const [eventDate, setEventDate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [quickStatus, setQuickStatus] = useState<string | null>(null);
  const [isShoppingCaptureOpen, setIsShoppingCaptureOpen] = useState(false);
  const [isEventCaptureOpen, setIsEventCaptureOpen] = useState(false);
  const [isTaskCaptureOpen, setIsTaskCaptureOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(() => loadShoppingHistory());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isShoppingCaptureOpen && !isEventCaptureOpen && !isTaskCaptureOpen)
      return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShoppingCaptureOpen(false);
        setIsEventCaptureOpen(false);
        setIsTaskCaptureOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isShoppingCaptureOpen, isEventCaptureOpen, isTaskCaptureOpen]);

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
    return () => {
      ignore = true;
    };
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
          if (!ignore) setAgendaError("Agenda-overzicht kon niet worden geladen.");
        });
    const refreshLists = () =>
      loadShoppingListSummary()
        .then((data) => {
          if (ignore) return;
          const shoppingLists = data ? [data] : [];
          setLists(shoppingLists);
          setHistory((current) =>
            mergeShoppingHistory(
              current,
              shoppingLists.flatMap((list) => list.activeItems.map((item) => item.text)),
            ),
          );
          setListsError(null);
        })
        .catch(() => {
          if (!ignore) setListsError("Boodschappenoverzicht kon niet worden geladen.");
        });
    const refreshTasks = () =>
      loadTasks()
        .then((data) => {
          if (ignore) return;
          setTasks(data);
          setTasksError(null);
        })
        .catch(() => {
          if (!ignore) setTasksError("Takenoverzicht kon niet worden geladen.");
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
      loadShoppingListSummary(),
      loadTasks(),
    ]);
    setSources([...agendaData.sources, ...demoReadOnlyEventSources]);
    setEvents([...agendaData.events, ...demoReadOnlyEvents]);
    setLists(listData ? [listData] : []);
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
      setIsShoppingCaptureOpen(false);
      setQuickStatus(`${trimmed} toegevoegd aan Boodschappen.`);
      await refreshHomeData();
    } catch {
      setListsError("Boodschap kon niet vanaf Thuis worden toegevoegd.");
    }
  }

  async function handleTaskSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      const ownerId = submitter?.dataset.owner ?? taskOwnerId;
      await createTask({
        title: trimmed,
        dueDate: toDateInputValue(now),
        ...taskOwnerInput(ownerId),
      });
      setTaskTitle("");
      setTaskOwnerId("unassigned");
      setTaskCaptureStep("title");
      setIsTaskCaptureOpen(false);
      setQuickStatus(`${trimmed} toegevoegd aan Taken.`);
      await refreshHomeData();
    } catch {
      setTasksError("Taak kon niet vanaf Thuis worden toegevoegd.");
    }
  }

  async function handleCalendarSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = eventTitle.trim();
    if (!trimmed) return;
    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      const when = (submitter?.dataset.when as "today" | "tomorrow" | "pick" | undefined) ?? eventWhen;
      const startsAt = quickEventDate(when, eventDate, now);
      await createCalendarAgendaEvent({
        title: trimmed,
        startsAt: startsAt.toISOString(),
        allDay: true,
      });
      setEventTitle("");
      setEventCaptureStep("title");
      setEventWhen("today");
      setIsEventCaptureOpen(false);
      setQuickStatus(`${trimmed} toegevoegd aan Agenda.`);
      await refreshHomeData();
    } catch {
      setAgendaError("Afspraak kon niet vanaf Thuis worden toegevoegd.");
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
    list.activeItems
      .map((item) => ({
        ...item,
        listId: list.id,
        listName: list.name,
      }))
      .filter(isActiveShoppingItem),
  );
  const visibleListItems = activeListItems.slice(0, visibleListLimit);
  const visibleListGroups = groupShoppingItemsByPreferredStore(visibleListItems);
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
  const motivationProgress = motivationFamilyGoal
    ? clampProgress(
        motivationFamilyGoal.currentProgress,
        motivationFamilyGoal.targetCount,
      )
    : 0;

  return (
    <section className="home-dashboard" aria-label="Thuisdashboard">
      <header className="home-hero">
        <div className="home-date-card" aria-label="Datum en tijd thuis">
          <p className="eyebrow">Vandaag</p>
          <h2>
            {now.toLocaleDateString("nl-NL", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="home-time" aria-label="Huidige tijd">
            {now.toLocaleTimeString("nl-NL", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <section className="family-strip" aria-label="Gezinsleden">
          {members.map((member) => (
            <button
              className="family-chip"
              key={member.id}
              type="button"
              style={{ "--member-color": member.displayColor } as CSSProperties}
              onClick={() => onSelectFamilyMember(member.id)}
              aria-label={`${member.name} gezinslidpagina openen`}
            >
              <FamilyAvatar member={member} />
              <strong>{member.name}</strong>
            </button>
          ))}
        </section>
      </header>
      {quickStatus ? (
        <p className="home-quick-status" role="status">
          {quickStatus}
        </p>
      ) : null}

      <div className="home-summary-grid">
        <SummaryCard
          className="agenda-summary"
          onClick={() => onNavigate("agenda")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("agenda")}
          aria-label="Agenda-overzicht"
        >
          <CardHeader
            className="home-card-header"
            title="Agenda"
            actions={
              <HomeCardActions
                onAdd={() => setIsEventCaptureOpen(true)}
                onOpen={() => onNavigate("agenda")}
                addLabel="Afspraak toevoegen"
                openLabel="Agenda openen"
              />
            }
            meta={`${visibleAgenda.length} zichtbaar`}
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
              <strong>Maak je eerste afspraak</strong>
              <p>
                Afspraken helpen het gezin belangrijke dagen en activiteiten te onthouden.
              </p>
              <p className="home-context-note">
                Gebruik de actie bovenaan om er één toe te voegen.
              </p>
            </div>
          ) : null}
          {hiddenAgendaCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("agenda")}
            >
              +{hiddenAgendaCount} meer
            </button>
          ) : null}
        </SummaryCard>

        <SummaryCard
          className="tasks-summary"
          onClick={() => onNavigate("tasks")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("tasks")}
          aria-label="Takenoverzicht"
        >
          <CardHeader
            className="home-card-header"
            title="Taken"
            actions={
              <HomeCardActions
                onAdd={() => setIsTaskCaptureOpen(true)}
                onOpen={() => onNavigate("tasks")}
                addLabel="Taak toevoegen"
                openLabel="Taken openen"
              />
            }
            meta={`${summaryTasks.length} binnenkort`}
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
              <strong>Maak je eerste taak</strong>
              <p>Taken helpen gezinsverantwoordelijkheden te organiseren.</p>
              <p className="home-context-note">
                Gebruik de actie bovenaan om er één toe te voegen.
              </p>
            </div>
          ) : null}
          {hiddenTaskCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("tasks")}
            >
              +{hiddenTaskCount} meer
            </button>
          ) : null}
        </SummaryCard>

        <SummaryCard
          className="motivation-summary"
          onClick={() => onNavigate("motivation")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("motivation")}
          aria-label="Motivatie-overzicht"
        >
          <CardHeader
            className="home-card-header"
            title="Motivatie"
            actions={
              <HomeCardActions
                onOpen={() => onNavigate("motivation")}
                openLabel="Motivatie openen"
              />
            }
            meta={
              motivationFamilyGoal
                ? `${motivationFamilyGoal.currentProgress}/${motivationFamilyGoal.targetCount} ${motivationFamilyGoal.unitLabel}`
                : motivationStatus === "error"
                  ? "Niet beschikbaar"
                  : "Laden"
            }
          />
          {motivationFamilyGoal ? (
            <>
              <p className="motivation-tile-title">
                {motivationFamilyGoal.title}
              </p>
              <div
                className="progress-bar"
                aria-label={`Voortgang gezinsdoel ${motivationFamilyGoal.currentProgress} van ${motivationFamilyGoal.targetCount}`}
              >
                <span style={{ width: `${motivationProgress}%` }} />
              </div>
              {motivationFamilyGoal.celebration ? (
                <div
                  className={`home-celebration-surface ${motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ? "ready" : motivationFamilyGoal.celebration.status === FamilyCelebrationStatus.Celebrated ? "celebrated" : "planned"}`}
                  aria-label="Viering thuis"
                >
                  <HomeOpsIcon
                    name={
                      motivationFamilyGoal.celebration.status ===
                      FamilyCelebrationStatus.ReadyToCelebrate
                        ? "celebrationReady"
                        : motivationFamilyGoal.celebration.status ===
                            FamilyCelebrationStatus.Celebrated
                          ? "celebrationCelebrated"
                          : "celebrationUpcoming"
                    }
                    variant="icon"
                  />
                  <div>
                    <strong>
                      {motivationFamilyGoal.celebration.status ===
                      FamilyCelebrationStatus.ReadyToCelebrate
                        ? "Gelukt — klaar om te vieren"
                        : motivationFamilyGoal.celebration.status ===
                            FamilyCelebrationStatus.Celebrated
                          ? "Samen gevierd"
                          : "Komt dichterbij"}
                    </strong>
                    <p>{homeCelebrationMessage(motivationFamilyGoal)}</p>
                  </div>
                </div>
              ) : (
                <p className="home-context-note">
                  Een gezamenlijk aanmoedigingsdoel voor het gezin.
                </p>
              )}
            </>
          ) : (
            <div className="empty-state-card">
              <strong>Maak je eerste gezinsdoel</strong>
              <p>Gezinsdoelen helpen iedereen samen ergens naartoe te werken.</p>
              <p className="home-context-note">
                Open Motivatie via de actie bovenaan.
              </p>
            </div>
          )}
        </SummaryCard>

        <SummaryCard
          className="lists-summary"
          onClick={() => onNavigate("lists")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNavigate("lists")}
          aria-label="Boodschappenoverzicht"
        >
          <CardHeader
            className="home-card-header"
            title={primaryListName ? `${primaryListName}` : "Boodschappen"}
            actions={
              <HomeCardActions
                onAdd={() => setIsShoppingCaptureOpen(true)}
                onOpen={() => onNavigate("lists")}
                addLabel="Boodschap toevoegen"
                openLabel="Boodschappen openen"
              />
            }
            meta={`${activeListItems.length} actief`}
          />
          {listsError ? <p role="alert">{listsError}</p> : null}
          <div className="shopping-summary-groups">
            {visibleListGroups.map((group) => (
              <section
                className="shopping-summary-group"
                key={group.store ?? "zonder-winkel"}
                aria-label={group.label}
              >
                {visibleListGroups.length > 1 ? <h4>{group.label}</h4> : null}
                <ul className="home-summary-list">
                  {group.items.map((item) => (
                    <li key={`${item.listId}-${item.id}`}>
                      <span className="shopping-item-dot" aria-hidden="true" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {visibleListItems.length === 0 && !listsError ? (
            <div className="empty-state-card">
              <strong>Voeg je eerste boodschap toe</strong>
              <p>Boodschappen helpen onthouden wat mee moet naar winkel, tas of huis.</p>
              <p className="home-context-note">
                Gebruik de actie bovenaan om er één toe te voegen.
              </p>
            </div>
          ) : null}
          {hiddenListCount > 0 ? (
            <button
              className="more-link"
              type="button"
              onClick={() => onNavigate("lists")}
            >
              +{hiddenListCount} meer
            </button>
          ) : null}
        </SummaryCard>
      </div>

      {isShoppingCaptureOpen ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => setIsShoppingCaptureOpen(false)}
        >
          <section
            className="home-capture-dialog home-conversation-dialog domain-lists"
            role="dialog"
            aria-modal="true"
            aria-label="Boodschap toevoegen vanaf Thuis"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div className="home-conversation-heading">
                <p className="eyebrow">Snel toevoegen</p>
                <h3>Boodschap toevoegen</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsShoppingCaptureOpen(false)}
                aria-label="Boodschap toevoegen sluiten"
              >
                <HomeOpsIcon name="close" />
              </button>
            </header>
            <form
              className="home-quick-form home-conversation-form event-dialog-form"
              onSubmit={handleShoppingSubmit}
            >
              <div className="home-conversation-panel">
                <label className="home-question-label" htmlFor="home-shopping-capture">
                  Wat hebben we nodig?
                </label>
                <div className="home-quick-row">
                  <input
                    id="home-shopping-capture"
                    autoFocus
                    list="home-shopping-suggestions"
                    value={shoppingText}
                    onChange={(event) => setShoppingText(event.target.value)}
                    placeholder="Melk"
                    aria-label="Wat hebben we nodig?"
                  />
                  <button type="submit">Toevoegen</button>
                </div>
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
                    <option
                      key={item}
                      value={item}
                      label={getShoppingSuggestionLabel(item, activeListItems)}
                    />
                  ))}
              </datalist>
            </form>
          </section>
        </div>
      ) : null}

      {isTaskCaptureOpen ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => setIsTaskCaptureOpen(false)}
        >
          <section
            className="home-capture-dialog home-conversation-dialog domain-tasks"
            role="dialog"
            aria-modal="true"
            aria-label="Taak toevoegen vanaf Thuis"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div className="home-conversation-heading">
                <p className="eyebrow">Snel toevoegen</p>
                <h3>Taak toevoegen</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsTaskCaptureOpen(false)}
                aria-label="Taak toevoegen sluiten"
              >
                <HomeOpsIcon name="close" />
              </button>
            </header>
            <form
              className="home-quick-form home-conversation-form event-dialog-form"
              onSubmit={handleTaskSubmit}
            >
              {taskCaptureStep === "title" ? (
                <div className="home-conversation-panel">
                  <label className="home-question-label" htmlFor="home-task-title">
                    Wat moet er gebeuren?
                  </label>
                  <div className="home-quick-row">
                    <input
                      id="home-task-title"
                      autoFocus
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="Vaatwasser uitruimen"
                      aria-label="Wat moet er gebeuren?"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (taskTitle.trim()) setTaskCaptureStep("owner");
                      }}
                    >
                      Volgende
                    </button>
                  </div>
                </div>
              ) : (
                <div className="home-conversation-panel">
                  <fieldset className="task-choice-group home-choice-group">
                    <legend>Wie doet dit?</legend>
                    <button
                      type="submit"
                      data-owner="unassigned"
                      className={taskOwnerId === "unassigned" ? "selected" : ""}
                      onClick={() => setTaskOwnerId("unassigned")}
                    >
                      Later beslissen
                    </button>
                    <button
                      type="submit"
                      data-owner="shared"
                      className={taskOwnerId === "shared" ? "selected" : ""}
                      onClick={() => setTaskOwnerId("shared")}
                    >
                      Iedereen
                    </button>
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="submit"
                        data-owner={member.id}
                        className={taskOwnerId === member.id ? "selected" : ""}
                        onClick={() => setTaskOwnerId(member.id)}
                      >
                        {member.name}
                      </button>
                    ))}
                  </fieldset>
                </div>
              )}
            </form>
          </section>
        </div>
      ) : null}

      {isEventCaptureOpen ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => setIsEventCaptureOpen(false)}
        >
          <section
            className="home-capture-dialog home-conversation-dialog domain-agenda"
            role="dialog"
            aria-modal="true"
            aria-label="Afspraak toevoegen vanaf Thuis"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div className="home-conversation-heading">
                <p className="eyebrow">Snel toevoegen</p>
                <h3>Afspraak toevoegen</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsEventCaptureOpen(false)}
                aria-label="Afspraak toevoegen sluiten"
              >
                <HomeOpsIcon name="close" />
              </button>
            </header>
            <form
              className="home-quick-form home-conversation-form event-dialog-form"
              onSubmit={handleCalendarSubmit}
            >
              {eventCaptureStep === "title" ? (
                <div className="home-conversation-panel">
                  <label className="home-question-label" htmlFor="home-event-title">
                    Wat gebeurt er?
                  </label>
                  <div className="home-quick-row">
                    <input
                      id="home-event-title"
                      autoFocus
                      value={eventTitle}
                      onChange={(event) => setEventTitle(event.target.value)}
                      placeholder="Zwemles"
                      aria-label="Wat gebeurt er?"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (eventTitle.trim()) setEventCaptureStep("when");
                      }}
                    >
                      Volgende
                    </button>
                  </div>
                </div>
              ) : (
                <div className="home-conversation-panel">
                  <fieldset className="task-choice-group home-choice-group horizontal">
                    <legend>Wanneer?</legend>
                    <button type="submit" data-when="today" onClick={() => setEventWhen("today")}>
                      Vandaag
                    </button>
                    <button type="submit" data-when="tomorrow" onClick={() => setEventWhen("tomorrow")}>
                      Morgen
                    </button>
                    <button
                      type="button"
                      className={eventWhen === "pick" ? "selected" : ""}
                      onClick={() => setEventWhen("pick")}
                    >
                      Datum kiezen
                    </button>
                  </fieldset>
                  {eventWhen === "pick" ? (
                    <div className="home-quick-row">
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(event) => setEventDate(event.target.value)}
                        aria-label="Datum kiezen"
                      />
                      <button type="submit" data-when="pick">Toevoegen</button>
                    </div>
                  ) : null}
                </div>
              )}
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function taskOwnerInput(ownerId: string) {
  if (ownerId === "shared") return { ownershipKind: "SharedHousehold" as const };
  if (ownerId === "unassigned") return { ownershipKind: "Unassigned" as const };
  return { ownershipKind: "FamilyMember" as const, familyMemberId: ownerId };
}

function HomeCardActions({
  onAdd,
  onOpen,
  addLabel,
  openLabel,
}: {
  onAdd?: () => void;
  onOpen: () => void;
  addLabel?: string;
  openLabel: string;
}) {
  return (
    <span className="home-card-actions">
      {onAdd ? (
        <button
          type="button"
          className="home-card-action"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          aria-label={addLabel}
        >
          <HomeOpsIcon name="add" />
        </button>
      ) : null}
      <button
        type="button"
        className="home-card-action"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        aria-label={openLabel}
      >
        <HomeOpsIcon name="open" />
      </button>
    </span>
  );
}

function homeCelebrationMessage(goal: MotivationFamilyGoal) {
  const celebration = goal.celebration;
  if (!celebration) return goal.title;
  const remaining = Math.max(0, goal.targetCount - goal.currentProgress);
  if (
    celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ||
    remaining === 0
  )
    return `${celebration.title} is nu klaar.`;
  if (celebration.status === FamilyCelebrationStatus.Celebrated)
    return celebration.title;
  return remaining === 1
    ? `Nog maar 1 ${goal.unitLabel} tot ${celebration.title}.`
    : `Nog maar ${remaining} ${goal.unitLabel} tot ${celebration.title}.`;
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
  const afterMorgen = addDays(startOfDay(now), 2);
  return hydrated
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .map((event) => ({
      ...event,
      bucket:
        new Date(event.startsAt) < tomorrow
          ? "Vandaag"
          : new Date(event.startsAt) < afterMorgen
            ? "Morgen"
            : "Later / Volgende",
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
  const primary = lists.find((list) =>
    ["shopping", "boodschappen"].includes(list.name.trim().toLowerCase()),
  ) ?? lists[0];
  if (!primary) return undefined;
  return primary.name.trim().toLowerCase() === "shopping" ? "Boodschappen" : primary.name;
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
  if (task.ownershipKind === "SharedHousehold") return "Gezinstaak";
  if (task.ownershipKind === "FamilyMember") {
    return (
      members.find((member) => member.id === task.familyMemberId)?.name ??
      "Gezinslid"
    );
  }
  return "Niet toegewezen";
}

function formatTaskDue(task: HouseholdTask) {
  if (!task.dueDate) return "Geen datum";
  return `Datum ${task.dueDate}`;
}

function getShoppingSuggestionLabel(
  item: string,
  activeItems: { text: string; preferredStore?: string | null }[],
): string {
  const match = activeItems.find(
    (activeItem) => activeItem.text.toLowerCase() === item.toLowerCase(),
  );
  return match?.preferredStore ? `${item} (${match.preferredStore})` : item;
}
