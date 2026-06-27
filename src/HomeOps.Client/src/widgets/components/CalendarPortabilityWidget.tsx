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
  const [exportSummary, setExportSummary] = useState<string>('No backup saved in this session yet.');
  const [restoreDocument, setRestoreDocument] = useState<CalendarExportDocument | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<string>('Choose a calendar backup file before restoring.');
  const [status, setStatus] = useState<RestoreStatus | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleExport() {
    setIsBusy(true);
    setStatus(null);
    try {
      const document = await createCalendarPortabilityClient().exportCalendar();
      const summary = summarizeCalendarExport(document);
      setExportSummary(`Backup saved at ${summary.exportedUtc} with ${summary.eventSeriesCount} calendar items.`);
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
      setRestoreSummary(`Backup from ${summary.exportedUtc} with ${summary.eventSeriesCount} calendar items.`);
    } catch (error) {
      setRestoreSummary('This backup file cannot be restored.');
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    }
  }

  async function handleRestore() {
    if (!restoreDocument || !restoreConfirmed) {
      setStatus({ kind: 'error', message: 'Confirm that restore will replace the current household calendar before continuing.', validationErrors: [] });
      return;
    }
    setIsBusy(true);
    setStatus(null);
    try {
      await createCalendarPortabilityClient().restoreCalendar(restoreDocument);
      setStatus({ kind: 'success', message: 'Household calendar restored successfully.', validationErrors: [] });
    } catch (error) {
      setStatus({ kind: 'error', message: getFriendlyCalendarPortabilityError(error), validationErrors: getValidationErrors(error) });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="calendar-portability-widget" aria-label="Calendar backup and restore">
      <p className="widget-type">Household maintenance</p>
      <h3>Calendar</h3>
      <p className="calendar-portability-intro">Save a backup of the household calendar or restore one when you need to replace it.</p>
      <div className="calendar-portability-actions">
        <div>
          <h4>Save a backup</h4>
          <p>Download a copy of the current household calendar.</p>
        </div>
        <button disabled={isBusy} onClick={handleExport} type="button">Export calendar</button>
        <span>{exportSummary}</span>
      </div>
      <div className="calendar-portability-actions calendar-restore-actions">
        <div>
          <h4>Restore from a backup</h4>
          <p className="restore-warning">Restore replaces the current household calendar with the selected backup. It does not merge calendars.</p>
        </div>
        <label>
          Choose backup file
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
          I understand restore replaces the current household calendar.
        </label>
        <button disabled={isBusy || !restoreDocument || !restoreConfirmed} onClick={handleRestore} type="button">Restore calendar</button>
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
