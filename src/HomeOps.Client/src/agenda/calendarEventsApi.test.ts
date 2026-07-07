import { describe, expect, it, vi } from 'vitest';
import {
  RecurrenceRuleDto,
  EventSourceDto,
  EventSourceHealthStatus,
  EventSourcePollInterval,
  EventSourceType,
  EventSeriesDto,
  EventExceptionDto,
  NormalizedEvent as ApiNormalizedEvent,
} from '../api/homeOpsApiClient';
import {
  createCalendarAgendaEvent,
  deleteCalendarAgendaEvent,
  deleteCalendarAgendaFutureOccurrences,
  deleteCalendarAgendaOccurrence,
  getCalendarAgendaEventSeries,
  loadCalendarAgendaData,
  skipCalendarAgendaOccurrence,
  splitCalendarAgendaEventSeries,
  toAgendaEventFromEventSeries,
  updateCalendarAgendaEvent,
  updateCalendarAgendaOccurrence,
} from './calendarEventsApi';

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
  eventSeriesId: 'series-dentist',
  sourceId: 'manual-source',
  title: 'Dentist Appointment',
  startsAt: new Date('2026-06-18T09:30:00Z'),
  endsAt: new Date('2026-06-18T10:15:00Z'),
  allDay: false,
  editable: true,
  occurrenceKey: '2026-06-18T09:30:00',
  isRecurring: true,
});

const eventSeriesDto = new EventSeriesDto({
  id: 'created',
  eventSourceId: 'manual-source',
  title: 'Created Event',
  location: 'Pool',
  startUtc: new Date('2026-06-22T09:00:00Z'),
  endUtc: new Date('2026-06-22T10:00:00Z'),
  isAllDay: false,
  recurrenceRule: new RecurrenceRuleDto({
    frequency: 'Weekly',
    interval: 1,
    endMode: 'Never',
    weeklyDays: ['Monday'],
  }),
  exceptions: [new EventExceptionDto({
    eventSeriesId: 'created',
    occurrenceKey: '2026-06-29T09:00:00',
    exceptionType: 'Modified',
    title: 'Moved Event',
  })],
});

describe('EventSeries API mapping', () => {
  it('loads event sources and normalized events from the generated API client', async () => {
    const client = {
      listEventSources: vi.fn().mockResolvedValue([apiSource]),
      getEvents: vi.fn().mockResolvedValue([apiEvent]),
    } as never;

    const data = await loadCalendarAgendaData(client);

    expect(data.sources[0]).toMatchObject({ id: 'manual-source', type: 'manual', capability: 'writable' });
    expect(data.events[0]).toMatchObject({ id: 'dentist', eventSeriesId: 'series-dentist', occurrenceKey: '2026-06-18T09:30:00', isRecurring: true });
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
      eventSeriesId: 'created',
      sourceId: 'manual-source',
      startsAt: '2026-06-22T09:00:00.000Z',
      editable: true,
      location: 'Pool',
      isRecurring: true,
    });
  });

  it('loads series details and forwards occurrence operations', async () => {
    const client = {
      getEventById: vi.fn().mockResolvedValue(eventSeriesDto),
      skipEventOccurrence: vi.fn().mockResolvedValue(undefined),
      modifyEventOccurrence: vi.fn().mockResolvedValue(undefined),
      splitEventSeriesFromOccurrence: vi.fn().mockResolvedValue(eventSeriesDto),
      deleteEventOccurrence: vi.fn().mockResolvedValue(undefined),
      deleteEventOccurrencesFromOccurrence: vi.fn().mockResolvedValue(undefined),
    } as never;

    const details = await getCalendarAgendaEventSeries('created', client);
    await skipCalendarAgendaOccurrence('created', '2026-06-29T09:00:00', client);
    await updateCalendarAgendaOccurrence('created', '2026-06-29T09:00:00', {
      title: 'Moved Event',
      description: 'Bring towel',
      location: 'Pool',
      startsAt: '2026-06-29T10:00',
      endsAt: '2026-06-29T11:00',
      allDay: false,
    }, client);
    await splitCalendarAgendaEventSeries('created', '2026-06-29T09:00:00', {
      title: 'Created Event',
      startsAt: '2026-06-29T09:00',
      endsAt: '2026-06-29T10:00',
      allDay: false,
      recurrenceRule: { frequency: 'Weekly', interval: 2, endMode: 'Never', weeklyDays: ['Monday'] },
    }, client);
    await deleteCalendarAgendaOccurrence('created', '2026-06-29T09:00:00', client);
    await deleteCalendarAgendaFutureOccurrences('created', '2026-06-29T09:00:00', client);

    expect(details.recurrenceRule).toMatchObject({ frequency: 'Weekly', interval: 1 });
    expect(details.exceptions[0]).toMatchObject({ occurrenceKey: '2026-06-29T09:00:00', title: 'Moved Event' });
    expect((client as { skipEventOccurrence: ReturnType<typeof vi.fn> }).skipEventOccurrence).toHaveBeenCalled();
    expect((client as { modifyEventOccurrence: ReturnType<typeof vi.fn> }).modifyEventOccurrence).toHaveBeenCalled();
    expect((client as { splitEventSeriesFromOccurrence: ReturnType<typeof vi.fn> }).splitEventSeriesFromOccurrence).toHaveBeenCalled();
    expect((client as { deleteEventOccurrence: ReturnType<typeof vi.fn> }).deleteEventOccurrence).toHaveBeenCalledWith('created', '2026-06-29T09:00:00');
    expect((client as { deleteEventOccurrencesFromOccurrence: ReturnType<typeof vi.fn> }).deleteEventOccurrencesFromOccurrence).toHaveBeenCalledWith('created', '2026-06-29T09:00:00');
  });
});
