export type EventSourceType = 'manual' | 'iCalFeed' | 'iCalFile' | 'googleCalendar' | 'calDav' | 'exchange' | 'birthdays' | 'tvSeries' | 'schoolHolidays' | 'provider';

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
  icon?: string;
  type: EventSourceType;
  enabled: boolean;
  capability: EventSourceCapability;
  visibility: EventSourceVisibility;
  color: EventSourceColor;
  providerSourceId?: string;
  sourceState?: 'healthy' | 'failed' | 'neverSynced' | 'disabled';
  canDisplayEvents?: boolean;
}

export interface NormalizedEvent {
  id: string;
  eventSeriesId?: string;
  sourceId: EventSource['id'];
  title: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  editable: boolean;
  providerEventId?: string;
  description?: string;
  location?: string;
  occurrenceKey?: string;
  isRecurring?: boolean;
  isException?: boolean;
  recurrence?: {
    isRecurring: boolean;
    frequency?: string;
    interval?: number;
    endMode?: string;
  };
}
