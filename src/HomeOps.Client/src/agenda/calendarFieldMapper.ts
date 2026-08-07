import type { EventSeriesInput } from './calendarEventsApi';

export interface CalendarFieldSetPayload {
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  isAllDay: boolean;
}

export function toCalendarFieldSet(input: Pick<EventSeriesInput, 'startsAt' | 'endsAt' | 'allDay'>): CalendarFieldSetPayload {
  const start = splitCalendarInput(input.startsAt);
  const end = splitCalendarInput(input.endsAt || input.startsAt);
  return {
    startDate: start.date,
    startTime: input.allDay ? null : start.time,
    endDate: end.date,
    endTime: input.allDay ? null : end.time,
    isAllDay: input.allDay,
  };
}

function splitCalendarInput(value: string): { date: string; time: string | null } {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/.exec(value);
  if (!match) throw new Error('Datum en tijd moeten als kalenderwaarden worden ingevuld.');
  return { date: match[1], time: match[2] ?? null };
}
