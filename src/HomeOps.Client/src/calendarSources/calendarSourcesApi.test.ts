import { describe, expect, it } from 'vitest';
import {
  EventSourceDto,
  EventSourceHealthStatus,
  EventSourceLastError,
  EventSourcePollInterval,
  EventSourceType,
  SyncSourceResultDto,
} from '../api/homeOpsApiClient';
import { formatCalendarSourceSyncSummary, getCalendarSourceStatusMessage, toCalendarSource, toCalendarSourceRefreshResult } from './calendarSourcesApi';

describe('calendarSourcesApi', () => {
  it('maps technical source errors to household-friendly status copy', () => {
    const source = toCalendarSource(new EventSourceDto({
      id: 'failed-source',
      name: 'Kapotte bron',
      icon: '🚫',
      sourceType: EventSourceType.ICalFeed,
      enabled: true,
      writable: false,
      isSystem: false,
      healthStatus: EventSourceHealthStatus.Failed,
      pollInterval: EventSourcePollInterval.Every8Hours,
      lastError: new EventSourceLastError({
        code: 'NotFound',
        message: 'iCal Feed request failed with HTTP status 404.',
      }),
    }));

    expect(source.lastError?.message).toBe('Deze bron kon niet worden opgehaald. Controleer het adres en probeer het opnieuw.');
    expect(getCalendarSourceStatusMessage(source)).toBe('Deze bron kon niet worden opgehaald. Controleer het adres en probeer het opnieuw.');
  });

  it('maps technical refresh failures to household-friendly summaries', () => {
    const result = toCalendarSourceRefreshResult(new SyncSourceResultDto({
      sourceId: 'failed-source',
      succeeded: false,
      healthStatus: EventSourceHealthStatus.Failed,
      attemptedAtUtc: new Date('2026-07-05T20:05:00.000Z'),
      failedAtUtc: new Date('2026-07-05T20:05:00.000Z'),
      error: new EventSourceLastError({
        code: 'Timeout',
        message: 'iCal Feed request timed out.',
      }),
    }));

    expect(result.error?.message).toBe('Het ophalen van deze bron duurde te lang. Probeer het zo opnieuw.');
    expect(formatCalendarSourceSyncSummary(result)).toBe('Het ophalen van deze bron duurde te lang. Probeer het zo opnieuw.');
  });
});
