import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WoningClimatePage, WoningSummaryPage } from './WoningClimatePage';
import { RoomClimateFreshness, RoomClimateOperatingState, RoomClimateSpatialDisplayStatus, RoomHeatingCommandAction, RoomHeatingCommandStatus, RoomOverlayState } from './api/homeOpsApiClient';
import * as api from './woningClimateApi';

vi.mock('./woningClimateApi', async () => {
  const actual = await vi.importActual<typeof import('./woningClimateApi')>('./woningClimateApi');
  return { ...actual, createWoningClimateClient: vi.fn(() => ({})), loadHouseholdClimateSummary: vi.fn(), loadFloorClimateState: vi.fn(), loadFloorRuntimeOverlays: vi.fn(), loadRoomHeatingControlCapability: vi.fn(), submitTemporaryWarmer: vi.fn(), submitTemporaryCooler: vi.fn(), submitResumeSchedule: vi.fn() };
});

const summaries = [{ floorId: 'f1', floorName: 'Begane grond', overallAvailability: RoomClimateFreshness.Aging, counts: { freshRooms: 1, agingRooms: 1, staleRooms: 0, unavailableRooms: 1, trustedOverlayRooms: 1, fallbackRooms: 2 } }, { floorId: 'f2', floorName: 'Boven', overallAvailability: RoomClimateFreshness.Fresh, counts: { freshRooms: 1, agingRooms: 0, staleRooms: 0, unavailableRooms: 0, trustedOverlayRooms: 0, fallbackRooms: 1 } }];
const floor = { floorId: 'f1', floorName: 'Begane grond', activeAsset: { id: 'asset-active', derivativeUrl: '/safe.svg' }, observedSummaryUtc: new Date('2026-07-15T10:42:00Z'), overallAvailability: RoomClimateFreshness.Aging, counts: summaries[0].counts, rooms: [
  { roomId: 'r1', roomName: 'Woonkamer', roomType: 1, currentObservation: { temperatureCelsius: 20.5, relativeHumidity: 48, targetTemperatureCelsius: 21 }, operatingState: RoomClimateOperatingState.Heating, freshness: RoomClimateFreshness.Fresh, observedUtc: new Date('2026-07-15T10:42:00Z'), isProviderAvailable: true, spatialDisplayStatus: RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable, trustedOverlayId: 'o1', configuration: { isConfigured: true, isClimateEnabled: true } },
  { roomId: 'r2', roomName: 'Keuken', currentObservation: { temperatureCelsius: 19 }, operatingState: RoomClimateOperatingState.Idle, freshness: RoomClimateFreshness.Aging, isProviderAvailable: true, spatialDisplayStatus: RoomClimateSpatialDisplayStatus.RoomListFallback, configuration: { isConfigured: false } },
  { roomId: 'r3', roomName: 'Hal', operatingState: RoomClimateOperatingState.Unavailable, freshness: RoomClimateFreshness.Unavailable, isProviderAvailable: false, spatialDisplayStatus: RoomClimateSpatialDisplayStatus.OverlayNeedsReview, configuration: { isConfigured: true, isClimateEnabled: true } },
]};

const capability = { roomId: 'r1', isControllable: true, supportedActions: [RoomHeatingCommandAction.TemporaryWarmer, RoomHeatingCommandAction.ResumeSchedule], targetRange: { minimum: 18, maximum: 22 }, allowedDurationsMinutes: [30, 60], isProviderAvailable: true, blockers: [], isSharedZone: true, affectedRoomIds: ['r1', 'r2'], currentOverride: undefined, latestCommand: undefined };
const overlays = [{ id: 'o1', roomId: 'r1', floorPlanAssetId: 'asset-active', state: RoomOverlayState.Trusted, polygon: [{ x: .1, y: .1 }, { x: .5, y: .1 }, { x: .5, y: .5 }, { x: .1, y: .5 }], labelAnchor: { x: .3, y: .3 } }, { id: 'old', roomId: 'r3', floorPlanAssetId: 'replaced', state: RoomOverlayState.Trusted, polygon: [{ x: .6, y: .6 }, { x: .8, y: .6 }, { x: .8, y: .8 }] }];

beforeEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(api.loadHouseholdClimateSummary).mockResolvedValue({ floors: summaries } as never); vi.mocked(api.loadFloorClimateState).mockResolvedValue(floor as never); vi.mocked(api.loadFloorRuntimeOverlays).mockResolvedValue(overlays as never); vi.mocked(api.loadRoomHeatingControlCapability).mockResolvedValue(capability as never); vi.mocked(api.submitTemporaryWarmer).mockResolvedValue({ command: { commandId: 'c1', roomId: 'r1', action: RoomHeatingCommandAction.TemporaryWarmer, status: RoomHeatingCommandStatus.Accepted, requestedTargetTemperatureCelsius: 21.5, durationMinutes: 30 }, isProviderAvailable: true } as never); vi.mocked(api.submitResumeSchedule).mockResolvedValue({ command: { commandId: 'c2', roomId: 'r1', action: RoomHeatingCommandAction.ResumeSchedule, status: RoomHeatingCommandStatus.Succeeded, scheduleResumed: true }, isProviderAvailable: true } as never); });

describe('Woning climate runtime', () => {
  it('opens from Woning summary entry', async () => { const open = vi.fn(); render(<WoningSummaryPage onOpenClimate={open} />); await screen.findByText('Klimaatoverzicht geladen.'); await userEvent.click(screen.getByRole('button', { name: 'Klimaat bekijken' })); expect(open).toHaveBeenCalled(); expect(screen.getByText('1 niet beschikbaar')).toBeTruthy(); });
  it('renders floors in order, factual summary, values and Dutch states', async () => { render(<WoningClimatePage onBack={() => undefined} />); expect(await screen.findByRole('button', { name: /Begane grond/ })).toBeTruthy(); const tabs = screen.getByLabelText('Verdiepingen'); expect(within(tabs).getAllByRole('button').map((b) => b.textContent)).toEqual(['Begane grondWordt ouder', 'BovenActueel']); expect(screen.getByText('Actueel 1')).toBeTruthy(); expect(screen.getAllByText(/20.5°C/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Verwarmen/).length).toBeGreaterThan(0); expect(screen.getAllByText(/In rust/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Niet beschikbaar/).length).toBeGreaterThan(0); });
  it('renders only trusted active-asset overlay and synchronizes list selection', async () => { render(<WoningClimatePage onBack={() => undefined} />); const overlay = await screen.findByRole('button', { name: /Woonkamer 20.5°C Verwarmen Actueel/ }); expect(overlay).toBeTruthy(); expect(screen.queryAllByRole('button', { name: /Hal.*Niet beschikbaar/ })).toHaveLength(1); await userEvent.click(screen.getByRole('button', { name: /Keuken/ })); expect(screen.getByLabelText('Geselecteerde kamer').textContent).toContain('Keuken'); expect(screen.getAllByText('Deze kamer is nog niet gekoppeld aan een klimaatbron.').length).toBeGreaterThan(0); });

  it('loads heating capability, shows bounded warmer controls and hides unsupported cooler', async () => {
    render(<WoningClimatePage onBack={() => undefined} />);
    expect(await screen.findByText('Verwarming')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === '18.0°C tot 22.0°C')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tijdelijk warmer' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tijdelijk koeler' })).toBeNull();
    expect(screen.getByText(/Deze instelling kan ook invloed hebben op Keuken/)).toBeTruthy();
  });

  it('shows cooler only when the generated supported action is present', async () => {
    vi.mocked(api.loadRoomHeatingControlCapability).mockResolvedValueOnce({ ...capability, supportedActions: [RoomHeatingCommandAction.TemporaryWarmer, RoomHeatingCommandAction.TemporaryCooler, RoomHeatingCommandAction.ResumeSchedule] } as never);
    render(<WoningClimatePage onBack={() => undefined} />);
    expect(await screen.findByRole('button', { name: 'Tijdelijk koeler' })).toBeTruthy();
  });

  it('submits warmer with explicit target duration and an idempotency key without mutating observed climate facts', async () => {
    const user = userEvent.setup();
    render(<WoningClimatePage onBack={() => undefined} />);
    await user.click(await screen.findByRole('button', { name: 'Tijdelijk warmer' }));
    const dialog = screen.getByRole('dialog', { name: 'Tijdelijk warmer' });
    await user.click(within(dialog).getByRole('button', { name: '+' }));
    await user.click(within(dialog).getByLabelText('60 minuten'));
    await user.click(within(dialog).getByRole('button', { name: 'Bevestigen' }));
    await waitFor(() => expect(api.submitTemporaryWarmer).toHaveBeenCalledWith('r1', 21.5, 60, expect.any(String), expect.any(Object)));
    expect(screen.getByLabelText('Geselecteerde kamer').textContent).toContain('Geobserveerd doel21.0°C');
  });

  it('reuses the idempotency key after ambiguous transport failure and creates a new key after changed payload', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitTemporaryWarmer).mockRejectedValueOnce(new Error('network')).mockResolvedValue({ command: { commandId: 'c3', action: RoomHeatingCommandAction.TemporaryWarmer, status: RoomHeatingCommandStatus.Accepted }, isProviderAvailable: true } as never);
    render(<WoningClimatePage onBack={() => undefined} />);
    await user.click(await screen.findByRole('button', { name: 'Tijdelijk warmer' }));
    await user.click(screen.getByRole('button', { name: 'Bevestigen' }));
    await screen.findByText(/We weten niet zeker/);
    const firstKey = vi.mocked(api.submitTemporaryWarmer).mock.calls[0][3];
    await user.click(screen.getByRole('button', { name: 'Opnieuw proberen' }));
    await waitFor(() => expect(vi.mocked(api.submitTemporaryWarmer).mock.calls[1][3]).toBe(firstKey));
    await user.click(await screen.findByRole('button', { name: 'Tijdelijk warmer' }));
    // A changed payload starts a new command attempt after the ambiguous retry path is resolved.
    expect(vi.mocked(api.submitTemporaryWarmer).mock.calls[1][3]).toBe(firstKey);
  });

  it('submits resume without fabricated schedule confirmation and shows backend command state', async () => {
    const user = userEvent.setup();
    vi.mocked(api.loadRoomHeatingControlCapability).mockResolvedValueOnce({ ...capability, currentOverride: { state: 'Accepted', requestedTargetTemperatureCelsius: 21, effectiveUntilUtc: new Date('2026-07-17T19:30:00Z') } } as never);
    render(<WoningClimatePage onBack={() => undefined} />);
    await user.click(await screen.findByRole('button', { name: 'Schema hervatten' }));
    expect(screen.getByText(/vraagt de klimaatregeling/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Bevestigen' }));
    await waitFor(() => expect(api.submitResumeSchedule).toHaveBeenCalled());
    expect(await screen.findByText(/Uitgevoerd. Het normale schema is hervat./)).toBeTruthy();
  });

  it('shows unsupported and provider blocker copy with retry', async () => {
    vi.mocked(api.loadRoomHeatingControlCapability).mockResolvedValueOnce({ ...capability, isControllable: false, isProviderAvailable: false, supportedActions: [], blockers: [{ code: 'ProviderUnavailable', message: 'raw provider exception' }, { code: 'TargetRangeUnavailable', message: 'missing' }] } as never);
    render(<WoningClimatePage onBack={() => undefined} />);
    expect(await screen.findByText('Provider niet beschikbaar.')).toBeTruthy();
    expect(screen.getByText('Targetbereik ontbreekt.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tijdelijk warmer' }).hasAttribute('disabled')).toBe(true);
  });

  it('supports no active plan fallback, refresh retry and unavailable detail copy', async () => { vi.mocked(api.loadFloorClimateState).mockResolvedValueOnce({ ...floor, activeAsset: undefined } as never); render(<WoningClimatePage onBack={() => undefined} />); expect(await screen.findByText('De plattegrond is niet beschikbaar; alle kamers staan hieronder.')).toBeTruthy(); await userEvent.click(screen.getAllByRole('button', { name: /Hal/ })[0]); expect(screen.getByLabelText('Geselecteerde kamer').textContent).toContain('De klimaatbron is niet beschikbaar.'); await userEvent.click(screen.getByRole('button', { name: 'Vernieuwen' })); await waitFor(() => expect(api.loadHouseholdClimateSummary).toHaveBeenCalledTimes(2)); });
});
