import type { EventSource, NormalizedEvent } from './eventSourceModel';

export const exampleEventSources: readonly EventSource[] = [
  {
    id: 'manual-events',
    name: 'HomeOps Manual Events',
    type: 'manual',
    enabled: true,
    capability: 'writable',
    visibility: { visibleByDefault: true, groupName: 'Household' },
    color: { hex: '#4f46e5' },
  },
  {
    id: 'school-holidays',
    name: 'School Holidays',
    type: 'schoolHolidays',
    enabled: true,
    capability: 'readOnly',
    visibility: { visibleByDefault: true, groupName: 'Reference' },
    color: { hex: '#0891b2' },
    externalSourceId: 'future-school-holiday-provider',
  },
] as const;

export const exampleNormalizedEvents: readonly NormalizedEvent[] = [
  {
    id: 'manual-event-example',
    sourceId: 'manual-events',
    title: 'Example household event',
    startsAt: '2026-06-18T09:00:00Z',
    allDay: false,
    editable: true,
  },
] as const;
