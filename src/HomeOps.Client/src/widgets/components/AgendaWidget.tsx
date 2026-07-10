import { useEffect, useMemo, useRef, useState } from "react";
import {
  filterEventsBySource,
  formatEventTime,
  hydrateAgendaEvents,
} from "../../agenda/agendaUtils";
import { loadAgendaWeather } from "../../agenda/agendaWeatherApi";
import {
  createCalendarAgendaEvent,
  deleteCalendarAgendaFutureOccurrences,
  deleteCalendarAgendaOccurrence,
  deleteCalendarAgendaEvent,
  getCalendarAgendaEventSeries,
  loadCalendarAgendaData,
  restoreCalendarAgendaOccurrence,
  skipCalendarAgendaOccurrence,
  splitCalendarAgendaEventSeries,
  updateCalendarAgendaEvent,
  updateCalendarAgendaOccurrence,
  type CalendarEventSeriesDetails,
  type EventRecurrenceEndMode,
  type EventRecurrenceFrequency,
  type EventRecurrenceRuleInput,
  type EventRecurrenceWeekday,
  type EventSeriesInput,
} from "../../agenda/calendarEventsApi";
import { useAgendaLayerSettings } from "../../agenda/layerSettings";
import type { AgendaWeatherSlotProjection } from "../../api/homeOpsApiClient";
import type {
  EventSource,
  NormalizedEvent,
} from "../../events/eventSourceModel";
import {
  WeatherTemperatureBadge,
  type WeatherTemperatureDisplay,
} from "../../weather/WeatherTemperatureBadge";
import {
  formatWeatherAccessibleLabel,
  formatTemperatureLabel,
  toWeatherIconKey,
} from "../../weather/weatherPresentation";
import { FamilyBoardIcon, type FamilyBoardIconName } from "../../design";
import type { WidgetRenderProps } from "../WidgetRenderer";
import { useVisualReviewNow } from "../../visualReviewTime";

type EventDialogQuestion = "title" | "date" | "dayKind" | "details";
type AgendaWorkspaceMode = "planning" | "month";

type EventFormState = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  recurrenceFrequency: EventRecurrenceFrequency;
  recurrenceInterval: string;
  recurrenceEndMode: EventRecurrenceEndMode;
  recurrenceUntilDate: string;
  recurrenceCount: string;
  recurrenceWeeklyDays: EventRecurrenceWeekday[];
  recurrenceMonthlyDayOfMonth: string;
  recurrenceYearlyMonth: string;
  recurrenceYearlyDayOfMonth: string;
};

type RecurringSaveScope = "single" | "future" | "series";

type PendingRecurringSave = {
  event: NormalizedEvent;
  input: EventSeriesInput;
  allowSingle: boolean;
};

type RecentSkippedOccurrence = {
  eventSeriesId: string;
  occurrenceKey: string;
  title: string;
};

function createEmptyForm(date = todayIsoDate()): EventFormState {
  return {
    title: "",
    description: "",
    location: "",
    startsAt: `${date}T09:00`,
    endsAt: `${date}T10:00`,
    allDay: false,
    recurrenceFrequency: "None",
    recurrenceInterval: "1",
    recurrenceEndMode: "Never",
    recurrenceUntilDate: "",
    recurrenceCount: "",
    recurrenceWeeklyDays: [],
    recurrenceMonthlyDayOfMonth: `${new Date(`${date}T12:00:00`).getDate()}`,
    recurrenceYearlyMonth: `${new Date(`${date}T12:00:00`).getMonth() + 1}`,
    recurrenceYearlyDayOfMonth: `${new Date(`${date}T12:00:00`).getDate()}`,
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
  const [agendaWeatherSlots, setAgendaWeatherSlots] = useState<
    AgendaWeatherSlotProjection[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(() => createEmptyForm(today));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NormalizedEvent | null>(null);
  const [editingEventSeries, setEditingEventSeries] =
    useState<CalendarEventSeriesDetails | null>(null);
  const [isLoadingEventSeries, setIsLoadingEventSeries] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventDialogQuestion, setEventDialogQuestion] =
    useState<EventDialogQuestion>("title");
  const [pendingRecurringSave, setPendingRecurringSave] =
    useState<PendingRecurringSave | null>(null);
  const [deleteScopeEvent, setDeleteScopeEvent] =
    useState<NormalizedEvent | null>(null);
  const [recentlySkippedOccurrence, setRecentlySkippedOccurrence] =
    useState<RecentSkippedOccurrence | null>(null);

  useEffect(() => {
    const previousToday = previousTodayRef.current;
    if (previousToday === today) return;

    setSelectedDate((current) => (current === previousToday ? today : current));
    previousTodayRef.current = today;
  }, [today]);

  async function reloadCalendarEvents() {
    const data = await loadCalendarAgendaData();
    setCalendarSources(data.sources);
    setCalendarEvents(data.events);
    setErrorMessage(null);
  }

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
            : "De agenda kon niet worden geladen.",
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
    let isMounted = true;

    loadAgendaWeather()
      .then((data) => {
        if (!isMounted) return;
        setAgendaWeatherSlots(data?.slots ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setAgendaWeatherSlots([]);
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

  const eventSources = useMemo(() => [...calendarSources], [calendarSources]);
  const events = useMemo(() => [...calendarEvents], [calendarEvents]);
  const { settings, setSourceEnabled } = useAgendaLayerSettings(eventSources);

  const selectedSources = settings.months.enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(events, selectedSources);
    return hydrateAgendaEvents(filteredEvents, eventSources);
  }, [events, eventSources, selectedSources]);
  const nowIso = visualReviewNow
    ? visualReviewNow.toISOString()
    : new Date().toISOString();
  const hasAgendaHeaderStatus = isLoading || errorMessage !== null;
  const showAgendaHeader = activeWorkspaceMode === "month" || hasAgendaHeaderStatus;

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
      if (
        editingEvent?.isRecurring &&
        editingEvent.occurrenceKey &&
        editingEvent.eventSeriesId
      ) {
        setPendingRecurringSave({
          event: editingEvent,
          input,
          allowSingle: !didRecurrenceChange(
            input.recurrenceRule,
            editingEventSeries?.recurrenceRule,
          ),
        });
      } else {
        const savedEvent = editingEventId
          ? await updateCalendarAgendaEvent(
              editingEvent?.eventSeriesId ?? editingEventId,
              input,
            )
          : await createCalendarAgendaEvent(input);

        setCalendarEvents((current) => {
          const withoutSaved = current.filter(
            (calendarEvent) => calendarEvent.id !== savedEvent.id,
          );
          return [...withoutSaved, savedEvent];
        });
        if (editingEventId) {
          setEditingEvent(savedEvent);
        }
        closeEventForm();
      }
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
    setEditingEvent(null);
    setEditingEventSeries(null);
    setPendingRecurringSave(null);
    setIsLoadingEventSeries(false);
    setIsEventFormOpen(false);
    setEventDialogQuestion("title");
    setForm(createEmptyForm(today));
  }

  function openNewEventForm(date = selectedDate || today) {
    setEditingEventId(null);
    setEditingEvent(null);
    setEditingEventSeries(null);
    setSelectedDate(date);
    setForm(createEmptyForm(date));
    setEventDialogQuestion("title");
    setIsEventFormOpen(true);
  }

  async function startEditing(event: NormalizedEvent) {
    setEditingEventId(event.id);
    setEditingEvent(event);
    setEditingEventSeries(null);
    setIsEventFormOpen(true);
    setEventDialogQuestion("title");
    setForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      startsAt: toDateTimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDateTimeLocal(event.endsAt) : "",
      allDay: event.allDay,
      recurrenceFrequency: "None",
      recurrenceInterval: "1",
      recurrenceEndMode: "Never",
      recurrenceUntilDate: "",
      recurrenceCount: "",
      recurrenceWeeklyDays: [],
      recurrenceMonthlyDayOfMonth: `${new Date(event.startsAt).getDate()}`,
      recurrenceYearlyMonth: `${new Date(event.startsAt).getMonth() + 1}`,
      recurrenceYearlyDayOfMonth: `${new Date(event.startsAt).getDate()}`,
    });

    if (event.isRecurring && event.eventSeriesId) {
      setIsLoadingEventSeries(true);
      try {
        const eventSeries = await getCalendarAgendaEventSeries(event.eventSeriesId);
        setEditingEventSeries(eventSeries);
        setForm((current) => applySeriesRecurrenceToForm(current, eventSeries));
      } catch (error: unknown) {
        setErrorMessage(
          toUserFacingError(
            error,
            "De herhaalinstellingen konden niet worden geladen.",
          ),
        );
      } finally {
        setIsLoadingEventSeries(false);
      }
    }
  }

  async function performRecurringSave(scope: RecurringSaveScope) {
    if (
      !pendingRecurringSave?.event.eventSeriesId ||
      !pendingRecurringSave.event.occurrenceKey
    ) {
      return;
    }

    setIsSaving(true);
    try {
      if (scope === "single") {
        await updateCalendarAgendaOccurrence(
          pendingRecurringSave.event.eventSeriesId,
          pendingRecurringSave.event.occurrenceKey,
          pendingRecurringSave.input,
        );
      } else if (scope === "future") {
        await splitCalendarAgendaEventSeries(
          pendingRecurringSave.event.eventSeriesId,
          pendingRecurringSave.event.occurrenceKey,
          pendingRecurringSave.input,
        );
      } else {
        await updateCalendarAgendaEvent(
          pendingRecurringSave.event.eventSeriesId,
          pendingRecurringSave.input,
        );
      }

      await reloadCalendarEvents();
      closeEventForm();
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "De afspraak kon niet worden opgeslagen."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function skipOccurrence(event: NormalizedEvent) {
    if (!event.eventSeriesId || !event.occurrenceKey) {
      return;
    }

    setIsSaving(true);
    try {
      await skipCalendarAgendaOccurrence(event.eventSeriesId, event.occurrenceKey);
      await reloadCalendarEvents();
      setRecentlySkippedOccurrence({
        eventSeriesId: event.eventSeriesId,
        occurrenceKey: event.occurrenceKey,
        title: event.title,
      });
      closeEventForm();
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "Deze afspraak kon niet worden overgeslagen."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function restoreOccurrence(
    eventSeriesId: string,
    occurrenceKey: string,
    closeDialog = false,
  ) {
    setIsSaving(true);
    try {
      await restoreCalendarAgendaOccurrence(eventSeriesId, occurrenceKey);
      await reloadCalendarEvents();
      setRecentlySkippedOccurrence((current) =>
        current?.eventSeriesId === eventSeriesId &&
        current.occurrenceKey === occurrenceKey
          ? null
          : current,
      );
      if (closeDialog) {
        closeEventForm();
      }
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "Deze afspraak kon niet worden teruggezet."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEvent(event: NormalizedEvent) {
    if (event.isRecurring && event.eventSeriesId && event.occurrenceKey) {
      setDeleteScopeEvent(event);
      return;
    }

    const eventId = event.eventSeriesId ?? event.id;
    setDeletingEventId(event.id);
    try {
      await deleteCalendarAgendaEvent(eventId);
      setCalendarEvents((current) =>
        current.filter((currentEvent) => currentEvent.id !== event.id),
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

  async function deleteRecurringEvent(
    event: NormalizedEvent,
    scope: RecurringSaveScope,
  ) {
    if (!event.eventSeriesId || !event.occurrenceKey) {
      return;
    }

    setDeletingEventId(event.id);
    try {
      if (scope === "single") {
        await deleteCalendarAgendaOccurrence(
          event.eventSeriesId,
          event.occurrenceKey,
        );
        setRecentlySkippedOccurrence({
          eventSeriesId: event.eventSeriesId,
          occurrenceKey: event.occurrenceKey,
          title: event.title,
        });
      } else if (scope === "future") {
        await deleteCalendarAgendaFutureOccurrences(
          event.eventSeriesId,
          event.occurrenceKey,
        );
      } else {
        await deleteCalendarAgendaEvent(event.eventSeriesId);
      }

      await reloadCalendarEvents();
      setDeleteScopeEvent(null);
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(
        toUserFacingError(error, "De afspraak kon niet worden verwijderd."),
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <article className="widget-card agenda-widget" aria-label={instance.title}>
      {showAgendaHeader ? (
        <div className="agenda-header">
          {activeWorkspaceMode === "month" ? (
            <div className="agenda-command-main">
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
                  Afspraak toevoegen
                </button>
              </div>
            </div>
          ) : null}
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
              {recentlySkippedOccurrence ? (
                <div className="agenda-status agenda-status-info" role="status">
                  <span>{recentlySkippedOccurrence.title} is deze keer overgeslagen.</span>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      restoreOccurrence(
                        recentlySkippedOccurrence.eventSeriesId,
                        recentlySkippedOccurrence.occurrenceKey,
                      )
                    }
                    disabled={isSaving}
                  >
                    {isSaving ? "Terugzetten…" : "Deze keer terugzetten"}
                  </button>
                </div>
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
      ) : null}

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
              editingEventId ? "Afspraak bewerken" : "Afspraak toevoegen"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>{editingEventId ? "Afspraak bewerken" : "Afspraak toevoegen"}</h3>
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
              editingEvent={editingEvent}
              editingEventSeries={editingEventSeries}
              form={form}
              isEditing={editingEventId !== null}
              isLoadingEventSeries={isLoadingEventSeries}
              isSaving={isSaving}
              question={eventDialogQuestion}
              onChange={setForm}
              onQuestionChange={setEventDialogQuestion}
              onRestoreOccurrence={() =>
                editingEvent?.eventSeriesId && editingEvent.occurrenceKey
                  ? restoreOccurrence(
                      editingEvent.eventSeriesId,
                      editingEvent.occurrenceKey,
                      true,
                    )
                  : Promise.resolve()
              }
              onSkipOccurrence={() =>
                editingEvent ? skipOccurrence(editingEvent) : Promise.resolve()
              }
              onCancel={closeEventForm}
              onSubmit={handleSubmit}
              today={today}
            />
          </section>
        </div>
      ) : null}

      {pendingRecurringSave ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => setPendingRecurringSave(null)}
        >
          <section
            className="home-capture-dialog domain-agenda"
            role="dialog"
            aria-modal="true"
            aria-label="Kies wat je wilt opslaan"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Herhalen</p>
                <h3>Wat wil je aanpassen?</h3>
              </div>
            </header>
            <div className="agenda-scope-actions">
              {pendingRecurringSave.allowSingle ? (
                <button
                  type="button"
                  onClick={() => performRecurringSave("single")}
                  disabled={isSaving}
                >
                  {isSaving ? "Opslaan…" : "Alleen deze afspraak"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => performRecurringSave("future")}
                disabled={isSaving}
              >
                {isSaving ? "Opslaan…" : "Deze en volgende afspraken"}
              </button>
              <button
                type="button"
                onClick={() => performRecurringSave("series")}
                disabled={isSaving}
              >
                {isSaving ? "Opslaan…" : "Hele reeks"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {deleteScopeEvent ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => setDeleteScopeEvent(null)}
        >
          <section
            className="home-capture-dialog domain-agenda"
            role="dialog"
            aria-modal="true"
            aria-label="Kies wat je wilt verwijderen"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Verwijderen</p>
                <h3>Welke afspraken mogen weg?</h3>
              </div>
            </header>
            <div className="agenda-scope-actions">
              <button
                type="button"
                onClick={() => deleteRecurringEvent(deleteScopeEvent, "single")}
                disabled={deletingEventId === deleteScopeEvent.id}
              >
                {deletingEventId === deleteScopeEvent.id
                  ? "Verwijderen…"
                  : "Alleen deze afspraak"}
              </button>
              <button
                type="button"
                onClick={() => deleteRecurringEvent(deleteScopeEvent, "future")}
                disabled={deletingEventId === deleteScopeEvent.id}
              >
                {deletingEventId === deleteScopeEvent.id
                  ? "Verwijderen…"
                  : "Deze en volgende afspraken"}
              </button>
              <button
                type="button"
                onClick={() => deleteRecurringEvent(deleteScopeEvent, "series")}
                disabled={deletingEventId === deleteScopeEvent.id}
              >
                {deletingEventId === deleteScopeEvent.id
                  ? "Verwijderen…"
                  : "Hele reeks"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="agenda-mode-canvas">
        {activeWorkspaceMode === "month" ? (
          <MonthWorkspace
            agendaWeatherSlots={agendaWeatherSlots}
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
            agendaWeatherSlots={agendaWeatherSlots}
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
  editingEvent,
  editingEventSeries,
  form,
  isEditing,
  isLoadingEventSeries,
  isSaving,
  question,
  onChange,
  onQuestionChange,
  onRestoreOccurrence,
  onSkipOccurrence,
  onCancel,
  onSubmit,
  today,
}: {
  editingEvent: NormalizedEvent | null;
  editingEventSeries: CalendarEventSeriesDetails | null;
  form: EventFormState;
  isEditing: boolean;
  isLoadingEventSeries: boolean;
  isSaving: boolean;
  question: EventDialogQuestion;
  onChange: (form: EventFormState) => void;
  onQuestionChange: (question: EventDialogQuestion) => void;
  onRestoreOccurrence: () => Promise<void>;
  onSkipOccurrence: () => Promise<void>;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  today: string;
}) {
  const titleIsValid = form.title.trim().length > 0;
  const submitLabel = isEditing ? "Afspraak opslaan" : "Afspraak maken";
  const showTitleQuestion = isEditing || question === "title";
  const showDateQuestion = isEditing || question === "date";
  const showDayKindQuestion = isEditing || question === "dayKind";
  const showDetailsQuestion = isEditing || question === "details";
  const recurrenceSummaryLines = buildRecurrenceSummary(form);
  const canSkipOccurrence = Boolean(
    editingEvent?.isRecurring && editingEvent.eventSeriesId && editingEvent.occurrenceKey,
  );
  const canRestoreOccurrence = Boolean(
    editingEvent?.isException &&
      editingEvent.eventSeriesId &&
      editingEvent.occurrenceKey,
  );

  return (
    <form
      className="calendar-event-form task-conversation-form"
      onSubmit={onSubmit}
      aria-label="Agenda-item invullen"
    >
      <div className="task-conversation-panel" key={question}>
        {showTitleQuestion ? (
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

        {showDateQuestion ? (
          <div className="task-date-question">
            <p className="task-question-label">Wanneer is het?</p>
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

        {showDayKindQuestion ? (
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

        {showDetailsQuestion ? (
          <div className="task-extras-question">
            <label className="task-conversation-question">
              <span>Nog details?</span>
              <input
                autoFocus
                value={form.description}
                onChange={(event) =>
                  onChange({ ...form, description: event.target.value })
                }
                placeholder="Notitie"
              />
            </label>
            <label className="task-conversation-question">
              <span>Waar is het?</span>
              <input
                value={form.location}
                onChange={(event) =>
                  onChange({ ...form, location: event.target.value })
                }
                placeholder="Locatie"
              />
            </label>
            <section className="agenda-recurrence-section" aria-label="Herhalen">
              <label className="task-conversation-question compact">
                <span>Herhalen</span>
                <select
                  aria-label="Herhaalfrequentie"
                  value={form.recurrenceFrequency}
                  onChange={(event) =>
                    onChange(
                      setRecurrenceFrequency(
                        form,
                        event.target.value as EventRecurrenceFrequency,
                      ),
                    )
                  }
                  disabled={isLoadingEventSeries}
                >
                  <option value="None">Niet herhalen</option>
                  <option value="Daily">Dagelijks</option>
                  <option value="Weekly">Wekelijks</option>
                  <option value="Monthly">Maandelijks</option>
                  <option value="Yearly">Jaarlijks</option>
                </select>
              </label>
              {isLoadingEventSeries ? (
                <p className="agenda-recurrence-loading" role="status">
                  Herhaalinstellingen laden…
                </p>
              ) : null}
              {form.recurrenceFrequency !== "None" ? (
                <div className="agenda-recurrence-fields">
                  <label className="task-conversation-question compact">
                    <span>Hoe vaak</span>
                    <input
                      aria-label="Hoe vaak"
                      type="number"
                      min="1"
                      step="1"
                      value={form.recurrenceInterval}
                      onChange={(event) =>
                        onChange({
                          ...form,
                          recurrenceInterval: event.target.value,
                        })
                      }
                    />
                  </label>

                  {form.recurrenceFrequency === "Weekly" ? (
                    <fieldset className="agenda-weekday-picker">
                      <legend>Kies minstens één weekdag</legend>
                      {weekdayOptions.map((weekday) => (
                        <label key={weekday.value}>
                          <input
                            aria-label={weekday.label}
                            type="checkbox"
                            checked={form.recurrenceWeeklyDays.includes(
                              weekday.value,
                            )}
                            onChange={() =>
                              onChange(toggleWeeklyDay(form, weekday.value))
                            }
                          />
                          <span>{weekday.label}</span>
                        </label>
                      ))}
                    </fieldset>
                  ) : null}

                  {form.recurrenceFrequency === "Monthly" ? (
                    <label className="task-conversation-question compact">
                      <span>Dag van de maand</span>
                      <input
                        aria-label="Dag van de maand"
                        type="number"
                        min="1"
                        max="31"
                        value={form.recurrenceMonthlyDayOfMonth}
                        onChange={(event) =>
                          onChange({
                            ...form,
                            recurrenceMonthlyDayOfMonth: event.target.value,
                          })
                        }
                      />
                    </label>
                  ) : null}

                  {form.recurrenceFrequency === "Yearly" ? (
                    <div className="agenda-time-grid">
                      <label className="task-conversation-question compact">
                        <span>Maand</span>
                        <select
                          aria-label="Maand"
                          value={form.recurrenceYearlyMonth}
                          onChange={(event) =>
                            onChange({
                              ...form,
                              recurrenceYearlyMonth: event.target.value,
                            })
                          }
                        >
                          {monthOptions.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="task-conversation-question compact">
                        <span>Dag</span>
                        <input
                          aria-label="Dag"
                          type="number"
                          min="1"
                          max="31"
                          value={form.recurrenceYearlyDayOfMonth}
                          onChange={(event) =>
                            onChange({
                              ...form,
                              recurrenceYearlyDayOfMonth: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <label className="task-conversation-question compact">
                    <span>Eindigt</span>
                    <select
                      aria-label="Eindigt"
                      value={form.recurrenceEndMode}
                      onChange={(event) =>
                        onChange({
                          ...form,
                          recurrenceEndMode: event.target.value as EventRecurrenceEndMode,
                        })
                      }
                    >
                      <option value="Never">Nooit</option>
                      <option value="OnDate">Op datum</option>
                      <option value="AfterCount">Na aantal keer</option>
                    </select>
                  </label>

                  {form.recurrenceEndMode === "OnDate" ? (
                    <label className="task-conversation-question compact">
                      <span>Einddatum</span>
                      <input
                        aria-label="Einddatum"
                        type="date"
                        value={form.recurrenceUntilDate}
                        onChange={(event) =>
                          onChange({
                            ...form,
                            recurrenceUntilDate: event.target.value,
                          })
                        }
                      />
                    </label>
                  ) : null}

                  {form.recurrenceEndMode === "AfterCount" ? (
                    <label className="task-conversation-question compact">
                      <span>Aantal keer</span>
                      <input
                        aria-label="Aantal keer"
                        type="number"
                        min="1"
                        step="1"
                        value={form.recurrenceCount}
                        onChange={(event) =>
                          onChange({
                            ...form,
                            recurrenceCount: event.target.value,
                          })
                        }
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </section>
            {editingEventSeries?.recurrenceRule &&
            editingEvent?.isRecurring &&
            didRecurrenceChange(
              toEventSeriesInput(form).recurrenceRule,
              editingEventSeries.recurrenceRule,
            ) ? (
              <p className="agenda-recurrence-hint">
                Herhaalinstellingen horen bij de reeks. Je kiest straks welke
                afspraken je wilt aanpassen.
              </p>
            ) : null}
            {canSkipOccurrence || canRestoreOccurrence ? (
              <div className="agenda-occurrence-actions">
                {canSkipOccurrence ? (
                  <button
                    type="button"
                    onClick={() => void onSkipOccurrence()}
                    disabled={isSaving}
                  >
                    {isSaving ? "Overslaan…" : "Deze keer overslaan"}
                  </button>
                ) : null}
                {canRestoreOccurrence ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => void onRestoreOccurrence()}
                    disabled={isSaving}
                  >
                    {isSaving ? "Terugzetten…" : "Deze keer terugzetten"}
                  </button>
                ) : null}
              </div>
            ) : null}
            <p className="task-dialog-summary">{eventSummary(form)}</p>
            {recurrenceSummaryLines.length > 0 ? (
              <div className="task-dialog-summary agenda-recurrence-summary">
                {recurrenceSummaryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="task-conversation-actions">
        {isEditing ? (
          <button type="button" className="secondary-action" onClick={onCancel}>
            Annuleren
          </button>
        ) : question !== "title" ? (
          <button
            type="button"
            className="secondary-action"
            onClick={() => onQuestionChange(previousEventQuestion(question))}
          >
            Terug
          </button>
        ) : null}
        {isEditing || question === "details" ? (
          <button type="submit" disabled={isSaving || !titleIsValid}>
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
    <div className="source-selector" role="group" aria-label="Kalenderbronnen">
      <span className="source-selector-label">Kalenderbronnen</span>
      {eventSources.map((source) => (
        <label key={source.id} className={source.canDisplayEvents === false ? "source-selector-unavailable" : undefined}>
          <input
            checked={selectedSources[source.id] ?? false}
            disabled={source.canDisplayEvents === false}
            onChange={(event) => onToggleSource(source.id, event.target.checked)}
            type="checkbox"
          />
          <span
            className="source-color"
            style={{ backgroundColor: source.color.hex }}
            aria-hidden="true"
          />
          <span className="source-selector-copy">
            <span>{source.icon ? `${source.icon} ` : ""}{formatFamilyFilterLabel(source.name)}</span>
            {source.canDisplayEvents === false ? (
              <small>{formatAgendaSourceState(source)}</small>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function PlanningWorkspace({
  agendaWeatherSlots,
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
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  eventSources: EventSource[];
  events: ReturnType<typeof hydrateAgendaEvents>;
  nowIso: string;
  onAddEvent: (date?: string) => void;
  onDelete: (event: NormalizedEvent) => void;
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
  const todayWeather = useMemo(
    () => resolveAgendaDayWeather(today, nowIso, agendaWeatherSlots),
    [agendaWeatherSlots, nowIso, today],
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
      <div className="agenda-planning-board">
        <TodayBriefingCard
          agendaWeatherSlots={agendaWeatherSlots}
          briefing={briefing.today}
          dayWeather={todayWeather}
          deletingEventId={deletingEventId}
          onDelete={onDelete}
          onEdit={onEdit}
          selectedEventId={selectedPlanningEventId}
          setSelectedEventId={setSelectedPlanningEventId}
        />
        <PlanningOutlookCard
          agendaWeatherSlots={agendaWeatherSlots}
          deletingEventId={deletingEventId}
          nowIso={nowIso}
          onDelete={onDelete}
          onEdit={onEdit}
          outlook={briefing.outlook}
          selectedEventId={selectedPlanningEventId}
          setSelectedEventId={setSelectedPlanningEventId}
        />
        <PlanningWeekCard
          agendaWeatherSlots={agendaWeatherSlots}
          deletingEventId={deletingEventId}
          nowIso={nowIso}
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
          selectedDayWeather={resolveAgendaDayWeather(
            selectedDate,
            nowIso,
            agendaWeatherSlots,
            formatDutchDay(selectedDate),
          )}
          selectedSources={selectedSources}
          today={today}
        />
      </div>
    </section>
  );
}

function TodayBriefingCard({
  agendaWeatherSlots,
  briefing,
  dayWeather,
  deletingEventId,
  onDelete,
  onEdit,
  selectedEventId,
  setSelectedEventId,
}: {
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  briefing: PlanningBriefing["today"];
  dayWeather: WeatherTemperatureDisplay | null;
  deletingEventId: string | null;
  onDelete: (event: NormalizedEvent) => void;
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
        <div className="agenda-today-header-meta">
          {dayWeather ? (
            <WeatherTemperatureBadge
              className="agenda-weather-cluster agenda-weather-cluster--today-header"
              display={dayWeather}
              variant="prominent"
            />
          ) : null}
          <span className={["agenda-planning-tone", briefing.tone].join(" ")}>
            {briefing.toneLabel}
          </span>
        </div>
      </header>

      {briefing.leadEvent ? (
        <div className="agenda-today-lead">
          <p className="agenda-planning-section-label">{briefing.leadLabel}</p>
          <PlanningEventRow
            agendaWeatherSlots={agendaWeatherSlots}
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
                agendaWeatherSlots={agendaWeatherSlots}
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
  agendaWeatherSlots,
  deletingEventId,
  nowIso,
  onDelete,
  onEdit,
  selectedEventId,
  setSelectedEventId,
  week,
}: {
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  nowIso: string;
  onDelete: (event: NormalizedEvent) => void;
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
              ? `${week.totalEvents} ${week.totalEvents === 1 ? "afspraak" : "afspraken"}`
              : "De rest van de week is rustig"}
          </h5>
          <p>{week.summary}</p>
        </div>
      </header>
      {week.dayGroups.length > 0 ? (
        <div className="agenda-week-briefing-days">
          {week.dayGroups.map((dayGroup) => {
            const dayWeather = resolveAgendaDayWeather(
              dayGroup.date,
              nowIso,
              agendaWeatherSlots,
              formatDutchDay(dayGroup.date),
            );

            return (
              <section className="agenda-week-briefing-day" key={dayGroup.date}>
                <div className="agenda-week-briefing-day-header">
                  <div>
                    <strong>{formatDutchWeekday(dayGroup.date)}</strong>
                    <p>{formatDutchShortDate(dayGroup.date)}</p>
                  </div>
                  <div className="agenda-week-briefing-day-meta">
                    {dayWeather ? (
                      <WeatherTemperatureBadge
                        className="agenda-weather-cluster agenda-weather-cluster--day-header"
                        display={dayWeather}
                        variant="medium"
                      />
                    ) : null}
                    <span>
                      {dayGroup.events.length}{" "}
                      {dayGroup.events.length === 1 ? "afspraak" : "afspraken"}
                    </span>
                  </div>
                </div>
                <ul className="agenda-planning-event-list compact">
                  {dayGroup.visibleEvents.map((event) => (
                    <PlanningEventRow
                      agendaWeatherSlots={agendaWeatherSlots}
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
                      showWeather={false}
                    />
                  ))}
                </ul>
                {dayGroup.hiddenCount > 0 ? (
                  <p className="agenda-planning-overflow-note">
                    +{dayGroup.hiddenCount} meer op {formatDutchWeekday(dayGroup.date)}
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="agenda-planning-group-empty">
          <p>Na vandaag blijft de komende week voorlopig ruim.</p>
        </div>
      )}
    </article>
  );
}

function PlanningOutlookCard({
  agendaWeatherSlots,
  deletingEventId,
  nowIso,
  onDelete,
  onEdit,
  outlook,
  selectedEventId,
  setSelectedEventId,
}: {
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  nowIso: string;
  onDelete: (event: NormalizedEvent) => void;
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
        </div>
      </header>
      {outlook.events.length > 0 ? (
        <>
          <ul className="agenda-planning-event-list compact">
            {outlook.visibleEvents.map((event) => (
              <PlanningEventRow
                agendaWeatherSlots={agendaWeatherSlots}
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
                weatherOverride={resolveAgendaOutlookAllDayWeather(
                  event,
                  nowIso,
                  agendaWeatherSlots,
                )}
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
  selectedDayWeather,
  selectedSources,
  today,
}: {
  eventSources: EventSource[];
  onAddEvent: (date?: string) => void;
  onOpenMonth: () => void;
  onToggleSource: (sourceId: string, enabled: boolean) => void;
  selectedDate: string;
  selectedDayWeather: WeatherTemperatureDisplay | null;
  selectedSources: Record<string, boolean>;
  today: string;
}) {
  return (
    <aside className="agenda-planning-card agenda-planning-tools" aria-label="Plannen">
      <header className="agenda-planning-card-header">
        <div>
          <h5>Plannen</h5>
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
        <div className="agenda-planning-tool-date">
          <strong>{formatDutchDay(selectedDate)}</strong>
          {selectedDayWeather ? (
            <WeatherTemperatureBadge
              className="agenda-weather-cluster agenda-weather-cluster--selected-day"
              display={selectedDayWeather}
              variant="medium"
            />
          ) : null}
        </div>
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
  agendaWeatherSlots,
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
  showWeather = true,
  statusBadge,
  weatherOverride,
}: {
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  dayLabel?: string;
  deletingEventId: string | null;
  detail: string;
  event: ReturnType<typeof hydrateAgendaEvents>[number];
  extra?: string;
  mode: "lead" | "today" | "compact";
  onDelete: (event: NormalizedEvent) => void;
  onEdit: (event: NormalizedEvent) => void;
  selected: boolean;
  setSelectedEventId: (eventId: string | null) => void;
  showWeather?: boolean;
  statusBadge?: string;
  weatherOverride?: WeatherTemperatureDisplay | null;
}) {
  const visual = getAgendaEventVisual(event);
  const showIcon = isSpecialPlanningEvent(event);
  const weather =
    weatherOverride ??
    (showWeather ? resolveAgendaEventWeather(event, agendaWeatherSlots) : null);

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
        {weather ? (
          <WeatherTemperatureBadge
            className="agenda-weather-cluster agenda-weather-cluster--row"
            display={weather}
            variant="compact"
          />
        ) : null}
      </button>
      {selected && event.editable ? (
        <span className="agenda-planning-event-actions">
          <button type="button" onClick={() => onEdit(event)}>
            Bewerken
          </button>
          <button
            type="button"
            disabled={deletingEventId === event.id}
            onClick={() => onDelete(event)}
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
  onDelete: (event: NormalizedEvent) => void;
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
  onDelete: (event: NormalizedEvent) => void;
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
  agendaWeatherSlots,
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
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  isEmpty: boolean;
  onAddEvent: (date?: string) => void;
  onDelete: (event: NormalizedEvent) => void;
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
        agendaWeatherSlots={agendaWeatherSlots}
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
  agendaWeatherSlots,
  deletingEventId,
  events,
  isAgendaEmpty,
  onAddEvent,
  onDelete,
  onEdit,
  selectedDate,
}: {
  agendaWeatherSlots: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  isAgendaEmpty: boolean;
  onAddEvent: () => void;
  onDelete: (event: NormalizedEvent) => void;
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
              : `${events.length} ${events.length === 1 ? "afspraak" : "afspraken"}.`}
          </p>
        </div>
        <button className="compact-action" type="button" onClick={onAddEvent}>
          Toevoegen
        </button>
      </header>
      {events.length > 0 ? (
        <AgendaEventList
          agendaWeatherSlots={agendaWeatherSlots}
          deletingEventId={deletingEventId}
          events={events}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <div className="agenda-day-empty-state">
          <strong>{isAgendaEmpty ? "Nog geen afspraken" : "Geen afspraken"}</strong>
        </div>
      )}
    </aside>
  );
}

function AgendaEventList({
  agendaWeatherSlots = [],
  deletingEventId,
  events,
  onDelete,
  onEdit,
}: {
  agendaWeatherSlots?: AgendaWeatherSlotProjection[];
  deletingEventId: string | null;
  events: ReturnType<typeof hydrateAgendaEvents>;
  onDelete: (event: NormalizedEvent) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  return (
    <ul className="agenda-event-list">
      {events.map((event) => {
        const visual = getAgendaEventVisual(event);
        const weather = resolveAgendaEventWeather(event, agendaWeatherSlots);
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
            {weather ? (
              <WeatherTemperatureBadge
                className="agenda-weather-cluster agenda-weather-cluster--row"
                display={weather}
                variant="compact"
              />
            ) : null}
            {event.editable ? (
              <span className="agenda-event-card-actions">
                <button type="button" onClick={() => onEdit(event)}>
                  Bewerken
                </button>
                <button
                  type="button"
                  disabled={deletingEventId === event.id}
                  onClick={() => onDelete(event)}
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
  const recurrenceRule =
    form.recurrenceFrequency === "None"
      ? undefined
      : {
          frequency: form.recurrenceFrequency,
          interval: Number(form.recurrenceInterval || "1"),
          endMode: form.recurrenceEndMode,
          untilDate:
            form.recurrenceEndMode === "OnDate"
              ? form.recurrenceUntilDate
              : undefined,
          count:
            form.recurrenceEndMode === "AfterCount"
              ? Number(form.recurrenceCount || "0")
              : undefined,
          weeklyDays:
            form.recurrenceFrequency === "Weekly"
              ? form.recurrenceWeeklyDays
              : undefined,
          monthlyDayOfMonth:
            form.recurrenceFrequency === "Monthly"
              ? Number(form.recurrenceMonthlyDayOfMonth || "0")
              : undefined,
          yearlyMonth:
            form.recurrenceFrequency === "Yearly"
              ? Number(form.recurrenceYearlyMonth || "0")
              : undefined,
          yearlyDayOfMonth:
            form.recurrenceFrequency === "Yearly"
              ? Number(form.recurrenceYearlyDayOfMonth || "0")
              : undefined,
        } satisfies EventRecurrenceRuleInput;

  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    location: form.location.trim() || undefined,
    startsAt: toApiDateValue(form.startsAt, form.allDay),
    endsAt: form.endsAt ? toApiDateValue(form.endsAt, form.allDay) : undefined,
    allDay: form.allDay,
    recurrenceRule,
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

  if (!input.recurrenceRule) {
    return null;
  }

  if (!Number.isInteger(input.recurrenceRule.interval) || input.recurrenceRule.interval <= 0) {
    return "Vul in hoe vaak deze afspraak zich herhaalt.";
  }

  if (
    input.recurrenceRule.frequency === "Weekly" &&
    (!input.recurrenceRule.weeklyDays ||
      input.recurrenceRule.weeklyDays.length === 0)
  ) {
    return "Kies minstens één weekdag.";
  }

  if (
    input.recurrenceRule.frequency === "Monthly" &&
    (!input.recurrenceRule.monthlyDayOfMonth ||
      input.recurrenceRule.monthlyDayOfMonth < 1 ||
      input.recurrenceRule.monthlyDayOfMonth > 31)
  ) {
    return "Kies een geldige datum.";
  }

  if (input.recurrenceRule.frequency === "Yearly") {
    const month = input.recurrenceRule.yearlyMonth ?? 0;
    const day = input.recurrenceRule.yearlyDayOfMonth ?? 0;
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      !isValidMonthDay(month, day)
    ) {
      return "Kies een geldige datum.";
    }
  }

  if (input.recurrenceRule.endMode === "OnDate") {
    if (!input.recurrenceRule.untilDate) {
      return "Kies een geldige datum.";
    }

    if (input.recurrenceRule.untilDate < getEventDate(form)) {
      return "Kies een geldige datum.";
    }
  }

  if (input.recurrenceRule.endMode === "AfterCount") {
    if (!input.recurrenceRule.count || input.recurrenceRule.count <= 0) {
      return "Vul in hoe vaak deze afspraak zich herhaalt.";
    }
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

const weekdayOptions: Array<{
  value: EventRecurrenceWeekday;
  label: string;
}> = [
  { value: "Monday", label: "Ma" },
  { value: "Tuesday", label: "Di" },
  { value: "Wednesday", label: "Wo" },
  { value: "Thursday", label: "Do" },
  { value: "Friday", label: "Vr" },
  { value: "Saturday", label: "Za" },
  { value: "Sunday", label: "Zo" },
];

const monthOptions = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
].map((label, index) => ({ value: `${index + 1}`, label }));

function setRecurrenceFrequency(
  form: EventFormState,
  frequency: EventRecurrenceFrequency,
): EventFormState {
  if (frequency === "None") {
    return {
      ...form,
      recurrenceFrequency: "None",
      recurrenceInterval: "1",
      recurrenceEndMode: "Never",
      recurrenceUntilDate: "",
      recurrenceCount: "",
      recurrenceWeeklyDays: [],
    };
  }

  const eventDate = new Date(`${getEventDate(form)}T12:00:00`);
  return {
    ...form,
    recurrenceFrequency: frequency,
    recurrenceInterval: form.recurrenceInterval || "1",
    recurrenceWeeklyDays:
      frequency === "Weekly"
        ? form.recurrenceWeeklyDays.length > 0
          ? form.recurrenceWeeklyDays
          : [weekdayValueFromDate(eventDate)]
        : [],
    recurrenceMonthlyDayOfMonth: `${eventDate.getDate()}`,
    recurrenceYearlyMonth: `${eventDate.getMonth() + 1}`,
    recurrenceYearlyDayOfMonth: `${eventDate.getDate()}`,
  };
}

function toggleWeeklyDay(
  form: EventFormState,
  weekday: EventRecurrenceWeekday,
): EventFormState {
  return {
    ...form,
    recurrenceWeeklyDays: form.recurrenceWeeklyDays.includes(weekday)
      ? form.recurrenceWeeklyDays.filter((current) => current !== weekday)
      : [...form.recurrenceWeeklyDays, weekday],
  };
}

function applySeriesRecurrenceToForm(
  form: EventFormState,
  eventSeries: CalendarEventSeriesDetails,
): EventFormState {
  const recurrenceRule = eventSeries.recurrenceRule;
  if (!recurrenceRule) {
    return setRecurrenceFrequency(form, "None");
  }

  return {
    ...form,
    recurrenceFrequency: recurrenceRule.frequency,
    recurrenceInterval: `${recurrenceRule.interval}`,
    recurrenceEndMode: recurrenceRule.endMode,
    recurrenceUntilDate: recurrenceRule.untilDate ?? "",
    recurrenceCount: recurrenceRule.count ? `${recurrenceRule.count}` : "",
    recurrenceWeeklyDays: recurrenceRule.weeklyDays ?? [],
    recurrenceMonthlyDayOfMonth: recurrenceRule.monthlyDayOfMonth
      ? `${recurrenceRule.monthlyDayOfMonth}`
      : form.recurrenceMonthlyDayOfMonth,
    recurrenceYearlyMonth: recurrenceRule.yearlyMonth
      ? `${recurrenceRule.yearlyMonth}`
      : form.recurrenceYearlyMonth,
    recurrenceYearlyDayOfMonth: recurrenceRule.yearlyDayOfMonth
      ? `${recurrenceRule.yearlyDayOfMonth}`
      : form.recurrenceYearlyDayOfMonth,
  };
}

function didRecurrenceChange(
  left?: EventRecurrenceRuleInput | null,
  right?: EventRecurrenceRuleInput | null,
): boolean {
  return JSON.stringify(normalizeRecurrenceForCompare(left)) !== JSON.stringify(normalizeRecurrenceForCompare(right));
}

function normalizeRecurrenceForCompare(
  recurrenceRule?: EventRecurrenceRuleInput | null,
) {
  if (!recurrenceRule) {
    return null;
  }

  return {
    frequency: recurrenceRule.frequency,
    interval: recurrenceRule.interval,
    endMode: recurrenceRule.endMode,
    untilDate: recurrenceRule.untilDate ?? null,
    count: recurrenceRule.count ?? null,
    weeklyDays: [...(recurrenceRule.weeklyDays ?? [])].sort(),
    monthlyDayOfMonth: recurrenceRule.monthlyDayOfMonth ?? null,
    yearlyMonth: recurrenceRule.yearlyMonth ?? null,
    yearlyDayOfMonth: recurrenceRule.yearlyDayOfMonth ?? null,
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

function buildRecurrenceSummary(form: EventFormState): string[] {
  if (form.recurrenceFrequency === "None") {
    return [];
  }

  const lines: string[] = [];
  if (form.recurrenceFrequency === "Daily") {
    lines.push(
      Number(form.recurrenceInterval) > 1
        ? `Elke ${form.recurrenceInterval} dagen`
        : "Elke dag",
    );
  }

  if (form.recurrenceFrequency === "Weekly") {
    const weekdays = form.recurrenceWeeklyDays
      .map((weekday) => weekdayToDutchLabel(weekday).toLowerCase())
      .join(" en ");
    lines.push(
      Number(form.recurrenceInterval) > 1
        ? `Elke ${form.recurrenceInterval} weken op ${weekdays}`
        : `Elke week op ${weekdays}`,
    );
  }

  if (form.recurrenceFrequency === "Monthly") {
    const day = Number(form.recurrenceMonthlyDayOfMonth || "0");
    lines.push(
      Number(form.recurrenceInterval) > 1
        ? `Elke ${form.recurrenceInterval} maanden op de ${day}e`
        : `Elke maand op de ${day}e`,
    );
  }

  if (form.recurrenceFrequency === "Yearly") {
    const month = Number(form.recurrenceYearlyMonth || "0");
    const day = Number(form.recurrenceYearlyDayOfMonth || "0");
    lines.push(
      `Elk jaar op ${day} ${monthOptions[month - 1]?.label ?? ""}`.trim(),
    );
  }

  if (form.recurrenceEndMode === "OnDate" && form.recurrenceUntilDate) {
    lines.push(`Eindigt op ${formatDutchLongDate(form.recurrenceUntilDate)}`);
  }

  if (form.recurrenceEndMode === "AfterCount" && form.recurrenceCount) {
    lines.push(`Eindigt na ${form.recurrenceCount} keer`);
  }

  return lines;
}

function weekdayToDutchLabel(weekday: EventRecurrenceWeekday): string {
  return (
    weekdayOptions.find((option) => option.value === weekday)?.label ?? weekday
  );
}

function weekdayValueFromDate(date: Date): EventRecurrenceWeekday {
  return (
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][date.getDay()] as EventRecurrenceWeekday
  );
}

function isValidMonthDay(month: number, day: number): boolean {
  return day <= new Date(2028, month, 0).getDate();
}

function formatDutchLongDate(date: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
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
      title: "Nu",
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
  if (event.allDay) return "Hele dag.";
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

function formatAgendaSourceState(source: EventSource) {
  switch (source.sourceState) {
    case "disabled":
      return "uit";
    case "failed":
      return "mislukt";
    case "neverSynced":
      return "nog niet ververst";
    default:
      return "beschikbaar";
  }
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

function resolveAgendaDayWeather(
  date: string,
  nowIso: string,
  slots: AgendaWeatherSlotProjection[],
  contextLabel = "Vandaag",
): WeatherTemperatureDisplay | null {
  const dailySlots = slots
    .filter((slot) => hasAgendaWeatherData(slot) && getWeatherSlotDate(slot) === date)
    .sort(compareAgendaWeatherSlots);
  if (dailySlots.length === 0) {
    return null;
  }

  const now = new Date(nowIso).getTime();
  const activeSlot = dailySlots.find((slot) => {
    const startsAt = slot.startsAtUtc?.getTime();
    const endsAt = slot.endsAtUtc?.getTime();
    return startsAt !== undefined && endsAt !== undefined && startsAt <= now && now < endsAt;
  });
  const nextSlot = dailySlots.find((slot) => {
    const startsAt = slot.startsAtUtc?.getTime();
    return startsAt !== undefined && startsAt >= now;
  });

  return buildAgendaWeatherDisplay(
    activeSlot ?? nextSlot ?? dailySlots[0],
    contextLabel,
  );
}

function resolveAgendaEventWeather(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
  slots: AgendaWeatherSlotProjection[],
): WeatherTemperatureDisplay | null {
  if (event.allDay) {
    return null;
  }

  const eventStart = new Date(event.startsAt);
  if (Number.isNaN(eventStart.getTime())) {
    return null;
  }

  const slot = slots.find((candidate) => {
    if (!hasAgendaWeatherData(candidate)) {
      return false;
    }

    const startsAt = candidate.startsAtUtc?.getTime();
    const endsAt = candidate.endsAtUtc?.getTime();
    if (startsAt === undefined || endsAt === undefined) {
      return false;
    }

    const timestamp = eventStart.getTime();
    return startsAt <= timestamp && timestamp < endsAt;
  });

  return slot ? buildAgendaWeatherDisplay(slot, event.title) : null;
}

function resolveAgendaOutlookAllDayWeather(
  event: ReturnType<typeof hydrateAgendaEvents>[number],
  nowIso: string,
  slots: AgendaWeatherSlotProjection[],
): WeatherTemperatureDisplay | null {
  if (!event.allDay) {
    return null;
  }

  const localDate = getLocalDateKey(event.startsAt);
  return localDate
    ? resolveAgendaDayWeather(localDate, nowIso, slots, event.title)
    : null;
}

function buildAgendaWeatherDisplay(
  slot: AgendaWeatherSlotProjection,
  contextLabel: string,
): WeatherTemperatureDisplay | null {
  if (!hasAgendaWeatherData(slot)) {
    return null;
  }

  return {
    accessibleLabel: formatWeatherAccessibleLabel(
      contextLabel,
      slot.temperatureCelsius,
      slot.summary,
    ),
    iconKey: toWeatherIconKey(slot.condition),
    temperatureLabel: formatTemperatureLabel(slot.temperatureCelsius),
  };
}

function hasAgendaWeatherData(slot: AgendaWeatherSlotProjection) {
  return (
    slot.startsAtUtc instanceof Date &&
    slot.endsAtUtc instanceof Date &&
    typeof slot.temperatureCelsius === "number" &&
    slot.condition !== undefined
  );
}

function compareAgendaWeatherSlots(
  left: AgendaWeatherSlotProjection,
  right: AgendaWeatherSlotProjection,
) {
  return (
    (left.startsAtUtc?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (right.startsAtUtc?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}

function getWeatherSlotDate(slot: AgendaWeatherSlotProjection) {
  return getLocalDateKey(slot.startsAtUtc);
}

function getLocalDateKey(value: Date | string | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : toIsoDate(date);
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
