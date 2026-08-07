export interface CalendarDraft {
  title: string;
  startDate: string;
  isAllDay: true;
}

const storageKey = 'homeops.calendarDraft.v1';

export function saveCalendarDraft(draft: CalendarDraft): void {
  window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
}

export function consumeCalendarDraft(): CalendarDraft | null {
  const stored = window.sessionStorage.getItem(storageKey);
  if (!stored) return null;
  window.sessionStorage.removeItem(storageKey);
  try {
    const draft = JSON.parse(stored) as CalendarDraft;
    return draft.title && /^\d{4}-\d{2}-\d{2}$/.test(draft.startDate) && draft.isAllDay ? draft : null;
  } catch {
    return null;
  }
}
