import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdTimeZoneDialog } from './HouseholdTimeZoneDialog';

const api = vi.hoisted(() => ({
  loadHouseholdTimeZone: vi.fn(),
  searchTimeZones: vi.fn(),
  previewHouseholdTimeZone: vi.fn(),
  updateHouseholdTimeZone: vi.fn(),
}));

vi.mock('./householdTimeZoneApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./householdTimeZoneApi')>()),
  ...api,
}));

describe('HouseholdTimeZoneDialog', () => {
  beforeEach(() => {
    api.loadHouseholdTimeZone.mockResolvedValue({ timeZoneId: 'Europe/Amsterdam', updatedUtc: '2026-08-07T10:00:00Z' });
    api.searchTimeZones.mockResolvedValue([{ id: 'America/New_York', displayName: 'Eastern Time', utcOffset: 'UTC-05:00' }]);
    api.previewHouseholdTimeZone.mockResolvedValue({
      currentTimeZoneId: 'Europe/Amsterdam',
      newTimeZoneId: 'America/New_York',
      impact: { manualTimedEventCount: 2, manualAllDayEventCount: 1, enabledImportedSourceCount: 1, disabledImportedSourceCount: 1 },
      explanations: ['Handmatige afspraken houden hun kloktijd.'],
    });
    api.updateHouseholdTimeZone.mockResolvedValue({ succeeded: true, timeZoneId: 'America/New_York', impact: {}, sourceFailures: [] });
  });

  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('searches, previews, explicitly confirms, and applies the selected IANA zone', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    const close = vi.fn();
    render(<HouseholdTimeZoneDialog onChanged={changed} onClose={close} />);

    const search = await screen.findByLabelText('Tijdzone zoeken');
    await user.clear(search);
    await user.type(search, 'New York');
    await waitFor(() => expect(api.searchTimeZones).toHaveBeenCalledWith('New York'));
    await user.click(await screen.findByRole('button', { name: /America\/New_York/ }));
    await user.click(screen.getByRole('button', { name: 'Gevolgen bekijken' }));

    expect(await screen.findByText('Wat verandert er?')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Tijdzone wijzigen' }));

    await waitFor(() => expect(api.updateHouseholdTimeZone).toHaveBeenCalledWith('America/New_York', 'Europe/Amsterdam'));
    expect(changed).toHaveBeenCalledWith('America/New_York');
    expect(close).toHaveBeenCalled();
  });

  it('keeps the preview visible when a source-specific preflight fails', async () => {
    const { HouseholdTimeZoneApiError } = await import('./householdTimeZoneApi');
    api.updateHouseholdTimeZone.mockRejectedValue(new HouseholdTimeZoneApiError(409, 'Bronnen konden niet worden voorbereid.', {
      succeeded: false,
      timeZoneId: 'Europe/Amsterdam',
      impact: { manualTimedEventCount: 0, manualAllDayEventCount: 0, enabledImportedSourceCount: 1, disabledImportedSourceCount: 0 },
      sourceFailures: [{ sourceId: 'source-1', sourceName: 'Schoolagenda', code: 'NetworkFailure', message: 'Niet bereikbaar' }],
    }));
    const user = userEvent.setup();
    render(<HouseholdTimeZoneDialog onChanged={vi.fn()} onClose={vi.fn()} />);
    const search = await screen.findByLabelText('Tijdzone zoeken');
    await user.clear(search); await user.type(search, 'New York');
    await user.click(await screen.findByRole('button', { name: /America\/New_York/ }));
    await user.click(screen.getByRole('button', { name: 'Gevolgen bekijken' }));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Tijdzone wijzigen' }));

    expect(await screen.findByText('Schoolagenda')).toBeTruthy();
    expect(screen.getByText('Niet bereikbaar')).toBeTruthy();
    expect(screen.getByText('Wat verandert er?')).toBeTruthy();
    expect((search as HTMLInputElement).value).toBe('America/New_York');
  });
});
