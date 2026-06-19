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
  const [exportSummary, setExportSummary] = useState<string>('No export loaded yet.');
  const [restoreDocument, setRestoreDocument] = useState<CalendarExportDocument | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<string>('Choose a local JSON export file before restoring.');
  const [status, setStatus] = useState<RestoreStatus | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleExport() {
    setIsBusy(true);
    setStatus(null);
    try {
      const document = await createCalendarPortabilityClient().exportCalendar();
      const summary = summarizeCalendarExport(document);
      setExportSummary(`Version ${summary.schemaVersion}.${summary.payloadVersion} exported at ${summary.exportedUtc} with ${summary.eventSeriesCount} EventSeries records.`);
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
      setRestoreSummary(`Version ${summary.schemaVersion}.${summary.payloadVersion} exported at ${summary.exportedUtc} with ${summary.eventSeriesCount} EventSeries records.`);
    } catch (error) {
      setRestoreSummary('The selected file cannot be restored.');
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    }
  }

  async function handleRestore() {
    if (!restoreDocument || !restoreConfirmed) {
      setStatus({ kind: 'error', message: 'Confirm that restore will replace existing calendar data before continuing.', validationErrors: [] });
      return;
    }
    setIsBusy(true);
    setStatus(null);
    try {
      await createCalendarPortabilityClient().restoreCalendar(restoreDocument);
      setStatus({ kind: 'success', message: 'Calendar restore completed successfully.', validationErrors: [] });
    } catch (error) {
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: getValidationErrors(error) });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="calendar-portability-widget" aria-label="Calendar export and restore">
      <p className="widget-type">Calendar administration</p>
      <h3>Calendar export / restore</h3>
      <p className="restore-warning">Destructive warning: restore replaces all existing local calendar event sources and EventSeries data with the selected JSON export. This is a full restore, not a merge.</p>
      <div className="calendar-portability-actions">
        <button disabled={isBusy} onClick={handleExport} type="button">Export calendar</button>
        <span>{exportSummary}</span>
      </div>
      <div className="calendar-portability-actions">
        <label>
          Import JSON export
          <input accept="application/json,.json" disabled={isBusy} onChange={handleFileChange} type="file" />
        </label>
        <span>{restoreSummary}</span>
      </div>
      <label className="restore-confirmation">
        <input
          checked={restoreConfirmed}
          disabled={isBusy || !restoreDocument}
          onChange={(event) => setRestoreConfirmed(event.target.checked)}
          type="checkbox"
        />
        I understand this full restore replaces existing calendar data.
      </label>
      <button disabled={isBusy || !restoreDocument || !restoreConfirmed} onClick={handleRestore} type="button">Restore calendar data</button>
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
