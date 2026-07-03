import { ChangeEvent, useId, useMemo, useState, type ReactNode } from "react";
import { CalendarExportDocument } from "../api/homeOpsApiClient";
import {
  createCalendarPortabilityClient,
  downloadCalendarExport,
  getFriendlyCalendarPortabilityError,
  getValidationErrors,
  parseCalendarExportJson,
  summarizeCalendarExport,
} from "../calendarPortability";
import { FamilyBoardIcon } from "../design";
import { WidgetRenderer } from "../widgets/WidgetRenderer";
import { getWidgetDefinition } from "../widgets/widgetCatalog";
import type { WidgetInstance } from "../widgets/widgetModel";

interface RestoreStatus {
  kind: "success" | "error";
  message: string;
  validationErrors: readonly string[];
}

interface SettingsDashboardProps {
  widgetInstances: readonly WidgetInstance[];
}

type SettingsSurface = "details" | "restore" | "settings" | null;

export function SettingsDashboard({ widgetInstances }: SettingsDashboardProps) {
  const [activeSurface, setActiveSurface] = useState<SettingsSurface>(null);
  const [exportSummary, setExportSummary] = useState("Nog geen back-up opgeslagen in deze sessie.");
  const [restoreDocument, setRestoreDocument] = useState<CalendarExportDocument | null>(null);
  const [restoreSummary, setRestoreSummary] = useState("Open Herstellen om eerst een back-upbestand te controleren.");
  const [status, setStatus] = useState<RestoreStatus | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const additionalWidgets = useMemo(
    () =>
      widgetInstances
        .filter((instance) => instance.widgetDefinitionId !== "calendar-portability-admin")
        .flatMap((instance) => {
          const definition = getWidgetDefinition(instance.widgetDefinitionId);
          return definition ? [{ definition, instance }] : [];
        }),
    [widgetInstances],
  );

  const needsAttention = status?.kind === "error";
  const backupReady = exportSummary.startsWith("Back-up opgeslagen op");
  const restoreReady = restoreDocument !== null;
  const hasAdditionalSettings = additionalWidgets.length > 0;

  const restoreReadinessSummary = restoreReady
    ? restoreConfirmed
      ? "Back-up staat klaar om veilig te herstellen."
      : "Back-up is geladen en wacht op bevestiging in het herstelpaneel."
    : "Herstellen opent in een begrensd paneel met controle vooraf.";
  const configurationSummary = hasAdditionalSettings
    ? `${additionalWidgets.length} extra gezinsinstelling${additionalWidgets.length === 1 ? "" : "en"} beschikbaar voor rustig onderhoud.`
    : "Gezinsinstellingen staan klaar zonder extra onderhoudsmeldingen.";
  const maintenanceSummary = status?.kind === "error"
    ? "Controleer de melding hieronder voordat je verdergaat."
    : status?.kind === "success"
      ? status.message
      : "Geen actieve onderhoudsmeldingen.";
  const statusTitle = status?.kind === "error"
    ? "Actieve waarschuwing"
    : status?.kind === "success"
      ? "Laatste onderhoud"
      : "Onderhoudsmelding";
  const statusMessage = status?.message ?? "Alles staat klaar voor rustig gezinsonderhoud.";

  async function handleExport() {
    setIsBusy(true);
    setStatus(null);

    try {
      const document = await createCalendarPortabilityClient().exportCalendar();
      const summary = summarizeCalendarExport(document);
      setExportSummary(`Back-up opgeslagen op ${summary.exportedUtc} met ${summary.eventSeriesCount} agenda-items.`);
      setStatus({ kind: "success", message: "Nieuwe back-up is opgeslagen.", validationErrors: [] });
      downloadCalendarExport(document);
    } catch (error) {
      setStatus({ kind: "error", message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setStatus(null);
    setRestoreDocument(null);
    setRestoreConfirmed(false);
    setRestoreSummary("Open Herstellen om eerst een back-upbestand te controleren.");

    if (!file) {
      return;
    }

    try {
      const document = parseCalendarExportJson(await file.text());
      const summary = summarizeCalendarExport(document);
      setRestoreDocument(document);
      setRestoreSummary(`Back-up van ${summary.exportedUtc} met ${summary.eventSeriesCount} agenda-items.`);
    } catch (error) {
      setRestoreSummary("Dit back-upbestand kan niet worden hersteld.");
      setStatus({ kind: "error", message: getFriendlyCalendarPortabilityError(error), validationErrors: [] });
    }
  }

  async function handleRestore() {
    if (!restoreDocument || !restoreConfirmed) {
      setStatus({
        kind: "error",
        message: "Bevestig eerst dat herstellen de huidige gezinsagenda vervangt.",
        validationErrors: [],
      });
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      await createCalendarPortabilityClient().restoreCalendar(restoreDocument);
      setStatus({ kind: "success", message: "Gezinsagenda is hersteld.", validationErrors: [] });
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarPortabilityError(error),
        validationErrors: getValidationErrors(error),
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="settings-dashboard" aria-label="Instellingen onderhoudsdashboard">
      <header className={`settings-dashboard-header ${needsAttention ? "attention" : "ready"}`}>
        <div className="settings-dashboard-header-copy">
          <p className="widget-type">Instellingen</p>
          <p className="settings-dashboard-question">Is alles in orde?</p>
          <h2>{needsAttention ? "Aandacht nodig." : "Alles is in orde."}</h2>
          <p>
            {needsAttention
              ? "Er staat een onderhoudsmelding klaar die je rustig kunt nalopen."
              : "Back-up, herstel en gezinsinstellingen blijven beschikbaar zonder dat de pagina druk wordt."}
          </p>
        </div>
        <div className="settings-dashboard-header-state" aria-label="Algemene onderhoudsstatus">
          <FamilyBoardIcon name={needsAttention ? "status.pending" : "status.ready"} size="large" />
          <span>{needsAttention ? "Onderhoud bekijken" : "Gezin klaar"}</span>
        </div>
      </header>

      <div className="settings-dashboard-main">
        <article className="settings-card settings-health-card">
          <div className="settings-card-header">
            <div>
              <p className="widget-type">Huishoudstatus</p>
              <h3>Rustig overzicht</h3>
            </div>
            <span className={`settings-tone-pill ${needsAttention ? "attention" : "ready"}`}>
              {needsAttention ? "Aandacht" : "In orde"}
            </span>
          </div>

          <dl className="settings-summary-list">
            <SettingsSummaryItem
              title="Huishoudgezondheid"
              value={maintenanceSummary}
              tone={needsAttention ? "pending" : "ready"}
            />
            <SettingsSummaryItem
              title="Laatste back-up"
              value={exportSummary}
              tone={backupReady ? "ready" : "pending"}
            />
            <SettingsSummaryItem
              title="Herstelgereedheid"
              value={restoreReadinessSummary}
              tone={restoreReady ? "ready" : "pending"}
            />
            <SettingsSummaryItem
              title="Gezinsconfiguratie"
              value={configurationSummary}
              tone="ready"
            />
          </dl>
        </article>

        <div className="settings-dashboard-secondary">
          <article className="settings-card settings-proof-card">
            <div className="settings-card-header">
              <div>
                <p className="widget-type">Onderhoudsbewijs</p>
                <h3>Back-up en herstel</h3>
              </div>
            </div>

            <div className="settings-proof-stack">
              <section>
                <h4>Back-upstatus</h4>
                <p>{exportSummary}</p>
              </section>
              <section>
                <h4>Herstelstatus</h4>
                <p>{restoreSummary}</p>
              </section>
              <section>
                <h4>Gezinsinstellingen</h4>
                <p>{configurationSummary}</p>
              </section>
            </div>
          </article>

          <article className={`settings-card settings-status-card ${status?.kind ?? "idle"}`}>
            <div className="settings-card-header">
              <div>
                <p className="widget-type">Status en validatie</p>
                <h3>{statusTitle}</h3>
              </div>
            </div>

            <div className="settings-status-slot" role={status?.kind === "error" ? "alert" : "status"}>
              <p>{statusMessage}</p>
              {status?.validationErrors.length ? (
                <ul className="settings-validation-list">
                  {status.validationErrors.map((validationError) => (
                    <li key={validationError}>{validationError}</li>
                  ))}
                </ul>
              ) : (
                <p className="settings-status-hint">
                  Gedetailleerde validatie blijft beschikbaar in een begrensd paneel wanneer dat nodig is.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>

      <footer className="settings-action-rail">
        <div className="settings-action-rail-summary">
          <p className="widget-type">Onderhoudsrail</p>
          <p>{status?.kind === "error" ? status.message : exportSummary}</p>
        </div>
        <div className="settings-action-rail-buttons">
          <button disabled={isBusy} onClick={() => void handleExport()} type="button">
            Back-up maken
          </button>
          <button disabled={isBusy} onClick={() => setActiveSurface("restore")} type="button">
            Herstellen
          </button>
          <button onClick={() => setActiveSurface("details")} type="button">
            Onderhoudsdetails
          </button>
          {hasAdditionalSettings ? (
            <button onClick={() => setActiveSurface("settings")} type="button">
              Gezinsinstellingen
            </button>
          ) : null}
        </div>
      </footer>

      {activeSurface === "details" ? (
        <SettingsSurfaceDialog
          description="Bekijk de rustige onderhoudssamenvatting zonder de hoofdpagina te verlengen."
          onClose={() => setActiveSurface(null)}
          title="Onderhoudsdetails"
        >
          <div className="settings-surface-grid">
            <section className="settings-surface-card">
              <h4>Laatste back-up</h4>
              <p>{exportSummary}</p>
            </section>
            <section className="settings-surface-card">
              <h4>Herstelgereedheid</h4>
              <p>{restoreReadinessSummary}</p>
            </section>
            <section className="settings-surface-card">
              <h4>Actieve status</h4>
              <p>{statusMessage}</p>
            </section>
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "restore" ? (
        <SettingsSurfaceDialog
          description="Kies rustig een back-up, controleer de waarschuwing en herstel pas na bevestiging."
          onClose={() => setActiveSurface(null)}
          title="Herstellen vanuit back-up"
        >
          <div className="settings-restore-flow">
            <section className="settings-surface-card">
              <h4>Geselecteerde back-up</h4>
              <p>{restoreSummary}</p>
            </section>

            <label className="settings-file-field">
              <span>Back-upbestand kiezen</span>
              <input
                accept="application/json,.json"
                disabled={isBusy}
                onChange={(event) => void handleFileChange(event)}
                type="file"
              />
            </label>

            <section className="settings-restore-warning">
              <h4>Voorzichtig herstellen</h4>
              <p>Herstellen vervangt de huidige gezinsagenda door de gekozen back-up. Agenda’s worden niet samengevoegd.</p>
            </section>

            <label className="settings-restore-confirmation">
              <input
                checked={restoreConfirmed}
                disabled={isBusy || !restoreDocument}
                onChange={(event) => setRestoreConfirmed(event.target.checked)}
                type="checkbox"
              />
              <span>Ik begrijp dat herstellen de huidige gezinsagenda vervangt.</span>
            </label>

            <div className="settings-surface-status" role={status?.kind === "error" ? "alert" : "status"}>
              <p>{statusMessage}</p>
              {status?.validationErrors.length ? (
                <ul className="settings-validation-list">
                  {status.validationErrors.map((validationError) => (
                    <li key={validationError}>{validationError}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="settings-surface-actions">
              <button onClick={() => setActiveSurface(null)} type="button">
                Sluiten
              </button>
              <button
                disabled={isBusy || !restoreDocument || !restoreConfirmed}
                onClick={() => void handleRestore()}
                type="button"
              >
                Agenda herstellen
              </button>
            </div>
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "settings" ? (
        <SettingsSurfaceDialog
          description="Open aanvullende gezinsinstellingen in een begrensd paneel."
          onClose={() => setActiveSurface(null)}
          title="Gezinsinstellingen"
        >
          <div className="settings-extra-widget-list">
            {additionalWidgets.map(({ definition, instance }) => (
              <WidgetRenderer definition={definition} instance={instance} key={instance.id} />
            ))}
          </div>
        </SettingsSurfaceDialog>
      ) : null}
    </section>
  );
}

function SettingsSummaryItem({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "ready" | "pending";
}) {
  return (
    <div className="settings-summary-item">
      <dt>
        <FamilyBoardIcon name={tone === "ready" ? "status.ready" : "status.pending"} size="small" />
        <span>{title}</span>
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

interface SettingsSurfaceDialogProps {
  children: ReactNode;
  description: string;
  onClose(): void;
  title: string;
}

function SettingsSurfaceDialog({ children, description, onClose, title }: SettingsSurfaceDialogProps) {
  const titleId = useId();

  return (
    <div className="settings-surface-backdrop" onClick={onClose} role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="settings-surface-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="settings-surface-header">
          <div>
            <p className="widget-type">Gezinsonderhoud</p>
            <h3 id={titleId}>{title}</h3>
            <p>{description}</p>
          </div>
          <button aria-label={`${title} sluiten`} onClick={onClose} type="button">
            <FamilyBoardIcon name="core.close" size="small" />
          </button>
        </header>
        <div className="settings-surface-body">{children}</div>
      </section>
    </div>
  );
}
