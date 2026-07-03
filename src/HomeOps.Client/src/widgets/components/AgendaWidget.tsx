import { useEffect, useMemo, useRef, useState } from "react";
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
} from "../../demo/demoAgendaData";
import type {
  EventSource,
  NormalizedEvent,
} from "../../events/eventSourceModel";
import { FamilyBoardIcon, type FamilyBoardIconName } from "../../design";
import type { WidgetRenderProps } from "../WidgetRenderer";
import { useVisualReviewNow } from "../../visualReviewTime";

type EventDialogQuestion = "title" | "date" | "dayKind" | "details";
type AgendaWorkspaceMode = "planning" | "month";

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

export function AgendaWidget({ instance }: WidgetRenderProps) {
  const visualReviewNow = useVisualReviewNow();
  const today = visualReviewNow ? toIsoDate(visualReviewNow) : todayIsoDate();
  const previousTodayRef = useRef(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeWorkspaceMode, setActiveWorkspaceMode] =
    useState<AgendaWorkspaceMode>("planning");
  const [calendarEvents, setCalendarEvents] = useState<NormalizedEvent[]>([]);
  const [calendarSources, setCalendarSources] = useState<EventSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(() => createEmptyForm(today));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventDialogQuestion, setEventDialogQuestion] =
    useState<EventDialogQuestion>("title");

  useEffect(() => {
    const previousToday = previousTodayRef.current;
    if (previousToday === today) return;

    setSelectedDate((current) => (current === previousToday ? today : current));
    previousTodayRef.current = today;
  }, [today]);

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

  const selectedSources = settings.months.enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(events, selectedSources);
    return hydrateAgendaEvents(filteredEvents, eventSources);
  }, [events, eventSources, selectedSources]);
  const nowIso = visualReviewNow
    ? visualReviewNow.toISOString()
    : new Date().toISOString();

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
    setForm(createEmptyForm(today));
  }

  function openNewEventForm(date = selectedDate || today) {
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
        <div className="agenda-command-main">
          <div className="agenda-command-title">
            <p className="widget-type">Familieplanning</p>
            <h3>{instance.title}</h3>
            <p>
              {activeWorkspaceMode === "planning"
                ? "Vandaag, straks en wat er binnenkort aankomt."
                : "Kies een dag om ruimte te vinden of een afspraak in te plannen."}
            </p>
          </div>
          {activeWorkspaceMode === "month" ? (
            <div className="agenda-command-actions">
              <button
                className="agenda-command-secondary"
                type="button"
                onClick={() => setActiveWorkspaceMode("planning")}
              >
                Terug naar planning
              </button>
              <button
                className="agenda-command-action"
                type="button"
                onClick={() => openNewEventForm(selectedDate || today)}
              >
                Gebeurtenis toevoegen
              </button>
            </div>
          ) : null}
        </div>
        <div className="agenda-command-meta">
          <div className="agenda-command-rail">
            {isLoading ? (
              <p className="agenda-status" role="status">
                Agenda laden…
              </p>
            ) : null}
            {errorMessage ? (
              <p className="agenda-status agenda-status-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            {activeWorkspaceMode === "month" ? (
              <AgendaSourceSelector
                eventSources={eventSources}
                selectedSources={selectedSources}
                onToggleSource={(sourceId, enabled) =>
                  setSourceEnabled("months", sourceId, enabled)
                }
              />
            ) : null}
          </div>
        </div>
      </div>

      {isEventFormOpen || editingEventId !== null ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={closeEventForm}
        >
          <section
            className="home-capture-dialog domain-agenda"
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
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeEventForm}
                aria-label="Sluit gebeurtenisvenster"
              >
                <FamilyBoardIcon name="core.close" size="small" />
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
              today={today}
            />
          </section>
        </div>
      ) : null}

      <div className="agenda-mode-canvas">
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
            today={today}
          />
        ) : (
          <PlanningWorkspace
            deletingEventId={deletingEventId}
            events={agendaEvents}
            eventSources={eventSources}
            nowIso={nowIso}
            onAddEvent={openNewEventForm}
            onDelete={removeEvent}
            onEdit={startEditing}
            onOpenMonth={() => setActiveWorkspaceMode("month")}
            onToggleSource={(sourceId, enabled) =>
              setSourceEnabled("months", sourceId, enabled)
            }
            selectedDate={selectedDate}
            selectedSources={selectedSources}
            today={today}
          />
        )}
      </div>
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
  today,
}: {
  form: EventFormState;
  isEditing: boolean;
  isSaving: boolean;
  question: EventDialogQuestion;
  onChange: (form: EventFormState) => void;
  onQuestionChange: (question: EventDialogQuestion) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  today: string;
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
                onClick={() => onChange(setEventDate(form, today))}
              >
                Vandaag
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(setEventDate(form, addDaysIso(today, 1)))
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

function AgendaSourceSelector({
  eventSources,
  selectedSources,
  onToggleSource,
}: {
  eventSources: EventSource[];
  selectedSources: Record<string, boolean>;
  onToggleSource: (sourceId: string, enabled: boolean) => void;
}) {
  return (
    <div className="source-selector" role="group" aria-label="Zichtbaar in de agenda">
      <span className="source-selector-label">Bronnen</span>
      {eventSources.map((source) => (
        <label key={source.id}>
          <input
            checked={selectedSources[source.id] ?? false}
            onChange={(event) => onToggleSource(source.id, event.target.checked)}
            type="checkbox"
          />
          <span
            className="source-color"
            style={{ backgroundColor: source.color.hex }}
            aria-hidden="true"
          />
          {formatFamilyFilterLabel(source.name)}
        </label>
      ))}
    </div>
  );
}

function PlanningWorkspace({
  deletingEventId,
  eventSources,
  events,
  nowIso,
  onAddEvent,
  onDelete,
  onEdit,
  onOpenMonth,
  onToggleSource,
  selectedDate,
  selectedSources,
  today,
}: {
  deletingEventId: string | null;
  eventSources: EventSource[];
  events: ReturnType<typeof hydrateAgendaEvents>;
  nowIso: string;
  onAddEvent: (date?: string) => void;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  onOpenMonth: () => void;
  onToggleSource: (sourceId: string, enabled: boolean) => void;
  selectedDate: string;
  selectedSources: Record<string, boolean>;
  today: string;
}) {
  const briefing = useMemo(
    () => buildPlanningBriefing(events, today, nowIso),
    [events, nowIso, today],
  );
  const [selectedPlanningEventId, setSelectedPlanningEventId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      selectedPlanningEventId &&
      !events.some((event) => event.id === selectedPlanningEventId)
    ) {
      setSelectedPlanningEventId(null);
    }
  }, [events, selectedPlanningEventId]);

  return (
    <section className="agenda-planning-workspace" aria-label="Planningoverzicht">
      <header className="agenda-planning-header">
        <div>
          <p className="eyebrow">Planning</p>
          <h4>Wat moet het gezin hierna weten?</h4>
          <p>Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.</p>
        </div>
      </header>
      <div className="agenda-planning-board">
        <TodayBriefingCard
          briefing={briefing.today}
          deletingEventId={deletingEventId}
          onDelete={onDelete}
          onEdit={onEdit}
          selectedEventId={selectedPlanningEventId}
          setSelectedEventId={setSelectedPlanningEventId}
        />
        <PlanningOutlookCard
          deletingEventId={deletingEventId}
          onDelete={onDelete}
          onEdit={onEdit}
          outlook={briefing.outlook}
          selectedEventId={selectedPlanningEventId}
          setSelectedEventId={setSelectedPlanningEventId}
        />
        <PlanningWeekCard
          deletingEventId={deletingEventId}
          onDelete={onDelete}
          onEdit={onEdit}
          selectedEventId={selectedPlanningEventId}
          setSelectedEventId={setSelectedPlanningEventId}
          week={briefing.week}
        />
        <PlanningToolsCard
          eventSources={eventSources}
          onAddEvent={onAddEvent}
          onOpenMonth={onOpenMonth}
          onToggleSource={onToggleSource}
          selectedDate={selectedDate}
          selectedSources={selectedSources}
          today={today}
        />
      </div>
    </section>
  );
}

function TodayBriefingCard({
  briefing,
  deletingEventId,
  onDelete,
  onEdit,
  selectedEventId,
  setSelectedEventId,
}: {
  briefing: PlanningBriefing["today"];
  deletingEventId: string | null;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
}) {
  return (
    <article className="agenda-planning-card agenda-today-briefing" aria-label="Vandaag briefing">
      <header className="agenda-planning-card-header">
        <div>
          <p className="eyebrow">Vandaag</p>
          <h5>{briefing.title}</h5>
          <p>{briefing.summary}</p>
        </div>
        <span className={["agenda-planning-tone", briefing.tone].join(" ")}>
          {briefing.toneLabel}
        </span>
      </header>

      {briefing.leadEvent ? (
        <div className="agenda-today-lead">
          <p className="agenda-planning-section-label">{briefing.leadLabel}</p>
          <PlanningEventRow
            deletingEventId={deletingEventId}
            detail={formatEventTime(briefing.leadEvent)}
            event={briefing.leadEvent}
            extra={briefing.leadCue}
            mode="lead"
            onDelete={onDelete}
            onEdit={onEdit}
            selected={selectedEventId === briefing.leadEvent.id}
            setSelectedEventId={setSelectedEventId}
            statusBadge={briefing.leadBadge}
          />
        </div>
      ) : (
        <div className="agenda-planning-group-empty agenda-today-empty-state">
          <strong>Vandaag blijft open</strong>
          <p>{briefing.summary}</p>
        </div>
      )}

      {briefing.supportEvents.length > 0 || briefing.hiddenSupportCount > 0 ? (
        <div className="agenda-today-support">
          <div className="agenda-planning-list-header">
            <p className="agenda-planning-section-label">Verder vandaag</p>
            {briefing.hiddenSupportCount > 0 ? (
              <span className="agenda-planning-overflow-note">
                +{briefing.hiddenSupportCount} meer vandaag
              </span>
            ) : null}
          </div>
          <ul className="agenda-planning-event-list">
            {briefing.supportEvents.map((event) => (
              <PlanningEventRow
                deletingEventId={deletingEventId}
                detail={formatEventTime(event)}
                event={event}
                extra={getPlanningPreparationCue(event)}
                key={event.id}
                mode="today"
                onDelete={onDelete}
                onEdit={onEdit}
                selected={selectedEventId === event.id}
                setSelectedEventId={setSelectedEventId}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function PlanningWeekCard({
  deletingEventId,
  onDelete,
  onEdit,
  selectedEventId,
  setSelectedEventId,
  week,
}: {
  deletingEventId: string | null;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
  week: PlanningBriefing["week"];
}) {
  return (
    <article className="agenda-planning-card agenda-week-briefing" aria-label="Deze week">
      <header className="agenda-planning-card-header">
        <div>
          <p className="eyebrow">Deze week</p>
          <h5>
            {week.dayGroups.length > 0
              ? `${week.totalEvents} ${week.totalEvents === 1 ? "afspraak" : "afspraken"} in beeld`
              : "De rest van de week is rustig"}
          </h5>
          <p>{week.summary}</p>
        </div>
      </header>
      {week.dayGroups.length > 0 ? (
        <div className="agenda-week-briefing-days">
          {week.dayGroups.map((dayGroup) => (
            <section className="agenda-week-briefing-day" key={dayGroup.date}>
              <div className="agenda-week-briefing-day-header">
                <div>
                  <strong>{formatDutchWeekday(dayGroup.date)}</strong>
                  <p>{formatDutchShortDate(dayGroup.date)}</p>
                </div>
                <span>
                  {dayGroup.events.length}{" "}
                  {dayGroup.events.length === 1 ? "afspraak" : "afspraken"}
                </span>
              </div>
              <ul className="agenda-planning-event-list compact">
                {dayGroup.visibleEvents.map((event) => (
                  <PlanningEventRow
                    deletingEventId={deletingEventId}
                    detail={formatEventTime(event)}
                    event={event}
                    extra={getPlanningPreparationCue(event)}
                    key={event.id}
                    mode="compact"
                    onDelete={onDelete}
                    onEdit={onEdit}
                    selected={selectedEventId === event.id}
                    setSelectedEventId={setSelectedEventId}
                  />
                ))}
              </ul>
              {dayGroup.hiddenCount > 0 ? (
                <p className="agenda-planning-overflow-note">
                  +{dayGroup.hiddenCount} meer op {formatDutchWeekday(dayGroup.date)}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <div className="agenda-planning-group-empty">
          <strong>Geen extra drukte zichtbaar</strong>
          <p>Na vandaag blijft de komende week voorlopig ruim.</p>
        </div>
      )}
    </article>
  );
}

function PlanningOutlookCard({
  deletingEventId,
  onDelete,
  onEdit,
  outlook,
  selectedEventId,
  setSelectedEventId,
}: {
  deletingEventId: string | null;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  outlook: PlanningBriefing["outlook"];
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
}) {
  return (
    <article className="agenda-planning-card agenda-outlook-briefing" aria-label="Vooruitkijken">
      <header className="agenda-planning-card-header">
        <div>
          <p className="eyebrow">Vooruitkijken</p>
          <h5>
            {outlook.events.length > 0 ? "Verder vooruit blijft in beeld" : "Nog niets verder vooruit"}
          </h5>
          <p>
            {outlook.events.length > 0
              ? "Compacte geruststelling voor wat later komt."
              : "Zodra er iets na deze week staat, verschijnt het hier rustig in beeld."}
          </p>
        </div>
      </header>
      {outlook.events.length > 0 ? (
        <>
          <ul className="agenda-planning-event-list compact">
            {outlook.visibleEvents.map((event) => (
              <PlanningEventRow
                dayLabel={`${formatDutchWeekday(getDateKey(event.startsAt))} ${formatDutchShortDate(getDateKey(event.startsAt))}`}
                deletingEventId={deletingEventId}
                detail={formatEventTime(event)}
                event={event}
                key={event.id}
                mode="compact"
                onDelete={onDelete}
                onEdit={onEdit}
                selected={selectedEventId === event.id}
                setSelectedEventId={setSelectedEventId}
              />
            ))}
          </ul>
          {outlook.hiddenCount > 0 ? (
            <p className="agenda-planning-overflow-note">
              +{outlook.hiddenCount} meer vooruit
            </p>
          ) : null}
        </>
      ) : (
        <div className="agenda-planning-group-empty">
          <strong>De horizon is rustig</strong>
          <p>Gebruik de maandweergave zodra je verder vooruit wilt plannen.</p>
        </div>
      )}
    </article>
  );
}

function PlanningToolsCard({
  eventSources,
  onAddEvent,
  onOpenMonth,
  onToggleSource,
  selectedDate,
  selectedSources,
  today,
}: {
  eventSources: EventSource[];
  onAddEvent: (date?: string) => void;
  onOpenMonth: () => void;
  onToggleSource: (sourceId: string, enabled: boolean) => void;
  selectedDate: string;
  selectedSources: Record<string, boolean>;
  today: string;
}) {
  return (
    <aside className="agenda-planning-card agenda-planning-tools" aria-label="Planning tools">
      <header className="agenda-planning-card-header">
        <div>
          <p className="eyebrow">Planning tools</p>
          <h5>Rustige hulpruimte</h5>
          <p>Pas gebruiken wanneer iemand wil plannen of iets wil opzoeken.</p>
        </div>
      </header>
      <div className="agenda-planning-tool-actions">
        <button
          className="agenda-planning-tool-button primary"
          type="button"
          onClick={() => onAddEvent(selectedDate || today)}
        >
          Afspraak plannen
        </button>
        <button
          className="agenda-planning-tool-button"
          type="button"
          onClick={onOpenMonth}
        >
          Datum kiezen
        </button>
        <button
          className="agenda-planning-tool-button"
          type="button"
          onClick={onOpenMonth}
        >
          Maand bekijken
        </button>
      </div>
      <div className="agenda-planning-tool-meta">
        <p className="agenda-planning-tool-label">Geselecteerde dag</p>
        <strong>{formatDutchDay(selectedDate)}</strong>
      </div>
      <AgendaSourceSelector
        eventSources={eventSources}
        onToggleSource={onToggleSource}
        selectedSources={selectedSources}
      />
    </aside>
  );
}

function PlanningEventRow({
  dayLabel,
  deletingEventId,
  detail,
  event,
  extra,
  mode,
  onDelete,
  onEdit,
  selected,
  setSelectedEventId,
  statusBadge,
}: {
  dayLabel?: string;
  deletingEventId: string | null;
  detail: string;
  event: ReturnType<typeof hydrateAgendaEvents>[number];
  extra?: string;
  mode: "lead" | "today" | "compact";
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
  selected: boolean;
  setSelectedEventId: (eventId: string | null) => void;
  statusBadge?: string;
}) {
  const visual = getAgendaEventVisual(event);
  const showIcon = isSpecialPlanningEvent(event);

  return (
    <li
      className={["agenda-planning-event", mode, selected ? "selected" : ""]
        .filter(Boolean)
        .join(" ")}
      style={toEventVisualStyle(visual)}
    >
      <button
        className="agenda-planning-event-hitbox"
        type="button"
        onClick={() => setSelectedEventId(selected ? null : event.id)}
        aria-pressed={selected}
      >
        <span className="agenda-planning-event-main">
          {dayLabel ? <span className="agenda-planning-event-day">{dayLabel}</span> : null}
          <span className="agenda-planning-event-title-row">
            {statusBadge ? (
              <span className="agenda-planning-event-badge">{statusBadge}</span>
            ) : null}
            {showIcon ? (
              <span className="agenda-planning-event-icon" aria-hidden="true">
                <FamilyBoardIcon name={visual.icon} size="small" />
              </span>
            ) : null}
            <strong>{event.title}</strong>
          </span>
          <span className="agenda-planning-event-detail">{detail}</span>
          {extra ? <span className="agenda-planning-event-extra">{extra}</span> : null}
        </span>
      </button>
      {selected && event.editable ? (
        <span className="agenda-planning-event-actions">
          <button type="button" onClick={() => onEdit(event)}>
            Bewerken
          </button>
          <button
            type="button"
            disabled={deletingEventId === event.id}
            onClick={() => onDelete(event.id)}
          >
            {deletingEventId === event.id ? "Verwijderen…" : "Verwijderen"}
          </button>
        </span>
      ) : null}
    </li>
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
          <p className="eyebrow">Week {getIsoWeekNumber(weekStart)}</p>
          <h4>{formatWeekRange(weekStart, weekEnd)}</h4>
        </div>
        <div className="agenda-week-navigation" aria-label="Weeknavigatie">
          <button
            className="secondary"
            type="button"
            onClick={() => onNavigate(addDaysIso(weekStart, -7))}
          >
            Vorige week
          </button>
          <button
            className="current"
            type="button"
            onClick={() => onNavigate(today)}
          >
            Deze week
          </button>
          <button
            className="secondary"
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
                  <FamilyBoardIcon name={visual.icon} size="small" />
                </span>
              );
            })}
            {overflowCount > 0 ? (
              <span className="agenda-event-overflow">+{overflowCount}</span>
            ) : null}
          </div>
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
        <div className="agenda-week-day-empty" aria-hidden="true" />
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
          <p className="eyebrow">Maand</p>
          <h4>{formatDutchMonth(selectedDate)}</h4>
        </div>
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
                        <FamilyBoardIcon name={visual.icon} size="small" />
                      </span>
                    );
                  })}
                  {overflowCount > 0 ? (
                    <span className="agenda-event-overflow">
                      +{overflowCount}
                    </span>
                  ) : null}
                </span>
              ) : null}
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
        <button className="compact-action" type="button" onClick={onAddEvent}>
          Toevoegen
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
          <p>Ruimte in de agenda.</p>
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
              <FamilyBoardIcon name={visual.icon} size="small" />
            </span>
            <span className="agenda-event-card-body">
              <span className="agenda-event-card-kicker">{visual.label}</span>
              <strong>{event.title}</strong>
              <small>
                {formatEventTime(event)} · {visual.label}
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
  icon: FamilyBoardIconName;
  color: string;
  background: string;
  border: string;
};

const maxMonthIndicators = 3;

const agendaEventVisuals: Record<AgendaEventType, AgendaEventVisual> = {
  birthday: {
    type: "birthday",
    label: "Verjaardag",
    icon: "agenda.birthday",
    color: "#9a5b13",
    background: "#fff4d6",
    border: "#f6d58c",
  },
  holiday: {
    type: "holiday",
    label: "Vakantie",
    icon: "agenda.holiday",
    color: "#176b73",
    background: "#e7f8f7",
    border: "#a8e0dc",
  },
  school: {
    type: "school",
    label: "School",
    icon: "agenda.school",
    color: "#315f9f",
    background: "#edf4ff",
    border: "#bdd4f7",
  },
  sports: {
    type: "sports",
    label: "Sport",
    icon: "agenda.sport",
    color: "#3f6f2a",
    background: "#edf8e7",
    border: "#bee2ad",
  },
  medical: {
    type: "medical",
    label: "Zorg",
    icon: "agenda.health",
    color: "#9a4a55",
    background: "#fff0f2",
    border: "#f3bbc4",
  },
  shopping: {
    type: "shopping",
    label: "Boodschappen",
    icon: "agenda.shopping",
    color: "#77522c",
    background: "#fff4e8",
    border: "#e8c7a2",
  },
  family: {
    type: "family",
    label: "Familie",
    icon: "agenda.home",
    color: "#6b4d92",
    background: "#f4efff",
    border: "#d6c6f2",
  },
  work: {
    type: "work",
    label: "Werk",
    icon: "agenda.work",
    color: "#53606f",
    background: "#eef2f6",
    border: "#c9d3df",
  },
  media: {
    type: "media",
    label: "Kijken",
    icon: "agenda.media",
    color: "#884b7d",
    background: "#fff0fb",
    border: "#ecc4e5",
  },
  general: {
    type: "general",
    label: "Afspraak",
    icon: "agenda.default",
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
type PlanningDayGroup = {
  date: string;
  events: ReturnType<typeof hydrateAgendaEvents>;
  hiddenCount: number;
  visibleEvents: ReturnType<typeof hydrateAgendaEvents>;
};
type PlanningBriefing = {
  today: {
    hiddenSupportCount: number;
    leadBadge?: string;
    leadCue?: string;
    leadEvent: ReturnType<typeof hydrateAgendaEvents>[number] | null;
    leadLabel: string;
    summary: string;
    supportEvents: ReturnType<typeof hydrateAgendaEvents>;
    title: string;
    tone: "calm" | "busy" | "steady";
    toneLabel: string;
  };
  week: {
    dayGroups: PlanningDayGroup[];
    summary: string;
    totalEvents: number;
  };
  outlook: {
    events: ReturnType<typeof hydrateAgendaEvents>;
    hiddenCount: number;
    visibleEvents: ReturnType<typeof hydrateAgendaEvents>;
  };
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

function buildPlanningBriefing(
  events: ReturnType<typeof hydrateAgendaEvents>,
  today: string,
  nowIso: string,
): PlanningBriefing {
  const upcomingEvents = events
    .filter((event) => getDateKey(event.startsAt) >= today)
    .slice()
    .sort(compareAgendaEvents);
  const todayEvents = upcomingEvents.filter(
    (event) => getDateKey(event.startsAt) === today,
  );
  const currentWeekEnd = addDaysIso(startOfWeek(today), 6);
  const tomorrow = addDaysIso(today, 1);
  const weekEnd = currentWeekEnd > today ? currentWeekEnd : tomorrow;
  const weekEvents = upcomingEvents.filter((event) => {
    const date = getDateKey(event.startsAt);
    return date > today && date <= weekEnd;
  });
  const weekDayGroups = [...groupEventsByDate(weekEvents).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayEvents]) => ({
      date,
      events: dayEvents,
      hiddenCount: Math.max(0, dayEvents.length - 2),
      visibleEvents: dayEvents.slice(0, 2),
    }));
  const outlookEvents = upcomingEvents.filter(
    (event) => getDateKey(event.startsAt) > weekEnd,
  );
  const nextFutureEvent = upcomingEvents.find(
    (event) => getDateKey(event.startsAt) > today,
  );

  return {
    today: buildTodayBriefing(todayEvents, nextFutureEvent ?? null, nowIso),
    week: {
      dayGroups: weekDayGroups,
      summary:
        weekDayGroups[0] !== undefined
          ? `Morgen begint op ${formatDutchWeekday(weekDayGroups[0].date)} en laat direct de weekvorm zien.`
          : "Na vandaag hoeft er nog niets extra's voorbereid te worden.",
      totalEvents: weekEvents.length,
    },
    outlook: {
      events: outlookEvents,
      hiddenCount: Math.max(0, outlookEvents.length - 4),
      visibleEvents: outlookEvents.slice(0, 4),
    },
  };
}

function buildTodayBriefing(
  todayEvents: ReturnType<typeof hydrateAgendaEvents>,
  nextFutureEvent: ReturnType<typeof hydrateAgendaEvents>[number] | null,
  nowIso: string,
): PlanningBriefing["today"] {
  const currentEvent = todayEvents.find((event) => isCurrentPlanningEvent(event, nowIso));
  const nextTodayEvent = todayEvents.find(
    (event) => new Date(event.startsAt).getTime() >= new Date(nowIso).getTime(),
  );
  const leadEvent = currentEvent ?? nextTodayEvent ?? todayEvents[0] ?? null;
  const supportEvents = leadEvent
    ? todayEvents.filter((event) => event.id !== leadEvent.id).slice(0, 2)
    : [];
  const hiddenSupportCount = leadEvent
    ? Math.max(0, todayEvents.length - 1 - supportEvents.length)
    : 0;

  if (currentEvent) {
    return {
      hiddenSupportCount,
      leadBadge: "Nu",
      leadCue: getPlanningPreparationCue(currentEvent),
      leadEvent: currentEvent,
      leadLabel: "Nu bezig",
      summary:
        todayEvents.length > 1
          ? `Er staan vandaag nog ${todayEvents.length - 1} andere ${todayEvents.length - 1 === 1 ? "afspraak" : "afspraken"} klaar.`
          : "De belangrijkste afspraak loopt nu.",
      supportEvents,
      title: "Nu telt vooral dit",
      tone: "busy",
      toneLabel: "Aandacht nu",
    };
  }

  if (nextTodayEvent) {
    return {
      hiddenSupportCount,
      leadBadge: "Straks",
      leadCue: getPlanningPreparationCue(nextTodayEvent),
      leadEvent: nextTodayEvent,
      leadLabel: "Eerstvolgend",
      summary:
        todayEvents.length > 1
          ? `${todayEvents.length} afspraken vandaag, met dit als eerstvolgende moment.`
          : "Eén duidelijke afspraak vraagt vandaag om aandacht.",
      supportEvents,
      title: "Dit komt hierna",
      tone: todayEvents.length > 2 ? "busy" : "steady",
      toneLabel: todayEvents.length > 2 ? "Drukkere dag" : "In balans",
    };
  }

  if (todayEvents.length > 0) {
    return {
      hiddenSupportCount: 0,
      leadCue: getPlanningPreparationCue(todayEvents[0]),
      leadEvent: todayEvents[0],
      leadLabel: "Vandaag liep al zo",
      summary: "De afspraken van vandaag liggen al achter het gezin.",
      supportEvents: [],
      title: "Vandaag is ingevuld",
      tone: "steady",
      toneLabel: "Afgerond",
    };
  }

  return {
    hiddenSupportCount: 0,
    leadEvent: null,
    leadLabel: "Vandaag",
    summary: nextFutureEvent
      ? `Volgende afspraak: ${formatDutchWeekday(getDateKey(nextFutureEvent.startsAt))} ${formatDutchShortDate(getDateKey(nextFutureEvent.startsAt))} · ${nextFutureEvent.title}.`
      : "Geen afspraken vandaag en niets dringends direct daarna.",
    supportEvents: [],
    title: "Vandaag blijft open",
    tone: "calm",
    toneLabel: "Rustige dag",
  };
}

function isCurrentPlanningEvent(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
  nowIso: string,
) {
  const now = new Date(nowIso).getTime();
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = event.endsAt ? new Date(event.endsAt).getTime() : startsAt;
  if (event.allDay) return getDateKey(event.startsAt) === nowIso.slice(0, 10);
  return startsAt <= now && now <= endsAt;
}

function getPlanningPreparationCue(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
) {
  if (event.location) return event.location;

  const description = event.description?.trim();
  if (description) return description;

  if (event.source.type === "birthdays") return "Verjaardag: denk aan kaartje of cadeau.";
  if (event.source.type === "schoolHolidays") {
    return "Vakantiedag: opvang of dagindeling controleren.";
  }
  if (event.allDay) return "Hele dag zichtbaar voor het gezin.";
  return undefined;
}

function isSpecialPlanningEvent(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
) {
  const title = event.title.toLowerCase();
  return (
    event.source.type === "birthdays" ||
    event.source.type === "schoolHolidays" ||
    title.includes("verjaardag") ||
    title.includes("birthday") ||
    title.includes("vakantie") ||
    title.includes("feestdag")
  );
}

function formatFamilyFilterLabel(sourceName: string) {
  const normalized = sourceName.toLowerCase();

  if (normalized.includes("school")) return "School";
  if (normalized.includes("birthday") || normalized.includes("verjaardag")) {
    return "Verjaardagen";
  }
  if (normalized.includes("tv") || normalized.includes("series")) {
    return "TV-series";
  }
  if (normalized.includes("holiday") || normalized.includes("vakantie")) {
    return "Vakanties";
  }
  if (normalized.includes("homeops") || normalized.includes("calendar")) {
    return "Gezin";
  }

  return sourceName;
}

function getIsoWeekNumber(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((value.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
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
