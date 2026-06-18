import { describe, expect, it } from 'vitest';
import { demoEvents, demoEventSources, demoToday } from '../demo/demoAgendaData';
import { createSourceSelection, filterEventsBySource, groupEventsByDay, groupEventsByMonth, hydrateAgendaEvents } from './agendaUtils';

describe('demo agenda dataset', () => {
  it('covers source, color, timing, and editability scenarios', () => {
    expect(demoEventSources.length).toBeGreaterThanOrEqual(3);
    expect(new Set(demoEventSources.map((source) => source.color.hex)).size).toBeGreaterThanOrEqual(3);
    expect(demoEventSources.some((source) => source.id === 'birthdays')).toBe(true);
    expect(demoEventSources.some((source) => source.capability === 'writable')).toBe(true);
    expect(demoEventSources.some((source) => source.capability === 'readOnly')).toBe(true);
    expect(demoEvents.some((event) => event.startsAt.startsWith(demoToday))).toBe(true);
    expect(demoEvents.some((event) => event.startsAt.startsWith('2026-06-19'))).toBe(true);
    expect(demoEvents.some((event) => event.startsAt.startsWith('2026-06-21'))).toBe(true);
    expect(demoEvents.some((event) => event.startsAt.startsWith('2026-07'))).toBe(true);
    expect(demoEvents.some((event) => event.startsAt.startsWith('2026-09'))).toBe(true);
    expect(demoEvents.some((event) => event.sourceId === 'birthdays' && event.startsAt.startsWith('2027-01'))).toBe(true);
    expect(demoEvents.filter((event) => event.startsAt.startsWith('2026-06-19'))).toHaveLength(2);
    expect(demoEvents.some((event) => event.title.length > 70)).toBe(true);
    expect(demoEvents.some((event) => event.allDay)).toBe(true);
    expect(demoEvents.some((event) => !event.allDay && event.endsAt)).toBe(true);
  });
});

describe('agenda source filtering and grouping', () => {
  it('filters events by multiple enabled and disabled sources', () => {
    const selectedSources = createSourceSelection(demoEventSources);
    const manualOnly = { ...selectedSources, birthdays: false, 'school-holidays': false, 'tv-series': false };

    const filteredEvents = filterEventsBySource(demoEvents, manualOnly);

    expect(filteredEvents.length).toBeGreaterThan(0);
    expect(filteredEvents.every((event) => event.sourceId === 'manual-events')).toBe(true);
  });

  it('groups filtered events into week and month views', () => {
    const selectedSources = createSourceSelection(demoEventSources);
    const agendaEvents = hydrateAgendaEvents(filterEventsBySource(demoEvents, selectedSources), demoEventSources);

    const weekGroups = groupEventsByDay(agendaEvents, demoToday, 7);
    const monthGroups = groupEventsByMonth(agendaEvents);

    expect(weekGroups.some((group) => group.date === demoToday)).toBe(true);
    expect(monthGroups.map((group) => group.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-11', '2027-01']);
  });
});
