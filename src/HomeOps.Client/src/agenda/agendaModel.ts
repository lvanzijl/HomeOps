import type { EventSource, NormalizedEvent } from '../events/eventSourceModel';

export interface AgendaEvent extends NormalizedEvent {
  source: EventSource;
}

export interface AgendaDayGroup {
  date: string;
  label: string;
  events: readonly AgendaEvent[];
}

export interface AgendaMonthGroup {
  month: string;
  label: string;
  events: readonly AgendaEvent[];
}
