import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  RoomClimateFreshness,
  RoomClimateOperatingState,
  RoomClimateSpatialDisplayStatus,
  RoomHeatingCommandAction,
  RoomHeatingCommandStatus,
  RoomOverlayState,
  type FloorClimateStateDto,
  type FloorClimateSummaryDto,
  type RoomClimateStateDto,
  type RoomHeatingCommandDto,
  type RoomHeatingCommandResponse,
  type RoomHeatingControlCapabilityDto,
  type RoomOverlayDto,
} from './api/homeOpsApiClient';
import { createWoningClimateClient, loadFloorClimateState, loadFloorRuntimeOverlays, loadHouseholdClimateSummary, loadRoomHeatingControlCapability, submitResumeSchedule, submitTemporaryCooler, submitTemporaryWarmer } from './woningClimateApi';

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


const commandStatusLabels: Record<RoomHeatingCommandStatus, string> = {
  [RoomHeatingCommandStatus.Pending]: 'Wordt verzonden',
  [RoomHeatingCommandStatus.Accepted]: 'Geaccepteerd',
  [RoomHeatingCommandStatus.Succeeded]: 'Uitgevoerd',
  [RoomHeatingCommandStatus.Failed]: 'Niet gelukt',
  [RoomHeatingCommandStatus.Superseded]: 'Vervangen',
  [RoomHeatingCommandStatus.Expired]: 'Verlopen',
};

const actionLabels: Record<RoomHeatingCommandAction, string> = {
  [RoomHeatingCommandAction.TemporaryWarmer]: 'Tijdelijk warmer',
  [RoomHeatingCommandAction.ResumeSchedule]: 'Schema hervatten',
  [RoomHeatingCommandAction.TemporaryCooler]: 'Tijdelijk koeler',
};

function commandStatusLabel(value?: RoomHeatingCommandStatus) { return value === undefined ? 'Onbekend' : commandStatusLabels[value]; }
function endTime(minutes: number) { const d = new Date(Date.now() + minutes * 60000); return time(d) ?? 'straks'; }
function isTerminal(status?: RoomHeatingCommandStatus) { return status === RoomHeatingCommandStatus.Succeeded || status === RoomHeatingCommandStatus.Failed || status === RoomHeatingCommandStatus.Superseded || status === RoomHeatingCommandStatus.Expired; }
function commandMessage(command?: RoomHeatingCommandDto) {
  switch (command?.status) {
    case RoomHeatingCommandStatus.Pending: return 'Opdracht verzenden…';
    case RoomHeatingCommandStatus.Accepted: return command.action === RoomHeatingCommandAction.ResumeSchedule ? 'Het normale schema wordt hervat.' : 'De klimaatregeling heeft de opdracht geaccepteerd.';
    case RoomHeatingCommandStatus.Succeeded: return command.action === RoomHeatingCommandAction.ResumeSchedule || command.scheduleResumed ? 'Het normale schema is hervat.' : 'De tijdelijke temperatuur is bevestigd.';
    case RoomHeatingCommandStatus.Failed: return 'De opdracht is niet uitgevoerd.';
    case RoomHeatingCommandStatus.Superseded: return 'Deze opdracht is vervangen door een nieuwere keuze.';
    case RoomHeatingCommandStatus.Expired: return 'De tijdelijke instelling is verlopen.';
    default: return '';
  }
}
function safeBlocker(code?: string, message?: string) {
  switch (code) {
    case 'ClimateDisabled': return 'Klimaatregeling staat uit voor deze kamer.';
    case 'MissingControlMapping': return 'Geen geldige verwarmingskoppeling.';
    case 'InvalidControlMapping': return 'De verwarmingskoppeling moet opnieuw worden gecontroleerd.';
    case 'ProviderInactive': return 'Provider niet beschikbaar.';
    case 'ProviderUnavailable': return 'Provider niet beschikbaar.';
    case 'CurrentObservationUnavailable': return 'Geen actuele meting beschikbaar.';
    case 'RoomInactive': return 'Kamer is niet bestuurbaar.';
    case 'TargetRangeUnavailable': return 'Targetbereik ontbreekt.';
    case 'PolicyNotBoundedControl': return 'Kamer is niet bestuurbaar.';
    default: return message && message.length < 80 && !message.includes('Exception') ? message : 'Verwarming kan nu niet veilig worden bediend.';
  }
}
function newKey() { return globalThis.crypto?.randomUUID?.() ?? `heating-${Date.now()}-${Math.random().toString(36).slice(2)}`; }


export type ClimateStoryContextCode = 'room-climate-unavailable' | 'room-observation-stale' | 'provider-unavailable' | 'room-heating' | 'temporary-override-active' | 'temporary-override-failed' | 'floor-plan-fallback-required' | 'room-overlay-review-required' | 'invalid-climate-context' | 'configuration-review';

export type ClimateStoryDeepLink = {
  storyId?: string;
  title: string;
  explanation?: string;
  createdAt?: Date;
  floorId?: string;
  roomId?: string;
  contextCode?: ClimateStoryContextCode;
};

const storyContextLabels: Record<ClimateStoryContextCode, { title: string; explanation: string; settings?: boolean }> = {
  'room-climate-unavailable': { title: 'Geen recente meting', explanation: 'Deze kamer had geen recente klimaatmeting toen dit aandachtspunt werd gemaakt.' },
  'room-observation-stale': { title: 'Geen recente meting', explanation: 'De laatste klimaatmeting was verouderd toen dit aandachtspunt werd gemaakt.' },
  'provider-unavailable': { title: 'Klimaatbron niet beschikbaar', explanation: 'De klimaatbron was niet bereikbaar toen dit aandachtspunt werd gemaakt.', settings: true },
  'room-heating': { title: 'Tijdelijke temperatuur actief', explanation: 'Deze kamer was bezig met verwarmen of koelen toen dit aandachtspunt werd gemaakt.' },
  'temporary-override-active': { title: 'Tijdelijke temperatuur actief', explanation: 'Er was een tijdelijke temperatuur actief toen dit aandachtspunt werd gemaakt.' },
  'temporary-override-failed': { title: 'Verwarmingsopdracht niet gelukt', explanation: 'Een verwarmingsopdracht was niet gelukt toen dit aandachtspunt werd gemaakt.', settings: true },
  'floor-plan-fallback-required': { title: 'Niet op de plattegrond', explanation: 'De plattegrond was niet bruikbaar; de kamer wordt in de kamerlijst getoond.' },
  'room-overlay-review-required': { title: 'Plattegrondgrens controleren', explanation: 'De plattegrondgrens moest opnieuw worden gecontroleerd.' },
  'invalid-climate-context': { title: 'Koppeling controleren', explanation: 'Dit aandachtspunt verwijst naar klimaatcontext die niet volledig meer bestaat.' },
  'configuration-review': { title: 'Koppeling controleren', explanation: 'De klimaatkoppeling moet gecontroleerd worden.', settings: true },
};

function storyLabel(code?: ClimateStoryContextCode) { return code ? storyContextLabels[code] : undefined; }
function storyTime(value?: Date) { return value ? value.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : undefined; }

function roomIssue(room: RoomClimateStateDto) {
  if (!room.configuration?.isConfigured) return 'Deze kamer is nog niet gekoppeld aan een klimaatbron.';
  if (room.configuration?.isClimateEnabled === false) return 'Klimaatmeting staat uit voor deze kamer.';
  if (room.isProviderAvailable === false) return 'De klimaatbron is niet beschikbaar.';
  if (!room.currentObservation) return 'Nog geen klimaatmeting beschikbaar.';
  return room.issues?.[0];
}

export function WoningSummaryPage({ onOpenClimate }: { onOpenClimate: (context?: ClimateStoryDeepLink) => void }) {
  const [summary, setSummary] = useState<FloorClimateSummaryDto[]>([]);
  const [status, setStatus] = useState('Klimaatoverzicht laden…');
  useEffect(() => { let ignore = false; loadHouseholdClimateSummary().then((s) => { if (!ignore) { setSummary(s.floors ?? []); setStatus('Klimaatoverzicht geladen.'); } }).catch(() => { if (!ignore) setStatus('Klimaatoverzicht niet beschikbaar.'); }); return () => { ignore = true; }; }, []);
  const unavailable = summary.reduce((total, floor) => total + (floor.counts?.unavailableRooms ?? 0), 0);
  const stale = summary.reduce((total, floor) => total + (floor.counts?.staleRooms ?? 0), 0);
  const mostUnavailable = [...summary].sort((a, b) => (b.counts?.unavailableRooms ?? 0) - (a.counts?.unavailableRooms ?? 0))[0];
  return <article className="woning-story-page" aria-label="Huisstatus">
    <p className="widget-type">Woning</p><h3>Huisstatus</h3><p>Story-first overzicht voor wonen. Klimaatdetails blijven in een rustige verdiepingsweergave.</p>
    <section className="woning-climate-entry"><h4>Klimaat in huis</h4><p role="status">{status}</p><div className="climate-summary-pills"><span>{unavailable} niet beschikbaar</span><span>{stale} verouderd</span><span>Meeste uitval: {mostUnavailable?.floorName ?? 'geen verdieping'}</span></div><button type="button" onClick={() => onOpenClimate(unavailable > 0 || stale > 0 ? { title: 'Klimaat in huis vraagt aandacht', floorId: mostUnavailable?.floorId, contextCode: unavailable > 0 ? 'provider-unavailable' : 'room-observation-stale', explanation: unavailable > 0 ? 'Een klimaatbron was niet beschikbaar toen dit aandachtspunt werd gemaakt.' : 'Bekijk hieronder de huidige status.' } : undefined)}>Klimaat bekijken</button></section>
  </article>;
}

export function WoningClimatePage({ onBack, initialStoryContext, onOpenClimateSettings }: { onBack: () => void; initialStoryContext?: ClimateStoryDeepLink; onOpenClimateSettings?: (roomId?: string) => void }) {
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
  const [capability, setCapability] = useState<RoomHeatingControlCapabilityDto>();
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [capabilityError, setCapabilityError] = useState('');
  const [storyContext, setStoryContext] = useState<ClimateStoryDeepLink | undefined>(initialStoryContext);
  const [storyCollapsed, setStoryCollapsed] = useState(false);
  const [storyNotice, setStoryNotice] = useState('');
  const storyHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const storyDismissRef = useRef<HTMLButtonElement | null>(null);

  const load = useCallback(async (preferredFloorId?: string, preferredRoomId?: string) => {
    setLoading(true); setError('');
    try {
      const summary = await loadHouseholdClimateSummary(client);
      const ordered = summary.floors ?? [];
      setFloors(ordered);
      let floorId = preferredFloorId && ordered.some((f) => f.floorId === preferredFloorId) ? preferredFloorId : ordered[0]?.floorId;
      setSelectedFloorId(floorId);
      if (floorId) {
        let state = await loadFloorClimateState(floorId, client);
        const targetRoom = preferredRoomId ? state.rooms?.find((r) => r.roomId === preferredRoomId) : undefined;
        if (preferredRoomId && !targetRoom) {
          for (const candidate of ordered.filter((f) => f.floorId && f.floorId !== floorId)) {
            const candidateState = await loadFloorClimateState(candidate.floorId ?? '', client);
            if (candidateState.rooms?.some((r) => r.roomId === preferredRoomId)) { floorId = candidate.floorId; state = candidateState; setStoryNotice('Deze kamer is gewijzigd sinds dit aandachtspunt werd gemaakt. De huidige gegevens worden getoond.'); break; }
          }
        }
        setSelectedFloorId(floorId);
        setFloorState(state);
        setOverlays(await loadFloorRuntimeOverlays(floorId!, client));
        setSelectedRoomId((current) => preferredRoomId && state.rooms?.some((r) => r.roomId === preferredRoomId) ? preferredRoomId : current && state.rooms?.some((r) => r.roomId === current) ? current : state.rooms?.[0]?.roomId);
        if (preferredRoomId && !state.rooms?.some((r) => r.roomId === preferredRoomId)) setStoryNotice('Deze kamer is gewijzigd sinds dit aandachtspunt werd gemaakt. De huidige gegevens worden getoond.');
      }
      setRefreshedAt(new Date());
    } catch { setError('Klimaatgegevens konden niet worden geladen.'); }
    finally { setLoading(false); }
  }, [client]);
  useEffect(() => { void load(initialStoryContext?.floorId, initialStoryContext?.roomId).then(() => { if (initialStoryContext) storyHeadingRef.current?.focus(); }); }, []);
  async function selectFloor(floorId: string) { setSelectedFloorId(floorId); setSelectedRoomId(undefined); setStoryCollapsed(true); await load(floorId); }

  const rooms = floorState?.rooms ?? [];
  const trustedOverlays = overlays.filter((o) => o.state === RoomOverlayState.Trusted && o.floorPlanAssetId === floorState?.activeAsset?.id && rooms.some((r) => r.trustedOverlayId === o.id && r.spatialDisplayStatus === RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable));
  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? rooms[0];
  const refreshSelectedCapability = useCallback(async () => { if (!selectedRoomId) return; setCapabilityLoading(true); setCapabilityError(''); try { setCapability(await loadRoomHeatingControlCapability(selectedRoomId, client)); } catch { setCapabilityError('Verwarmingsbediening kon niet worden geladen.'); } finally { setCapabilityLoading(false); } }, [client, selectedRoomId]);
  useEffect(() => { setCapability(undefined); void refreshSelectedCapability(); }, [refreshSelectedCapability]);
  const filteredRooms = rooms.filter((r) => filter === 'all' || (filter === 'fresh' && r.freshness === RoomClimateFreshness.Fresh) || (filter === 'unavailable' && r.freshness === RoomClimateFreshness.Unavailable) || (filter === 'attention' && (r.freshness !== RoomClimateFreshness.Fresh || (r.issues?.length ?? 0) > 0 || r.isProviderAvailable === false)));

  return <article className="climate-workspace" aria-label="Klimaat in huis">
    <header className="climate-header"><button type="button" onClick={onBack}>Terug naar Woning</button><div><p className="widget-type">Klimaat in huis</p><h3>Klimaat per verdieping en kamer</h3></div><button type="button" onClick={async () => { await load(selectedFloorId); await refreshSelectedCapability(); }}>Vernieuwen</button></header>
    {loading ? <p role="status">Klimaatgegevens laden…</p> : null}{error ? <p role="alert">{error} <button type="button" onClick={() => load(selectedFloorId)}>Opnieuw proberen</button></p> : null}
    <section className="floor-tabs" aria-label="Verdiepingen">{floors.map((f) => <button key={f.floorId} aria-pressed={f.floorId === selectedFloorId} onClick={() => f.floorId && selectFloor(f.floorId)}>{f.floorName}<small>{freshnessLabel(f.overallAvailability)}</small></button>)}</section>
    <section className="climate-floor-summary" aria-label="Samenvatting verdieping"><strong>{floorState?.floorName ?? 'Geen verdieping'}</strong><span>Actueel {floorState?.counts?.freshRooms ?? 0}</span><span>Wordt ouder {floorState?.counts?.agingRooms ?? 0}</span><span>Verouderd {floorState?.counts?.staleRooms ?? 0}</span><span>Niet beschikbaar {floorState?.counts?.unavailableRooms ?? 0}</span><span>Op plan {floorState?.counts?.trustedOverlayRooms ?? 0}</span><span>Fallback {floorState?.counts?.fallbackRooms ?? 0}</span><span>{floorState?.activeAsset?.derivativeUrl ? 'Actieve plattegrond beschikbaar' : 'Geen actieve plattegrond'}</span><span>{floorState?.observedSummaryUtc ? `Laatste meting ${time(floorState.observedSummaryUtc)}` : 'Geen recente meting beschikbaar'}</span>{refreshedAt ? <span role="status">Bijgewerkt om {time(refreshedAt)}</span> : null}</section>
    <main className="climate-grid">
      <section className="climate-plan-panel" aria-label="Plattegrond klimaat"><div className="climate-legend"><span>Actueel</span><span>Wordt ouder</span><span>Verouderd</span><span>Niet beschikbaar</span></div>{floorState?.activeAsset?.derivativeUrl ? <div className="climate-plan"><img alt={`Plattegrond ${floorState.floorName ?? ''}`} src={floorState.activeAsset.derivativeUrl} />{trustedOverlays.map((o) => <Overlay key={o.id} overlay={o} room={rooms.find((r) => r.roomId === o.roomId)} selected={o.roomId === selectedRoom?.roomId} onSelect={() => { setSelectedRoomId(o.roomId); setStoryCollapsed(true); }} />)}</div> : <p className="empty-state">De plattegrond is niet beschikbaar; alle kamers staan hieronder.</p>}</section>
      <section className="climate-room-list" aria-label="Kamerlijst"><div className="room-filters">{[['all','Alle kamers'],['fresh','Actueel'],['attention','Aandacht nodig'],['unavailable','Niet beschikbaar']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>{filteredRooms.map((r) => <button type="button" className="room-row" aria-pressed={r.roomId === selectedRoom?.roomId} key={r.roomId} onClick={() => { setSelectedRoomId(r.roomId); setStoryCollapsed(true); }}><strong>{r.roomName}</strong><span>{temp(r.currentObservation?.temperatureCelsius)} {humidity(r.currentObservation?.relativeHumidity) ?? ''}</span><span>Doel {temp(r.currentObservation?.targetTemperatureCelsius)}</span><span>{operatingLabel(r.operatingState)} · {freshnessLabel(r.freshness)}</span><small>{roomIssue(r) ?? spatialText(r.spatialDisplayStatus)}</small></button>)}</section>
      {storyContext ? <StoryContextPanel context={storyContext} selectedRoom={selectedRoom} notice={storyNotice} collapsed={storyCollapsed} headingRef={storyHeadingRef} dismissRef={storyDismissRef} onToggle={() => setStoryCollapsed((v) => !v)} onDismiss={() => { setStoryContext(undefined); }} onOpenSettings={onOpenClimateSettings} /> : null}
      <RoomDetail room={selectedRoom} rooms={rooms} capability={capability} loading={capabilityLoading} error={capabilityError} onRetry={refreshSelectedCapability} onAfterCommand={async () => { await refreshSelectedCapability(); await load(selectedFloorId); }} client={client} />
    </main>
  </article>;
}

function Overlay({ overlay, room, selected, onSelect }: { overlay: RoomOverlayDto; room?: RoomClimateStateDto; selected: boolean; onSelect: () => void }) {
  const points = overlay.polygon?.map((p) => `${(p.x ?? 0) * 100},${(p.y ?? 0) * 100}`).join(' ') ?? '';
  const anchor = overlay.labelAnchor ?? overlay.polygon?.[0];
  return <button type="button" className={`climate-overlay ${selected ? 'selected' : ''}`} style={{ clipPath: `polygon(${points.split(' ').map((p)=>{const [x,y]=p.split(','); return `${x}% ${y}%`;}).join(',')})` }} onClick={onSelect} aria-label={`${room?.roomName ?? 'Kamer'} ${temp(room?.currentObservation?.temperatureCelsius)} ${operatingLabel(room?.operatingState)} ${freshnessLabel(room?.freshness)}`}><span style={{ left: `${((anchor?.x ?? 0.5) * 100)}%`, top: `${((anchor?.y ?? 0.5) * 100)}%` }}>{room?.roomName}<br />{temp(room?.currentObservation?.temperatureCelsius)} · {operatingLabel(room?.operatingState)}<br />{freshnessLabel(room?.freshness)}</span></button>;
}


function StoryContextPanel({ context, selectedRoom, notice, collapsed, headingRef, dismissRef, onToggle, onDismiss, onOpenSettings }: { context: ClimateStoryDeepLink; selectedRoom?: RoomClimateStateDto; notice: string; collapsed: boolean; headingRef: RefObject<HTMLHeadingElement | null>; dismissRef: RefObject<HTMLButtonElement | null>; onToggle: () => void; onDismiss: () => void; onOpenSettings?: (roomId?: string) => void }) {
  const mapped = storyLabel(context.contextCode);
  const issueStillPresent = selectedRoom ? (context.contextCode === 'provider-unavailable' && selectedRoom.isProviderAvailable === false) || ((context.contextCode === 'room-climate-unavailable' || context.contextCode === 'room-observation-stale') && selectedRoom.freshness !== RoomClimateFreshness.Fresh) || (context.contextCode === 'room-overlay-review-required' && selectedRoom.spatialDisplayStatus === RoomClimateSpatialDisplayStatus.OverlayNeedsReview) || (context.contextCode === 'floor-plan-fallback-required' && selectedRoom.spatialDisplayStatus !== RoomClimateSpatialDisplayStatus.TrustedOverlayAvailable) : false;
  const status = selectedRoom ? `${selectedRoom.roomName}: ${temp(selectedRoom.currentObservation?.temperatureCelsius)} · ${operatingLabel(selectedRoom.operatingState)} · ${freshnessLabel(selectedRoom.freshness)}` : 'Geen gekoppelde kamer gevonden. De huidige klimaatgegevens blijven beschikbaar.';
  return <aside className="climate-story-context" aria-labelledby="climate-story-context-title">
    <header><div><p className="widget-type">Aandachtspunt</p><h4 id="climate-story-context-title" ref={headingRef} tabIndex={-1}>{mapped?.title ?? context.title}</h4></div><div className="woning-actions"><button type="button" onClick={onToggle}>{collapsed ? 'Context tonen' : 'Context inklappen'}</button><button ref={dismissRef} type="button" onClick={onDismiss}>Sluiten</button></div></header>
    {!collapsed ? <div className="climate-story-context__body"><p><strong>{context.title}</strong></p><p>{context.explanation ?? mapped?.explanation ?? 'Bekijk hieronder de huidige status.'}</p>{context.createdAt ? <p>Gemaakt op {storyTime(context.createdAt)}.</p> : null}{notice ? <p role="alert">{notice}</p> : null}<p role="status">Huidige status: {status}</p>{selectedRoom && !issueStillPresent ? <p role="status">Dit aandachtspunt lijkt inmiddels opgelost.</p> : null}<p>Bekijk hieronder de huidige status.</p>{mapped?.settings && onOpenSettings ? <button type="button" onClick={() => onOpenSettings(selectedRoom?.roomId ?? context.roomId)}>Klimaatinstellingen openen</button> : null}</div> : null}
  </aside>;
}

function RoomDetail({ room, rooms, capability, loading, error, onRetry, onAfterCommand, client }: { room?: RoomClimateStateDto; rooms: RoomClimateStateDto[]; capability?: RoomHeatingControlCapabilityDto; loading: boolean; error: string; onRetry: () => Promise<void>; onAfterCommand: (response: RoomHeatingCommandResponse) => Promise<void>; client: ReturnType<typeof createWoningClimateClient> }) {
  if (!room) return <aside className="room-detail"><h4>Kamer</h4><p>Selecteer een kamer.</p></aside>;
  return <aside className="room-detail" aria-label="Geselecteerde kamer"><h4>{room.roomName}</h4><section className="room-facts"><dl><dt>Kamertype</dt><dd>{room.roomType ?? 'Onbekend'}</dd><dt>Temperatuur</dt><dd>{temp(room.currentObservation?.temperatureCelsius)}</dd>{room.currentObservation?.targetTemperatureCelsius !== undefined ? <><dt>Geobserveerd doel</dt><dd>{temp(room.currentObservation.targetTemperatureCelsius)}</dd></> : null}{room.currentObservation?.relativeHumidity !== undefined ? <><dt>Luchtvochtigheid</dt><dd>{humidity(room.currentObservation.relativeHumidity)}</dd></> : null}<dt>Status</dt><dd>{operatingLabel(room.operatingState)}</dd><dt>Actualiteit</dt><dd>{freshnessLabel(room.freshness)}</dd>{room.observedUtc ? <><dt>Meting</dt><dd>Bijgewerkt om {time(room.observedUtc)}</dd></> : null}<dt>Klimaatbron</dt><dd>{room.isProviderAvailable === false ? 'Niet beschikbaar' : 'Beschikbaar'}</dd><dt>Plattegrond</dt><dd>{spatialText(room.spatialDisplayStatus)}</dd>{roomIssue(room) ? <><dt>Aandacht</dt><dd>{roomIssue(room)}</dd></> : null}</dl></section><HeatingControls room={room} rooms={rooms} capability={capability} loading={loading} error={error} onRetry={onRetry} onAfterCommand={onAfterCommand} client={client} /></aside>;
}

function HeatingControls({ room, rooms, capability, loading, error, onRetry, onAfterCommand, client }: { room: RoomClimateStateDto; rooms: RoomClimateStateDto[]; capability?: RoomHeatingControlCapabilityDto; loading: boolean; error: string; onRetry: () => Promise<void>; onAfterCommand: (response: RoomHeatingCommandResponse) => Promise<void>; client: ReturnType<typeof createWoningClimateClient> }) {
  const [dialogAction, setDialogAction] = useState<RoomHeatingCommandAction>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastCommand, setLastCommand] = useState<RoomHeatingCommandDto>();
  const [retryPayload, setRetryPayload] = useState<{ action: RoomHeatingCommandAction; target?: number; duration?: number; key: string }>();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const actions = capability?.supportedActions ?? [];
  const hasWarmer = capability?.isControllable && actions.includes(RoomHeatingCommandAction.TemporaryWarmer);
  const hasCooler = capability?.isControllable && actions.includes(RoomHeatingCommandAction.TemporaryCooler);
  const hasResume = capability?.isControllable && (actions.includes(RoomHeatingCommandAction.ResumeSchedule) || !!capability.currentOverride);
  const pendingSame = submitting || (!!lastCommand && !isTerminal(lastCommand.status));
  const affectedNames = (capability?.affectedRoomIds ?? []).map((id) => rooms.find((r) => r.roomId === id)?.roomName).filter((n): n is string => !!n && n !== room.roomName);
  const submit = async (payload: { action: RoomHeatingCommandAction; target?: number; duration?: number; key?: string }) => {
    const key = payload.key ?? newKey();
    setSubmitting(true); setSubmitError(''); setRetryPayload({ action: payload.action, target: payload.target, duration: payload.duration, key });
    try {
      const response = payload.action === RoomHeatingCommandAction.TemporaryWarmer ? await submitTemporaryWarmer(room.roomId ?? '', payload.target ?? 0, payload.duration ?? 0, key, client) : payload.action === RoomHeatingCommandAction.TemporaryCooler ? await submitTemporaryCooler(room.roomId ?? '', payload.target ?? 0, payload.duration ?? 0, key, client) : await submitResumeSchedule(room.roomId ?? '', key, client);
      if (response.command) setLastCommand(response.command);
      setRetryPayload(undefined); setDialogAction(undefined); await onAfterCommand(response);
    } catch { setSubmitError('We weten niet zeker of de opdracht is aangekomen. Probeer opnieuw of vernieuw de status.'); }
    finally { setSubmitting(false); }
  };
  useEffect(() => { if (dialogAction !== undefined) setTimeout(() => closeRef.current?.focus(), 0); }, [dialogAction]);
  return <section className="heating-controls" aria-label="Verwarming"><h5>Verwarming</h5>{loading ? <p role="status">Verwarmingsmogelijkheden laden…</p> : null}{error ? <p role="alert">{error} <button type="button" onClick={onRetry}>Opnieuw proberen</button></p> : null}{capability ? <><dl><dt>Bedienbaar</dt><dd>{capability.isControllable ? 'Ja' : 'Nee'}</dd><dt>Provider</dt><dd>{capability.isProviderAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}</dd>{capability.targetRange ? <><dt>Doelbereik</dt><dd>{temp(capability.targetRange.minimum)} tot {temp(capability.targetRange.maximum)}</dd></> : null}<dt>Duren</dt><dd>{(capability.allowedDurationsMinutes ?? []).map((m) => `${m} min`).join(', ') || 'Niet beschikbaar'}</dd><dt>Acties</dt><dd>{actions.map((a) => actionLabels[a]).join(', ') || 'Geen veilige actie'}</dd></dl>{capability.blockers?.length ? <ul className="heating-blockers">{capability.blockers.map((b) => <li key={`${b.code}-${b.message}`}>{safeBlocker(b.code, b.message)}</li>)}</ul> : null}<OverrideSummary capability={capability} />{capability.latestCommand ? <p className="command-state">Laatste opdracht: {commandStatusLabel(capability.latestCommand.status)}.</p> : null}{capability.isSharedZone ? <p className="shared-zone" role="status">Deze instelling kan ook invloed hebben op {affectedNames.length ? affectedNames.join(' en ') : `${capability.affectedRoomIds?.length ?? 0} kamers`}.</p> : null}<div className="heating-actions"><button type="button" disabled={!hasWarmer || pendingSame} onClick={() => setDialogAction(RoomHeatingCommandAction.TemporaryWarmer)} title={hasWarmer ? undefined : 'Deze actie wordt nu niet ondersteund.'}>Tijdelijk warmer</button>{hasCooler ? <button type="button" disabled={pendingSame} onClick={() => setDialogAction(RoomHeatingCommandAction.TemporaryCooler)}>Tijdelijk koeler</button> : null}<button type="button" disabled={!hasResume || pendingSame} onClick={() => setDialogAction(RoomHeatingCommandAction.ResumeSchedule)} title={hasResume ? undefined : 'Er is geen hervatbare tijdelijke instelling.'}>Schema hervatten</button><button type="button" onClick={onRetry}>Status vernieuwen</button></div></> : <p>Geen verwarmingsstatus geladen.</p>}{lastCommand ? <p role="status">{commandStatusLabel(lastCommand.status)}. {commandMessage(lastCommand)}</p> : null}{submitError ? <p role="alert">{submitError} {retryPayload ? <><button type="button" disabled={submitting} onClick={() => submit(retryPayload)}>Opnieuw proberen</button><button type="button" onClick={onRetry}>Status vernieuwen</button></> : null}</p> : null}{dialogAction !== undefined && capability ? <HeatingDialog action={dialogAction} room={room} capability={capability} affectedNames={affectedNames} submitting={submitting} onClose={() => setDialogAction(undefined)} onSubmit={submit} closeRef={closeRef} /> : null}</section>;
}

function OverrideSummary({ capability }: { capability: RoomHeatingControlCapabilityDto }) {
  const override = capability.currentOverride;
  if (!override) return <p>Geen tijdelijke instelling actief.</p>;
  return <div className="override-summary"><strong>{override.requestedTargetTemperatureCelsius !== undefined ? `Tijdelijk ingesteld op ${temp(override.requestedTargetTemperatureCelsius)}${override.effectiveUntilUtc ? ` tot ${time(override.effectiveUntilUtc)}` : ''}` : 'Tijdelijke instelling actief'}</strong>{override.requestedTargetTemperatureCelsius !== undefined ? <p>Doeltemperatuur aangevraagd: {temp(override.requestedTargetTemperatureCelsius)}</p> : null}{override.confirmedTargetTemperatureCelsius !== undefined ? <p>Bevestigde doeltemperatuur: {temp(override.confirmedTargetTemperatureCelsius)}</p> : null}<p>Status: {override.state ?? 'Onbekend'}</p>{override.state?.toLowerCase().includes('resume') ? <p>{override.state.toLowerCase().includes('failed') ? 'De tijdelijke instelling is verlopen, maar het schema kon nog niet worden hervat.' : 'Het normale schema wordt na afloop hervat.'}</p> : <p>Het normale schema wordt na afloop hervat.</p>}</div>;
}

function HeatingDialog({ action, room, capability, affectedNames, submitting, onClose, onSubmit, closeRef }: { action: RoomHeatingCommandAction; room: RoomClimateStateDto; capability: RoomHeatingControlCapabilityDto; affectedNames: string[]; submitting: boolean; onClose: () => void; onSubmit: (payload: { action: RoomHeatingCommandAction; target?: number; duration?: number }) => void; closeRef: RefObject<HTMLButtonElement | null> }) {
  const range = capability.targetRange;
  const durations = capability.allowedDurationsMinutes ?? [];
  const initial = Math.min(range?.maximum ?? 21, Math.max(range?.minimum ?? 15, room.currentObservation?.targetTemperatureCelsius ?? room.currentObservation?.temperatureCelsius ?? range?.minimum ?? 20));
  const [target, setTarget] = useState(Number(initial.toFixed(1)));
  const [duration, setDuration] = useState(durations[0] ?? 30);
  const isResume = action === RoomHeatingCommandAction.ResumeSchedule;
  const step = (delta: number) => setTarget((v) => Number(Math.min(range?.maximum ?? v, Math.max(range?.minimum ?? v, v + delta)).toFixed(1)));
  return <div className="heating-dialog-backdrop" role="presentation"><section className="heating-dialog" role="dialog" aria-modal="true" aria-label={actionLabels[action]}><header><h4>{actionLabels[action]}</h4><button ref={closeRef} type="button" onClick={onClose} aria-label="Verwarmingsdialoog sluiten">Sluiten</button></header>{isResume ? <p>FamilyBoard vraagt de klimaatregeling om het normale schema te hervatten. We tonen pas dat het schema actief is wanneer de backend dat bevestigt.</p> : <><p>Deze temperatuur geldt tijdelijk. Daarna probeert FamilyBoard het normale schema te hervatten.</p><dl><dt>Huidig</dt><dd>{temp(room.currentObservation?.temperatureCelsius)}</dd><dt>Geobserveerd doel</dt><dd>{temp(room.currentObservation?.targetTemperatureCelsius)}</dd><dt>Aangevraagd tot</dt><dd>{endTime(duration)}</dd></dl><div className="target-stepper" aria-label="Doeltemperatuur kiezen"><button type="button" onClick={() => step(-0.5)} disabled={target <= (range?.minimum ?? target)}>-</button><output aria-live="polite">{temp(target)}</output><button type="button" onClick={() => step(0.5)} disabled={target >= (range?.maximum ?? target)}>+</button></div><fieldset><legend>Duur kiezen</legend>{durations.map((m) => <label key={m}><input type="radio" name="duration" value={m} checked={duration === m} onChange={() => setDuration(m)} /> {m} minuten</label>)}</fieldset></>}{capability.isSharedZone ? <p className="shared-zone" role="alert">Deze instelling kan ook invloed hebben op {affectedNames.length ? affectedNames.join(' en ') : `${capability.affectedRoomIds?.length ?? 0} kamers`}.</p> : null}{capability.currentOverride || capability.latestCommand ? <p>Er is al een tijdelijke instelling of opdracht bekend. Controleer de keuze voordat je doorgaat.</p> : null}<footer><button type="button" onClick={onClose}>Annuleren</button><button type="button" disabled={submitting || (!isResume && (!range || durations.length === 0))} onClick={() => onSubmit(isResume ? { action } : { action, target, duration })}>{submitting ? 'Opdracht verzenden…' : 'Bevestigen'}</button></footer></section></div>;
}
