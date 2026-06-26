import { useEffect, useMemo, useState } from "react";
import {
  groupEventsByDay,
  groupEventsByMonth,
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

type AgendaView = "week" | "months";
type EventDialogQuestion = "title" | "date" | "dayKind" | "details";

type EventFormState = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
};

const emptyForm: EventFormState = {
  title: "",
  description: "",
  startsAt: "2026-06-22T09:00",
  endsAt: "2026-06-22T10:00",
  allDay: false,
};

export function AgendaWidget({ instance }: WidgetRenderProps) {
  const [activeView, setActiveView] = useState<AgendaView>("week");
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
            : "HomeOps Calendar events could not be loaded.",
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

  const selectedSources = settings[activeView].enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(events, selectedSources);
    return hydrateAgendaEvents(filteredEvents, eventSources);
  }, [events, eventSources, selectedSources]);

  const weekGroups = useMemo(
    () => groupEventsByDay(agendaEvents, demoToday, 7),
    [agendaEvents],
  );
  const monthGroups = useMemo(
    () => groupEventsByMonth(agendaEvents),
    [agendaEvents],
  );

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
        toUserFacingError(error, "Calendar event could not be saved."),
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

  function openNewEventForm() {
    setEditingEventId(null);
    setForm(emptyForm);
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
        toUserFacingError(error, "Calendar event could not be deleted."),
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <article className="widget-card agenda-widget" aria-label={instance.title}>
      <div className="agenda-header">
        <div>
          <p className="widget-type">Family agenda</p>
          <h3>{instance.title}</h3>
        </div>
        <div className="agenda-view-toggle" aria-label="Agenda view selector">
          <button
            aria-pressed={activeView === "week"}
            onClick={() => setActiveView("week")}
            type="button"
          >
            Week View
          </button>
          <button
            aria-pressed={activeView === "months"}
            onClick={() => setActiveView("months")}
            type="button"
          >
            Months View
          </button>
        </div>
      </div>

      {isLoading ? <p role="status">Loading calendar events…</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      <button
        type="button"
        className="compact-action"
        onClick={openNewEventForm}
      >
        Add household event
      </button>

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
              editingEventId ? "Edit calendar event" : "Add calendar event"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>{editingEventId ? "Edit event" : "Add an event"}</h3>
                <p>Start with what and when. Details can stay optional.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeEventForm}
                aria-label="Close event dialog"
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
        <legend>Sources</legend>
        {eventSources.map((source) => (
          <label key={source.id}>
            <input
              checked={selectedSources[source.id] ?? false}
              onChange={(event) =>
                setSourceEnabled(activeView, source.id, event.target.checked)
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

      {agendaEvents.length === 0 && !isLoading && !errorMessage ? (
        <div className="empty-state-card page-empty-state">
          <strong>Create your first event</strong>
          <p>
            Events help the household remember important dates and activities.
          </p>
          <button type="button" onClick={openNewEventForm}>
            Start with one household event.
          </button>
        </div>
      ) : activeView === "week" ? (
        <WeekView
          deletingEventId={deletingEventId}
          groups={weekGroups}
          onDelete={removeEvent}
          onEdit={startEditing}
        />
      ) : (
        <MonthsView
          deletingEventId={deletingEventId}
          groups={monthGroups}
          onDelete={removeEvent}
          onEdit={startEditing}
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
  const submitLabel = isEditing ? "Save event" : "Create event";

  return (
    <form
      className="calendar-event-form task-conversation-form"
      onSubmit={onSubmit}
      aria-label="Calendar event conversation"
    >
      <div className="task-conversation-panel" key={question}>
        {question === "title" ? (
          <label className="task-conversation-question">
            <span>What is happening?</span>
            <input
              autoFocus
              value={form.title}
              onChange={(event) =>
                onChange({ ...form, title: event.target.value })
              }
              id="calendar-event-title"
              placeholder="Swimming lesson"
              required
            />
          </label>
        ) : null}

        {question === "date" ? (
          <div className="task-date-question">
            <p className="task-question-label">
              When should the family remember it?
            </p>
            <div
              className="task-choice-group horizontal"
              aria-label="Event date shortcuts"
            >
              <button
                type="button"
                onClick={() => onChange(setEventDate(form, demoToday))}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(setEventDate(form, addDaysIso(demoToday, 1)))
                }
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => onChange(setEventDate(form, getEventDate(form)))}
              >
                Pick date
              </button>
            </div>
            <label className="task-conversation-question compact">
              <span>Pick a date</span>
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
            <p className="task-question-label">Is it all day?</p>
            <div
              className="task-choice-group horizontal"
              aria-label="Event time type"
            >
              <button
                type="button"
                className={form.allDay ? "selected" : ""}
                onClick={() => onChange(toAllDayState(form, true))}
              >
                All day
              </button>
              <button
                type="button"
                className={!form.allDay ? "selected" : ""}
                onClick={() => onChange(toAllDayState(form, false))}
              >
                Pick a time
              </button>
            </div>
            {form.allDay ? (
              <div className="agenda-time-grid">
                <label className="task-conversation-question compact">
                  <span>Event date</span>
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
                  <span>End date</span>
                  <input
                    type="date"
                    value={
                      form.endsAt ? form.endsAt.slice(0, 10) : getEventDate(form)
                    }
                    onChange={(event) =>
                      onChange(setAllDayEndDate(form, event.target.value))
                    }
                  />
                </label>
                <p className="task-dialog-summary">
                  We’ll keep this as an all-day event.
                </p>
              </div>
            ) : (
              <div className="agenda-time-grid">
                <label className="task-conversation-question compact">
                  <span>Start time</span>
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
                  <span>End time</span>
                  <input
                    type="time"
                    value={getEventTime(form.endsAt, "10:00")}
                    onChange={(event) =>
                      onChange(
                        setEventTime(form, "endsAt", event.target.value),
                      )
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
              <span>Any details?</span>
              <input
                autoFocus
                value={form.description}
                onChange={(event) =>
                  onChange({ ...form, description: event.target.value })
                }
                placeholder="Optional note for the family"
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
            Back
          </button>
        ) : null}
        {question === "details" ? (
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onQuestionChange(nextEventQuestion(question))}
            disabled={question === "title" && !titleIsValid}
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

function WeekView({
  deletingEventId,
  groups,
  onDelete,
  onEdit,
}: {
  deletingEventId: string | null;
  groups: ReturnType<typeof groupEventsByDay>;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  return (
    <section className="agenda-view" aria-label="Week View">
      {groups.map((group) => (
        <div className="agenda-group" key={group.date}>
          <h4>{group.label}</h4>
          <AgendaEventList
            deletingEventId={deletingEventId}
            events={group.events}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </section>
  );
}

function MonthsView({
  deletingEventId,
  groups,
  onDelete,
  onEdit,
}: {
  deletingEventId: string | null;
  groups: ReturnType<typeof groupEventsByMonth>;
  onDelete: (eventId: string) => void;
  onEdit: (event: NormalizedEvent) => void;
}) {
  return (
    <section
      className="agenda-view agenda-months-view"
      aria-label="Months View"
    >
      {groups.map((group) => (
        <div className="agenda-group" key={group.month}>
          <h4>{group.label}</h4>
          <AgendaEventList
            deletingEventId={deletingEventId}
            events={group.events}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </section>
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
      {events.map((event) => (
        <li className="agenda-event" key={event.id}>
          <span
            className="source-color"
            style={{ backgroundColor: event.source.color.hex }}
            aria-hidden="true"
          />
          <span>
            <strong>{event.title}</strong>
            <small>
              {formatEventTime(event)} · {event.source.name} ·{" "}
              {event.editable ? "Writable" : "Read-only"}
            </small>
          </span>
          {event.editable ? (
            <span>
              <button type="button" onClick={() => onEdit(event)}>
                Edit
              </button>
              <button
                type="button"
                disabled={deletingEventId === event.id}
                onClick={() => onDelete(event.id)}
              >
                {deletingEventId === event.id ? "Deleting…" : "Delete"}
              </button>
            </span>
          ) : null}
        </li>
      ))}
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
    return "Calendar event title is required.";
  }

  if (!form.startsAt) {
    return form.allDay
      ? "All-day event date is required."
      : "Event start is required.";
  }

  if (!form.allDay && !form.endsAt) {
    return "Timed events require an end time.";
  }

  if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
    return "Event end must be on or after event start.";
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
  const title = form.title.trim() || "Untitled event";
  const date = getEventDate(form);
  if (form.allDay) return `${title} · ${date} · all day`;
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
