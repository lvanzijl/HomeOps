export interface HouseholdTimeZoneInfo { timeZoneId: string; updatedUtc: string }
export interface SupportedTimeZone { id: string; displayName: string; utcOffset: string }
export interface HouseholdTimeZoneImpact {
  manualTimedEventCount: number;
  manualAllDayEventCount: number;
  enabledImportedSourceCount: number;
  disabledImportedSourceCount: number;
}
export interface HouseholdTimeZonePreview {
  currentTimeZoneId: string;
  newTimeZoneId: string;
  impact: HouseholdTimeZoneImpact;
  explanations: string[];
}
export interface HouseholdTimeZoneSourceFailure { sourceId: string; sourceName: string; code: string; message: string }
export interface HouseholdTimeZoneUpdate {
  succeeded: boolean;
  timeZoneId: string;
  impact: HouseholdTimeZoneImpact;
  sourceFailures: HouseholdTimeZoneSourceFailure[];
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

export class HouseholdTimeZoneApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly result?: HouseholdTimeZoneUpdate) { super(message); }
}

export function loadHouseholdTimeZone(): Promise<HouseholdTimeZoneInfo> {
  return request('/api/households/current/time-zone');
}

export function searchTimeZones(query: string): Promise<SupportedTimeZone[]> {
  return request(`/api/time-zones?query=${encodeURIComponent(query)}`);
}

export function previewHouseholdTimeZone(timeZoneId: string): Promise<HouseholdTimeZonePreview> {
  return request('/api/households/current/time-zone/preview', { method: 'POST', body: JSON.stringify({ timeZoneId }) });
}

export function updateHouseholdTimeZone(timeZoneId: string, expectedCurrentTimeZoneId: string): Promise<HouseholdTimeZoneUpdate> {
  return request('/api/households/current/time-zone', {
    method: 'PUT',
    body: JSON.stringify({ timeZoneId, expectedCurrentTimeZoneId, confirmed: true }),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const text = await response.text();
  const body = text ? JSON.parse(text) as T & { title?: string; errors?: Record<string, string[]> } : undefined;
  if (!response.ok) {
    const update = response.status === 409 ? body as unknown as HouseholdTimeZoneUpdate : undefined;
    const validation = Object.values(body?.errors ?? {}).flat().join(' ');
    const message = validation || (update?.sourceFailures.length
      ? 'Een of meer kalenderbronnen konden niet worden voorbereid. De tijdzone is niet gewijzigd.'
      : response.status === 409 ? 'De huishoudtijdzone is intussen gewijzigd. Open het venster opnieuw.' : body?.title || 'De tijdzone kon niet worden gewijzigd.');
    throw new HouseholdTimeZoneApiError(response.status, message, update);
  }
  return body as T;
}
