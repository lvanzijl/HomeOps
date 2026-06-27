import { useEffect, useMemo, useState } from "react";
import {
  filterEventsBySource,
  formatEventTime,
  hydrateAgendaEvents,
} from "../../agenda/agendaUtils";
import {
  createCalendarAgendaEvent,
  deleteCalendarAgendaEvent,
  loadCalendarAgendaData,
  updateCalendarAgendaEvent,
  type EventSeriesInput,
} from "../../agenda/calendarEventsApi";
import { useAgendaLayerSettings } from "../../agenda/layerSettings";
import {
  demoReadOnlyEvents,
  demoReadOnlyEventSources,
  demoToday,
} from "../../demo/demoAgendaData";
import type {
  EventSource,
  NormalizedEvent,
} from "../../events/eventSourceModel";
import type { WidgetRenderProps } from "../WidgetRenderer";

type EventDialogQuestion = "title" | "date" | "dayKind" | "details";
type AgendaWorkspaceMode = "month" | "week" | "list";

type EventFormState = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
};

function createEmptyForm(date = todayIsoDate()): EventFormState {
  return {
    title: "",
    description: "",
    startsAt: `${date}T09:00`,
    endsAt: `${date}T10:00`,
    allDay: false,
  };
}

const emptyForm: EventFormState = createEmptyForm();

export function AgendaWidget({ instance }: WidgetRenderProps) {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [activeWorkspaceMode, setActiveWorkspaceMode] =
    useState<AgendaWorkspaceMode>("month");
  const [weekAnchorDate, setWeekAnchorDate] = useState(todayIsoDate());
  const [calendarEvents, setCalendarEvents] = useState<NormalizedEvent[]>([]);
  const [calendarSources, setCalendarSources] = useState<EventSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventDialogQuestion, setEventDialogQuestion] =
    useState<EventDialogQuestion>("title");

  useEffect(() => {
    let isMounted = true;

    loadCalendarAgendaData()
      .then((data) => {
        if (!isMounted) return;
        setCalendarSources(data.sources);
        setCalendarEvents(data.events);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "HomeOps Agenda-gebeurtenissen konden niet worden geladen.",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEventFormOpen && editingEventId === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEventForm();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [editingEventId, isEventFormOpen]);

  const eventSources = useMemo(
    () => [...calendarSources, ...demoReadOnlyEventSources],
    [calendarSources],
  );
  const events = useMemo(
    () => [...calendarEvents, ...demoReadOnlyEvents],
    [calendarEvents],
  );
  const { settings, setSourceEnabled } = useAgendaLayerSettings(eventSources);

  const layerView = activeWorkspaceMode === "week" ? "week" : "months";
  const selectedSources = settings[layerView].enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(events, selectedSources);
    return hydrateAgendaEvents(filteredEvents, eventSources);
  }, [events, eventSources, selectedSources]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toEventSeriesInput(form);

    const validationError = validateEventForm(form);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const savedEvent = editingEventId
        ? await updateCalendarAgendaEvent(editingEventId, input)
        : await createCalendarAgendaEvent(input);

      setCalendarEvents((current) => {
        const withoutSaved = current.filter(
          (calendarEvent) => calendarEvent.id !== savedEvent.id,
        );
        return [...withoutSaved, savedEvent];
      });
      closeEventForm();
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "De gebeurtenis kon niet worden opgeslagen."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function closeEventForm() {
    setEditingEventId(null);
    setIsEventFormOpen(false);
    setEventDialogQuestion("title");
    setForm(emptyForm);
  }

  function openNewEventForm(date = selectedDate || todayIsoDate()) {
    setEditingEventId(null);
    setSelectedDate(date);
    setForm(createEmptyForm(date));
    setEventDialogQuestion("title");
    setIsEventFormOpen(true);
  }

  function startEditing(event: NormalizedEvent) {
    setEditingEventId(event.id);
    setIsEventFormOpen(true);
    setEventDialogQuestion("title");
    setForm({
      title: event.title,
      description: event.description ?? "",
      startsAt: toDateTimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDateTimeLocal(event.endsAt) : "",
      allDay: event.allDay,
    });
  }

  async function removeEvent(eventId: string) {
    setDeletingEventId(eventId);
    try {
      await deleteCalendarAgendaEvent(eventId);
      setCalendarEvents((current) =>
        current.filter((event) => event.id !== eventId),
      );
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "De gebeurtenis kon niet worden verwijderd."),
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <article className="widget-card agenda-widget" aria-label={instance.title}>
      <div className="agenda-header">
        <div>
          <p className="widget-type">Familieplanning</p>
          <h3>{instance.title}</h3>
          <p>Plan de maand, bekijk de week en zie wat eraan komt.</p>
        </div>
        <div className="agenda-workspace-toggle" aria-label="Agenda weergave">
          <button
            aria-pressed={activeWorkspaceMode === "month"}
            onClick={() => setActiveWorkspaceMode("month")}
            type="button"
          >
            Maand
          </button>
          <button
            aria-pressed={activeWorkspaceMode === "week"}
            onClick={() => setActiveWorkspaceMode("week")}
            type="button"
          >
            Week
          </button>
          <button
            aria-pressed={activeWorkspaceMode === "list"}
            onClick={() => setActiveWorkspaceMode("list")}
            type="button"
          >
            Lijst
          </button>
        </div>
      </div>

      {isLoading ? <p role="status">Agenda laden…</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {isEventFormOpen || editingEventId !== null ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={closeEventForm}
        >
          <section
            className="home-capture-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingEventId ? "Gebeurtenis bewerken" : "Gebeurtenis toevoegen"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>
                  {editingEventId
                    ? "Gebeurtenis bewerken"
                    : "Gebeurtenis toevoegen"}
                </h3>
                <p>
                  Begin met wat er gebeurt. De gekozen dag staat alvast klaar.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeEventForm}
                aria-label="Sluit gebeurtenisvenster"
              >
                ×
              </button>
            </header>
            <EventConversationForm
              form={form}
              isEditing={editingEventId !== null}
              isSaving={isSaving}
              question={eventDialogQuestion}
              onChange={setForm}
              onQuestionChange={setEventDialogQuestion}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      ) : null}

      <fieldset className="source-selector">
        <legend>Bronnen</legend>
        {eventSources.map((source) => (
          <label key={source.id}>
            <input
              checked={selectedSources[source.id] ?? false}
              onChange={(event) =>
                setSourceEnabled(layerView, source.id, event.target.checked)
              }
              type="checkbox"
            />
            <span
              className="source-color"
              style={{ backgroundColor: source.color.hex }}
              aria-hidden="true"
            />
            {source.name}
          </label>
        ))}
      </fieldset>

      {activeWorkspaceMode === "month" ? (
        <MonthWorkspace
          deletingEventId={deletingEventId}
          events={agendaEvents}
          isEmpty={agendaEvents.length === 0 && !isLoading && !errorMessage}
          onAddEvent={openNewEventForm}
          onDelete={removeEvent}
          onEdit={startEditing}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
          today={todayIsoDate()}
        />
      ) : activeWorkspaceMode === "week" ? (
        <WeekWorkspace
          anchorDate={weekAnchorDate}
          deletingEventId={deletingEventId}
          events={agendaEvents}
          onDelete={removeEvent}
          onEdit={startEditing}
          onNavigate={setWeekAnchorDate}
          today={todayIsoDate()}
        />
      ) : (
        <ListWorkspace
          deletingEventId={deletingEventId}
          events={agendaEvents}
          onDelete={removeEvent}
          onEdit={startEditing}
          today={todayIsoDate()}
        />
      )}
    </article>
  );
}

function EventConversationForm({
  form,
  isEditing,
  isSaving,
  question,
  onChange,
  onQuestionChange,
  onSubmit,
}: {
  form: EventFormState;
  isEditing: boolean;
  isSaving: boolean;
  question: EventDialogQuestion;
  onChange: (form: EventFormState) => void;
  onQuestionChange: (question: EventDialogQuestion) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const titleIsValid = form.title.trim().length > 0;
  const submitLabel = isEditing ? "Gebeurtenis opslaan" : "Gebeurtenis maken";

  return (
    <form
      className="calendar-event-form task-conversation-form"
      onSubmit={onSubmit}
      aria-label="Calendar event conversation"
    >
      <div className="task-conversation-panel" key={question}>
        {question === "title" ? (
          <label className="task-conversation-question">
            <span>Wat gebeurt er?</span>
            <input
              autoFocus
              value={form.title}
              onChange={(event) =>
                onChange({ ...form, title: event.target.value })
              }
              id="calendar-event-title"
              placeholder="Zwemles"
              required
            />
          </label>
        ) : null}

        {question === "date" ? (
          <div className="task-date-question">
            <p className="task-question-label">
              Wanneer moet het gezin dit onthouden?
            </p>
            <div
              className="task-choice-group horizontal"
              aria-label="Snelle datumkeuzes"
            >
              <button
                type="button"
                onClick={() => onChange(setEventDate(form, demoToday))}
              >
                Vandaag
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(setEventDate(form, addDaysIso(demoToday, 1)))
                }
              >
                Morgen
              </button>
              <button
                type="button"
                onClick={() => onChange(setEventDate(form, getEventDate(form)))}
              >
                Kies datum
              </button>
            </div>
            <label className="task-conversation-question compact">
              <span>Kies datum</span>
              <input
                autoFocus
                type="date"
                value={getEventDate(form)}
                onChange={(event) =>
                  onChange(setEventDate(form, event.target.value))
                }
              />
            </label>
          </div>
        ) : null}

        {question === "dayKind" ? (
          <div className="task-date-question">
            <p className="task-question-label">Duurt het de hele dag?</p>
            <div
              className="task-choice-group horizontal"
              aria-label="Soort tijd"
            >
              <button
                type="button"
                className={form.allDay ? "selected" : ""}
                onClick={() => onChange(toAllDayState(form, true))}
              >
                Hele dag
              </button>
              <button
                type="button"
                className={!form.allDay ? "selected" : ""}
                onClick={() => onChange(toAllDayState(form, false))}
              >
                Kies een tijd
              </button>
            </div>
            {form.allDay ? (
              <div className="agenda-time-grid">
                <label className="task-conversation-question compact">
                  <span>Datum</span>
                  <input
                    autoFocus
                    type="date"
                    value={getEventDate(form)}
                    onChange={(event) =>
                      onChange(setEventDate(form, event.target.value))
                    }
                  />
                </label>
                <label className="task-conversation-question compact">
                  <span>Einddatum</span>
                  <input
                    type="date"
                    value={
                      form.endsAt
                        ? form.endsAt.slice(0, 10)
                        : getEventDate(form)
                    }
                    onChange={(event) =>
                      onChange(setAllDayEndDate(form, event.target.value))
                    }
                  />
                </label>
                <p className="task-dialog-summary">
                  We bewaren dit als gebeurtenis voor de hele dag.
                </p>
              </div>
            ) : (
              <div className="agenda-time-grid">
                <label className="task-conversation-question compact">
                  <span>Begintijd</span>
                  <input
                    autoFocus
                    type="time"
                    value={getEventTime(form.startsAt, "09:00")}
                    onChange={(event) =>
                      onChange(
                        setEventTime(form, "startsAt", event.target.value),
                      )
                    }
                  />
                </label>
                <label className="task-conversation-question compact">
                  <span>Eindtijd</span>
                  <input
                    type="time"
                    value={getEventTime(form.endsAt, "10:00")}
                    onChange={(event) =>
                      onChange(setEventTime(form, "endsAt", event.target.value))
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ) : null}

        {question === "details" ? (
          <div className="task-extras-question">
            <label className="task-conversation-question">
              <span>Nog details?</span>
              <input
                autoFocus
                value={form.description}
                onChange={(event) =>
                  onChange({ ...form, description: event.target.value })
                }
                placeholder="Optionele notitie voor het gezin"
              />
            </label>
            <p className="task-dialog-summary">{eventSummary(form)}</p>
          </div>
        ) : null}
      </div>

      <div className="task-conversation-actions">
        {question !== "title" ? (
          <button
            type="button"
            className="secondary-action"
            onClick={() => onQuestionChange(previousEventQuestion(question))}
          >
            Terug
          </button>
        ) : null}
        {question === "details" ? (
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Opslaan…" : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onQuestionChange(nextEventQuestion(question))}
            disabled={question === "title" && !titleIsValid}
          >
            Verder
          </button>
        )}
      </div>
    </form>
  );
}

function ListWorkspace({
  deletingEventId,
  events,
  onDelete,
  onEdit,
  today,
}: {
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  today: string;
}) {
  const timelineGroups = useMemo(
    () => buildTimelineGroups(events, today),
    [events, today],
  );
  const upcomingEventCount = timelineGroups.reduce(
    (count, group) => count + group.events.length,
    0,
  );

  return (
    <section className="agenda-list-workspace" aria-label="Lijstplanning">
      <header className="agenda-list-header">
        <div>
          <p className="eyebrow">Chronologisch overzicht</p>
          <h4>Wat komt eraan?</h4>
          <p>
            Een rustige tijdlijn van de komende gezinsmomenten, van vandaag naar
            later.
          </p>
        </div>
        <span>
          {upcomingEventCount === 0
            ? "Geen komende momenten"
            : upcomingEventCount === 1
              ? "1 komend moment"
              : `${upcomingEventCount} komende momenten`}
        </span>
      </header>

      {timelineGroups.length > 0 ? (
        <div className="agenda-timeline-groups">
          {timelineGroups.map((group) => (
            <AgendaTimelineGroup
              deletingEventId={deletingEventId}
              group={group}
              key={group.key}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <div className="agenda-list-empty-state">
          <strong>Even niets dat om aandacht vraagt</strong>
          <p>
            Er staan geen komende gebeurtenissen in de agenda. Mooi moment om
            samen adem te halen.
          </p>
        </div>
      )}
    </section>
  );
}

function AgendaTimelineGroup({
  deletingEventId,
  group,
  onDelete,
  onEdit,
}: {
  deletingEventId: string | null;
  group: TimelineGroup;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  const visibleIndicators = group.events.slice(0, maxMonthIndicators);
  const overflowCount = Math.max(0, group.events.length - maxMonthIndicators);

  return (
    <section className="agenda-timeline-group" aria-label={group.label}>
      <header className="agenda-timeline-group-header">
        <div>
          <h5>{group.label}</h5>
          <p>{group.description}</p>
        </div>
        <div className="agenda-timeline-group-indicators" aria-hidden="true">
          {visibleIndicators.map((event) => {
            const visual = getAgendaEventVisual(event);
            return (
              <span
                className="agenda-event-indicator"
                key={event.id}
                style={toEventVisualStyle(visual)}
                title={visual.label}
              >
                {visual.icon}
              </span>
            );
          })}
          {overflowCount > 0 ? (
            <span className="agenda-event-overflow">+{overflowCount}</span>
          ) : null}
        </div>
      </header>
      <AgendaEventList
        deletingEventId={deletingEventId}
        events={group.events}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </section>
  );
}

function WeekWorkspace({
  anchorDate,
  deletingEventId,
  events,
  onDelete,
  onEdit,
  onNavigate,
  today,
}: {
  anchorDate: string;
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  onNavigate: (date: string) => void;
  today: string;
}) {
  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const weekEvents = weekDays.flatMap(
    (day) => eventsByDate.get(day.date) ?? [],
  );

  return (
    <section className="agenda-week-workspace" aria-label="Weekplanning">
      <header className="agenda-week-header">
        <div>
          <p className="eyebrow">Weekplanning</p>
          <h4>{formatWeekRange(weekStart, weekEnd)}</h4>
          <p>Wat gebeurt er deze week, en waar wordt het druk?</p>
        </div>
        <div className="agenda-week-navigation" aria-label="Weeknavigatie">
          <button
            type="button"
            onClick={() => onNavigate(addDaysIso(weekStart, -7))}
          >
            Vorige week
          </button>
          <button type="button" onClick={() => onNavigate(today)}>
            Deze week
          </button>
          <button
            type="button"
            onClick={() => onNavigate(addDaysIso(weekStart, 7))}
          >
            Volgende week
          </button>
        </div>
      </header>

      {weekEvents.length === 0 ? (
        <div className="agenda-week-empty-state">
          <strong>Een rustige week in zicht</strong>
          <p>
            Er staat nog weinig op de planning. Mooi moment om samen vooruit te
            kijken.
          </p>
        </div>
      ) : null}

      <div className="agenda-week-grid">
        {weekDays.map((day) => (
          <WeekDayCard
            date={day.date}
            deletingEventId={deletingEventId}
            events={eventsByDate.get(day.date) ?? []}
            isToday={day.date === today}
            key={day.date}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

function WeekDayCard({
  date,
  deletingEventId,
  events,
  isToday,
  onDelete,
  onEdit,
}: {
  date: string;
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  isToday: boolean;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  const visibleIndicators = events.slice(0, maxMonthIndicators);
  const overflowCount = Math.max(0, events.length - maxMonthIndicators);
  const visibleEvents = events.slice(0, maxWeekEventsPerDay);
  const hiddenEventCount = Math.max(0, events.length - maxWeekEventsPerDay);

  return (
    <article
      className={["agenda-week-day-card", isToday ? "today" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${formatDutchDay(date)}, ${events.length} ${events.length === 1 ? "gebeurtenis" : "gebeurtenissen"}`}
    >
      <header className="agenda-week-day-header">
        <div>
          <p>{formatDutchWeekday(date)}</p>
          <h5>{formatDutchShortDate(date)}</h5>
        </div>
        {isToday ? <span>Vandaag</span> : null}
      </header>

      {events.length > 0 ? (
        <>
          <div className="agenda-week-day-indicators" aria-hidden="true">
            {visibleIndicators.map((event) => {
              const visual = getAgendaEventVisual(event);
              return (
                <span
                  className="agenda-event-indicator"
                  key={event.id}
                  style={toEventVisualStyle(visual)}
                  title={visual.label}
                >
                  {visual.icon}
                </span>
              );
            })}
            {overflowCount > 0 ? (
              <span className="agenda-event-overflow">+{overflowCount}</span>
            ) : null}
          </div>
          <p className="agenda-week-day-summary">
            {events.length === 1
              ? "1 moment om rekening mee te houden."
              : `${events.length} momenten op de gezinsplanning.`}
          </p>
          <AgendaEventList
            deletingEventId={deletingEventId}
            events={visibleEvents}
            onDelete={onDelete}
            onEdit={onEdit}
          />
          {hiddenEventCount > 0 ? (
            <p className="agenda-week-more">
              +{hiddenEventCount} meer voor deze dag
            </p>
          ) : null}
        </>
      ) : (
        <div className="agenda-week-day-empty">
          <strong>Rustige dag</strong>
          <p>Ruimte om adem te halen of iets kleins voor te bereiden.</p>
        </div>
      )}
    </article>
  );
}

function MonthWorkspace({
  deletingEventId,
  events,
  isEmpty,
  onAddEvent,
  onDelete,
  onEdit,
  onSelectDate,
  selectedDate,
  today,
}: {
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  isEmpty: boolean;
  onAddEvent: (date?: string) => void;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  today: string;
}) {
  const monthDays = useMemo(() => buildMonthDays(selectedDate), [selectedDate]);
  const selectedDayEvents = useMemo(
    () => events.filter((event) => getDateKey(event.startsAt) === selectedDate),
    [events, selectedDate],
  );

  return (
    <section className="agenda-month-workspace" aria-label="Maandplanning">
      <MonthGrid
        days={monthDays}
        events={events}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        today={today}
      />
      <SelectedDayPanel
        deletingEventId={deletingEventId}
        events={selectedDayEvents}
        isAgendaEmpty={isEmpty}
        onAddEvent={() => onAddEvent(selectedDate || today)}
        onDelete={onDelete}
        onEdit={onEdit}
        selectedDate={selectedDate}
      />
    </section>
  );
}

function MonthGrid({
  days,
  events,
  onSelectDate,
  selectedDate,
  today,
}: {
  days: MonthDay[];
  events: ReturnType<typeof hydrateAgendaEvents>;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  today: string;
}) {
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const currentMonth = selectedDate.slice(0, 7);

  return (
    <section className="agenda-month-grid-card" aria-label="Maandrooster">
      <header className="agenda-month-title">
        <div>
          <p className="eyebrow">Maandoverzicht</p>
          <h4>{formatDutchMonth(selectedDate)}</h4>
        </div>
        <p>Kies een dag om de planning te bekijken.</p>
      </header>
      <div className="agenda-weekday-row" aria-hidden="true">
        {dutchWeekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="agenda-month-grid">
        {days.map((day) => {
          const dayEvents = eventsByDate.get(day.date) ?? [];
          const count = dayEvents.length;
          const visibleIndicators = dayEvents.slice(0, maxMonthIndicators);
          const overflowCount = Math.max(0, count - maxMonthIndicators);
          const isSelected = day.date === selectedDate;
          const isToday = day.date === today;
          const isOutsideMonth = !day.date.startsWith(currentMonth);
          return (
            <button
              aria-label={`${formatDutchDay(day.date)}${count > 0 ? `, ${count} ${count === 1 ? "gebeurtenis" : "gebeurtenissen"}` : ", geen gebeurtenissen"}`}
              aria-pressed={isSelected}
              className={[
                "agenda-day-cell",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                isOutsideMonth ? "outside-month" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              type="button"
            >
              <span className="agenda-day-number">{day.dayOfMonth}</span>
              {isToday ? (
                <span className="agenda-day-badge">Vandaag</span>
              ) : null}
              {count > 0 ? (
                <span className="agenda-day-indicators" aria-hidden="true">
                  {visibleIndicators.map((event) => {
                    const visual = getAgendaEventVisual(event);
                    return (
                      <span
                        className="agenda-event-indicator"
                        key={event.id}
                        style={toEventVisualStyle(visual)}
                        title={visual.label}
                      >
                        {visual.icon}
                      </span>
                    );
                  })}
                  {overflowCount > 0 ? (
                    <span className="agenda-event-overflow">
                      +{overflowCount}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="agenda-day-empty">Rustige dag</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedDayPanel({
  deletingEventId,
  events,
  isAgendaEmpty,
  onAddEvent,
  onDelete,
  onEdit,
  selectedDate,
}: {
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  isAgendaEmpty: boolean;
  onAddEvent: () => void;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  selectedDate: string;
}) {
  return (
    <aside className="agenda-selected-day-panel" aria-label="Gekozen dag">
      <header className="agenda-detail-header">
        <div>
          <p className="eyebrow">Gekozen dag</p>
          <h4>{formatDutchDay(selectedDate)}</h4>
          <p>
            {events.length === 0
              ? "Nog geen afspraken."
              : `${events.length} op de planning.`}
          </p>
        </div>
        <button type="button" onClick={onAddEvent}>
          Gebeurtenis toevoegen
        </button>
      </header>
      {events.length > 0 ? (
        <AgendaEventList
          deletingEventId={deletingEventId}
          events={events}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <div className="agenda-day-empty-state">
          <strong>
            {isAgendaEmpty
              ? "Begin met de eerste gebeurtenis"
              : "Deze dag is nog leeg"}
          </strong>
          <p>
            Voeg een gebeurtenis toe voor deze datum of kies een andere dag in
            het maandrooster.
          </p>
        </div>
      )}
    </aside>
  );
}

function AgendaEventList({
  deletingEventId,
  events,
  onDelete,
  onEdit,
}: {
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  return (
    <ul className="agenda-event-list">
      {events.map((event) => {
        const visual = getAgendaEventVisual(event);
        return (
          <li
            className="agenda-event"
            key={event.id}
            style={toEventVisualStyle(visual)}
          >
            <span className="agenda-event-card-icon" aria-hidden="true">
              {visual.icon}
            </span>
            <span className="agenda-event-card-body">
              <span className="agenda-event-card-kicker">{visual.label}</span>
              <strong>{event.title}</strong>
              <small>
                {formatEventTime(event)} · {event.source.name} ·{" "}
                {event.editable ? "Bewerkbaar" : "Alleen lezen"}
              </small>
            </span>
            {event.editable ? (
              <span className="agenda-event-card-actions">
                <button type="button" onClick={() => onEdit(event)}>
                  Bewerken
                </button>
                <button
                  type="button"
                  disabled={deletingEventId === event.id}
                  onClick={() => onDelete(event.id)}
                >
                  {deletingEventId === event.id
                    ? "Verwijderen…"
                    : "Verwijderen"}
                </button>
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function toEventSeriesInput(form: EventFormState): EventSeriesInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    startsAt: toApiDateValue(form.startsAt, form.allDay),
    endsAt: form.endsAt ? toApiDateValue(form.endsAt, form.allDay) : undefined,
    allDay: form.allDay,
  };
}

function toDateTimeLocal(value: string): string {
  return value.slice(0, 16);
}

function validateEventForm(form: EventFormState): string | null {
  const input = toEventSeriesInput(form);

  if (!input.title) {
    return "Een titel voor de gebeurtenis is verplicht.";
  }

  if (!form.startsAt) {
    return form.allDay
      ? "Een datum voor de daggebeurtenis is verplicht."
      : "Een begintijd is verplicht.";
  }

  if (!form.allDay && !form.endsAt) {
    return "Gebeurtenissen met tijd hebben een eindtijd nodig.";
  }

  if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
    return "De eindtijd moet gelijk aan of na de begintijd zijn.";
  }

  return null;
}

function toAllDayState(form: EventFormState, allDay: boolean): EventFormState {
  return {
    ...form,
    allDay,
    startsAt: allDay
      ? form.startsAt.slice(0, 10)
      : expandDateTime(form.startsAt, "09:00"),
    endsAt: allDay
      ? form.endsAt.slice(0, 10)
      : expandDateTime(form.endsAt || form.startsAt, "10:00"),
  };
}

function toInputValue(value: string, allDay: boolean): string {
  return allDay ? value.slice(0, 10) : value;
}

function toApiDateValue(value: string, allDay: boolean): string {
  return allDay && value.length === 10 ? `${value}T00:00` : value;
}

function expandDateTime(value: string, fallbackTime: string): string {
  return value.length === 10 ? `${value}T${fallbackTime}` : value;
}

function nextEventQuestion(question: EventDialogQuestion): EventDialogQuestion {
  if (question === "title") return "date";
  if (question === "date") return "dayKind";
  return "details";
}

function previousEventQuestion(
  question: EventDialogQuestion,
): EventDialogQuestion {
  if (question === "details") return "dayKind";
  if (question === "dayKind") return "date";
  return "title";
}

function getEventDate(form: EventFormState) {
  return form.startsAt.slice(0, 10);
}

function getEventTime(value: string, fallback: string) {
  return value.length >= 16 ? value.slice(11, 16) : fallback;
}

function setEventDate(form: EventFormState, date: string): EventFormState {
  if (form.allDay) {
    return {
      ...form,
      startsAt: date,
      endsAt: form.endsAt ? date : form.endsAt,
    };
  }

  return {
    ...form,
    startsAt: `${date}T${getEventTime(form.startsAt, "09:00")}`,
    endsAt: `${date}T${getEventTime(form.endsAt, "10:00")}`,
  };
}

function setEventTime(
  form: EventFormState,
  field: "startsAt" | "endsAt",
  time: string,
): EventFormState {
  const date = getEventDate(form);
  return {
    ...form,
    allDay: false,
    [field]: `${date}T${time}`,
  };
}

function setAllDayEndDate(form: EventFormState, date: string): EventFormState {
  return {
    ...form,
    allDay: true,
    endsAt: date,
  };
}

function eventSummary(form: EventFormState) {
  const title = form.title.trim() || "Naamloze gebeurtenis";
  const date = getEventDate(form);
  if (form.allDay) return `${title} · ${date} · hele dag`;
  return `${title} · ${date} · ${getEventTime(
    form.startsAt,
    "09:00",
  )}-${getEventTime(form.endsAt, "10:00")}`;
}

function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

type AgendaEventType =
  | "birthday"
  | "holiday"
  | "school"
  | "sports"
  | "medical"
  | "shopping"
  | "family"
  | "work"
  | "media"
  | "general";

type AgendaEventVisual = {
  type: AgendaEventType;
  label: string;
  icon: string;
  color: string;
  background: string;
  border: string;
};

const maxMonthIndicators = 3;

const agendaEventVisuals: Record<AgendaEventType, AgendaEventVisual> = {
  birthday: {
    type: "birthday",
    label: "Verjaardag",
    icon: "🎂",
    color: "#9a5b13",
    background: "#fff4d6",
    border: "#f6d58c",
  },
  holiday: {
    type: "holiday",
    label: "Vakantie",
    icon: "🏖️",
    color: "#176b73",
    background: "#e7f8f7",
    border: "#a8e0dc",
  },
  school: {
    type: "school",
    label: "School",
    icon: "🎒",
    color: "#315f9f",
    background: "#edf4ff",
    border: "#bdd4f7",
  },
  sports: {
    type: "sports",
    label: "Sport",
    icon: "⚽",
    color: "#3f6f2a",
    background: "#edf8e7",
    border: "#bee2ad",
  },
  medical: {
    type: "medical",
    label: "Zorg",
    icon: "🩺",
    color: "#9a4a55",
    background: "#fff0f2",
    border: "#f3bbc4",
  },
  shopping: {
    type: "shopping",
    label: "Boodschappen",
    icon: "🛒",
    color: "#77522c",
    background: "#fff4e8",
    border: "#e8c7a2",
  },
  family: {
    type: "family",
    label: "Familie",
    icon: "🏡",
    color: "#6b4d92",
    background: "#f4efff",
    border: "#d6c6f2",
  },
  work: {
    type: "work",
    label: "Werk",
    icon: "💼",
    color: "#53606f",
    background: "#eef2f6",
    border: "#c9d3df",
  },
  media: {
    type: "media",
    label: "Kijken",
    icon: "🎬",
    color: "#884b7d",
    background: "#fff0fb",
    border: "#ecc4e5",
  },
  general: {
    type: "general",
    label: "Afspraak",
    icon: "📌",
    color: "#5c667a",
    background: "#f4f6fb",
    border: "#d7ddea",
  },
};

const titleTypeRules: Array<{ type: AgendaEventType; pattern: RegExp }> = [
  { type: "birthday", pattern: /(^|\b)(birthday|verjaardag|jarig)(\b|$)/i },
  {
    type: "holiday",
    pattern: /(^|\b)(holiday|vakantie|vrije dag|feestdag|camp|kamp)(\b|$)/i,
  },
  {
    type: "school",
    pattern:
      /(^|\b)(school|teacher|leraar|studiedag|huiswerk|ouderavond)(\b|$)/i,
  },
  {
    type: "sports",
    pattern:
      /(^|\b)(sport|voetbal|hockey|zwem|swim|training|wedstrijd|gym)(\b|$)/i,
  },
  {
    type: "medical",
    pattern:
      /(^|\b)(doctor|dokter|tandarts|dentist|huisarts|zorg|medical|arts|controle)(\b|$)/i,
  },
  {
    type: "shopping",
    pattern:
      /(^|\b)(boodschap|boodschappen|shopping|winkel|markt|supermarkt)(\b|$)/i,
  },
  {
    type: "work",
    pattern: /(^|\b)(werk|work|meeting|kantoor|dienst|shift)(\b|$)/i,
  },
  {
    type: "family",
    pattern: /(^|\b)(familie|family|oma|opa|bezoek|dinner|eten|uitje)(\b|$)/i,
  },
];

function getAgendaEventVisual(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
): AgendaEventVisual {
  if (event.source.type === "birthdays") return agendaEventVisuals.birthday;
  if (event.source.type === "schoolHolidays") return agendaEventVisuals.school;
  if (event.source.type === "tvSeries") return agendaEventVisuals.media;

  const text = `${event.title} ${event.source.name}`;
  const matchingRule = titleTypeRules.find((rule) => rule.pattern.test(text));
  if (matchingRule) return agendaEventVisuals[matchingRule.type];

  if (event.source.type === "googleCalendar") return agendaEventVisuals.family;
  return agendaEventVisuals.general;
}

function toEventVisualStyle(visual: AgendaEventVisual) {
  return {
    "--event-type-color": visual.color,
    "--event-type-bg": visual.background,
    "--event-type-border": visual.border,
  } as React.CSSProperties;
}

const maxWeekEventsPerDay = 3;

type WeekDay = { date: string };
type TimelineGroupKey =
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "nextWeek"
  | "later";
type TimelineGroup = {
  key: TimelineGroupKey;
  label: string;
  description: string;
  events: ReturnType<typeof hydrateAgendaEvents>;
};

const dutchWeekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
});
const dutchShortDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
});

type MonthDay = { date: string; dayOfMonth: number };

const dutchWeekdays = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const dutchMonthFormatter = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});
const dutchDayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function buildMonthDays(anchorDate: string): MonthDay[] {
  const [year, month] = anchorDate.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  const mondayOffset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - mondayOffset);
  const last = new Date(year, month, 0);
  const end = new Date(last);
  const sundayOffset = (7 - ((last.getDay() + 6) % 7) - 1) % 7;
  end.setDate(last.getDate() + sundayOffset);
  const days: MonthDay[] = [];
  for (
    const current = new Date(start);
    current <= end;
    current.setDate(current.getDate() + 1)
  )
    days.push({ date: toIsoDate(current), dayOfMonth: current.getDate() });
  return days;
}

function buildTimelineGroups(
  events: ReturnType<typeof hydrateAgendaEvents>,
  today: string,
): TimelineGroup[] {
  const upcomingEvents = events
    .filter((event) => getDateKey(event.startsAt) >= today)
    .slice()
    .sort(compareAgendaEvents);
  const buckets = new Map<
    TimelineGroupKey,
    ReturnType<typeof hydrateAgendaEvents>
  >();

  upcomingEvents.forEach((event) => {
    const key = getTimelineGroupKey(getDateKey(event.startsAt), today);
    buckets.set(key, [...(buckets.get(key) ?? []), event]);
  });

  return timelineGroupDefinitions.flatMap((definition) => {
    const groupEvents = buckets.get(definition.key) ?? [];
    return groupEvents.length > 0
      ? [{ ...definition, events: groupEvents }]
      : [];
  });
}

const timelineGroupDefinitions: Array<Omit<TimelineGroup, "events">> = [
  {
    key: "today",
    label: "Vandaag",
    description: "Wat vraagt vandaag om aandacht?",
  },
  {
    key: "tomorrow",
    label: "Morgen",
    description: "Handig om alvast klaar te leggen.",
  },
  {
    key: "thisWeek",
    label: "Deze week",
    description: "De rest van deze week in volgorde.",
  },
  {
    key: "nextWeek",
    label: "Volgende week",
    description: "Wat daarna al in beeld komt.",
  },
  {
    key: "later",
    label: "Later",
    description: "Verder vooruit, zodat niets uit beeld raakt.",
  },
];

function getTimelineGroupKey(date: string, today: string): TimelineGroupKey {
  const tomorrow = addDaysIso(today, 1);
  if (date === today) return "today";
  if (date === tomorrow) return "tomorrow";

  const thisWeekEnd = addDaysIso(startOfWeek(today), 6);
  if (date <= thisWeekEnd) return "thisWeek";

  const nextWeekEnd = addDaysIso(thisWeekEnd, 7);
  if (date <= nextWeekEnd) return "nextWeek";

  return "later";
}

function compareAgendaEvents(
  first: ReturnType<typeof hydrateAgendaEvents>[number],
  second: ReturnType<typeof hydrateAgendaEvents>[number],
) {
  const firstTime = new Date(first.startsAt).getTime();
  const secondTime = new Date(second.startsAt).getTime();
  if (firstTime !== secondTime) return firstTime - secondTime;
  return first.title.localeCompare(second.title, "nl-NL");
}

function buildWeekDays(anchorDate: string): WeekDay[] {
  const start = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => ({
    date: addDaysIso(start, index),
  }));
}

function startOfWeek(date: string): string {
  const current = new Date(`${date}T12:00:00`);
  const mondayOffset = (current.getDay() + 6) % 7;
  current.setDate(current.getDate() - mondayOffset);
  return toIsoDate(current);
}

function groupEventsByDate(events: ReturnType<typeof hydrateAgendaEvents>) {
  const groups = new Map<string, ReturnType<typeof hydrateAgendaEvents>>();
  events.forEach((event) => {
    const date = getDateKey(event.startsAt);
    groups.set(date, [...(groups.get(date) ?? []), event]);
  });
  return groups;
}

function formatWeekRange(startDate: string, endDate: string) {
  return `${formatDutchShortDate(startDate)} – ${formatDutchShortDate(endDate)}`;
}

function formatDutchWeekday(date: string) {
  return dutchWeekdayFormatter.format(new Date(`${date}T12:00:00`));
}

function formatDutchShortDate(date: string) {
  return dutchShortDateFormatter.format(new Date(`${date}T12:00:00`));
}

function formatDutchMonth(date: string) {
  return dutchMonthFormatter.format(new Date(`${date}T12:00:00`));
}
function formatDutchDay(date: string) {
  return dutchDayFormatter.format(new Date(`${date}T12:00:00`));
}
function todayIsoDate() {
  return toIsoDate(new Date());
}
function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}
function getDateKey(dateTime: string): string {
  return dateTime.slice(0, 10);
}

function toUserFacingError(error: unknown, fallback: string): string {
  if (
    error instanceof Error &&
    "response" in error &&
    typeof error.response === "string"
  ) {
    try {
      const parsed = JSON.parse(error.response) as {
        errors?: Record<string, string[]>;
        title?: string;
      };
      const validationMessages = parsed.errors
        ? Object.values(parsed.errors).flat()
        : [];
      if (validationMessages.length > 0) {
        return validationMessages.join(" ");
      }

      return parsed.title ?? fallback;
    } catch {
      return fallback;
    }
  }

  return error instanceof Error ? error.message : fallback;
}
