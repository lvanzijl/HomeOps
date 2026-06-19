import {
  CreateManualEventRequest,
  EventSourceCapability as ApiEventSourceCapability,
  EventSourceType as ApiEventSourceType,
  HomeOpsApiClient,
  ManualEventDto,
  NormalizedEvent as ApiNormalizedEvent,
  UpdateManualEventRequest,
  type EventSource as ApiEventSource,
} from '../api/homeOpsApiClient';
import type { EventSource, EventSourceCapability, EventSourceType, NormalizedEvent } from '../events/eventSourceModel';

export interface ManualAgendaData {
  sources: EventSource[];
  events: NormalizedEvent[];
}

export interface ManualEventInput {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
}

export function createAgendaApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient();
}

export async function loadManualAgendaData(client = createAgendaApiClient()): Promise<ManualAgendaData> {
  const [sources, events] = await Promise.all([client.getEventSources(), client.getEvents()]);

  return {
    sources: sources.map(toAgendaEventSource),
    events: events.map(toAgendaEvent),
  };
}

export async function createManualAgendaEvent(input: ManualEventInput, client = createAgendaApiClient()): Promise<NormalizedEvent> {
  const event = await client.createEvent(new CreateManualEventRequest(toManualEventRequest(input)));
  return toAgendaEventFromManualEvent(event);
}

export async function updateManualAgendaEvent(eventId: string, input: ManualEventInput, client = createAgendaApiClient()): Promise<NormalizedEvent> {
  const event = await client.updateEvent(eventId, new UpdateManualEventRequest(toManualEventRequest(input)));
  return toAgendaEventFromManualEvent(event);
}

export async function deleteManualAgendaEvent(eventId: string, client = createAgendaApiClient()): Promise<void> {
  await client.deleteEvent(eventId);
}

export function toAgendaEventSource(source: ApiEventSource): EventSource {
  return {
    id: requireString(source.id, 'event source id'),
    name: source.name ?? 'Manual Events',
    type: mapEventSourceType(source.type),
    enabled: source.enabled ?? true,
    capability: mapEventSourceCapability(source.capability),
    visibility: {
      visibleByDefault: source.visibility?.visibleByDefault ?? true,
      groupName: source.visibility?.groupName,
    },
    color: { hex: source.color?.hex ?? '#4f46e5' },
    externalSourceId: source.externalSourceId,
  };
}

export function toAgendaEvent(event: ApiNormalizedEvent): NormalizedEvent {
  return {
    id: requireString(event.id, 'event id'),
    sourceId: requireString(event.sourceId, 'event source id'),
    title: event.title ?? 'Untitled event',
    startsAt: requireDate(event.startsAt, 'event start'),
    endsAt: optionalDate(event.endsAt),
    allDay: event.allDay ?? false,
    editable: event.editable ?? false,
    externalEventId: event.externalEventId,
    description: event.description,
    location: event.location,
  };
}

export function toAgendaEventFromManualEvent(event: ManualEventDto): NormalizedEvent {
  return {
    id: requireString(event.id, 'event id'),
    sourceId: requireString(event.eventSourceId, 'event source id'),
    title: event.title ?? 'Untitled event',
    startsAt: requireDate(event.startUtc, 'event start'),
    endsAt: optionalDate(event.endUtc),
    allDay: event.isAllDay ?? false,
    editable: true,
    description: event.description,
  };
}

function toManualEventRequest(input: ManualEventInput) {
  return {
    title: input.title,
    description: input.description,
    startUtc: new Date(input.startsAt),
    endUtc: input.endsAt ? new Date(input.endsAt) : undefined,
    isAllDay: input.allDay,
  };
}

function mapEventSourceType(type?: ApiEventSourceType): EventSourceType {
  switch (type) {
    case ApiEventSourceType.Manual:
      return 'manual';
    case ApiEventSourceType.GoogleCalendar:
      return 'googleCalendar';
    case ApiEventSourceType.Birthdays:
      return 'birthdays';
    case ApiEventSourceType.TvSeries:
      return 'tvSeries';
    case ApiEventSourceType.SchoolHolidays:
      return 'schoolHolidays';
    default:
      return 'external';
  }
}

function mapEventSourceCapability(capability?: ApiEventSourceCapability): EventSourceCapability {
  return capability === ApiEventSourceCapability.Writable ? 'writable' : 'readOnly';
}

function requireString(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} from Manual Events API response.`);
  }

  return value;
}

function requireDate(value: Date | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} from Manual Events API response.`);
  }

  return value.toISOString();
}

function optionalDate(value: Date | undefined): string | undefined {
  return value?.toISOString();
}
