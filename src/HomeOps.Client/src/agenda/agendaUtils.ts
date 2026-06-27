import type { EventSource, NormalizedEvent } from '../events/eventSourceModel';
import type { AgendaDayGroup, AgendaEvent, AgendaMonthGroup } from './agendaModel';

const dayFormatter = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const timeFormatter = new Intl.DateTimeFormat('nl-NL', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

export function createSourceSelection(sources: readonly EventSource[]): Record<string, boolean> {
  return Object.fromEntries(sources.map((source) => [source.id, source.enabled]));
}

export function filterEventsBySource(
  events: readonly NormalizedEvent[],
  selectedSourceIds: Readonly<Record<string, boolean>>,
): readonly NormalizedEvent[] {
  return events.filter((event) => selectedSourceIds[event.sourceId]);
}

export function hydrateAgendaEvents(
  events: readonly NormalizedEvent[],
  sources: readonly EventSource[],
): readonly AgendaEvent[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return events.flatMap((event) => {
    const source = sourceById.get(event.sourceId);
    return source ? [{ ...event, source }] : [];
  });
}

export function sortEvents<TEvent extends NormalizedEvent>(events: readonly TEvent[]): readonly TEvent[] {
  return [...events].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function groupEventsByDay(events: readonly AgendaEvent[], anchorDate: string, dayCount: number): readonly AgendaDayGroup[] {
  const allowedDates = new Set(Array.from({ length: dayCount }, (_, index) => addDays(anchorDate, index)));
  const groups = new Map<string, AgendaEvent[]>();

  sortEvents(events)
    .filter((event) => allowedDates.has(getDateKey(event.startsAt)))
    .forEach((event) => {
      const date = getDateKey(event.startsAt);
      groups.set(date, [...(groups.get(date) ?? []), event]);
    });

  return [...groups.entries()].map(([date, groupedEvents]) => ({
    date,
    label: formatDayLabel(date),
    events: groupedEvents,
  }));
}

export function groupEventsByMonth(events: readonly AgendaEvent[]): readonly AgendaMonthGroup[] {
  const groups = new Map<string, AgendaEvent[]>();

  sortEvents(events).forEach((event) => {
    const month = getMonthKey(event.startsAt);
    groups.set(month, [...(groups.get(month) ?? []), event]);
  });

  return [...groups.entries()].map(([month, groupedEvents]) => ({
    month,
    label: formatMonthLabel(month),
    events: groupedEvents,
  }));
}

export function formatEventTime(event: NormalizedEvent): string {
  if (event.allDay) {
    return 'Hele dag';
  }

  const startsAt = timeFormatter.format(new Date(event.startsAt));
  const endsAt = event.endsAt ? timeFormatter.format(new Date(event.endsAt)) : undefined;
  return endsAt ? `${startsAt}–${endsAt}` : startsAt;
}

function addDays(date: string, days: number): string {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function getDateKey(dateTime: string): string {
  return dateTime.slice(0, 10);
}

function getMonthKey(dateTime: string): string {
  return dateTime.slice(0, 7);
}

function formatDayLabel(date: string): string {
  return dayFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatMonthLabel(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}
