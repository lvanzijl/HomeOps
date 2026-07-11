import {
  CreateEventSeriesRequest,
  EventSourceDto,
  DecorativeAvatarReferenceDto,
  DecorativeAvatarReferenceType,
  EventSourceHealthStatus,
  EventSourceType as ApiEventSourceType,
  EventSeriesDto,
  HomeOpsApiClient,
  ModifyOccurrenceRequest,
  NormalizedEvent as ApiNormalizedEvent,
  OccurrenceTargetRequest,
  RecurrenceRuleDto,
  SplitEventSeriesRequest,
  UpdateEventSeriesRequest,
} from "../api/homeOpsApiClient";
import type {
  EventSource,
  EventSourceType,
  NormalizedEvent,
  DecorativeAvatarReference,
} from "../events/eventSourceModel";

export interface CalendarAgendaData {
  sources: EventSource[];
  events: NormalizedEvent[];
}

export type EventRecurrenceFrequency =
  | "None"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly";

export type EventRecurrenceEndMode = "Never" | "OnDate" | "AfterCount";
export type EventRecurrenceWeekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface EventRecurrenceRuleInput {
  frequency: Exclude<EventRecurrenceFrequency, "None">;
  interval: number;
  endMode: EventRecurrenceEndMode;
  untilDate?: string;
  count?: number;
  weeklyDays?: EventRecurrenceWeekday[];
  monthlyDayOfMonth?: number;
  yearlyMonth?: number;
  yearlyDayOfMonth?: number;
}

export interface EventSeriesInput {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  recurrenceRule?: EventRecurrenceRuleInput | null;
  decorativeAvatar?: DecorativeAvatarReference | null;
}

export interface CalendarEventException {
  eventSeriesId: string;
  occurrenceKey: string;
  exceptionType: string;
  title?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface CalendarEventSeriesDetails {
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  recurrenceRule?: EventRecurrenceRuleInput;
  exceptions: CalendarEventException[];
  decorativeAvatar?: DecorativeAvatarReference | null;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createAgendaApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadCalendarAgendaData(
  client = createAgendaApiClient(),
): Promise<CalendarAgendaData> {
  const [sources, events] = await Promise.all([
    client.listEventSources(),
    client.getEvents(),
  ]);

  return {
    sources: sources.map(toAgendaEventSource),
    events: events.map(toAgendaEvent),
  };
}

export async function getCalendarAgendaEventSeries(
  eventSeriesId: string,
  client = createAgendaApiClient(),
): Promise<CalendarEventSeriesDetails> {
  const eventSeries = await client.getEventById(eventSeriesId);
  return toCalendarEventSeriesDetails(eventSeries);
}

export async function createCalendarAgendaEvent(
  input: EventSeriesInput,
  client = createAgendaApiClient(),
): Promise<NormalizedEvent> {
  const event = await client.createEvent(
    new CreateEventSeriesRequest(toEventSeriesRequest(input)),
  );
  return toAgendaEventFromEventSeries(event);
}

export async function updateCalendarAgendaEvent(
  eventSeriesId: string,
  input: EventSeriesInput,
  client = createAgendaApiClient(),
): Promise<NormalizedEvent> {
  const event = await client.updateEvent(
    eventSeriesId,
    new UpdateEventSeriesRequest(toEventSeriesRequest(input)),
  );
  return toAgendaEventFromEventSeries(event);
}

export async function updateCalendarAgendaOccurrence(
  eventSeriesId: string,
  occurrenceKey: string,
  input: EventSeriesInput,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.modifyEventOccurrence(
    eventSeriesId,
    new ModifyOccurrenceRequest({
      occurrenceKey,
      title: input.title,
      description: input.description,
      location: input.location,
      isAllDay: input.allDay,
      startUtc: new Date(input.startsAt),
      endUtc: input.endsAt ? new Date(input.endsAt) : undefined,
    }),
  );
}

export async function skipCalendarAgendaOccurrence(
  eventSeriesId: string,
  occurrenceKey: string,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.skipEventOccurrence(
    eventSeriesId,
    new OccurrenceTargetRequest({ occurrenceKey }),
  );
}

export async function restoreCalendarAgendaOccurrence(
  eventSeriesId: string,
  occurrenceKey: string,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.restoreEventOccurrence(
    eventSeriesId,
    new OccurrenceTargetRequest({ occurrenceKey }),
  );
}

export async function splitCalendarAgendaEventSeries(
  eventSeriesId: string,
  occurrenceKey: string,
  input: EventSeriesInput,
  client = createAgendaApiClient(),
): Promise<CalendarEventSeriesDetails> {
  const eventSeries = await client.splitEventSeriesFromOccurrence(
    eventSeriesId,
    new SplitEventSeriesRequest({
      occurrenceKey,
      title: input.title,
      description: input.description,
      location: input.location,
      isAllDay: input.allDay,
      startUtc: new Date(input.startsAt),
      endUtc: input.endsAt ? new Date(input.endsAt) : undefined,
      recurrenceRule: toRecurrenceRuleDto(input.recurrenceRule),
    }),
  );
  return toCalendarEventSeriesDetails(eventSeries);
}

export async function deleteCalendarAgendaOccurrence(
  eventSeriesId: string,
  occurrenceKey: string,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.deleteEventOccurrence(eventSeriesId, occurrenceKey);
}

export async function deleteCalendarAgendaFutureOccurrences(
  eventSeriesId: string,
  occurrenceKey: string,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.deleteEventOccurrencesFromOccurrence(eventSeriesId, occurrenceKey);
}

export async function deleteCalendarAgendaEvent(
  eventSeriesId: string,
  client = createAgendaApiClient(),
): Promise<void> {
  await client.deleteEvent(eventSeriesId);
}

export function toAgendaEventSource(source: EventSourceDto): EventSource {
  const enabled = source.enabled ?? true;
  const sourceState = !enabled
    ? "disabled"
    : source.healthStatus === EventSourceHealthStatus.Healthy
      ? "healthy"
      : source.healthStatus === EventSourceHealthStatus.Failed
        ? "failed"
        : "neverSynced";

  return {
    id: requireString(source.id, "event source id"),
    name: source.name ?? "HomeOps Calendar",
    icon: source.icon ?? "📅",
    type: mapEventSourceType(source.sourceType),
    enabled,
    capability: source.writable ? "writable" : "readOnly",
    visibility: {
      visibleByDefault: true,
    },
    color: { hex: "#4f46e5" },
    providerSourceId: source.providerSourceId,
    sourceState,
    canDisplayEvents: sourceState === "healthy",
  };
}

export function toAgendaEvent(event: ApiNormalizedEvent): NormalizedEvent {
  return {
    id: requireString(event.id, "event id"),
    eventSeriesId: event.eventSeriesId ?? requireString(event.id, "event id"),
    sourceId: requireString(event.sourceId, "event source id"),
    title: event.title ?? "Untitled event",
    startsAt: requireDate(event.startsAt, "event start"),
    endsAt: optionalDate(event.endsAt),
    allDay: event.allDay ?? false,
    editable: event.editable ?? false,
    providerEventId: event.providerEventId,
    description: event.description,
    location: event.location,
    occurrenceKey: event.occurrenceKey,
    isRecurring: event.isRecurring ?? false,
    isException: event.isException ?? false,
    decorativeAvatar: toDecorativeAvatarReference(event.decorativeAvatar),
    recurrence: event.recurrence
      ? {
          isRecurring: event.recurrence.isRecurring ?? false,
          frequency: event.recurrence.frequency,
          interval: event.recurrence.interval,
          endMode: event.recurrence.endMode,
        }
      : undefined,
  };
}

export function toAgendaEventFromEventSeries(
  event: EventSeriesDto,
): NormalizedEvent {
  return {
    id: requireString(event.id, "event id"),
    eventSeriesId: requireString(event.id, "event id"),
    sourceId: requireString(event.eventSourceId, "event source id"),
    title: event.title ?? "Untitled event",
    startsAt: requireDate(event.startUtc, "event start"),
    endsAt: optionalDate(event.endUtc),
    allDay: event.isAllDay ?? false,
    editable: true,
    description: event.description,
    location: event.location,
    isRecurring: Boolean(event.recurrenceRule),
    decorativeAvatar: toDecorativeAvatarReference(event.decorativeAvatar),
    recurrence: event.recurrenceRule
      ? {
          isRecurring: true,
          frequency: event.recurrenceRule.frequency,
          interval: event.recurrenceRule.interval,
          endMode: event.recurrenceRule.endMode,
        }
      : undefined,
  };
}

export function toCalendarEventSeriesDetails(
  event: EventSeriesDto,
): CalendarEventSeriesDetails {
  return {
    id: requireString(event.id, "event id"),
    sourceId: requireString(event.eventSourceId, "event source id"),
    title: event.title ?? "Untitled event",
    description: event.description,
    location: event.location,
    startsAt: requireDate(event.startUtc, "event start"),
    endsAt: optionalDate(event.endUtc),
    allDay: event.isAllDay ?? false,
    recurrenceRule: event.recurrenceRule
      ? toRecurrenceRuleInput(event.recurrenceRule)
      : undefined,
    decorativeAvatar: toDecorativeAvatarReference(event.decorativeAvatar),
    exceptions:
      event.exceptions?.map((exception) => ({
        eventSeriesId: requireString(
          exception.eventSeriesId,
          "event exception series id",
        ),
        occurrenceKey: requireString(
          exception.occurrenceKey,
          "event exception occurrence key",
        ),
        exceptionType: exception.exceptionType ?? "Modified",
        title: exception.title,
        description: exception.description,
        location: exception.location,
        allDay: exception.isAllDay,
        startsAt: optionalDate(exception.startsAt),
        endsAt: optionalDate(exception.endsAt),
      })) ?? [],
  };
}

function toEventSeriesRequest(input: EventSeriesInput) {
  return {
    title: input.title,
    description: input.description,
    location: input.location,
    startUtc: new Date(input.startsAt),
    endUtc: input.endsAt ? new Date(input.endsAt) : undefined,
    isAllDay: input.allDay,
    recurrenceRule: toRecurrenceRuleDto(input.recurrenceRule),
    decorativeAvatar: toDecorativeAvatarDto(input.decorativeAvatar),
  };
}

function toDecorativeAvatarReference(reference: { referenceType?: unknown; referenceId?: string } | undefined): DecorativeAvatarReference | null {
  if (!reference || reference.referenceType === undefined || !reference.referenceId) return null;
  const normalizedType = typeof reference.referenceType === 'number' ? reference.referenceType : String(reference.referenceType).toLowerCase();
  const referenceType = normalizedType === 0 || normalizedType === 'familymember' ? 'familyMember' : 'knownPerson';
  return { referenceType, referenceId: reference.referenceId };
}

function toDecorativeAvatarDto(reference: DecorativeAvatarReference | null | undefined): DecorativeAvatarReferenceDto | undefined {
  if (!reference) return undefined;
  return new DecorativeAvatarReferenceDto({
    referenceType: reference.referenceType === 'familyMember' ? DecorativeAvatarReferenceType.FamilyMember : DecorativeAvatarReferenceType.KnownPerson,
    referenceId: reference.referenceId,
  });
}

function toRecurrenceRuleDto(
  recurrenceRule?: EventRecurrenceRuleInput | null,
): RecurrenceRuleDto | undefined {
  if (!recurrenceRule) {
    return undefined;
  }

  return new RecurrenceRuleDto({
    frequency: recurrenceRule.frequency,
    interval: recurrenceRule.interval,
    endMode: recurrenceRule.endMode,
    untilDate: recurrenceRule.untilDate
      ? new Date(`${recurrenceRule.untilDate}T00:00:00`)
      : undefined,
    count: recurrenceRule.count,
    weeklyDays: recurrenceRule.weeklyDays,
    monthlyDayOfMonth: recurrenceRule.monthlyDayOfMonth,
    yearlyMonth: recurrenceRule.yearlyMonth,
    yearlyDayOfMonth: recurrenceRule.yearlyDayOfMonth,
  });
}

function toRecurrenceRuleInput(
  recurrenceRule: RecurrenceRuleDto,
): EventRecurrenceRuleInput {
  return {
    frequency: requireRecurrenceFrequency(recurrenceRule.frequency),
    interval: recurrenceRule.interval ?? 1,
    endMode: requireEndMode(recurrenceRule.endMode),
    untilDate: recurrenceRule.untilDate?.toISOString().slice(0, 10),
    count: recurrenceRule.count ?? undefined,
    weeklyDays: recurrenceRule.weeklyDays as EventRecurrenceWeekday[] | undefined,
    monthlyDayOfMonth: recurrenceRule.monthlyDayOfMonth ?? undefined,
    yearlyMonth: recurrenceRule.yearlyMonth ?? undefined,
    yearlyDayOfMonth: recurrenceRule.yearlyDayOfMonth ?? undefined,
  };
}

function requireRecurrenceFrequency(
  value?: string,
): Exclude<EventRecurrenceFrequency, "None"> {
  if (
    value === "Daily" ||
    value === "Weekly" ||
    value === "Monthly" ||
    value === "Yearly"
  ) {
    return value;
  }

  throw new Error("Unsupported recurrence frequency in EventSeries API response.");
}

function requireEndMode(value?: string): EventRecurrenceEndMode {
  if (value === "Never" || value === "OnDate" || value === "AfterCount") {
    return value;
  }

  throw new Error("Unsupported recurrence end mode in EventSeries API response.");
}

function mapEventSourceType(type?: ApiEventSourceType): EventSourceType {
  switch (type) {
    case ApiEventSourceType.Manual:
      return "manual";
    case ApiEventSourceType.ICalFeed:
      return "iCalFeed";
    case ApiEventSourceType.ICalFile:
      return "iCalFile";
    case ApiEventSourceType.GoogleCalendar:
      return "googleCalendar";
    case ApiEventSourceType.CalDav:
      return "calDav";
    case ApiEventSourceType.Exchange:
      return "exchange";
    case ApiEventSourceType.Birthdays:
      return "birthdays";
    case ApiEventSourceType.TvSeries:
      return "tvSeries";
    case ApiEventSourceType.SchoolHolidays:
      return "schoolHolidays";
    case ApiEventSourceType.Provider:
    default:
      return "provider";
  }
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
