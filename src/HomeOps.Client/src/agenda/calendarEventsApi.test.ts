import { describe, expect, it, vi } from 'vitest';
import {
  EventSourceDto,
  EventSourceHealthStatus,
  EventSourcePollInterval,
  EventSourceType,
  EventSeriesDto,
  NormalizedEvent as ApiNormalizedEvent,
} from '../api/homeOpsApiClient';
import { createCalendarAgendaEvent, deleteCalendarAgendaEvent, loadCalendarAgendaData, toAgendaEventFromEventSeries, updateCalendarAgendaEvent } from './calendarEventsApi';

const apiSource = new EventSourceDto({
  id: 'manual-source',
  name: 'HomeOps Calendar',
  icon: '📅',
  sourceType: EventSourceType.Manual,
  enabled: true,
  writable: true,
  healthStatus: EventSourceHealthStatus.Healthy,
  pollInterval: EventSourcePollInterval.Every8Hours,
});

const apiEvent = new ApiNormalizedEvent({
  id: 'dentist',
  sourceId: 'manual-source',
  title: 'Dentist Appointment',
  startsAt: new Date('2026-06-18T09:30:00Z'),
  endsAt: new Date('2026-06-18T10:15:00Z'),
  allDay: false,
  editable: true,
});

const eventSeriesDto = new EventSeriesDto({
  id: 'created',
  eventSourceId: 'manual-source',
  title: 'Created Event',
  startUtc: new Date('2026-06-22T09:00:00Z'),
  endUtc: new Date('2026-06-22T10:00:00Z'),
  isAllDay: false,
});

describe('EventSeries API mapping', () => {
  it('loads event sources and normalized events from the generated API client', async () => {
    const client = {
      listEventSources: vi.fn().mockResolvedValue([apiSource]),
      getEvents: vi.fn().mockResolvedValue([apiEvent]),
    } as never;

    const data = await loadCalendarAgendaData(client);

    expect(data.sources[0]).toMatchObject({ id: 'manual-source', type: 'manual', capability: 'writable' });
    expect(data.events[0]).toMatchObject({ id: 'dentist', title: 'Dentist Appointment', editable: true });
  });

  it('creates, updates, and deletes events through generated API methods', async () => {
    const client = {
      createEvent: vi.fn().mockResolvedValue(eventSeriesDto),
      updateEvent: vi.fn().mockResolvedValue(new EventSeriesDto({ ...eventSeriesDto, title: 'Updated Event' })),
      deleteEvent: vi.fn().mockResolvedValue(undefined),
    } as never;

    const created = await createCalendarAgendaEvent({ title: 'Created Event', startsAt: '2026-06-22T09:00', endsAt: '2026-06-22T10:00', allDay: false }, client);
    const updated = await updateCalendarAgendaEvent('created', { title: 'Updated Event', startsAt: '2026-06-22T09:00', endsAt: '2026-06-22T10:00', allDay: false }, client);
    await deleteCalendarAgendaEvent('created', client);

    expect((client as { createEvent: ReturnType<typeof vi.fn> }).createEvent).toHaveBeenCalledTimes(1);
    expect((client as { updateEvent: ReturnType<typeof vi.fn> }).updateEvent).toHaveBeenCalledWith('created', expect.objectContaining({ title: 'Updated Event' }));
    expect((client as { deleteEvent: ReturnType<typeof vi.fn> }).deleteEvent).toHaveBeenCalledWith('created');
    expect(created).toMatchObject({ id: 'created', sourceId: 'manual-source', editable: true });
    expect(updated.title).toBe('Updated Event');
  });

  it('normalizes EventSeriesDto instances into agenda events', () => {
    expect(toAgendaEventFromEventSeries(eventSeriesDto)).toMatchObject({
      id: 'created',
      sourceId: 'manual-source',
      startsAt: '2026-06-22T09:00:00.000Z',
      editable: true,
    });
  });
});
