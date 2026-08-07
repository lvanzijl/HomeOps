import type { CalendarFieldSetPayload } from '../agenda/calendarFieldMapper';

export interface CalendarRepairCandidate extends CalendarFieldSetPayload {
  eventId: string;
  title: string;
  updatedUtc: string;
}

export interface CalendarRepairPreview {
  eventId: string;
  currentTiming: CalendarFieldSetPayload;
  proposedTiming: CalendarFieldSetPayload;
  proposedStartUtc: string;
  proposedEndUtc: string;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

export class CalendarRepairError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function loadCalendarRepairCandidates(): Promise<CalendarRepairCandidate[]> {
  return request('/api/events/calendar-field-repair-candidates');
}

export async function previewCalendarRepair(eventId: string, timing: CalendarFieldSetPayload): Promise<CalendarRepairPreview> {
  return request(`/api/events/${eventId}/calendar-field-repair/preview`, { method: 'POST', body: JSON.stringify({ timing }) });
}

export async function applyCalendarRepair(candidate: CalendarRepairCandidate, timing: CalendarFieldSetPayload): Promise<void> {
  await request(`/api/events/${candidate.eventId}/calendar-field-repair`, {
    method: 'POST',
    body: JSON.stringify({ timing, expectedUpdatedUtc: candidate.updatedUtc, confirmed: true }),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const text = await response.text();
  if (!response.ok) {
    let message = response.status === 409 ? 'Deze afspraak is intussen gewijzigd. Laad de controle opnieuw.' : 'De kalendercontrole kon niet worden uitgevoerd.';
    try {
      const body = JSON.parse(text) as { error?: string; title?: string; errors?: Record<string, string[]> };
      message = Object.values(body.errors ?? {}).flat().join(' ') || body.error || body.title || message;
    } catch { /* retain friendly fallback */ }
    throw new CalendarRepairError(response.status, message);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}
