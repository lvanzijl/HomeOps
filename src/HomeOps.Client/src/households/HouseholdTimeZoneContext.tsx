import { createContext, useContext } from 'react';

const HouseholdTimeZoneContext = createContext('Europe/Amsterdam');

export const HouseholdTimeZoneProvider = HouseholdTimeZoneContext.Provider;

export function useHouseholdTimeZone(): string {
  return useContext(HouseholdTimeZoneContext);
}

export function calendarDateInTimeZone(now: Date, timeZoneId: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function projectedInstantToCalendarDateTime(value: string, timeZoneId: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}
