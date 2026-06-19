import { describe, expect, it, vi } from 'vitest';
import {
  EventSource as ApiEventSource,
  EventSourceCapability,
  EventSourceColor,
  EventSourceType,
  EventSourceVisibility,
  ManualEventDto,
  NormalizedEvent as ApiNormalizedEvent,
} from '../api/homeOpsApiClient';
import { createManualAgendaEvent, deleteManualAgendaEvent, loadManualAgendaData, toAgendaEventFromManualEvent, updateManualAgendaEvent } from './manualEventsApi';

const apiSource = new ApiEventSource({
  id: 'manual-source',
  name: 'HomeOps Manual Events',
  type: EventSourceType.Manual,
  enabled: true,
  capability: EventSourceCapability.Writable,
  visibility: new EventSourceVisibility({ visibleByDefault: true, groupName: 'Household' }),
  color: new EventSourceColor({ hex: '#4f46e5' }),
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

const manualDto = new ManualEventDto({
  id: 'created',
  eventSourceId: 'manual-source',
  title: 'Created Event',
  startUtc: new Date('2026-06-22T09:00:00Z'),
  endUtc: new Date('2026-06-22T10:00:00Z'),
  isAllDay: false,
});

describe('manual events API mapping', () => {
  it('loads event sources and normalized events from the generated API client', async () => {
    const client = {
      getEventSources: vi.fn().mockResolvedValue([apiSource]),
      getEvents: vi.fn().mockResolvedValue([apiEvent]),
    } as never;

    const data = await loadManualAgendaData(client);

    expect(data.sources[0]).toMatchObject({ id: 'manual-source', type: 'manual', capability: 'writable' });
    expect(data.events[0]).toMatchObject({ id: 'dentist', title: 'Dentist Appointment', editable: true });
  });

  it('creates, updates, and deletes events through generated API methods', async () => {
    const client = {
      createEvent: vi.fn().mockResolvedValue(manualDto),
      updateEvent: vi.fn().mockResolvedValue(new ManualEventDto({ ...manualDto, title: 'Updated Event' })),
      deleteEvent: vi.fn().mockResolvedValue(undefined),
    } as never;

    const created = await createManualAgendaEvent({ title: 'Created Event', startsAt: '2026-06-22T09:00', endsAt: '2026-06-22T10:00', allDay: false }, client);
    const updated = await updateManualAgendaEvent('created', { title: 'Updated Event', startsAt: '2026-06-22T09:00', endsAt: '2026-06-22T10:00', allDay: false }, client);
    await deleteManualAgendaEvent('created', client);

    expect((client as { createEvent: ReturnType<typeof vi.fn> }).createEvent).toHaveBeenCalledTimes(1);
    expect((client as { updateEvent: ReturnType<typeof vi.fn> }).updateEvent).toHaveBeenCalledWith('created', expect.objectContaining({ title: 'Updated Event' }));
    expect((client as { deleteEvent: ReturnType<typeof vi.fn> }).deleteEvent).toHaveBeenCalledWith('created');
    expect(created).toMatchObject({ id: 'created', sourceId: 'manual-source', editable: true });
    expect(updated.title).toBe('Updated Event');
  });

  it('normalizes ManualEventDto instances into agenda events', () => {
    expect(toAgendaEventFromManualEvent(manualDto)).toMatchObject({
      id: 'created',
      sourceId: 'manual-source',
      startsAt: '2026-06-22T09:00:00.000Z',
      editable: true,
    });
  });
});
