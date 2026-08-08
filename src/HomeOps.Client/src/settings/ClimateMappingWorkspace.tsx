import { useEffect, useMemo, useState } from "react";
import {
  ClimateSourceRole,
  MappingHealth,
  archiveClimateMapping,
  createClimateMapping,
  getFriendlyWoningError,
  loadRoomClimateCapabilities,
  loadRoomClimateMappings,
  restoreClimateMapping,
  updateClimateMapping,
  type ClimateCapabilitySummary,
  type ClimateMapping,
  type ClimateMappingDraft,
  type ClimateProvider,
  type Room,
} from "./woningApi";

interface Props {
  room: Room;
  providers: readonly ClimateProvider[];
  onClose: () => void;
  onChanged: () => void;
}

type Editor = { kind: "create" } | { kind: "edit"; mapping: ClimateMapping } | null;

export const climateRoleLabels: Record<ClimateSourceRole, string> = {
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

export function ClimateMappingWorkspace({ room, providers, onClose, onChanged }: Props) {
  const [mappings, setMappings] = useState<ClimateMapping[]>([]);
  const [capabilities, setCapabilities] = useState<ClimateCapabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [message, setMessage] = useState("Koppelingen laden…");
  const [error, setError] = useState<string | null>(null);
  const activeProviders = providers.filter((item) => item.id && item.isEnabled && !item.isArchived);

  async function reload() {
    if (!room.id) return;
    setLoading(true);
    setError(null);
    try {
      const [nextMappings, nextCapabilities] = await Promise.all([loadRoomClimateMappings(room.id), loadRoomClimateCapabilities(room.id)]);
      setMappings(nextMappings);
      setCapabilities(nextCapabilities);
      setMessage("Koppelingen zijn bijgewerkt.");
    } catch (err) {
      setError(getFriendlyWoningError(err, "Klimaatkoppelingen laden lukt niet."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, [room.id]);

  const visibleRoles = useMemo(() => {
    const roles = capabilities?.roles ?? [];
    return roles.filter((role) => role.role !== undefined && (role.isRequired || mappings.some((mapping) => mapping.sourceRole === role.role)));
  }, [capabilities, mappings]);

  async function mutate(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setEditor(null);
      setMessage(success);
      await reload();
      onChanged();
    } catch (err) {
      setError(getFriendlyWoningError(err, "De koppeling kon niet worden gewijzigd. Controleer bron, prioriteit en afhankelijkheden."));
    } finally {
      setBusy(false);
    }
  }

  async function archive(mapping: ClimateMapping) {
    if (!mapping.id || !confirm(`Koppeling “${sourceLabel(mapping)}” archiveren? De bron wordt uitgeschakeld maar kan worden hersteld.`)) return;
    await mutate(() => archiveClimateMapping(mapping.id ?? ""), "Koppeling is gearchiveerd.");
  }

  async function restore(mapping: ClimateMapping) {
    if (!mapping.id) return;
    await mutate(() => restoreClimateMapping(mapping.id ?? ""), "Koppeling is hersteld en moet opnieuw worden gecontroleerd.");
  }

  const canCreate = !!capabilities?.hasClimateConfiguration && !!capabilities.isClimateEnabled && activeProviders.length > 0 && (capabilities.roles?.some((role) => role.isRequired) ?? false);

  return <div className="settings-surface-backdrop" role="presentation">
    <section className="settings-surface-dialog woning-dialog klimaat-mapping-dialog" role="dialog" aria-modal="true" aria-label={`Klimaatkoppelingen voor ${room.name}`}>
      <header className="settings-surface-header"><div><h3>Klimaatkoppelingen · {room.name}</h3><p>Koppel semantische klimaatrollen aan veilige provider-entiteiten. Deze werkruimte voert geen vrije Home Assistant-services uit.</p></div><button disabled={busy} onClick={onClose}>Sluiten</button></header>
      {editor ? <MappingEditor
        editor={editor}
        providers={activeProviders}
        mappings={mappings}
        roles={(capabilities?.roles ?? []).filter((role) => role.isRequired && role.role !== undefined).map((role) => role.role!)}
        busy={busy}
        error={error}
        onCancel={() => { setEditor(null); setError(null); }}
        onSave={(draft) => mutate(
          () => editor.kind === "create" ? createClimateMapping(room.id ?? "", draft) : updateClimateMapping(editor.mapping.id ?? "", draft),
          editor.kind === "create" ? "Koppeling is aangemaakt." : "Koppeling is opgeslagen.",
        )}
      /> : <div className="klimaat-mapping-layout">
        <div className="klimaat-mapping-capabilities" aria-label="Kamerstatus">
          <strong>{capabilities?.isClimateEnabled ? "Klimaat actief" : capabilities?.hasClimateConfiguration ? "Klimaat uitgeschakeld" : "Nog niet geconfigureerd"}</strong>
          <span>{capabilities?.roles?.filter((role) => role.isRequired).length ?? 0} vereiste rollen</span>
          <button disabled={!canCreate || loading || busy} onClick={() => setEditor({ kind: "create" })}>Koppeling toevoegen</button>
        </div>
        <div className="woning-status" role={error ? "alert" : "status"}>{error ?? (loading ? "Koppelingen laden…" : message)}</div>
        {!canCreate ? <p className="klimaat-mapping-guidance">Activeer eerst de klimaatconfiguratie en een provider. Alleen rollen uit de kamerconfiguratie kunnen worden gekoppeld.</p> : null}
        <div className="klimaat-mapping-scroll">
          {visibleRoles.length === 0 && !loading ? <div className="woning-empty"><p>Er zijn nog geen beschikbare rollen of koppelingen voor deze kamer.</p></div> : visibleRoles.map((capability) => {
            const role = capability.role!;
            const roleMappings = mappings.filter((mapping) => mapping.sourceRole === role);
            const active = roleMappings.filter((mapping) => !mapping.isArchived).sort(byPriority);
            const archived = roleMappings.filter((mapping) => mapping.isArchived).sort(byPriority);
            return <section className="klimaat-mapping-role" key={role} aria-label={climateRoleLabels[role]}>
              <header><div><h4>{climateRoleLabels[role]}</h4><p>{capability.isRequired ? "Vereist" : "Optioneel"} · {capabilityStatus(capability.status)}{capability.hasSharedSource ? " · gedeelde verwarmingszone" : ""}</p></div><span>{active.length} actief</span></header>
              {active.length === 0 ? <p className="klimaat-mapping-empty">Nog geen actieve bron.</p> : active.map((mapping) => <MappingRow key={mapping.id} mapping={mapping} roomNames={roomNames(mapping, room, [])} busy={busy} onEdit={() => setEditor({ kind: "edit", mapping })} onArchive={() => void archive(mapping)} />)}
              {archived.length > 0 ? <details><summary>Gearchiveerd ({archived.length})</summary>{archived.map((mapping) => <MappingRow key={mapping.id} mapping={mapping} roomNames={[]} busy={busy} onRestore={() => void restore(mapping)} />)}</details> : null}
            </section>;
          })}
        </div>
      </div>}
    </section>
  </div>;
}

function MappingEditor({ editor, providers, mappings, roles, busy, error, onCancel, onSave }: { editor: Exclude<Editor, null>; providers: readonly ClimateProvider[]; mappings: readonly ClimateMapping[]; roles: readonly ClimateSourceRole[]; busy: boolean; error: string | null; onCancel: () => void; onSave: (draft: ClimateMappingDraft) => Promise<void> }) {
  const original = editor.kind === "edit" ? editor.mapping : null;
  const [providerId, setProviderId] = useState(original?.providerId ?? providers[0]?.id ?? "");
  const [role, setRole] = useState(original?.sourceRole ?? roles[0] ?? ClimateSourceRole.ComfortTemperature);
  const [sourceId, setSourceId] = useState(original?.source?.externalSourceId ?? "");
  const [displayName, setDisplayName] = useState(original?.source?.externalDisplayName ?? "");
  const [sourceKind, setSourceKind] = useState(original?.source?.externalSourceKind ?? "");
  const [areaName, setAreaName] = useState(original?.source?.externalAreaName ?? "");
  const [deviceName, setDeviceName] = useState(original?.source?.externalDeviceName ?? "");
  const [priority, setPriority] = useState(String(original?.priority ?? nextPriority(mappings, role)));
  const [enabled, setEnabled] = useState(original?.isEnabled ?? true);
  const validation = validateDraft(mappings, original, providerId, role, sourceId, priority);

  function changeRole(next: ClimateSourceRole) { setRole(next); if (!original) setPriority(String(nextPriority(mappings, next))); }
  function submit() {
    if (validation) return;
    void onSave({ providerId, sourceRole: role, externalSourceId: sourceId, externalDisplayName: displayName, externalSourceKind: sourceKind, externalAreaName: areaName, externalDeviceName: deviceName, priority: Number(priority), isEnabled: enabled });
  }

  return <form className="klimaat-mapping-editor" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <div className="klimaat-mapping-editor-scroll">
      <h4>{editor.kind === "create" ? "Koppeling toevoegen" : `${climateRoleLabels[role]} bewerken`}</h4>
      <p>Gebruik een provider-entiteit, bijvoorbeeld <code>sensor.woonkamer_temperatuur</code> of <code>climate.beneden</code>. Er worden geen services of vrije JSON-opdrachten opgeslagen.</p>
      <div className="klimaat-mapping-fields">
        <label><span>Provider</span><select value={providerId} disabled={editor.kind === "edit"} onChange={(event) => setProviderId(event.target.value)}>{providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.displayName}</option>)}</select></label>
        <label><span>Semantische rol</span><select value={role} disabled={editor.kind === "edit"} onChange={(event) => changeRole(Number(event.target.value) as ClimateSourceRole)}>{roles.map((item) => <option value={item} key={item}>{climateRoleLabels[item]}</option>)}</select></label>
        <label><span>Entiteits-ID</span><input value={sourceId} onChange={(event) => setSourceId(event.target.value)} maxLength={240} required placeholder="sensor.woonkamer_temperatuur" /></label>
        <label><span>Prioriteit</span><input type="number" min="0" step="1" value={priority} onChange={(event) => setPriority(event.target.value)} required /><small>0 is de eerste keuze binnen deze rol.</small></label>
        <label><span>Weergavenaam (optioneel)</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={240} /></label>
        <label><span>Brontype (optioneel)</span><input value={sourceKind} onChange={(event) => setSourceKind(event.target.value)} maxLength={80} placeholder="sensor of climate" /></label>
        <label><span>Ruimte bij provider (optioneel)</span><input value={areaName} onChange={(event) => setAreaName(event.target.value)} maxLength={160} /></label>
        <label><span>Apparaat (optioneel)</span><input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} maxLength={160} /></label>
      </div>
      <label className="woning-climate-check"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span><strong>Ingeschakeld</strong><small>Uitgeschakelde bronnen blijven bewaard maar leveren geen actieve kandidaat.</small></span></label>
      {validation ? <p className="woning-climate-validation" role="alert">{validation}</p> : null}
      {error ? <p className="woning-climate-save-error" role="alert">{error}</p> : null}
    </div>
    <footer className="settings-surface-actions klimaat-mapping-actions"><button type="button" disabled={busy} onClick={onCancel}>Annuleren</button><button disabled={busy || !!validation}>{busy ? "Opslaan…" : "Opslaan"}</button></footer>
  </form>;
}

function MappingRow({ mapping, roomNames, busy, onEdit, onArchive, onRestore }: { mapping: ClimateMapping; roomNames: string[]; busy: boolean; onEdit?: () => void; onArchive?: () => void; onRestore?: () => void }) {
  return <article className="klimaat-mapping-row">
    <div><strong>{sourceLabel(mapping)}</strong><p>Prioriteit {mapping.priority ?? 0} · {mapping.isEnabled ? "Ingeschakeld" : "Uitgeschakeld"} · {healthLabel(mapping.health)}</p><p>{mapping.source?.externalSourceId}</p>{mapping.isSharedSource ? <p>Gedeeld met {roomNames.length ? roomNames.join(", ") : `${mapping.sharedRoomIds?.length ?? 0} andere kamer(s)`}.</p> : null}<p>{mapping.diagnosticSummary || "Geen extra veilige diagnose."}</p><p>Laatst gecontroleerd: {formatDate(mapping.lastCheckedUtc)} · Laatst gelukt: {formatDate(mapping.lastSuccessfulUtc)}</p></div>
    <div className="woning-actions">{onEdit ? <button disabled={busy} onClick={onEdit}>Bewerken</button> : null}{onArchive ? <button disabled={busy} onClick={onArchive}>Archiveren</button> : null}{onRestore ? <button disabled={busy} onClick={onRestore}>Herstellen</button> : null}</div>
  </article>;
}

function validateDraft(mappings: readonly ClimateMapping[], original: ClimateMapping | null, providerId: string, role: ClimateSourceRole, sourceId: string, priorityText: string) {
  if (!providerId) return "Kies een actieve provider.";
  const trimmed = sourceId.trim();
  if (!trimmed) return "Vul een entiteits-ID in.";
  const priority = Number(priorityText);
  if (!Number.isInteger(priority) || priority < 0) return "Prioriteit moet een geheel getal van 0 of hoger zijn.";
  const active = mappings.filter((mapping) => !mapping.isArchived && mapping.id !== original?.id && mapping.sourceRole === role);
  if (active.some((mapping) => mapping.priority === priority)) return `Prioriteit ${priority} wordt al gebruikt voor ${climateRoleLabels[role]}.`;
  if (active.some((mapping) => mapping.providerId === providerId && mapping.source?.externalSourceId?.trim() === trimmed)) return "Deze actieve bron is al gekoppeld aan dezelfde rol.";
  return "";
}

function nextPriority(mappings: readonly ClimateMapping[], role: ClimateSourceRole) { return Math.max(-1, ...mappings.filter((mapping) => !mapping.isArchived && mapping.sourceRole === role).map((mapping) => mapping.priority ?? 0)) + 1; }
function byPriority(a: ClimateMapping, b: ClimateMapping) { return (a.priority ?? 0) - (b.priority ?? 0); }
function sourceLabel(mapping: ClimateMapping) { return mapping.source?.externalDisplayName || mapping.source?.externalAreaName || mapping.source?.externalSourceId || "Bron zonder naam"; }
function healthLabel(health?: MappingHealth) { return health === undefined ? "Nog niet gecontroleerd" : healthLabels[health] ?? "Controle nodig"; }
function capabilityStatus(status?: string) { if (status === "Healthy") return "in orde"; if (status === "Degraded") return "gedeeltelijk beschikbaar"; if (status === "Unverified") return "nog niet gecontroleerd"; if (status === "UnavailableOrMissing") return "niet beschikbaar"; if (status === "RequiredUnmapped") return "bron ontbreekt"; return "niet vereist"; }
function formatDate(date?: Date) { return date ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" }).format(date) : "Nog niet beschikbaar"; }
function roomNames(mapping: ClimateMapping, room: Room, rooms: readonly Room[]) { return (mapping.sharedRoomIds ?? []).map((id) => rooms.find((item) => item.id === id)?.name ?? (id === room.id ? room.name ?? "Deze kamer" : "Andere kamer")); }
