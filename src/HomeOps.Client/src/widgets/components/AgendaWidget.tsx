import { useEffect, useMemo, useState } from 'react';
import { groupEventsByDay, groupEventsByMonth, filterEventsBySource, formatEventTime, hydrateAgendaEvents } from '../../agenda/agendaUtils';
import {
  createCalendarAgendaEvent,
  deleteCalendarAgendaEvent,
  loadCalendarAgendaData,
  updateCalendarAgendaEvent,
  type EventSeriesInput,
} from '../../agenda/calendarEventsApi';
import { useAgendaLayerSettings } from '../../agenda/layerSettings';
import { demoReadOnlyEvents, demoReadOnlyEventSources, demoToday } from '../../demo/demoAgendaData';
import type { EventSource, NormalizedEvent } from '../../events/eventSourceModel';
import type { WidgetRenderProps } from '../WidgetRenderer';

type AgendaView = 'week' | 'months';

type EventFormState = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
};

const emptyForm: EventFormState = {
  title: '',
  description: '',
  startsAt: '2026-06-22T09:00',
  endsAt: '2026-06-22T10:00',
  allDay: false,
};

export function AgendaWidget({ instance }: WidgetRenderProps) {
  const [activeView, setActiveView] = useState<AgendaView>('week');
  const [calendarEvents, setCalendarEvents] = useState<NormalizedEvent[]>([]);
  const [calendarSources, setCalendarSources] = useState<EventSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

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
        setErrorMessage(error instanceof Error ? error.message : 'HomeOps Calendar events could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const eventSources = useMemo(() => [...calendarSources, ...demoReadOnlyEventSources], [calendarSources]);
  const events = useMemo(() => [...calendarEvents, ...demoReadOnlyEvents], [calendarEvents]);
  const { settings, setSourceEnabled } = useAgendaLayerSettings(eventSources);

  const selectedSources = settings[activeView].enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(events, selectedSources);
    return hydrateAgendaEvents(filteredEvents, eventSources);
  }, [events, eventSources, selectedSources]);

  const weekGroups = useMemo(() => groupEventsByDay(agendaEvents, demoToday, 7), [agendaEvents]);
  const monthGroups = useMemo(() => groupEventsByMonth(agendaEvents), [agendaEvents]);

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
        const withoutSaved = current.filter((calendarEvent) => calendarEvent.id !== savedEvent.id);
        return [...withoutSaved, savedEvent];
      });
      setForm(emptyForm);
      setEditingEventId(null);
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(toUserFacingError(error, 'Calendar event could not be saved.'));
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(event: NormalizedEvent) {
    setEditingEventId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? '',
      startsAt: toDateTimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDateTimeLocal(event.endsAt) : '',
      allDay: event.allDay,
    });
  }

  async function removeEvent(eventId: string) {
    setDeletingEventId(eventId);
    try {
      await deleteCalendarAgendaEvent(eventId);
      setCalendarEvents((current) => current.filter((event) => event.id !== eventId));
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(toUserFacingError(error, 'Calendar event could not be deleted.'));
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <article className="widget-card agenda-widget" aria-label={instance.title}>
      <div className="agenda-header">
        <div>
          <p className="widget-type">Agenda Widget</p>
          <h3>{instance.title}</h3>
        </div>
        <div className="agenda-view-toggle" aria-label="Agenda view selector">
          <button aria-pressed={activeView === 'week'} onClick={() => setActiveView('week')} type="button">
            Week View
          </button>
          <button aria-pressed={activeView === 'months'} onClick={() => setActiveView('months')} type="button">
            Months View
          </button>
        </div>
      </div>

      {isLoading ? <p role="status">Loading calendar events…</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      <EventForm
        form={form}
        isEditing={editingEventId !== null}
        isSaving={isSaving}
        onCancel={() => {
          setEditingEventId(null);
          setForm(emptyForm);
        }}
        onChange={setForm}
        onSubmit={handleSubmit}
      />

      <fieldset className="source-selector">
        <legend>Sources</legend>
        {eventSources.map((source) => (
          <label key={source.id}>
            <input
              checked={selectedSources[source.id] ?? false}
              onChange={(event) => setSourceEnabled(activeView, source.id, event.target.checked)}
              type="checkbox"
            />
            <span className="source-color" style={{ backgroundColor: source.color.hex }} aria-hidden="true" />
            {source.name}
          </label>
        ))}
      </fieldset>

      {activeView === 'week' ? <WeekView deletingEventId={deletingEventId} groups={weekGroups} onDelete={removeEvent} onEdit={startEditing} /> : <MonthsView deletingEventId={deletingEventId} groups={monthGroups} onDelete={removeEvent} onEdit={startEditing} />}
    </article>
  );
}

function EventForm({
  form,
  isEditing,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: EventFormState;
  isEditing: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (form: EventFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="calendar-event-form" onSubmit={onSubmit} aria-label="Calendar event form">
      <label>
        Title
        <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Calendar event title" />
      </label>
      <label>
        Description
        <input value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Optional description" />
      </label>
      <label>
        Start
        <input type={form.allDay ? 'date' : 'datetime-local'} value={toInputValue(form.startsAt, form.allDay)} onChange={(event) => onChange({ ...form, startsAt: event.target.value })} />
      </label>
      <label>
        End
        <input type={form.allDay ? 'date' : 'datetime-local'} value={toInputValue(form.endsAt, form.allDay)} onChange={(event) => onChange({ ...form, endsAt: event.target.value })} />
      </label>
      <label>
        <input type="checkbox" checked={form.allDay} onChange={(event) => onChange(toAllDayState(form, event.target.checked))} />
        All day
      </label>
      <button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : isEditing ? 'Update Event' : 'Add Event'}</button>
      {isEditing ? <button type="button" onClick={onCancel}>Cancel Edit</button> : null}
    </form>
  );
}

function WeekView({ deletingEventId, groups, onDelete, onEdit }: { deletingEventId: string | null; groups: ReturnType<typeof groupEventsByDay>; onDelete: (eventId: string) => void; onEdit: (event: NormalizedEvent) => void }) {
  return (
    <section className="agenda-view" aria-label="Week View">
      {groups.map((group) => (
        <div className="agenda-group" key={group.date}>
          <h4>{group.label}</h4>
          <AgendaEventList deletingEventId={deletingEventId} events={group.events} onDelete={onDelete} onEdit={onEdit} />
        </div>
      ))}
    </section>
  );
}

function MonthsView({ deletingEventId, groups, onDelete, onEdit }: { deletingEventId: string | null; groups: ReturnType<typeof groupEventsByMonth>; onDelete: (eventId: string) => void; onEdit: (event: NormalizedEvent) => void }) {
  return (
    <section className="agenda-view agenda-months-view" aria-label="Months View">
      {groups.map((group) => (
        <div className="agenda-group" key={group.month}>
          <h4>{group.label}</h4>
          <AgendaEventList deletingEventId={deletingEventId} events={group.events} onDelete={onDelete} onEdit={onEdit} />
        </div>
      ))}
    </section>
  );
}

function AgendaEventList({ deletingEventId, events, onDelete, onEdit }: { deletingEventId: string | null; events: ReturnType<typeof hydrateAgendaEvents>; onDelete: (eventId: string) => void; onEdit: (event: NormalizedEvent) => void }) {
  return (
    <ul className="agenda-event-list">
      {events.map((event) => (
        <li className="agenda-event" key={event.id}>
          <span className="source-color" style={{ backgroundColor: event.source.color.hex }} aria-hidden="true" />
          <span>
            <strong>{event.title}</strong>
            <small>
              {formatEventTime(event)} · {event.source.name} · {event.editable ? 'Writable' : 'Read-only'}
            </small>
          </span>
          {event.editable ? (
            <span>
              <button type="button" onClick={() => onEdit(event)}>Edit</button>
              <button type="button" disabled={deletingEventId === event.id} onClick={() => onDelete(event.id)}>{deletingEventId === event.id ? 'Deleting…' : 'Delete'}</button>
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
    return 'Calendar event title is required.';
  }

  if (!form.startsAt) {
    return form.allDay ? 'All-day event date is required.' : 'Event start is required.';
  }

  if (!form.allDay && !form.endsAt) {
    return 'Timed events require an end time.';
  }

  if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
    return 'Event end must be on or after event start.';
  }

  return null;
}

function toAllDayState(form: EventFormState, allDay: boolean): EventFormState {
  return {
    ...form,
    allDay,
    startsAt: allDay ? form.startsAt.slice(0, 10) : expandDateTime(form.startsAt, '09:00'),
    endsAt: allDay ? form.endsAt.slice(0, 10) : expandDateTime(form.endsAt || form.startsAt, '10:00'),
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

function toUserFacingError(error: unknown, fallback: string): string {
  if (error instanceof Error && 'response' in error && typeof error.response === 'string') {
    try {
      const parsed = JSON.parse(error.response) as { errors?: Record<string, string[]>; title?: string };
      const validationMessages = parsed.errors ? Object.values(parsed.errors).flat() : [];
      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }

      return parsed.title ?? fallback;
    } catch {
      return fallback;
    }
  }

  return error instanceof Error ? error.message : fallback;
}
