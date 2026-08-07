import { useEffect, useState } from 'react';
import type { CalendarFieldSetPayload } from '../agenda/calendarFieldMapper';
import { useHouseholdTimeZone } from '../households/HouseholdTimeZoneContext';
import { SettingsSurfaceDialog } from './SettingsDashboard';
import { applyCalendarRepair, loadCalendarRepairCandidates, previewCalendarRepair, type CalendarRepairCandidate, type CalendarRepairPreview } from './calendarRepairApi';

export function CalendarRepairDialog({ onClose }: { onClose(): void }) {
  const timeZoneId = useHouseholdTimeZone();
  const [candidates, setCandidates] = useState<CalendarRepairCandidate[]>([]);
  const [selected, setSelected] = useState<CalendarRepairCandidate | null>(null);
  const [timing, setTiming] = useState<CalendarFieldSetPayload | null>(null);
  const [preview, setPreview] = useState<CalendarRepairPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState('Kandidaten laden…');
  const [busy, setBusy] = useState(true);

  useEffect(() => { void reload(); }, []);

  async function reload() {
    setBusy(true); setPreview(null); setConfirmed(false);
    try {
      const loaded = await loadCalendarRepairCandidates();
      setCandidates(loaded);
      selectCandidate(loaded[0] ?? null);
      setStatus(loaded.length ? `${loaded.length} afspraak${loaded.length === 1 ? '' : 'en'} vraagt om controle.` : 'Er zijn geen oude afspraken die controle nodig hebben.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Kalendercontrole kon niet worden geladen.'); }
    finally { setBusy(false); }
  }

  function selectCandidate(candidate: CalendarRepairCandidate | null) {
    setSelected(candidate); setPreview(null); setConfirmed(false);
    setTiming(candidate ? { startDate: candidate.startDate, startTime: candidate.startTime, endDate: candidate.endDate, endTime: candidate.endTime, isAllDay: candidate.isAllDay } : null);
  }

  async function handlePreview() {
    if (!selected || !timing) return;
    setBusy(true); setConfirmed(false);
    try { setPreview(await previewCalendarRepair(selected.eventId, timing)); setStatus('Controleer de projectie en bevestig daarna de correctie.'); }
    catch (error) { setPreview(null); setStatus(error instanceof Error ? error.message : 'Voorbeeld kon niet worden gemaakt.'); }
    finally { setBusy(false); }
  }

  async function handleApply() {
    if (!selected || !timing || !preview || !confirmed) return;
    setBusy(true);
    try {
      await applyCalendarRepair(selected, timing);
      const remaining = candidates.filter((candidate) => candidate.eventId !== selected.eventId);
      setCandidates(remaining); selectCandidate(remaining[0] ?? null);
      setStatus(remaining.length ? 'Correctie opgeslagen. Controleer de volgende afspraak.' : 'Alle kalendercorrecties zijn afgerond.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Correctie kon niet worden opgeslagen.'); }
    finally { setBusy(false); }
  }

  return <SettingsSurfaceDialog title="Kalendercontrole" description={`Controleer oude handmatige afspraken in de gezinstijdzone ${timeZoneId}.`} onClose={onClose}>
    <div className="calendar-repair-flow">
      <p role="status" className="settings-surface-status">{status}</p>
      {candidates.length ? <label className="settings-file-field"><span>Afspraak</span><select disabled={busy} value={selected?.eventId ?? ''} onChange={(event) => selectCandidate(candidates.find((candidate) => candidate.eventId === event.target.value) ?? null)}>{candidates.map((candidate) => <option key={candidate.eventId} value={candidate.eventId}>{candidate.title} · {candidate.startDate}</option>)}</select></label> : null}
      {timing ? <fieldset className="calendar-repair-fields" disabled={busy}><legend>Gecorrigeerde kalenderwaarden</legend>
        <label><span>Startdatum</span><input type="date" value={timing.startDate} onChange={(event) => setTiming({ ...timing, startDate: event.target.value })} /></label>
        <label><span>Starttijd</span><input type="time" disabled={timing.isAllDay} value={timing.startTime ?? ''} onChange={(event) => setTiming({ ...timing, startTime: event.target.value || null })} /></label>
        <label><span>Einddatum</span><input type="date" value={timing.endDate} onChange={(event) => setTiming({ ...timing, endDate: event.target.value })} /></label>
        <label><span>Eindtijd</span><input type="time" disabled={timing.isAllDay} value={timing.endTime ?? ''} onChange={(event) => setTiming({ ...timing, endTime: event.target.value || null })} /></label>
        <label className="settings-restore-confirmation"><input type="checkbox" checked={timing.isAllDay} onChange={(event) => setTiming({ ...timing, isAllDay: event.target.checked, startTime: event.target.checked ? null : timing.startTime, endTime: event.target.checked ? null : timing.endTime })} /><span>Hele dag</span></label>
      </fieldset> : null}
      {preview ? <section className="settings-surface-card" aria-label="Projectievoorbeeld"><h4>Voorbeeld</h4><p>Start: {preview.proposedStartUtc}</p><p>Einde: {preview.proposedEndUtc}</p><label className="settings-restore-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>Ik bevestig deze correctie voor één afspraak.</span></label></section> : null}
      <div className="settings-surface-actions"><button type="button" onClick={onClose}>Sluiten</button><button type="button" disabled={busy} onClick={() => void reload()}>Opnieuw laden</button><button type="button" disabled={busy || !timing} onClick={() => void handlePreview()}>Voorbeeld maken</button><button type="button" disabled={busy || !preview || !confirmed} onClick={() => void handleApply()}>Correctie opslaan</button></div>
    </div>
  </SettingsSurfaceDialog>;
}
