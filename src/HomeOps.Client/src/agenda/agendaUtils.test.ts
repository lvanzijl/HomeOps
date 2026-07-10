import { describe, expect, it } from 'vitest';
import type { EventSource, NormalizedEvent } from '../events/eventSourceModel';
import { demoReadOnlyEvents, demoReadOnlyEventSources, demoToday } from '../demo/demoAgendaData';
import { createSourceSelection, filterEventsBySource, groupEventsByDay, groupEventsByMonth, hydrateAgendaEvents } from './agendaUtils';

const manualSource: EventSource = {
  id: 'manual-events',
  name: 'HomeOps Calendar',
  type: 'manual',
  enabled: true,
  capability: 'writable',
  visibility: { visibleByDefault: true, groupName: 'Household' },
  color: { hex: '#4f46e5' },
};

const manualEvents: NormalizedEvent[] = [
  {
    id: 'dentist',
    sourceId: manualSource.id,
    title: 'Dentist Appointment',
    startsAt: '2026-06-18T09:30:00Z',
    endsAt: '2026-06-18T10:15:00Z',
    allDay: false,
    editable: true,
  },
  {
    id: 'bins',
    sourceId: manualSource.id,
    title: 'Put Bins Outside',
    startsAt: '2026-06-21T20:00:00Z',
    endsAt: '2026-06-21T20:10:00Z',
    allDay: false,
    editable: true,
  },
];

const eventSources = [manualSource, ...demoReadOnlyEventSources];
const events = [...manualEvents, ...demoReadOnlyEvents];

describe('agenda source datasets', () => {
  it('combines API-backed calendar events with read-only fixture sources', () => {
    expect(demoReadOnlyEventSources.length).toBeGreaterThanOrEqual(3);
    expect(new Set(eventSources.map((source) => source.color.hex)).size).toBeGreaterThanOrEqual(3);
    expect(eventSources.some((source) => source.id === 'birthdays')).toBe(true);
    expect(eventSources.some((source) => source.capability === 'writable')).toBe(true);
    expect(eventSources.some((source) => source.capability === 'readOnly')).toBe(true);
    expect(events.some((event) => event.startsAt.startsWith(demoToday))).toBe(true);
    expect(events.some((event) => event.startsAt.startsWith('2026-06-19'))).toBe(true);
    expect(events.some((event) => event.startsAt.startsWith('2026-06-21'))).toBe(true);
    expect(events.some((event) => event.startsAt.startsWith('2026-07'))).toBe(true);
    expect(events.some((event) => event.startsAt.startsWith('2026-09'))).toBe(true);
    expect(events.some((event) => event.sourceId === 'birthdays' && event.startsAt.startsWith('2027-01'))).toBe(true);
    expect(events.some((event) => event.allDay)).toBe(true);
    expect(events.some((event) => !event.allDay && event.endsAt)).toBe(true);
  });
});

describe('agenda source filtering and grouping', () => {
  it('filters events by multiple enabled and disabled sources', () => {
    const selectedSources = createSourceSelection(eventSources);
    const manualOnly = { ...selectedSources, birthdays: false, 'school-holidays': false, 'tv-series': false };

    const filteredEvents = filterEventsBySource(events, manualOnly);

    expect(filteredEvents.length).toBeGreaterThan(0);
    expect(filteredEvents.every((event) => event.sourceId === 'manual-events')).toBe(true);
  });

  it('groups filtered events into week and month views', () => {
    const selectedSources = createSourceSelection(eventSources);
    const agendaEvents = hydrateAgendaEvents(filterEventsBySource(events, selectedSources), eventSources);

    const weekGroups = groupEventsByDay(agendaEvents, demoToday, 7);
    const monthGroups = groupEventsByMonth(agendaEvents);

    expect(weekGroups.some((group) => group.date === demoToday)).toBe(true);
    expect(monthGroups.map((group) => group.month)).toEqual(['2026-06', '2026-07', '2026-09', '2026-11', '2027-01']);
  });
});
