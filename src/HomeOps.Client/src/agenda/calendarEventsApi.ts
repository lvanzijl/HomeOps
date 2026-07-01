import {
  CreateEventSeriesRequest,
  EventSourceCapability as ApiEventSourceCapability,
  EventSourceType as ApiEventSourceType,
  HomeOpsApiClient,
  EventSeriesDto,
  NormalizedEvent as ApiNormalizedEvent,
  UpdateEventSeriesRequest,
  type EventSource as ApiEventSource,
} from '../api/homeOpsApiClient';
import type { EventSource, EventSourceCapability, EventSourceType, NormalizedEvent } from '../events/eventSourceModel';

export interface CalendarAgendaData {
  sources: EventSource[];
  events: NormalizedEvent[];
}

export interface EventSeriesInput {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

export function createAgendaApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadCalendarAgendaData(client = createAgendaApiClient()): Promise<CalendarAgendaData> {
  const [sources, events] = await Promise.all([client.getEventSources(), client.getEvents()]);

  return {
    sources: sources.map(toAgendaEventSource),
    events: events.map(toAgendaEvent),
  };
}

export async function createCalendarAgendaEvent(input: EventSeriesInput, client = createAgendaApiClient()): Promise<NormalizedEvent> {
  const event = await client.createEvent(new CreateEventSeriesRequest(toEventSeriesRequest(input)));
  return toAgendaEventFromEventSeries(event);
}

export async function updateCalendarAgendaEvent(eventId: string, input: EventSeriesInput, client = createAgendaApiClient()): Promise<NormalizedEvent> {
  const event = await client.updateEvent(eventId, new UpdateEventSeriesRequest(toEventSeriesRequest(input)));
  return toAgendaEventFromEventSeries(event);
}

export async function deleteCalendarAgendaEvent(eventId: string, client = createAgendaApiClient()): Promise<void> {
  await client.deleteEvent(eventId);
}

export function toAgendaEventSource(source: ApiEventSource): EventSource {
  return {
    id: requireString(source.id, 'event source id'),
    name: source.name ?? 'HomeOps Calendar',
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

export function toAgendaEventFromEventSeries(event: EventSeriesDto): NormalizedEvent {
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

function toEventSeriesRequest(input: EventSeriesInput) {
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
    throw new Error(`Missing ${name} from EventSeries API response.`);
  }

  return value;
}

function requireDate(value: Date | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} from EventSeries API response.`);
  }

  return value.toISOString();
}

function optionalDate(value: Date | undefined): string | undefined {
  return value?.toISOString();
}


// Compatibility aliases for existing Agenda component wiring.
export type ManualAgendaData = CalendarAgendaData;
export type ManualEventInput = EventSeriesInput;
export const loadManualAgendaData = loadCalendarAgendaData;
export const createManualAgendaEvent = createCalendarAgendaEvent;
export const updateManualAgendaEvent = updateCalendarAgendaEvent;
export const deleteManualAgendaEvent = deleteCalendarAgendaEvent;
