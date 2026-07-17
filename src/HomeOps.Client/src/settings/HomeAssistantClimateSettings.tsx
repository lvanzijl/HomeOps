import { useEffect, useState } from "react";
import {
  ClimateSourceRole,
  HomeAssistantResumeStrategyType,
  MappingHealth,
  ProviderType,
  getFriendlyWoningError,
  loadClimateProviders,
  createHomeAssistantResumeStrategyRequest,
  loadHomeAssistantDiagnostics,
  loadRoomClimateMappings,
  refreshHomeAssistantMapping,
  refreshHomeAssistantProvider,
  refreshHomeAssistantRoom,
  saveHomeAssistantProvider,
  loadHomeAssistantResumeStrategy,
  updateHomeAssistantResumeStrategy,
  type ClimateMapping,
  type ClimateProvider,
  type HomeAssistantDiagnostics,
  type HomeAssistantRefreshSummary,
  type HomeAssistantResumeStrategyConfiguration,
  type Room,
} from "./woningApi";

interface Props { rooms: readonly Room[]; onSelectRoom?: (roomId: string) => void }

type Busy = "save" | "provider" | string | null;

const roleLabels: Record<ClimateSourceRole, string> = {
  [ClimateSourceRole.ComfortTemperature]: "Kamertemperatuur",
  [ClimateSourceRole.Humidity]: "Luchtvochtigheid",
  [ClimateSourceRole.HeatingTargetTemperature]: "Doeltemperatuur",
  [ClimateSourceRole.HeatingStatus]: "Verwarmingsstatus",
  [ClimateSourceRole.HeatingControl]: "Verwarmingsregeling",
  [ClimateSourceRole.HeatingControlTemperature]: "Regeltemperatuur",
};

const healthLabels: Record<MappingHealth, string> = {
  [MappingHealth.Healthy]: "In orde",
  [MappingHealth.Unverified]: "Nog niet gecontroleerd",
  [MappingHealth.Missing]: "Niet gevonden",
  [MappingHealth.Unavailable]: "Niet beschikbaar",
  [MappingHealth.NeedsReview]: "Controle nodig",
  [MappingHealth.Degraded]: "Gedeeltelijk beschikbaar",
};

export function HomeAssistantClimateSettings({ rooms, onSelectRoom }: Props) {
  const [providers, setProviders] = useState<ClimateProvider[]>([]);
  const [mappings, setMappings] = useState<ClimateMapping[]>([]);
  const [diagnostics, setDiagnostics] = useState<HomeAssistantDiagnostics | null>(null);
  const [summary, setSummary] = useState<HomeAssistantRefreshSummary | null>(null);
  const [resumeStrategy, setResumeStrategy] = useState<HomeAssistantResumeStrategyConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("Klimaatbronnen laden…");
  const [error, setError] = useState<string | null>(null);

  const provider = providers.find((item) => item.providerType === ProviderType.HomeAssistant && !item.isArchived) ?? null;
  const homeAssistantMappings = mappings.filter((mapping) => mapping.providerId === provider?.id && !mapping.isArchived);
  const grouped = rooms.map((room) => ({ room, mappings: homeAssistantMappings.filter((mapping) => mapping.roomId === room.id) })).filter((group) => group.mappings.length > 0);

  useEffect(() => { void reload(); }, [rooms]);

  async function reload() {
    setLoading(true); setError(null);
    try {
      const nextProviders = await loadClimateProviders();
      setProviders(nextProviders);
      const nextProvider = nextProviders.find((item) => item.providerType === ProviderType.HomeAssistant && !item.isArchived) ?? null;
      const loadedMappings = (await Promise.all(rooms.filter((room) => room.id).map((room) => loadRoomClimateMappings(room.id ?? "")))).flat();
      setMappings(loadedMappings);
      if (nextProvider?.id) { setDiagnostics(await loadHomeAssistantDiagnostics(nextProvider.id)); setResumeStrategy(await loadHomeAssistantResumeStrategy(nextProvider.id)); } else { setDiagnostics(null); setResumeStrategy(null); }
      setMessage(nextProvider ? "Home Assistant-status is bijgewerkt." : "Home Assistant is nog niet ingesteld.");
    } catch (err) { setError(getFriendlyWoningError(err, "Home Assistant-klimaatbronnen laden lukt niet.")); }
    finally { setLoading(false); }
  }

  async function run(key: Busy, action: () => Promise<HomeAssistantRefreshSummary | void>, success: string) {
    if (busy) return;
    setBusy(key); setError(null);
    try {
      const result = await action();
      if (result) setSummary(result);
      setMessage(success);
      await reload();
    } catch (err) { setError(getFriendlyWoningError(err, "Vernieuwen is niet gelukt. Eerdere metingen blijven beschikbaar.")); }
    finally { setBusy(null); }
  }

  return <section className="ha-climate" aria-label="Klimaatbronnen">
    <header className="ha-climate__header"><div><p className="widget-type">Klimaatbronnen</p><h4>Home Assistant</h4><p>Beheer alleen veilige klimaatkoppelingen en diagnostiek. De toegangssleutel wordt veilig buiten FamilyBoard ingesteld en wordt hier nooit getoond.</p></div><button onClick={() => setEditing(true)}>{provider ? "Home Assistant beheren" : "Home Assistant toevoegen"}</button></header>
    <div className="woning-status" role={error ? "alert" : "status"}>{error ?? (loading ? "Home Assistant laden…" : message)}</div>
    {!provider ? <div className="woning-empty"><p>Home Assistant is nog niet ingesteld.</p><p>Configureer de token buiten FamilyBoard met <code>HomeAssistant__AccessToken</code> of <code>HOMEASSISTANT__ACCESSTOKEN</code>.</p></div> : <div className="ha-climate__grid">
      <aside className="ha-climate__summary"><h5>{provider.displayName}</h5><dl><dt>Adres</dt><dd>{provider.externalInstanceReference}</dd><dt>Status</dt><dd>{provider.isEnabled ? "Ingeschakeld" : "Uitgeschakeld"}</dd><dt>Verbinding</dt><dd>{outcomeLabel(diagnostics?.outcome) || outcomeFromSummary(summary)}</dd><dt>Laatste succesvolle controle</dt><dd>{formatDate(diagnostics?.lastSuccessfulUtc)}</dd><dt>Kamers/koppelingen</dt><dd>{new Set(homeAssistantMappings.map((m) => m.roomId)).size} kamers · {homeAssistantMappings.length} koppelingen</dd></dl><div className="woning-actions"><button disabled={busy === "provider" || !provider.id} onClick={() => run("provider", () => refreshHomeAssistantProvider(provider.id ?? ""), "Verbinding met Home Assistant is gecontroleerd.")}>{busy === "provider" ? "Controleren…" : "Verbinding controleren"}</button><button disabled={busy === "provider" || !provider.id} onClick={() => run("provider", () => refreshHomeAssistantProvider(provider.id ?? ""), "Alle klimaatbronnen zijn vernieuwd.")}>Alles vernieuwen</button></div>{summary ? <RefreshSummary summary={summary} /> : null}<p className="ha-climate__safe">Technische details zijn beperkt om toegangssleutels en Home Assistant-gegevens te beschermen.</p>{provider.id && resumeStrategy ? <ResumeStrategyForm strategy={resumeStrategy} busy={busy === "resume"} onSave={(request) => run("resume", () => updateHomeAssistantResumeStrategy(provider.id ?? "", request).then((saved) => { setResumeStrategy(saved); }), "Hervatmethode is opgeslagen.")} /> : null}</aside>
      <main className="ha-climate__mappings" aria-label="Home Assistant-koppelingen per kamer">{grouped.length === 0 ? <div className="woning-empty"><p>Er zijn nog geen klimaatbronnen gekoppeld.</p><p>Open de bestaande kamerconfiguratie om koppelingen te beheren.</p></div> : grouped.map(({ room, mappings }) => <section className="ha-room" key={room.id}><header><h5>{room.name}</h5><div className="woning-actions"><button onClick={() => onSelectRoom?.(room.id ?? "")}>Klimaatinstellingen</button><button onClick={() => onSelectRoom?.(room.id ?? "")}>Koppelingen beheren</button><button disabled={busy === `room:${room.id}`} onClick={() => run(`room:${room.id}`, () => refreshHomeAssistantRoom(room.id ?? ""), `${room.name} is vernieuwd.`)}>Kamer vernieuwen</button></div></header>{mappings.map((mapping) => <article className="ha-mapping" key={mapping.id}><div><strong>{roleLabel(mapping.sourceRole)}</strong><p>{healthLabel(mapping.health)} · {mapping.isEnabled ? "Ingeschakeld" : "Uitgeschakeld"}{mapping.isArchived ? " · Gearchiveerd" : ""}</p><p>{safeSource(mapping)}</p><p>{mapping.diagnosticSummary || diagnostics?.mappings?.find((item) => item.mappingId === mapping.id)?.diagnosticSummary || "Geen extra veilige diagnose."}</p><p>Laatst gecontroleerd: {formatDate(mapping.lastCheckedUtc)} · Laatst gelukt: {formatDate(mapping.lastSuccessfulUtc)}</p></div><button disabled={busy === `mapping:${mapping.id}`} onClick={() => run(`mapping:${mapping.id}`, () => refreshHomeAssistantMapping(mapping.id ?? ""), "Koppeling is gecontroleerd.")}>Koppeling controleren</button></article>)}</section>)}</main>
    </div>}
    {editing ? <ProviderForm provider={provider} busy={busy === "save"} onCancel={() => setEditing(false)} onSave={(name, url, enabled) => run("save", () => saveHomeAssistantProvider(provider, name, url, enabled).then(() => undefined), "Home Assistant-provider is opgeslagen.").then(() => setEditing(false))} /> : null}
  </section>;
}

function ProviderForm({ provider, busy, onCancel, onSave }: { provider: ClimateProvider | null; busy: boolean; onCancel: () => void; onSave: (name: string, url: string, enabled: boolean) => Promise<void> }) { const [name, setName] = useState(provider?.displayName ?? "Home Assistant"); const [url, setUrl] = useState(provider?.externalInstanceReference ?? ""); const [enabled, setEnabled] = useState(provider?.isEnabled ?? true); const validation = validateUrl(url); return <div className="settings-surface-backdrop" role="presentation"><section className="settings-surface-dialog woning-dialog" role="dialog" aria-modal="true" aria-label="Home Assistant beheren"><header className="settings-surface-header"><h3>Home Assistant beheren</h3><button onClick={onCancel}>Sluiten</button></header><form className="settings-surface-body" onSubmit={(event) => { event.preventDefault(); if (!validation) void onSave(name.trim(), url.trim(), enabled); }}><label className="settings-file-field"><span>Weergavenaam</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="settings-file-field"><span>Home Assistant-adres</span><input value={url} onChange={(event) => setUrl(event.target.value)} required aria-describedby="ha-url-error" /></label>{validation ? <p id="ha-url-error" role="alert">{validation}</p> : null}<label><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Ingeschakeld</label><p>De toegangssleutel wordt veilig buiten FamilyBoard ingesteld en wordt hier nooit getoond. Gebruik <code>HomeAssistant__AccessToken</code> of <code>HOMEASSISTANT__ACCESSTOKEN</code> in de procesconfiguratie.</p><div className="settings-surface-actions"><button type="button" onClick={onCancel}>Annuleren</button><button disabled={busy || !!validation}>{busy ? "Opslaan…" : "Opslaan"}</button></div></form></section></div>; }
function validateUrl(value: string) { try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) return "Gebruik een http- of https-adres."; if (url.username || url.password) return "Gebruik geen gebruikersnaam of wachtwoord in het adres."; return ""; } catch { return "Vul een geldig Home Assistant-adres in."; } }
function roleLabel(role?: ClimateSourceRole) { return role === undefined ? "Onbekende rol" : roleLabels[role] ?? "Onbekende rol"; }
function healthLabel(health?: MappingHealth) { return health === undefined ? "Nog niet gecontroleerd" : healthLabels[health] ?? "Controle nodig"; }
function safeSource(mapping: ClimateMapping) { return mapping.source?.externalDisplayName || mapping.source?.externalAreaName || mapping.source?.externalSourceId || "Geen veilige bronreferentie"; }
function formatDate(date?: Date) { return date ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" }).format(date) : "Nog niet beschikbaar"; }
function outcomeLabel(outcome?: string) { if (!outcome) return "Nog niet gecontroleerd"; if (outcome === "Healthy") return "Verbinding met Home Assistant is gelukt."; if (outcome === "AuthenticationFailure") return "De toegangssleutel ontbreekt of is niet geldig."; if (outcome === "ProviderUnavailable") return "Home Assistant is niet bereikbaar."; if (outcome === "InvalidConnectionConfiguration") return "Het adres van Home Assistant is niet geldig."; if (outcome === "PartialFailure") return "De verbinding werkt, maar niet alle klimaatbronnen zijn beschikbaar."; return "Onbekend of nog niet gecontroleerd."; }
function outcomeFromSummary(summary: HomeAssistantRefreshSummary | null) { return summary?.outcome === 0 ? "Verbinding met Home Assistant is gelukt." : "Nog niet gecontroleerd"; }
function RefreshSummary({ summary }: { summary: HomeAssistantRefreshSummary }) { return <div className="ha-refresh"><h6>Laatste vernieuwing</h6><p>Kamers: {summary.roomsSucceeded ?? 0}/{summary.roomsAttempted ?? 0} gelukt, {summary.roomsFailed ?? 0} mislukt.</p><p>Koppelingen: {summary.mappingsHealthy ?? 0} in orde, {summary.mappingsMissing ?? 0} niet gevonden, {summary.mappingsUnavailable ?? 0} niet beschikbaar, {summary.mappingsNeedsReview ?? 0} controle nodig.</p><p>Metingen: {summary.observationsAccepted ?? 0} verwerkt, {summary.observationsIgnored ?? 0} genegeerd, {summary.observationsFailed ?? 0} mislukt.</p><p>{formatDate(summary.startedUtc)} – {formatDate(summary.completedUtc)}{summary.wasCancelled ? " · Geannuleerd" : ""}</p></div>; }


function ResumeStrategyForm({ strategy, busy, onSave }: { strategy: HomeAssistantResumeStrategyConfiguration; busy: boolean; onSave: (request: ReturnType<typeof createHomeAssistantResumeStrategyRequest>) => Promise<void> }) {
  const [type, setType] = useState(strategy.strategyType ?? HomeAssistantResumeStrategyType.None);
  const [script, setScript] = useState(strategy.scriptEntityReference ?? "");
  const [climate, setClimate] = useState(strategy.climateEntityReference ?? "");
  const [preset, setPreset] = useState(strategy.presetValue ?? "");
  const guidance = validateResume(type, script, climate, preset);
  async function submit(nextType = type) {
    if (nextType === HomeAssistantResumeStrategyType.None && strategy.strategyType !== HomeAssistantResumeStrategyType.None && !confirm("Hervatmethode wissen? Schema hervatten is daarna niet beschikbaar.")) return;
    await onSave(createHomeAssistantResumeStrategyRequest(nextType, script.trim() || undefined, climate.trim() || undefined, preset.trim() || undefined));
  }
  return <form className="ha-resume" onSubmit={(event) => { event.preventDefault(); if (!guidance) void submit(); }}>
    <h6>Schema hervatten</h6>
    <p>FamilyBoard gebruikt alleen deze vooraf toegestane methode om het normale schema te hervatten.</p>
    <p>{strategy.supportsResumeSchedule ? "Schema hervatten is beschikbaar." : "Zonder geldige hervatmethode is “Schema hervatten” niet beschikbaar."}</p>
    {strategy.blockers?.length ? <ul>{strategy.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : null}
    <fieldset><legend>Hervatmethode</legend>
      <label><input type="radio" name="resume-strategy" checked={type === HomeAssistantResumeStrategyType.None} onChange={() => setType(HomeAssistantResumeStrategyType.None)} /> Geen</label>
      <label><input type="radio" name="resume-strategy" checked={type === HomeAssistantResumeStrategyType.Script} onChange={() => setType(HomeAssistantResumeStrategyType.Script)} /> Home Assistant-script gebruiken</label>
      <label><input type="radio" name="resume-strategy" checked={type === HomeAssistantResumeStrategyType.ClimatePreset} onChange={() => setType(HomeAssistantResumeStrategyType.ClimatePreset)} /> Thermostaatpreset gebruiken</label>
    </fieldset>
    {type === HomeAssistantResumeStrategyType.Script ? <label className="settings-file-field"><span>Script-entiteit</span><input value={script} onChange={(event) => setScript(event.target.value)} placeholder="script.schema_hervatten" /></label> : null}
    {type === HomeAssistantResumeStrategyType.ClimatePreset ? <><label className="settings-file-field"><span>Klimaat-entiteit</span><input value={climate} onChange={(event) => setClimate(event.target.value)} placeholder="climate.woonkamer" /></label><label className="settings-file-field"><span>Presetwaarde</span><input value={preset} onChange={(event) => setPreset(event.target.value)} placeholder="schedule" maxLength={80} /></label></> : null}
    {guidance ? <p role="alert">{guidance}</p> : null}
    <div className="woning-actions"><button disabled={busy || !!guidance}>{busy ? "Opslaan…" : "Hervatmethode opslaan"}</button>{type !== HomeAssistantResumeStrategyType.None ? <button type="button" disabled={busy} onClick={() => { setType(HomeAssistantResumeStrategyType.None); void submit(HomeAssistantResumeStrategyType.None); }}>Wissen</button> : null}</div>
  </form>;
}
function validateResume(type: HomeAssistantResumeStrategyType, script: string, climate: string, preset: string) { if (type === HomeAssistantResumeStrategyType.Script && !/^script\.[A-Za-z0-9_]+$/.test(script.trim())) return "Gebruik een geldige script-entiteit, bijvoorbeeld script.schema_hervatten."; if (type === HomeAssistantResumeStrategyType.ClimatePreset) { if (!/^climate\.[A-Za-z0-9_]+$/.test(climate.trim())) return "Gebruik een geldige klimaat-entiteit, bijvoorbeeld climate.woonkamer."; if (!preset.trim() || preset.length > 80 || /[\x00-\x1F]/.test(preset)) return "Vul een veilige presetwaarde in."; } return ""; }
