export type EventSourceType = 'manual' | 'googleCalendar' | 'birthdays' | 'tvSeries' | 'schoolHolidays' | 'external';

export type EventSourceCapability = 'readOnly' | 'writable';

export interface EventSourceVisibility {
  visibleByDefault: boolean;
  groupName?: string;
}

export interface EventSourceColor {
  hex?: string;
}

export interface EventSource {
  id: string;
  name: string;
  type: EventSourceType;
  enabled: boolean;
  capability: EventSourceCapability;
  visibility: EventSourceVisibility;
  color: EventSourceColor;
  externalSourceId?: string;
}

export interface NormalizedEvent {
  id: string;
  sourceId: EventSource['id'];
  title: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  editable: boolean;
  externalEventId?: string;
  description?: string;
  location?: string;
}
