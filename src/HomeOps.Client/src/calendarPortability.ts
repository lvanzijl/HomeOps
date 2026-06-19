import { ApiException, CalendarExportDocument, HomeOpsApiClient, HttpValidationProblemDetails } from './api/homeOpsApiClient';

export const calendarExportFileNamePrefix = 'homeops-calendar-export';

export interface CalendarExportSummary {
  format: string;
  schemaVersion: number;
  payloadVersion: number;
  exportedUtc: string;
  eventSeriesCount: number;
}

export function createCalendarPortabilityClient(): HomeOpsApiClient {
  return new HomeOpsApiClient('');
}

export function summarizeCalendarExport(document: CalendarExportDocument): CalendarExportSummary {
  return {
    format: document.format ?? 'Unknown format',
    schemaVersion: document.schemaVersion ?? 0,
    payloadVersion: document.calendar?.version ?? 0,
    exportedUtc: document.exportedUtc?.toISOString() ?? 'Unknown timestamp',
    eventSeriesCount: document.calendar?.eventSeries?.length ?? 0,
  };
}

export function createCalendarExportFileName(exportedUtc: Date = new Date()): string {
  const timestamp = exportedUtc.toISOString().replace(/[:.]/g, '-');
  return `${calendarExportFileNamePrefix}-${timestamp}.json`;
}

export function downloadCalendarExport(document: CalendarExportDocument, browserWindow: Window = window): void {
  const json = JSON.stringify(document.toJSON(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = browserWindow.document.createElement('a');
  anchor.href = url;
  anchor.download = createCalendarExportFileName(document.exportedUtc);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseCalendarExportJson(json: string): CalendarExportDocument {
  return CalendarExportDocument.fromJS(JSON.parse(json));
}

export function getFriendlyCalendarPortabilityError(error: unknown): string {
  const validationErrors = getValidationErrors(error);
  if (validationErrors.length > 0) {
    return validationErrors.join(' ');
  }

  if (error instanceof SyntaxError) {
    return 'The selected file is not valid JSON.';
  }

  if (ApiException.isApiException(error)) {
    if (error.status === 400) return 'The calendar export could not be restored. Please review the validation errors and try again.';
    if (error.status >= 500) return 'HomeOps could not complete the calendar request. Please try again after the server is available.';
  }

  return 'HomeOps could not complete the calendar portability request.';
}

export function getValidationErrors(error: unknown): string[] {
  if (!ApiException.isApiException(error)) return [];

  const parsed = parseProblemDetails(error.response);
  const errors = parsed.errors ?? {};
  return Object.entries(errors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`));
}

function parseProblemDetails(response: string): HttpValidationProblemDetails {
  if (!response) return new HttpValidationProblemDetails();
  try {
    return HttpValidationProblemDetails.fromJS(JSON.parse(response));
  } catch {
    return new HttpValidationProblemDetails();
  }
}
