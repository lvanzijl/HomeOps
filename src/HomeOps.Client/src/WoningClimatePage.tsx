import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RoomClimateFreshness,
  RoomClimateOperatingState,
  RoomClimateSpatialDisplayStatus,
  RoomOverlayState,
  type FloorClimateStateDto,
  type FloorClimateSummaryDto,
  type RoomClimateStateDto,
  type RoomOverlayDto,
} from './api/homeOpsApiClient';
import { createWoningClimateClient, loadFloorClimateState, loadFloorRuntimeOverlays, loadHouseholdClimateSummary } from './woningClimateApi';

const freshnessLabels: Record<RoomClimateFreshness, string> = {
  [RoomClimateFreshness.Fresh]: 'Actueel',
  [RoomClimateFreshness.Aging]: 'Wordt ouder',
  [RoomClimateFreshness.Stale]: 'Verouderd',
  [RoomClimateFreshness.Unavailable]: 'Niet beschikbaar',
};

const operatingLabels: Record<RoomClimateOperatingState, string> = {
  [RoomClimateOperatingState.Unknown]: 'Onbekend',
  [RoomClimateOperatingState.Idle]: 'In rust',
  [RoomClimateOperatingState.Heating]: 'Verwarmen',
  [RoomClimateOperatingState.Cooling]: 'Koelen',
  [RoomClimateOperatingState.Unavailable]: 'Niet beschikbaar',
};

function freshnessLabel(value?: RoomClimateFreshness) { return value === undefined ? 'Niet beschikbaar' : freshnessLabels[value]; }
function operatingLabel(value?: RoomClimateOperatingState) { return value === undefined ? 'Onbekend' : operatingLabels[value]; }
function temp(value?: number) { return value === undefined ? '—' : `${value.toFixed(1)}°C`; }
function humidity(value?: number) { return value === undefined ? undefined : `${Math.round(value)}%`; }
function time(value?: Date) { return value ? value.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : undefined; }

function spatialText(status?: RoomClimateSpatialDisplayStatus) {
  switch (status) {
    case RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable: return 'Op plattegrond';
    case RoomClimateSpatialDisplayStatus.RoomListFallback: return 'Deze kamer is nog niet op de plattegrond ingesteld.';
    case RoomClimateSpatialDisplayStatus.IntentionallyNotDrawn: return 'Niet op de plattegrond';
    case RoomClimateSpatialDisplayStatus.OverlayNeedsReview: return 'Plattegrondgrens moet opnieuw worden gecontroleerd.';
    case RoomClimateSpatialDisplayStatus.NoActiveFloorPlan: return 'De plattegrond is niet beschikbaar; alle kamers staan hieronder.';
    default: return 'Kamerlijstfallback';
  }
}

function roomIssue(room: RoomClimateStateDto) {
  if (!room.configuration?.isConfigured) return 'Deze kamer is nog niet gekoppeld aan een klimaatbron.';
  if (room.configuration?.isClimateEnabled === false) return 'Klimaatmeting staat uit voor deze kamer.';
  if (room.isProviderAvailable === false) return 'De klimaatbron is niet beschikbaar.';
  if (!room.currentObservation) return 'Nog geen klimaatmeting beschikbaar.';
  return room.issues?.[0];
}

export function WoningSummaryPage({ onOpenClimate }: { onOpenClimate: () => void }) {
  const [summary, setSummary] = useState<FloorClimateSummaryDto[]>([]);
  const [status, setStatus] = useState('Klimaatoverzicht laden…');
  useEffect(() => { let ignore = false; loadHouseholdClimateSummary().then((s) => { if (!ignore) { setSummary(s.floors ?? []); setStatus('Klimaatoverzicht geladen.'); } }).catch(() => { if (!ignore) setStatus('Klimaatoverzicht niet beschikbaar.'); }); return () => { ignore = true; }; }, []);
  const unavailable = summary.reduce((total, floor) => total + (floor.counts?.unavailableRooms ?? 0), 0);
  const stale = summary.reduce((total, floor) => total + (floor.counts?.staleRooms ?? 0), 0);
  const mostUnavailable = [...summary].sort((a, b) => (b.counts?.unavailableRooms ?? 0) - (a.counts?.unavailableRooms ?? 0))[0];
  return <article className="woning-story-page" aria-label="Huisstatus">
    <p className="widget-type">Woning</p><h3>Huisstatus</h3><p>Story-first overzicht voor wonen. Klimaatdetails blijven in een rustige verdiepingsweergave.</p>
    <section className="woning-climate-entry"><h4>Klimaat in huis</h4><p role="status">{status}</p><div className="climate-summary-pills"><span>{unavailable} niet beschikbaar</span><span>{stale} verouderd</span><span>Meeste uitval: {mostUnavailable?.floorName ?? 'geen verdieping'}</span></div><button type="button" onClick={onOpenClimate}>Klimaat bekijken</button></section>
  </article>;
}

export function WoningClimatePage({ onBack }: { onBack: () => void }) {
  const client = useMemo(() => createWoningClimateClient(), []);
  const [floors, setFloors] = useState<FloorClimateSummaryDto[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>();
  const [floorState, setFloorState] = useState<FloorClimateStateDto>();
  const [overlays, setOverlays] = useState<RoomOverlayDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<Date>();

  const load = useCallback(async (preferredFloorId?: string) => {
    setLoading(true); setError('');
    try {
      const summary = await loadHouseholdClimateSummary(client);
      const ordered = summary.floors ?? [];
      setFloors(ordered);
      const floorId = preferredFloorId && ordered.some((f) => f.floorId === preferredFloorId) ? preferredFloorId : ordered[0]?.floorId;
      setSelectedFloorId(floorId);
      if (floorId) {
        const state = await loadFloorClimateState(floorId, client);
        setFloorState(state);
        setOverlays(await loadFloorRuntimeOverlays(floorId, client));
        setSelectedRoomId((current) => current && state.rooms?.some((r) => r.roomId === current) ? current : state.rooms?.[0]?.roomId);
      }
      setRefreshedAt(new Date());
    } catch { setError('Klimaatgegevens konden niet worden geladen.'); }
    finally { setLoading(false); }
  }, [client]);
  useEffect(() => { void load(selectedFloorId); }, []);
  async function selectFloor(floorId: string) { setSelectedFloorId(floorId); setSelectedRoomId(undefined); await load(floorId); }

  const rooms = floorState?.rooms ?? [];
  const trustedOverlays = overlays.filter((o) => o.state === RoomOverlayState.Trusted && o.floorPlanAssetId === floorState?.activeAsset?.id && rooms.some((r) => r.trustedOverlayId === o.id && r.spatialDisplayStatus === RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable));
  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? rooms[0];
  const filteredRooms = rooms.filter((r) => filter === 'all' || (filter === 'fresh' && r.freshness === RoomClimateFreshness.Fresh) || (filter === 'unavailable' && r.freshness === RoomClimateFreshness.Unavailable) || (filter === 'attention' && (r.freshness !== RoomClimateFreshness.Fresh || (r.issues?.length ?? 0) > 0 || r.isProviderAvailable === false)));

  return <article className="climate-workspace" aria-label="Klimaat in huis">
    <header className="climate-header"><button type="button" onClick={onBack}>Terug naar Woning</button><div><p className="widget-type">Klimaat in huis</p><h3>Klimaat per verdieping en kamer</h3></div><button type="button" onClick={() => load(selectedFloorId)}>Vernieuwen</button></header>
    {loading ? <p role="status">Klimaatgegevens laden…</p> : null}{error ? <p role="alert">{error} <button type="button" onClick={() => load(selectedFloorId)}>Opnieuw proberen</button></p> : null}
    <section className="floor-tabs" aria-label="Verdiepingen">{floors.map((f) => <button key={f.floorId} aria-pressed={f.floorId === selectedFloorId} onClick={() => f.floorId && selectFloor(f.floorId)}>{f.floorName}<small>{freshnessLabel(f.overallAvailability)}</small></button>)}</section>
    <section className="climate-floor-summary" aria-label="Samenvatting verdieping"><strong>{floorState?.floorName ?? 'Geen verdieping'}</strong><span>Actueel {floorState?.counts?.freshRooms ?? 0}</span><span>Wordt ouder {floorState?.counts?.agingRooms ?? 0}</span><span>Verouderd {floorState?.counts?.staleRooms ?? 0}</span><span>Niet beschikbaar {floorState?.counts?.unavailableRooms ?? 0}</span><span>Op plan {floorState?.counts?.trustedOverlayRooms ?? 0}</span><span>Fallback {floorState?.counts?.fallbackRooms ?? 0}</span><span>{floorState?.activeAsset?.derivativeUrl ? 'Actieve plattegrond beschikbaar' : 'Geen actieve plattegrond'}</span><span>{floorState?.observedSummaryUtc ? `Laatste meting ${time(floorState.observedSummaryUtc)}` : 'Geen recente meting beschikbaar'}</span>{refreshedAt ? <span role="status">Bijgewerkt om {time(refreshedAt)}</span> : null}</section>
    <main className="climate-grid">
      <section className="climate-plan-panel" aria-label="Plattegrond klimaat"><div className="climate-legend"><span>Actueel</span><span>Wordt ouder</span><span>Verouderd</span><span>Niet beschikbaar</span></div>{floorState?.activeAsset?.derivativeUrl ? <div className="climate-plan"><img alt={`Plattegrond ${floorState.floorName ?? ''}`} src={floorState.activeAsset.derivativeUrl} />{trustedOverlays.map((o) => <Overlay key={o.id} overlay={o} room={rooms.find((r) => r.roomId === o.roomId)} selected={o.roomId === selectedRoom?.roomId} onSelect={() => setSelectedRoomId(o.roomId)} />)}</div> : <p className="empty-state">De plattegrond is niet beschikbaar; alle kamers staan hieronder.</p>}</section>
      <section className="climate-room-list" aria-label="Kamerlijst"><div className="room-filters">{[['all','Alle kamers'],['fresh','Actueel'],['attention','Aandacht nodig'],['unavailable','Niet beschikbaar']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>{filteredRooms.map((r) => <button type="button" className="room-row" aria-pressed={r.roomId === selectedRoom?.roomId} key={r.roomId} onClick={() => setSelectedRoomId(r.roomId)}><strong>{r.roomName}</strong><span>{temp(r.currentObservation?.temperatureCelsius)} {humidity(r.currentObservation?.relativeHumidity) ?? ''}</span><span>Doel {temp(r.currentObservation?.targetTemperatureCelsius)}</span><span>{operatingLabel(r.operatingState)} · {freshnessLabel(r.freshness)}</span><small>{roomIssue(r) ?? spatialText(r.spatialDisplayStatus)}</small></button>)}</section>
      <RoomDetail room={selectedRoom} />
    </main>
  </article>;
}

function Overlay({ overlay, room, selected, onSelect }: { overlay: RoomOverlayDto; room?: RoomClimateStateDto; selected: boolean; onSelect: () => void }) {
  const points = overlay.polygon?.map((p) => `${(p.x ?? 0) * 100},${(p.y ?? 0) * 100}`).join(' ') ?? '';
  const anchor = overlay.labelAnchor ?? overlay.polygon?.[0];
  return <button type="button" className={`climate-overlay ${selected ? 'selected' : ''}`} style={{ clipPath: `polygon(${points.split(' ').map((p)=>{const [x,y]=p.split(','); return `${x}% ${y}%`;}).join(',')})` }} onClick={onSelect} aria-label={`${room?.roomName ?? 'Kamer'} ${temp(room?.currentObservation?.temperatureCelsius)} ${operatingLabel(room?.operatingState)} ${freshnessLabel(room?.freshness)}`}><span style={{ left: `${((anchor?.x ?? 0.5) * 100)}%`, top: `${((anchor?.y ?? 0.5) * 100)}%` }}>{room?.roomName}<br />{temp(room?.currentObservation?.temperatureCelsius)} · {operatingLabel(room?.operatingState)}<br />{freshnessLabel(room?.freshness)}</span></button>;
}

function RoomDetail({ room }: { room?: RoomClimateStateDto }) {
  if (!room) return <aside className="room-detail"><h4>Kamer</h4><p>Selecteer een kamer.</p></aside>;
  return <aside className="room-detail" aria-label="Geselecteerde kamer"><h4>{room.roomName}</h4><dl><dt>Kamertype</dt><dd>{room.roomType ?? 'Onbekend'}</dd><dt>Temperatuur</dt><dd>{temp(room.currentObservation?.temperatureCelsius)}</dd>{room.currentObservation?.targetTemperatureCelsius !== undefined ? <><dt>Doeltemperatuur</dt><dd>{temp(room.currentObservation.targetTemperatureCelsius)}</dd></> : null}{room.currentObservation?.relativeHumidity !== undefined ? <><dt>Luchtvochtigheid</dt><dd>{humidity(room.currentObservation.relativeHumidity)}</dd></> : null}<dt>Status</dt><dd>{operatingLabel(room.operatingState)}</dd><dt>Actualiteit</dt><dd>{freshnessLabel(room.freshness)}</dd>{room.observedUtc ? <><dt>Meting</dt><dd>Bijgewerkt om {time(room.observedUtc)}</dd></> : null}<dt>Klimaatbron</dt><dd>{room.isProviderAvailable === false ? 'Niet beschikbaar' : 'Beschikbaar'}</dd><dt>Plattegrond</dt><dd>{spatialText(room.spatialDisplayStatus)}</dd>{roomIssue(room) ? <><dt>Aandacht</dt><dd>{roomIssue(room)}</dd></> : null}</dl></aside>;
}
