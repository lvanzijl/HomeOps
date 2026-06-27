import { ChangeEvent, useState } from 'react';
import { CalendarExportDocument } from '../../api/homeOpsApiClient';
import {
  createCalendarPortabilityClient,
  downloadCalendarExport,
  getFriendlyCalendarPortabilityError,
  getValidationErrors,
  parseCalendarExportJson,
  summarizeCalendarExport,
} from '../../calendarPortability';

interface RestoreStatus {
  kind: 'success' | 'error';
  message: string;
  validationErrors: readonly string[];
}

export function CalendarPortabilityWidget() {
  const [exportSummary, setExportSummary] = useState<string>('Nog geen back-up opgeslagen in deze sessie.');
  const [restoreDocument, setRestoreDocument] = useState<CalendarExportDocument | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<string>('Kies eerst een agenda-back-upbestand voordat je herstelt.');
  const [status, setStatus] = useState<RestoreStatus | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleExport() {
    setIsBusy(true);
    setStatus(null);
    try {
      const document = await createCalendarPortabilityClient().exportCalendar();
      const summary = summarizeCalendarExport(document);
      setExportSummary(`Back-up opgeslagen op ${summary.exportedUtc} met ${summary.eventSeriesCount} agenda-items.`);
      downloadCalendarExport(document);
    } catch (error) {
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStatus(null);
    setRestoreDocument(null);
    setRestoreConfirmed(false);
    if (!file) return;

    try {
      const document = parseCalendarExportJson(await file.text());
      const summary = summarizeCalendarExport(document);
      setRestoreDocument(document);
      setRestoreSummary(`Back-up van ${summary.exportedUtc} met ${summary.eventSeriesCount} agenda-items.`);
    } catch (error) {
      setRestoreSummary('Dit back-upbestand kan niet worden hersteld.');
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    }
  }

  async function handleRestore() {
    if (!restoreDocument || !restoreConfirmed) {
      setStatus({ kind: 'error', message: 'Bevestig eerst dat herstellen de huidige gezinsagenda vervangt.', validationErrors: [] });
      return;
    }
    setIsBusy(true);
    setStatus(null);
    try {
      await createCalendarPortabilityClient().restoreCalendar(restoreDocument);
      setStatus({ kind: 'success', message: 'Gezinsagenda is hersteld.', validationErrors: [] });
    } catch (error) {
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: getValidationErrors(error) });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="calendar-portability-widget" aria-label="Agenda back-up en herstel">
      <p className="widget-type">Gezinsonderhoud</p>
      <h3>Agenda</h3>
      <p className="calendar-portability-intro">Sla een back-up van de gezinsagenda op of herstel er één wanneer je de agenda moet vervangen.</p>
      <div className="calendar-portability-actions">
        <div>
          <h4>Back-up opslaan</h4>
          <p>Download een kopie van de huidige gezinsagenda.</p>
        </div>
        <button disabled={isBusy} onClick={handleExport} type="button">Agenda exporteren</button>
        <span>{exportSummary}</span>
      </div>
      <div className="calendar-portability-actions calendar-restore-actions">
        <div>
          <h4>Herstellen vanuit back-up</h4>
          <p className="restore-warning">Herstellen vervangt de huidige gezinsagenda door de gekozen back-up. Agenda’s worden niet samengevoegd.</p>
        </div>
        <label>
          Back-upbestand kiezen
          <input accept="application/json,.json" disabled={isBusy} onChange={handleFileChange} type="file" />
        </label>
        <span>{restoreSummary}</span>
        <label className="restore-confirmation">
          <input
            checked={restoreConfirmed}
            disabled={isBusy || !restoreDocument}
            onChange={(event) => setRestoreConfirmed(event.target.checked)}
            type="checkbox"
          />
          Ik begrijp dat herstellen de huidige gezinsagenda vervangt.
        </label>
        <button disabled={isBusy || !restoreDocument || !restoreConfirmed} onClick={handleRestore} type="button">Agenda herstellen</button>
      </div>
      {status && (
        <div className={`calendar-portability-status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          <p>{status.message}</p>
          {status.validationErrors.length > 0 && (
            <ul>{status.validationErrors.map((validationError) => <li key={validationError}>{validationError}</li>)}</ul>
          )}
        </div>
      )}
    </section>
  );
}
