import { useEffect, useState } from "react";
import { SettingsSurfaceDialog } from "./SettingsDashboard";
import {
  WeatherLocationFormError,
  WeatherProviderStatus,
  WeatherUnitSystem,
  createWeatherLocationFormValues,
  getWeatherLocationError,
  loadHouseholdWeatherLocation,
  refreshHouseholdWeatherLocation,
  saveHouseholdWeatherLocation,
  validateWeatherLocationForm,
  type HouseholdWeatherLocation,
  type WeatherLocationFormValues,
} from "./householdWeatherLocationApi";

export function HouseholdWeatherLocationDialog({
  onChanged,
  onClose,
}: {
  onChanged?(): void | Promise<void>;
  onClose(): void;
}) {
  const [location, setLocation] = useState<HouseholdWeatherLocation | null>(null);
  const [form, setForm] = useState<WeatherLocationFormValues>(() => createWeatherLocationFormValues());
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [operation, setOperation] = useState<"save" | "refresh" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<readonly string[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoadState("loading");
    setMessage(null);
    try {
      const loaded = await loadHouseholdWeatherLocation();
      setLocation(loaded);
      setForm(createWeatherLocationFormValues(loaded));
      setLoadState("ready");
    } catch (error) {
      setMessage(getWeatherLocationError(error));
      setLoadState("error");
    }
  }

  function update<K extends keyof WeatherLocationFormValues>(key: K, value: WeatherLocationFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setValidationErrors([]);
  }

  async function save() {
    const localErrors = validateWeatherLocationForm(form);
    if (localErrors.length > 0) {
      setValidationErrors(localErrors);
      setMessage("Controleer de gemarkeerde locatiegegevens.");
      return;
    }

    setOperation("save");
    setMessage(null);
    setValidationErrors([]);
    try {
      const saved = await saveHouseholdWeatherLocation(form);
      setLocation(saved);
      setForm(createWeatherLocationFormValues(saved));
      setMessage("De weerlocatie is opgeslagen. Vernieuw het weer om de verbinding te controleren.");
      await onChanged?.();
    } catch (error) {
      setMessage(getWeatherLocationError(error));
      setValidationErrors(error instanceof WeatherLocationFormError ? error.validationErrors : []);
    } finally {
      setOperation(null);
    }
  }

  async function refresh() {
    setOperation("refresh");
    setMessage(null);
    setValidationErrors([]);
    try {
      const refreshed = await refreshHouseholdWeatherLocation();
      setLocation(refreshed);
      setMessage(refreshed.statusMessage ?? "De weerstatus is bijgewerkt.");
    } catch (error) {
      setMessage(getWeatherLocationError(error));
    } finally {
      setOperation(null);
    }
  }

  const busy = operation !== null;
  const statusLabel = getStatusLabel(location?.providerStatus, location?.isConfigured);

  return (
    <SettingsSurfaceDialog
      description="Kies de vaste huishoudlocatie die Home en Agenda voor weerinformatie gebruiken."
      dialogClassName="weather-location-dialog"
      onClose={onClose}
      title="Weerlocatie"
    >
      <div className="weather-location-dialog-layout">
        <div className="weather-location-dialog-content">
          {loadState === "loading" ? <p role="status">Weerlocatie laden…</p> : null}
          {loadState === "error" ? (
            <section className="weather-location-state error" role="alert">
              <strong>Laden lukt niet.</strong>
              <p>{message}</p>
              <button onClick={() => void load()} type="button">Opnieuw proberen</button>
            </section>
          ) : null}

          {loadState === "ready" ? (
            <>
              <section className={`weather-location-state ${getStatusTone(location?.providerStatus)}`} aria-label="Weerproviderstatus">
                <div>
                  <p className="widget-type">{location?.providerName ?? "Open-Meteo"}</p>
                  <h4>{statusLabel}</h4>
                </div>
                <p>{location?.statusMessage}</p>
                <dl>
                  <div><dt>Locatie</dt><dd>{location?.isConfigured ? location.displayName : "Nog niet ingesteld"}</dd></div>
                  <div><dt>Laatste verversing</dt><dd>{formatRefreshTime(location?.lastRefreshedUtc)}</dd></div>
                </dl>
              </section>

              <section className="weather-location-fields" aria-label="Locatiegegevens">
                <label>
                  <span>Naam voor thuis</span>
                  <input
                    autoComplete="off"
                    maxLength={120}
                    onChange={(event) => update("displayName", event.target.value)}
                    placeholder="Bijvoorbeeld Amsterdam thuis"
                    value={form.displayName}
                  />
                </label>
                <div className="weather-location-coordinate-grid">
                  <label>
                    <span>Breedtegraad</span>
                    <input inputMode="decimal" onChange={(event) => update("latitude", event.target.value)} placeholder="52.3676" value={form.latitude} />
                  </label>
                  <label>
                    <span>Lengtegraad</span>
                    <input inputMode="decimal" onChange={(event) => update("longitude", event.target.value)} placeholder="4.9041" value={form.longitude} />
                  </label>
                </div>
                <label>
                  <span>Eenheden</span>
                  <select onChange={(event) => update("unitSystem", Number(event.target.value) as WeatherUnitSystem)} value={form.unitSystem}>
                    <option value={WeatherUnitSystem.Metric}>Celsius en km/u</option>
                    <option value={WeatherUnitSystem.Imperial}>Fahrenheit en mph</option>
                  </select>
                </label>
              </section>

              {validationErrors.length > 0 ? (
                <ul className="settings-validation-list" role="alert">
                  {validationErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              ) : null}
              {message && message !== location?.statusMessage ? (
                <p className="weather-location-operation-message" role="status">{message}</p>
              ) : null}

              <section className="weather-location-guidance">
                <h4>Privacy en gebruik</h4>
                <p>HomeOps gebruikt alleen deze coördinaten voor Open-Meteo. Er is geen adreszoeker, kaart, browserlocatie of locatiepermissie.</p>
                <p>Na opslaan wordt de oude cache verwijderd. Home en Agenda gebruiken de nieuwe locatie bij hun volgende laadmoment.</p>
              </section>
            </>
          ) : null}
        </div>

        <div className="weather-location-actions">
          <button disabled={busy} onClick={onClose} type="button">Annuleren</button>
          <button disabled={busy || !location?.isConfigured || loadState !== "ready"} onClick={() => void refresh()} type="button">
            {operation === "refresh" ? "Vernieuwen…" : "Weer vernieuwen"}
          </button>
          <button disabled={busy || loadState !== "ready"} onClick={() => void save()} type="button">
            {operation === "save" ? "Opslaan…" : "Locatie opslaan"}
          </button>
        </div>
      </div>
    </SettingsSurfaceDialog>
  );
}

function getStatusLabel(status: WeatherProviderStatus | undefined, configured: boolean | undefined) {
  if (!configured) return "Nog niet ingesteld";
  switch (status) {
    case WeatherProviderStatus.Available: return "Beschikbaar";
    case WeatherProviderStatus.Stale: return "Verouderd";
    case WeatherProviderStatus.Unavailable: return "Niet beschikbaar";
    default: return "Wacht op verversing";
  }
}

function getStatusTone(status: WeatherProviderStatus | undefined) {
  return status === WeatherProviderStatus.Available ? "success" : status === WeatherProviderStatus.Unavailable ? "error" : "pending";
}

function formatRefreshTime(value: Date | undefined) {
  return value instanceof Date
    ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "Nog niet ververst";
}
