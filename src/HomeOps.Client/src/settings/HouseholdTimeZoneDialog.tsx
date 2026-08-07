import { useEffect, useState } from 'react';
import { SettingsSurfaceDialog } from './SettingsDashboard';
import {
  HouseholdTimeZoneApiError,
  loadHouseholdTimeZone,
  previewHouseholdTimeZone,
  searchTimeZones,
  updateHouseholdTimeZone,
  type HouseholdTimeZonePreview,
  type HouseholdTimeZoneSourceFailure,
  type SupportedTimeZone,
} from './householdTimeZoneApi';

export function HouseholdTimeZoneDialog({ onClose, onChanged }: { onClose(): void; onChanged(timeZoneId: string): void }) {
  const [currentZone, setCurrentZone] = useState('');
  const [query, setQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [matches, setMatches] = useState<SupportedTimeZone[]>([]);
  const [preview, setPreview] = useState<HouseholdTimeZonePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFailures, setSourceFailures] = useState<HouseholdTimeZoneSourceFailure[]>([]);

  useEffect(() => {
    let ignore = false;
    loadHouseholdTimeZone().then((value) => {
      if (!ignore) { setCurrentZone(value.timeZoneId); setSelectedZone(value.timeZoneId); setQuery(value.timeZoneId); setBusy(false); }
    }).catch(() => { if (!ignore) { setError('De huidige tijdzone kon niet worden geladen.'); setBusy(false); } });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (busy) return;
    let ignore = false;
    const timer = window.setTimeout(() => {
      searchTimeZones(query).then((values) => { if (!ignore) setMatches(values); }).catch(() => { if (!ignore) setError('De lijst met tijdzones kon niet worden geladen.'); });
    }, 150);
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [busy, query]);

  function selectZone(zone: SupportedTimeZone) {
    setSelectedZone(zone.id);
    setQuery(zone.id);
    setPreview(null);
    setConfirmed(false);
    setSourceFailures([]);
  }

  async function previewChange() {
    setBusy(true); setError(null); setSourceFailures([]); setConfirmed(false);
    try { setPreview(await previewHouseholdTimeZone(selectedZone)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'De gevolgen konden niet worden geladen.'); }
    finally { setBusy(false); }
  }

  async function applyChange() {
    if (!preview || !confirmed) return;
    setBusy(true); setError(null); setSourceFailures([]);
    try {
      const result = await updateHouseholdTimeZone(preview.newTimeZoneId, preview.currentTimeZoneId);
      setCurrentZone(result.timeZoneId);
      onChanged(result.timeZoneId);
      onClose();
    } catch (reason) {
      const apiError = reason instanceof HouseholdTimeZoneApiError ? reason : null;
      setError(apiError?.message ?? 'De tijdzone kon niet worden gewijzigd.');
      setSourceFailures(apiError?.result?.sourceFailures ?? []);
    } finally { setBusy(false); }
  }

  return <SettingsSurfaceDialog description="Kies de IANA-tijdzone die de kalenderdatums en kloktijden van dit huishouden bepaalt." onClose={busy ? () => {} : onClose} title="Huishoudtijdzone">
    <div className="household-time-zone-flow">
      <section className="settings-surface-card"><h4>Huidige tijdzone</h4><p><strong>{currentZone || 'Laden…'}</strong></p></section>
      <label className="settings-file-field">
        <span>Tijdzone zoeken</span>
        <input aria-controls="household-time-zone-results" autoComplete="off" disabled={busy} onChange={(event) => { setQuery(event.target.value); setSelectedZone(''); setPreview(null); }} placeholder="Bijvoorbeeld Europe/Amsterdam" value={query} />
      </label>
      <ul className="household-time-zone-results" id="household-time-zone-results">
        {matches.map((zone) => <li key={zone.id}><button aria-pressed={selectedZone === zone.id} disabled={busy} onClick={() => selectZone(zone)} type="button"><strong>{zone.id}</strong><span>{zone.utcOffset} · {zone.displayName}</span></button></li>)}
      </ul>
      <div className="settings-surface-actions"><button disabled={busy || !selectedZone || selectedZone === currentZone} onClick={() => void previewChange()} type="button">Gevolgen bekijken</button></div>
      {preview ? <section className="household-time-zone-preview" aria-label="Gevolgen van tijdzonewijziging">
        <h4>Wat verandert er?</h4>
        <dl>
          <Impact label="Handmatige afspraken met tijd" value={preview.impact.manualTimedEventCount} />
          <Impact label="Handmatige afspraken voor hele dagen" value={preview.impact.manualAllDayEventCount} />
          <Impact label="Ingeschakelde importbronnen" value={preview.impact.enabledImportedSourceCount} />
          <Impact label="Uitgeschakelde importbronnen" value={preview.impact.disabledImportedSourceCount} />
        </dl>
        <ul>{preview.explanations.map((explanation) => <li key={explanation}>{explanation}</li>)}</ul>
        <label className="settings-restore-confirmation"><input checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Ik begrijp deze gevolgen en wil de huishoudtijdzone wijzigen naar {preview.newTimeZoneId}.</span></label>
      </section> : null}
      {error ? <div className="settings-surface-status" role="alert"><p>{error}</p>{sourceFailures.length ? <ul className="household-time-zone-failures">{sourceFailures.map((failure) => <li key={failure.sourceId}><strong>{failure.sourceName}</strong><span>{failure.message}</span></li>)}</ul> : null}</div> : null}
      <div className="settings-surface-actions"><button disabled={busy} onClick={onClose} type="button">Annuleren</button><button disabled={busy || !preview || !confirmed} onClick={() => void applyChange()} type="button">{busy ? 'Bezig…' : 'Tijdzone wijzigen'}</button></div>
    </div>
  </SettingsSurfaceDialog>;
}

function Impact({ label, value }: { label: string; value: number }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
