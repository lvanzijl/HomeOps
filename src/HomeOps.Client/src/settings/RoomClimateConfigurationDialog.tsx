import { useMemo, useState, type FormEvent } from "react";
import {
  ClimateRangeDto,
  HeatingPolicyIntent,
  UpsertRoomClimateConfigurationRequest,
  type RoomClimateConfigurationDto,
  type RoomDto,
} from "../api/homeOpsApiClient";
import { getFriendlyWoningError, saveClimateConfiguration } from "./woningApi";

interface Props {
  room: RoomDto;
  configuration?: RoomClimateConfigurationDto | null;
  onClose: () => void;
  onSaved: (configuration: RoomClimateConfigurationDto) => void;
}

interface RangeDraft {
  enabled: boolean;
  minimum: string;
  maximum: string;
}

interface ClimateDraft {
  isClimateEnabled: boolean;
  isBedtimeRelevant: boolean;
  temperature: RangeDraft;
  humidity: RangeDraft;
  heatingPolicyIntent: HeatingPolicyIntent;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function RoomClimateConfigurationDialog({ room, configuration, onClose, onSaved }: Props) {
  const initialDraft = useMemo(() => toDraft(configuration), [configuration]);
  const [baseline, setBaseline] = useState(initialDraft);
  const [draft, setDraft] = useState(initialDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [serverError, setServerError] = useState("");
  const validationErrors = validateDraft(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const isNew = configuration?.isConfigured !== true && saveState !== "saved";

  function change(update: (current: ClimateDraft) => ClimateDraft) {
    setDraft(update);
    setSaveState("idle");
    setServerError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room.id || validationErrors.length > 0) return;
    setSaveState("saving");
    setServerError("");
    try {
      const saved = await saveClimateConfiguration(room.id, toRequest(draft));
      const savedDraft = toDraft(saved);
      setDraft(savedDraft);
      setBaseline(savedDraft);
      setSaveState("saved");
      onSaved(saved);
    } catch (error) {
      setSaveState("error");
      setServerError(getFriendlyWoningError(error, "Klimaatinstellingen opslaan lukt niet. Controleer de waarden en probeer opnieuw."));
    }
  }

  const status = saveState === "saving"
    ? "Klimaatinstellingen opslaan…"
    : saveState === "saved"
      ? "Klimaatinstellingen zijn opgeslagen."
      : saveState === "error"
        ? serverError
        : dirty || isNew
          ? "Niet-opgeslagen klimaatinstellingen."
          : "Klimaatinstellingen zijn ongewijzigd.";

  return <div className="settings-surface-backdrop" role="presentation">
    <section className="settings-surface-dialog woning-climate-dialog" role="dialog" aria-modal="true" aria-label={`Klimaatinstellingen voor ${room.name}`}>
      <header className="settings-surface-header">
        <div><p className="widget-type">{room.name}</p><h3>Klimaatinstellingen</h3><p>Leg alleen de gewenste kamergrenzen en beleidsintentie vast. Bronnen koppel je apart.</p></div>
        <button disabled={saveState === "saving"} onClick={onClose} type="button">Sluiten</button>
      </header>
      <form className="woning-climate-form" onSubmit={(event) => void submit(event)}>
        <div className="woning-climate-form-body">
          <fieldset disabled={saveState === "saving"}>
            <legend>Gebruik</legend>
            <label className="woning-climate-check"><input checked={draft.isClimateEnabled} onChange={(event) => change((current) => ({ ...current, isClimateEnabled: event.target.checked, isBedtimeRelevant: event.target.checked ? current.isBedtimeRelevant : false }))} type="checkbox" /><span><strong>Klimaat voor deze kamer gebruiken</strong><small>Uitgeschakeld blijft de configuratie bewaard, maar de kamer neemt niet deel aan klimaatfuncties.</small></span></label>
            <label className="woning-climate-check"><input checked={draft.isBedtimeRelevant} disabled={!draft.isClimateEnabled} onChange={(event) => change((current) => ({ ...current, isBedtimeRelevant: event.target.checked }))} type="checkbox" /><span><strong>Meenemen rond bedtijd</strong><small>{draft.isClimateEnabled ? "Markeert deze kamer als relevant voor toekomstige bedtijdcontext." : "Schakel klimaat eerst in om bedtijdrelevantie te gebruiken."}</small></span></label>
          </fieldset>

          <RangeEditor disabled={saveState === "saving"} kind="temperature" label="Voorkeurstemperatuur" range={draft.temperature} onChange={(temperature) => change((current) => ({ ...current, temperature }))} />
          <RangeEditor disabled={saveState === "saving"} kind="humidity" label="Voorkeursluchtvochtigheid" range={draft.humidity} onChange={(humidity) => change((current) => ({ ...current, humidity }))} />

          <fieldset disabled={saveState === "saving"}>
            <legend>Verwarmingsbeleid</legend>
            <label className="settings-file-field"><span>Gewenste bediening</span><select aria-label="Gewenste verwarmingsbediening" value={draft.heatingPolicyIntent} onChange={(event) => change((current) => ({ ...current, heatingPolicyIntent: Number(event.target.value) as HeatingPolicyIntent }))}><option value={HeatingPolicyIntent.None}>Geen verwarmingsfunctie</option><option value={HeatingPolicyIntent.ReadOnlyStatus}>Alleen status uitlezen</option><option value={HeatingPolicyIntent.BoundedControl}>Tijdelijke bediening binnen grenzen</option></select></label>
            <p className="woning-climate-policy-note">{heatingPolicyExplanation(draft.heatingPolicyIntent)}</p>
          </fieldset>

          {validationErrors.length > 0 ? <div className="woning-climate-validation" role="alert"><strong>Controleer de invoer</strong><ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
          <p className={saveState === "error" ? "woning-climate-save-error" : undefined} role={saveState === "error" ? "alert" : "status"}>{status}</p>
        </div>
        <footer className="settings-surface-actions woning-climate-actions"><button disabled={saveState === "saving"} onClick={onClose} type="button">Sluiten</button><button disabled={saveState === "saving" || validationErrors.length > 0 || (!dirty && !isNew)} type="submit">{saveState === "saving" ? "Opslaan…" : "Klimaat opslaan"}</button></footer>
      </form>
    </section>
  </div>;
}

function RangeEditor({ disabled, kind, label, range, onChange }: { disabled: boolean; kind: "temperature" | "humidity"; label: string; range: RangeDraft; onChange: (range: RangeDraft) => void }) {
  const suffix = kind === "temperature" ? "°C" : "%";
  const bounds = kind === "temperature" ? { min: -30, max: 60, step: 0.5 } : { min: 0, max: 100, step: 1 };
  return <fieldset disabled={disabled}>
    <legend>{label}</legend>
    <label className="woning-climate-check"><input checked={range.enabled} onChange={(event) => onChange({ ...range, enabled: event.target.checked })} type="checkbox" /><span><strong>{label} instellen</strong><small>Laat uit als deze kamer geen eigen voorkeursbereik nodig heeft.</small></span></label>
    {range.enabled ? <div className="woning-climate-range"><label><span>Minimum ({suffix})</span><input aria-label={`${label} minimum`} max={bounds.max} min={bounds.min} onChange={(event) => onChange({ ...range, minimum: event.target.value })} step={bounds.step} type="number" value={range.minimum} /></label><label><span>Maximum ({suffix})</span><input aria-label={`${label} maximum`} max={bounds.max} min={bounds.min} onChange={(event) => onChange({ ...range, maximum: event.target.value })} step={bounds.step} type="number" value={range.maximum} /></label></div> : null}
  </fieldset>;
}

function toDraft(configuration?: RoomClimateConfigurationDto | null): ClimateDraft {
  return {
    isClimateEnabled: configuration?.isConfigured ? configuration.isClimateEnabled === true : true,
    isBedtimeRelevant: configuration?.isBedtimeRelevant === true,
    temperature: { enabled: Boolean(configuration?.temperatureRange), minimum: String(configuration?.temperatureRange?.minimum ?? 18), maximum: String(configuration?.temperatureRange?.maximum ?? 22) },
    humidity: { enabled: Boolean(configuration?.humidityRange), minimum: String(configuration?.humidityRange?.minimum ?? 40), maximum: String(configuration?.humidityRange?.maximum ?? 60) },
    heatingPolicyIntent: configuration?.heatingPolicyIntent ?? HeatingPolicyIntent.None,
  };
}

function toRequest(draft: ClimateDraft) {
  return new UpsertRoomClimateConfigurationRequest({
    isClimateEnabled: draft.isClimateEnabled,
    isBedtimeRelevant: draft.isClimateEnabled && draft.isBedtimeRelevant,
    temperatureRange: draft.temperature.enabled ? new ClimateRangeDto({ minimum: Number(draft.temperature.minimum), maximum: Number(draft.temperature.maximum) }) : undefined,
    humidityRange: draft.humidity.enabled ? new ClimateRangeDto({ minimum: Number(draft.humidity.minimum), maximum: Number(draft.humidity.maximum) }) : undefined,
    heatingPolicyIntent: draft.heatingPolicyIntent,
  });
}

function validateDraft(draft: ClimateDraft) {
  const errors: string[] = [];
  validateRange(draft.temperature, -30, 60, "Temperatuur", errors);
  validateRange(draft.humidity, 0, 100, "Luchtvochtigheid", errors);
  if (draft.heatingPolicyIntent === HeatingPolicyIntent.BoundedControl && !draft.temperature.enabled) errors.push("Tijdelijke verwarmingsbediening vereist een voorkeurstemperatuur.");
  return errors;
}

function validateRange(range: RangeDraft, supportedMinimum: number, supportedMaximum: number, label: string, errors: string[]) {
  if (!range.enabled) return;
  if (!range.minimum.trim() || !range.maximum.trim()) { errors.push(`${label}: vul minimum en maximum in.`); return; }
  const minimum = Number(range.minimum);
  const maximum = Number(range.maximum);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) { errors.push(`${label}: gebruik geldige getallen.`); return; }
  if (minimum < supportedMinimum || maximum > supportedMaximum) errors.push(`${label}: gebruik waarden tussen ${supportedMinimum} en ${supportedMaximum}.`);
  if (minimum >= maximum) errors.push(`${label}: het minimum moet lager zijn dan het maximum.`);
}

function heatingPolicyExplanation(intent: HeatingPolicyIntent) {
  if (intent === HeatingPolicyIntent.ReadOnlyStatus) return "FamilyBoard mag de verwarmingsstatus tonen, maar vraagt geen wijzigingen aan.";
  if (intent === HeatingPolicyIntent.BoundedControl) return "FamilyBoard mag alleen tijdelijke opdrachten binnen het gekozen temperatuurbereik aanbieden wanneer de backend dit veilig verklaart.";
  return "Er wordt geen verwarmingsstatus of bediening voor deze kamer verwacht.";
}
