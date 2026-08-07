import { describe, expect, it } from 'vitest';
import { toCalendarFieldSet } from './calendarFieldMapper';

describe('calendar field mapper', () => {
  it('keeps timed input as literal calendar fields', () => {
    expect(toCalendarFieldSet({ startsAt: '2026-10-25T02:30', endsAt: '2026-10-25T02:30', allDay: false })).toEqual({
      startDate: '2026-10-25', startTime: '02:30', endDate: '2026-10-25', endTime: '02:30', isAllDay: false,
    });
  });

  it('keeps inclusive all-day dates and null times', () => {
    expect(toCalendarFieldSet({ startsAt: '2026-07-01', endsAt: '2026-07-03', allDay: true })).toEqual({
      startDate: '2026-07-01', startTime: null, endDate: '2026-07-03', endTime: null, isAllDay: true,
    });
  });
});
