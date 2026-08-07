import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EventSourceDto,
  EventSourceHealthStatus,
  EventSourceLastError,
  EventSourcePollInterval,
  EventSourceType,
  SyncSourceResultDto,
} from '../api/homeOpsApiClient';
import { formatCalendarSourceSyncSummary, getCalendarSourceStatusMessage, setCalendarSourceEnabled, toCalendarSource, toCalendarSourceRefreshResult } from './calendarSourcesApi';

afterEach(() => vi.unstubAllGlobals());

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

  it('disables an unreachable feed through metadata without reconnecting it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'feed-source', name: 'School', icon: 'calendar', sourceType: EventSourceType.ICalFeed,
      enabled: false, writable: false, isSystem: false, isArchived: false,
      healthStatus: EventSourceHealthStatus.Failed, pollInterval: EventSourcePollInterval.Every8Hours,
      requiresNormalization: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await setCalendarSourceEnabled({
      id: 'feed-source', name: 'School', icon: 'calendar', type: 'iCalFeed', enabled: true,
      writable: false, isSystem: false, state: 'failed', canDisplayEvents: false,
      pollInterval: 'every8Hours', providerConfiguration: { kind: 'iCalFeed', feedUrl: 'https://example.test/school.ics' },
    }, false);

    expect(fetchMock).toHaveBeenCalledWith('/api/event-sources/feed-source/metadata', expect.objectContaining({ method: 'PUT' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ enabled: false, name: 'School' });
  });
});
