import { describe, expect, it } from 'vitest';
import { calendarDateInTimeZone, projectedInstantToCalendarDateTime } from './HouseholdTimeZoneContext';

describe('household-local calendar helpers', () => {
  it('derives the date from the household zone rather than the browser zone', () => {
    const instant = new Date('2026-07-01T22:30:00Z');
    expect(calendarDateInTimeZone(instant, 'Europe/Amsterdam')).toBe('2026-07-02');
    expect(calendarDateInTimeZone(instant, 'America/New_York')).toBe('2026-07-01');
  });

  it('projects read instants back to household-local form strings', () => {
    expect(projectedInstantToCalendarDateTime('2026-06-18T09:30:00Z', 'Europe/Amsterdam')).toBe('2026-06-18T11:30');
  });
});
