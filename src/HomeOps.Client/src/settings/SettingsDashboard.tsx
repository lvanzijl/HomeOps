import { ChangeEvent, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { CalendarExportDocument } from "../api/homeOpsApiClient";
import {
  createCalendarSource,
  archiveCalendarSource,
  createCalendarSourceFormValues,
  deleteCalendarSource,
  formatCalendarSourceDateTime,
  formatCalendarSourceSyncSummary,
  getCalendarSourcePollIntervalLabel,
  getCalendarSourceStateLabel,
  getCalendarSourceStateTone,
  getCalendarSourceStatusMessage,
  getCalendarSourceTypeLabel,
  getCalendarSourceValidationErrors,
  getFriendlyCalendarSourceError,
  hasCalendarSourceAttention,
  hasOnlyManualCalendarSource,
  loadCalendarSources,
  refreshAllCalendarSources,
  refreshCalendarSource,
  replaceCalendarSourceFile,
  restoreCalendarSource,
  setCalendarSourceEnabled,
  updateCalendarSource,
  type CalendarSource,
  type CalendarSourceFormValues,
  type CalendarSourceRefreshResult,
} from "../calendarSources/calendarSourcesApi";
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
import { PeopleManagement } from "../knownPeople/PeopleManagement";
import { WoningManagement } from "./WoningManagement";
import { FamilyAdministration } from "./FamilyAdministration";
import type { FamilyMember } from "../home/familyMembers";
import { CalendarRepairDialog } from './CalendarRepairDialog';
import { HouseholdTimeZoneDialog } from './HouseholdTimeZoneDialog';

interface MaintenanceStatus {
  kind: "success" | "error";
  message: string;
  validationErrors: readonly string[];
  refreshResults?: readonly CalendarSourceRefreshResult[];
}

interface SettingsDashboardProps {
  widgetInstances: readonly WidgetInstance[];
  members?: readonly FamilyMember[];
  onCalendarSourcesChanged?(sources: readonly CalendarSource[]): void;
  onFamilyMembersChanged?(): Promise<void>;
  onHouseholdTimeZoneChanged?(timeZoneId: string): void;
}

type SettingsSurface =
  | "details"
  | "restore"
  | "settings"
  | "createSource"
  | "editSource"
  | "deleteSource"
  | "archiveSource"
  | "replaceFile"
  | "people"
  | "woning"
  | "family"
  | "calendarRepair"
  | "timeZone"
  | null;

export function SettingsDashboard({ widgetInstances, members = [], onCalendarSourcesChanged, onFamilyMembersChanged = async () => {}, onHouseholdTimeZoneChanged = () => {} }: SettingsDashboardProps) {
  const [activeSurface, setActiveSurface] = useState<SettingsSurface>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState<CalendarSourceFormValues>(() => createCalendarSourceFormValues());
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [busySourceId, setBusySourceId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [exportSummary, setExportSummary] = useState("Nog geen back-up opgeslagen in deze sessie.");
  const [restoreDocument, setRestoreDocument] = useState<CalendarExportDocument | null>(null);
  const [restoreSummary, setRestoreSummary] = useState("Open Herstellen om eerst een back-upbestand te controleren.");
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [isPortabilityBusy, setIsPortabilityBusy] = useState(false);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

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

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? null,
    [selectedSourceId, sources],
  );

  const backupReady = exportSummary.startsWith("Back-up opgeslagen op");
  const restoreReady = restoreDocument !== null;
  const hasAdditionalSettings = additionalWidgets.length > 0;
  const hasSourceAttention = hasCalendarSourceAttention(sources);
  const onlyManualSource = hasOnlyManualCalendarSource(sources);
  const needsAttention = status?.kind === "error" || hasSourceAttention;
  const sourceCount = sources.length;
  const visibleSourceCount = sources.filter((source) => source.canDisplayEvents).length;
  const actionableSourceCount = sources.filter((source) => source.type === "iCalFeed" || source.type === "iCalFile").length;
  const anySourcesBusy = isLoadingSources || isSavingSource || busySourceId !== null || isRefreshingAll;

  const restoreReadinessSummary = restoreReady
    ? restoreConfirmed
      ? "Back-up staat klaar om veilig te herstellen."
      : "Back-up is geladen en wacht op je bevestiging."
    : "Kies een back-up om het herstel te controleren.";
  const configurationSummary = hasAdditionalSettings
    ? `${additionalWidgets.length} extra gezinsinstelling${additionalWidgets.length === 1 ? "" : "en"} beschikbaar.`
    : "Er zijn nu geen extra gezinsinstellingen.";
  const sourceSummary = isLoadingSources
    ? "Kalenderbronnen laden…"
    : onlyManualSource
      ? "Alleen je gezinsagenda staat klaar. Voeg een iCal-bron toe om andere agenda’s te importeren."
      : `${sourceCount} bronnen ingesteld, ${visibleSourceCount} zichtbaar in de agenda.`;
  const statusTitle = status?.refreshResults?.length
    ? "Laatste verversing"
    : status?.kind === "error"
      ? "Waarschuwing"
      : status?.kind === "success"
        ? "Laatste actie"
        : "Activiteit";
  const statusMessage = status?.message
    ?? (hasSourceAttention
      ? `${sources.filter((source) => source.enabled && source.state === "failed").length} kalenderbron${sources.filter((source) => source.enabled && source.state === "failed").length === 1 ? " heeft" : "nen hebben"} aandacht nodig.`
      : "Alles staat klaar.");

  useEffect(() => {
    void reloadSources(true);
  }, []);

  async function reloadSources(showLoading = false) {
    if (showLoading) {
      setIsLoadingSources(true);
    }

    try {
      const loaded = await loadCalendarSources();
      setSources(loaded);
      onCalendarSourcesChanged?.(loaded);
      return loaded;
    } catch (error) {
      setStatus({ kind: "error", message: getFriendlyCalendarSourceError(error), validationErrors: [] });
      return null;
    } finally {
      if (showLoading) {
        setIsLoadingSources(false);
      }
    }
  }

  function closeSurface() {
    setActiveSurface(null);
    setSelectedSourceId(null);
  }

  function openCreateSource() {
    setSelectedSourceId(null);
    setSourceForm(createCalendarSourceFormValues());
    setActiveSurface("createSource");
  }

  function openEditSource(source: CalendarSource) {
    setSelectedSourceId(source.id);
    setSourceForm(createCalendarSourceFormValues(source));
    setActiveSurface("editSource");
  }

  function openDeleteSource(source: CalendarSource) {
    setSelectedSourceId(source.id);
    setActiveSurface("deleteSource");
  }

  function openArchiveSource(source: CalendarSource) {
    setSelectedSourceId(source.id);
    setActiveSurface("archiveSource");
  }

  function openReplaceFile(source: CalendarSource) {
    setSelectedSourceId(source.id);
    setReplacementFile(null);
    setActiveSurface("replaceFile");
  }

  async function handleExport() {
    setIsPortabilityBusy(true);
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
      setIsPortabilityBusy(false);
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

    setIsPortabilityBusy(true);
    setStatus(null);

    try {
      await createCalendarPortabilityClient().restoreCalendar(restoreDocument);
      setStatus({ kind: "success", message: "Gezinsagenda is hersteld.", validationErrors: [] });
      void reloadSources();
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarPortabilityError(error),
        validationErrors: getValidationErrors(error),
      });
    } finally {
      setIsPortabilityBusy(false);
    }
  }

  async function handleSaveSource() {
    setIsSavingSource(true);
    setStatus(null);

    try {
      const saved = activeSurface === "editSource" && selectedSource
        ? await updateCalendarSource(selectedSource.id, sourceForm)
        : await createCalendarSource(sourceForm);

      setSources((current) => {
        const next = activeSurface === "editSource"
          ? current.map((source) => (source.id === saved.id ? saved : source)).sort(compareCalendarSources)
          : [...current, saved].sort(compareCalendarSources);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({
        kind: "success",
        message: activeSurface === "editSource" ? `${saved.name} is bijgewerkt.` : `${saved.name} is toegevoegd.`,
        validationErrors: [],
      });
      closeSurface();
      void reloadSources();
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarSourceError(error),
        validationErrors: getCalendarSourceValidationErrors(error),
      });
    } finally {
      setIsSavingSource(false);
    }
  }

  async function handleDeleteSource() {
    if (!selectedSource) {
      return;
    }

    setIsSavingSource(true);
    setStatus(null);

    try {
      await deleteCalendarSource(selectedSource.id);
      setSources((current) => {
        const next = current.filter((source) => source.id !== selectedSource.id);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({ kind: "success", message: `${selectedSource.name} is verwijderd.`, validationErrors: [] });
      closeSurface();
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarSourceError(error),
        validationErrors: getCalendarSourceValidationErrors(error),
      });
    } finally {
      setIsSavingSource(false);
    }
  }

  async function handleArchiveSource() {
    if (!selectedSource) return;
    setIsSavingSource(true); setStatus(null);
    try {
      const updated = await archiveCalendarSource(selectedSource.id);
      setSources((current) => {
        const next = current.map((source) => source.id === updated.id ? updated : source).sort(compareCalendarSources);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({ kind: "success", message: `${updated.name} is gearchiveerd; geïmporteerde afspraken zijn verborgen.`, validationErrors: [] });
      closeSurface();
    } catch (error) {
      setStatus({ kind: "error", message: getFriendlyCalendarSourceError(error), validationErrors: [] });
    } finally { setIsSavingSource(false); }
  }

  async function handleRestoreSource(source: CalendarSource) {
    setBusySourceId(source.id); setStatus(null);
    try {
      const restored = await restoreCalendarSource(source.id);
      setSources((current) => {
        const next = current.map((candidate) => candidate.id === restored.id ? restored : candidate).sort(compareCalendarSources);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({ kind: "success", message: `${restored.name} is ververst en hersteld.`, validationErrors: [] });
    } catch (error) {
      setStatus({ kind: "error", message: getFriendlyCalendarSourceError(error), validationErrors: [] });
    } finally { setBusySourceId(null); }
  }

  async function handleReplaceFile() {
    if (!selectedSource || !replacementFile) return;
    setIsSavingSource(true); setStatus(null);
    try {
      const updated = await replaceCalendarSourceFile(selectedSource.id, replacementFile);
      setSources((current) => {
        const next = current.map((source) => source.id === updated.id ? updated : source).sort(compareCalendarSources);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({ kind: "success", message: `Het bestand van ${updated.name} is vervangen en opnieuw geïmporteerd.`, validationErrors: [] });
      closeSurface();
    } catch (error) {
      setStatus({ kind: "error", message: getFriendlyCalendarSourceError(error), validationErrors: [] });
    } finally { setIsSavingSource(false); }
  }

  async function handleToggleSource(source: CalendarSource, enabled: boolean) {
    setBusySourceId(source.id);
    setStatus(null);

    try {
      const updated = await setCalendarSourceEnabled(source, enabled);
      setSources((current) => {
        const next = current.map((candidate) => (candidate.id === updated.id ? updated : candidate)).sort(compareCalendarSources);
        onCalendarSourcesChanged?.(next);
        return next;
      });
      setStatus({
        kind: "success",
        message: enabled ? `${updated.name} is ingeschakeld.` : `${updated.name} is uitgeschakeld.`,
        validationErrors: [],
      });
      void reloadSources();
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarSourceError(error),
        validationErrors: getCalendarSourceValidationErrors(error),
      });
    } finally {
      setBusySourceId(null);
    }
  }

  async function handleRefreshSource(source: CalendarSource) {
    setBusySourceId(source.id);
    setStatus(null);

    try {
      const result = await refreshCalendarSource(source.id);
      const refreshed = await reloadSources();
      setStatus({
        kind: result.succeeded ? "success" : "error",
        message: `${source.name}: ${formatCalendarSourceSyncSummary(result)}`,
        validationErrors: [],
        refreshResults: [result],
      });
      if (refreshed) {
        onCalendarSourcesChanged?.(refreshed);
      }
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarSourceError(error),
        validationErrors: getCalendarSourceValidationErrors(error),
      });
    } finally {
      setBusySourceId(null);
    }
  }

  async function handleRefreshAllSources() {
    setIsRefreshingAll(true);
    setStatus(null);

    try {
      const results = await refreshAllCalendarSources();
      const refreshed = await reloadSources();
      const failedCount = results.filter((result) => !result.succeeded).length;
      const successCount = results.length - failedCount;
      setStatus({
        kind: failedCount > 0 ? "error" : "success",
        message: failedCount > 0
          ? `${successCount} bron${successCount === 1 ? "" : "nen"} ververst, ${failedCount} met aandacht.`
          : `${successCount} bron${successCount === 1 ? "" : "nen"} ververst zonder fouten.`,
        validationErrors: [],
        refreshResults: results,
      });
      if (refreshed) {
        onCalendarSourcesChanged?.(refreshed);
      }
    } catch (error) {
      setStatus({
        kind: "error",
        message: getFriendlyCalendarSourceError(error),
        validationErrors: getCalendarSourceValidationErrors(error),
      });
    } finally {
      setIsRefreshingAll(false);
    }
  }

  return (
    <section className="settings-dashboard" aria-label="Instellingenoverzicht">
      <header className={`settings-dashboard-header ${needsAttention ? "attention" : "ready"}`}>
        <div className="settings-dashboard-header-copy">
          <p className="widget-type">Instellingen</p>
          <p className="settings-dashboard-question">Is alles in orde?</p>
          <h2>{needsAttention ? "Aandacht nodig." : "Alles is in orde."}</h2>
          <p>
            {needsAttention
              ? "Controleer de kalenderbronnen of melding hieronder."
              : "Kalenderbronnen, back-ups en herstel staan hier voor je klaar."}
          </p>
        </div>
        <div className="settings-dashboard-header-state" aria-label="Algemene status">
          <FamilyBoardIcon name={needsAttention ? "status.pending" : "status.ready"} size="large" />
          <span>{needsAttention ? "Aandacht nodig" : "Klaar voor gebruik"}</span>
        </div>
      </header>

      <div className="settings-dashboard-main">
        <article className="settings-card settings-sources-card">
          <div className="settings-card-header">
            <div>
              <p className="widget-type">Kalenderbronnen</p>
              <h3>Bronnen beheren</h3>
            </div>
            <span className={`settings-tone-pill ${hasSourceAttention ? "attention" : "ready"}`}>
              {isLoadingSources ? "Laden" : hasSourceAttention ? "Aandacht" : "In orde"}
            </span>
          </div>

          <dl className="settings-summary-list">
            <SettingsSummaryItem title="Kalenderbronnen" value={sourceSummary} tone={hasSourceAttention ? "pending" : "ready"} />
            <SettingsSummaryItem title="Laatste back-up" value={exportSummary} tone={backupReady ? "ready" : "pending"} />
            <SettingsSummaryItem title="Herstelstatus" value={restoreReadinessSummary} tone={restoreReady ? "ready" : "pending"} />
            <SettingsSummaryItem title="Extra instellingen" value={configurationSummary} tone="ready" />
          </dl>

          <div className="settings-source-toolbar">
            <button disabled={anySourcesBusy} onClick={openCreateSource} type="button">
              Bron toevoegen
            </button>
            <button disabled={anySourcesBusy || actionableSourceCount === 0} onClick={() => void handleRefreshAllSources()} type="button">
              {isRefreshingAll ? "Bronnen verversen…" : "Alles verversen"}
            </button>
          </div>

          {onlyManualSource ? (
            <section className="settings-source-empty" aria-label="Lege kalenderbronnenstatus">
              <h4>Voeg een iCal-bron toe</h4>
              <p>Je handmatige gezinsagenda staat al klaar. Voeg een iCal-feed of iCal-bestand toe om extra agenda’s te importeren.</p>
            </section>
          ) : null}

          <div className="settings-source-list" role="list" aria-label="Geconfigureerde kalenderbronnen">
            {isLoadingSources ? (
              <p className="settings-source-loading" role="status">Kalenderbronnen laden…</p>
            ) : null}
            {!isLoadingSources
              ? sources.map((source) => {
                  const tone = getCalendarSourceStateTone(source);
                  const isUserManaged = source.type === "iCalFeed" || source.type === "iCalFile";
                  const isSourceBusy = busySourceId === source.id;

                  return (
                    <article className="settings-source-card" key={source.id} role="listitem">
                      <div className="settings-source-card-header">
                        <div className="settings-source-title">
                          <span aria-hidden="true" className="settings-source-icon">{source.icon}</span>
                          <div>
                            <h4>{source.name}</h4>
                            <p>{getCalendarSourceTypeLabel(source.type)}</p>
                          </div>
                        </div>
                        <span className={`settings-tone-pill ${tone === "ready" ? "ready" : tone === "attention" ? "attention" : "pending"}`}>
                          {getCalendarSourceStateLabel(source)}
                        </span>
                      </div>

                      <div className="settings-source-meta">
                        <SourceMetaItem label="Verversritme" value={getCalendarSourcePollIntervalLabel(source.pollInterval)} />
                        <SourceMetaItem label="Laatst ververst" value={source.lastSuccessfulSyncUtc ? formatCalendarSourceDateTime(source.lastSuccessfulSyncUtc) : "Nog niet ververst"} />
                        <SourceMetaItem label="Volgende poging" value={source.nextSyncAfterUtc ? formatCalendarSourceDateTime(source.nextSyncAfterUtc) : "Wacht op verversing"} />
                        <SourceMetaItem label="Status" value={getCalendarSourceStatusMessage(source)} />
                      </div>

                      <p className="settings-source-provider">{describeProviderConfiguration(source)}</p>

                      {source.lastError?.message ? (
                        <div className="settings-source-error" role="note">
                          <strong>Laatste fout</strong>
                          <p>{source.lastError.message}</p>
                        </div>
                      ) : null}

                      {source.requiresNormalization ? (
                        <div className="settings-source-error" role="note">
                          <strong>Verversen vereist</strong>
                          <p>Deze bron is nog niet verwerkt in de huidige huishoudtijdzone. Ververs hem voordat je hem inschakelt.</p>
                        </div>
                      ) : null}

                      <div className="settings-source-footer">
                        <label className="settings-source-switch">
                          <input
                            aria-label={`${source.name} ${source.enabled ? "uitschakelen" : "inschakelen"}`}
                            checked={source.enabled}
                            disabled={!isUserManaged || source.isArchived || isSourceBusy || isSavingSource}
                            onChange={(event) => void handleToggleSource(source, event.target.checked)}
                            type="checkbox"
                          />
                          <span>{source.enabled ? "Ingeschakeld" : "Uitgeschakeld"}</span>
                        </label>

                        <div className="settings-source-actions">
                          {isUserManaged ? (
                            source.isArchived ? (
                              <>
                                {source.type === "iCalFile" ? (
                                  <button disabled={isSourceBusy || isSavingSource} onClick={() => openReplaceFile(source)} type="button">
                                    Bestand koppelen
                                  </button>
                                ) : (
                                  <button disabled={isSourceBusy || isSavingSource} onClick={() => openEditSource(source)} type="button">
                                    Feed koppelen
                                  </button>
                                )}
                                <button disabled={isSourceBusy || isSavingSource} onClick={() => void handleRestoreSource(source)} type="button">
                                  {isSourceBusy ? "Herstellen…" : "Herstellen"}
                                </button>
                                <button disabled={isSourceBusy || isSavingSource} onClick={() => openDeleteSource(source)} type="button">
                                  Definitief verwijderen
                                </button>
                              </>
                            ) : (
                              <>
                                <button disabled={isSourceBusy || isSavingSource} onClick={() => openEditSource(source)} type="button">
                                  Bewerken
                                </button>
                                {source.type === "iCalFile" ? (
                                  <button disabled={isSourceBusy || isSavingSource} onClick={() => openReplaceFile(source)} type="button">
                                    Bestand vervangen
                                  </button>
                                ) : null}
                                <button disabled={isSourceBusy || isSavingSource} onClick={() => void handleRefreshSource(source)} type="button">
                                  {isSourceBusy ? "Verversen…" : "Verversen"}
                                </button>
                                <button disabled={isSourceBusy || isSavingSource} onClick={() => openArchiveSource(source)} type="button">
                                  Archiveren
                                </button>
                              </>
                            )
                          ) : (
                            <p className="settings-source-protection">Deze handmatige gezinsagenda blijft beschikbaar voor eigen afspraken.</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              : null}
          </div>
        </article>

        <div className="settings-dashboard-secondary">
          <article className="settings-card settings-proof-card">
            <div className="settings-card-header">
              <div>
                <p className="widget-type">Overzicht</p>
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
                <h4>Bronoverzicht</h4>
                <p>{sourceSummary}</p>
              </section>
            </div>
          </article>

          <article className={`settings-card settings-status-card ${status?.kind ?? "idle"}`}>
            <div className="settings-card-header">
              <div>
                <p className="widget-type">Activiteit</p>
                <h3>{statusTitle}</h3>
              </div>
            </div>

            <div className="settings-status-slot" role={status?.kind === "error" ? "alert" : "status"}>
              <p>{statusMessage}</p>
              {status?.refreshResults?.length ? (
                <ul className="settings-refresh-results">
                  {status.refreshResults.map((result) => {
                    const source = sources.find((candidate) => candidate.id === result.sourceId);
                    return (
                      <li key={`${result.sourceId}-${result.attemptedAtUtc}`}>
                        <strong>{source?.name ?? "Kalenderbron"}</strong>
                        <span>{formatCalendarSourceSyncSummary(result)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {status?.validationErrors.length ? (
                <ul className="settings-validation-list">
                  {status.validationErrors.map((validationError) => (
                    <li key={validationError}>{validationError}</li>
                  ))}
                </ul>
              ) : status?.refreshResults?.length ? null : (
                <p className="settings-status-hint">
                  Statusupdates van acties verschijnen hier.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>

      <footer className="settings-action-rail">
        <div className="settings-action-rail-summary">
          <p className="widget-type">Snelle acties</p>
          <p>{status?.kind === "error" ? status.message : hasSourceAttention ? sourceSummary : exportSummary}</p>
        </div>
        <div className="settings-action-rail-buttons">
          <button disabled={isPortabilityBusy} onClick={() => void handleExport()} type="button">
            Back-up maken
          </button>
          <button disabled={isPortabilityBusy} onClick={() => setActiveSurface("restore")} type="button">
            Herstellen
          </button>
          <button onClick={() => setActiveSurface("details")} type="button">
            Details bekijken
          </button>
          <button onClick={() => setActiveSurface("woning")} type="button">
            Woning
          </button>
          <button onClick={() => setActiveSurface("people")} type="button">
            Bekenden beheren
          </button>
          <button onClick={() => setActiveSurface("family")} type="button">
            Gezinsleden
          </button>
          <button onClick={() => setActiveSurface("calendarRepair")} type="button">
            Kalendercontrole
          </button>
          <button onClick={() => setActiveSurface("timeZone")} type="button">
            Tijdzone
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
          description="Bekijk back-up, herstel en kalenderbronnen in één overzicht."
          onClose={closeSurface}
          title="Details"
        >
          <div className="settings-surface-grid">
            <section className="settings-surface-card">
              <h4>Laatste back-up</h4>
              <p>{exportSummary}</p>
            </section>
            <section className="settings-surface-card">
              <h4>Herstelstatus</h4>
              <p>{restoreReadinessSummary}</p>
            </section>
            <section className="settings-surface-card">
              <h4>Kalenderbronnen</h4>
              <p>{sourceSummary}</p>
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
          onClose={closeSurface}
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
                disabled={isPortabilityBusy}
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
                disabled={isPortabilityBusy || !restoreDocument}
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
              <button onClick={closeSurface} type="button">
                Sluiten
              </button>
              <button
                disabled={isPortabilityBusy || !restoreDocument || !restoreConfirmed}
                onClick={() => void handleRestore()}
                type="button"
              >
                Agenda herstellen
              </button>
            </div>
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "woning" ? (
        <SettingsSurfaceDialog
          description="Beheer verdiepingen, kamers, volgorde en compacte klimaat- en plattegrondstatus."
          onClose={closeSurface}
          title="Woning"
        >
          <WoningManagement members={members} />
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "calendarRepair" ? <CalendarRepairDialog onClose={closeSurface} /> : null}

      {activeSurface === "timeZone" ? <HouseholdTimeZoneDialog onChanged={onHouseholdTimeZoneChanged} onClose={closeSurface} /> : null}

      {activeSurface === "family" ? (
        <SettingsSurfaceDialog
          description="Voeg gezinsleden toe, werk ze bij en herstel verwijderde gezinsleden zonder bestaande verwijzingen te veranderen."
          onClose={closeSurface}
          title="Gezinsleden"
        >
          <FamilyAdministration members={members} onChanged={onFamilyMembersChanged} />
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "people" ? (
        <SettingsSurfaceDialog
          description="Beheer gedeelde bekenden en bekenden per gezinslid."
          onClose={closeSurface}
          title="Bekenden"
        >
          <PeopleManagement members={members} />
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "settings" ? (
        <SettingsSurfaceDialog
          description="Bekijk aanvullende gezinsinstellingen."
          onClose={closeSurface}
          title="Gezinsinstellingen"
        >
          <div className="settings-extra-widget-list">
            {additionalWidgets.map(({ definition, instance }) => (
              <WidgetRenderer definition={definition} instance={instance} key={instance.id} />
            ))}
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "createSource" || activeSurface === "editSource" ? (
        <SettingsSurfaceDialog
          description={activeSurface === "editSource" ? "Werk naam, icoon, ritme of brongegevens bij." : "Voeg een nieuwe iCal-bron toe."}
          onClose={closeSurface}
          title={activeSurface === "editSource" ? "Kalenderbron bewerken" : "Kalenderbron toevoegen"}
        >
          <form
            className="settings-source-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveSource();
            }}
          >
            <label className="settings-file-field">
              <span>Naam</span>
              <input
                disabled={isSavingSource}
                onChange={(event) => setSourceForm((current) => ({ ...current, name: event.target.value }))}
                value={sourceForm.name}
              />
            </label>
            <label className="settings-file-field">
              <span>Icoon</span>
              <input
                disabled={isSavingSource}
                onChange={(event) => setSourceForm((current) => ({ ...current, icon: event.target.value }))}
                value={sourceForm.icon}
              />
            </label>
            <label className="settings-file-field">
              <span>Brontype</span>
              <select
                disabled={activeSurface === "editSource" || isSavingSource}
                onChange={(event) => {
                  const nextType = event.target.value as CalendarSourceFormValues["type"];
                  setSourceForm((current) => ({
                    ...current,
                    type: nextType,
                    icon: nextType === "iCalFile" ? "📄" : current.icon || "🌐",
                    providerConfiguration: nextType === "iCalFile"
                      ? { kind: "iCalFile", file: null }
                      : { kind: "iCalFeed", feedUrl: "" },
                  }));
                }}
                value={sourceForm.type}
              >
                <option value="iCalFeed">iCal-feed</option>
                <option value="iCalFile">iCal-bestand</option>
              </select>
            </label>
            <label className="settings-file-field settings-file-field-checkbox">
              <input
                checked={sourceForm.enabled}
                disabled={isSavingSource}
                onChange={(event) => setSourceForm((current) => ({ ...current, enabled: event.target.checked }))}
                type="checkbox"
              />
              <span>Direct inschakelen</span>
            </label>
            <label className="settings-file-field">
              <span>Verversritme</span>
              <select
                disabled={isSavingSource}
                onChange={(event) => setSourceForm((current) => ({ ...current, pollInterval: event.target.value as CalendarSourceFormValues["pollInterval"] }))}
                value={sourceForm.pollInterval}
              >
                <option value="hourly">Elk uur</option>
                <option value="every8Hours">Elke 8 uur</option>
                <option value="daily">Dagelijks</option>
              </select>
            </label>

            {sourceForm.providerConfiguration.kind === "iCalFeed" ? (
              <label className="settings-file-field settings-source-form-span-2">
                <span>Feedadres</span>
                <input
                  disabled={isSavingSource}
                  onChange={(event) =>
                    setSourceForm((current) => ({
                      ...current,
                      providerConfiguration: { kind: "iCalFeed", feedUrl: event.target.value },
                    }))
                  }
                  placeholder="https://voorbeeld.nl/agenda.ics"
                  value={sourceForm.providerConfiguration.feedUrl}
                />
              </label>
            ) : (
              <>
                {activeSurface === "createSource" ? (
                  <label className="settings-file-field settings-source-form-span-2">
                    <span>iCal-bestand</span>
                    <input
                      accept=".ics,text/calendar"
                      disabled={isSavingSource}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSourceForm((current) => ({
                          ...current,
                          providerConfiguration: { kind: "iCalFile", file },
                        }));
                      }}
                      type="file"
                    />
                    <small>Maximaal 5 MiB. Alleen een geldig .ics-bestand wordt opgeslagen.</small>
                  </label>
                ) : (
                  <section className="settings-surface-card settings-source-form-span-2">
                    <h4>Beheerd iCal-bestand</h4>
                    <p>Gebruik ‘Bestand vervangen’ op de bronkaart om nieuwe inhoud eerst veilig te laten controleren.</p>
                  </section>
                )}
              </>
            )}

            <div className="settings-surface-status" role={status?.kind === "error" ? "alert" : "status"}>
              <p>{status?.validationErrors.length ? "Controleer de velden hieronder." : "Broninstellingen blijven bewaard tot je opslaat."}</p>
              {status?.validationErrors.length ? (
                <ul className="settings-validation-list">
                  {status.validationErrors.map((validationError) => (
                    <li key={validationError}>{validationError}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="settings-surface-actions">
              <button onClick={closeSurface} type="button">
                Annuleren
              </button>
              <button disabled={isSavingSource} type="submit">
                {isSavingSource ? "Opslaan…" : activeSurface === "editSource" ? "Bron opslaan" : "Bron toevoegen"}
              </button>
            </div>
          </form>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "deleteSource" && selectedSource ? (
        <SettingsSurfaceDialog
          description="Verwijder alleen bronnen die je echt niet meer nodig hebt."
          onClose={closeSurface}
          title="Kalenderbron verwijderen"
        >
          <div className="settings-restore-flow">
            <section className="settings-surface-card">
              <h4>{selectedSource.icon} {selectedSource.name}</h4>
              <p>{getCalendarSourceTypeLabel(selectedSource.type)}</p>
            </section>
            <section className="settings-restore-warning">
              <h4>Verwijderen is definitief</h4>
              <p>De gekoppelde geïmporteerde agenda-items verdwijnen ook uit je agenda. De handmatige gezinsagenda blijft altijd beschikbaar.</p>
            </section>
            <div className="settings-surface-actions">
              <button onClick={closeSurface} type="button">
                Annuleren
              </button>
              <button disabled={isSavingSource} onClick={() => void handleDeleteSource()} type="button">
                {isSavingSource ? "Verwijderen…" : "Bron verwijderen"}
              </button>
            </div>
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "archiveSource" && selectedSource ? (
        <SettingsSurfaceDialog
          description="Bewaar de koppeling, maar verberg alle geïmporteerde afspraken."
          onClose={closeSurface}
          title="Kalenderbron archiveren"
        >
          <div className="settings-restore-flow">
            <section className="settings-surface-card">
              <h4>{selectedSource.icon} {selectedSource.name}</h4>
              <p>De configuratie en het beheerde bestand blijven bewaard.</p>
            </section>
            <section className="settings-restore-warning">
              <h4>Agenda-items worden verborgen</h4>
              <p>Herstellen haalt de bron opnieuw op en toont de afspraken pas als die verversing slaagt.</p>
            </section>
            <div className="settings-surface-actions">
              <button onClick={closeSurface} type="button">Annuleren</button>
              <button disabled={isSavingSource} onClick={() => void handleArchiveSource()} type="button">
                {isSavingSource ? "Archiveren…" : "Bron archiveren"}
              </button>
            </div>
          </div>
        </SettingsSurfaceDialog>
      ) : null}

      {activeSurface === "replaceFile" && selectedSource?.providerConfiguration?.kind === "iCalFile" ? (
        <SettingsSurfaceDialog
          description="Controleer en importeer een nieuw iCal-bestand zonder de huidige inhoud voortijdig te vervangen."
          onClose={closeSurface}
          title="iCal-bestand vervangen"
        >
          <div className="settings-restore-flow">
            <section className="settings-surface-card">
              <h4>Huidig bestand</h4>
              <p>{selectedSource.providerConfiguration.originalFilename || "Geen bestand gekoppeld"}</p>
              <p>{formatFileSize(selectedSource.providerConfiguration.contentLength)} · {formatCalendarSourceDateTime(selectedSource.providerConfiguration.uploadedUtc)}</p>
            </section>
            <label className="settings-file-field">
              <span>Nieuw iCal-bestand</span>
              <input
                accept=".ics,text/calendar"
                disabled={isSavingSource}
                onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <small>Maximaal 5 MiB. Bij een fout blijft het huidige bestand actief.</small>
            </label>
            <div className="settings-surface-actions">
              <button onClick={closeSurface} type="button">Annuleren</button>
              <button disabled={isSavingSource || !replacementFile} onClick={() => void handleReplaceFile()} type="button">
                {isSavingSource ? "Controleren…" : "Bestand vervangen"}
              </button>
            </div>
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

function SourceMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-source-meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface SettingsSurfaceDialogProps {
  children: ReactNode;
  description: string;
  onClose(): void;
  title: string;
}

export function SettingsSurfaceDialog({ children, description, onClose, title }: SettingsSurfaceDialogProps) {
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
            <p className="widget-type">Instellingen</p>
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

function compareCalendarSources(first: CalendarSource, second: CalendarSource) {
  if (first.isSystem !== second.isSystem) {
    return first.isSystem ? -1 : 1;
  }

  return first.name.localeCompare(second.name, "nl-NL");
}

function describeProviderConfiguration(source: CalendarSource) {
  if (source.providerConfiguration?.kind === "iCalFeed") {
    return `Feed: ${source.providerConfiguration.feedUrl}`;
  }

  if (source.providerConfiguration?.kind === "iCalFile") {
    const uploaded = source.providerConfiguration.uploadedUtc
      ? `, geüpload ${formatCalendarSourceDateTime(source.providerConfiguration.uploadedUtc)}`
      : "";
    return `Bestand: ${source.providerConfiguration.originalFilename || "niet gekoppeld"} (${formatFileSize(source.providerConfiguration.contentLength)}${uploaded})`;
  }

  return source.writable
    ? "Handmatige gezinsagenda voor eigen afspraken."
    : "Deze bron is klaar voor agenda-import.";
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 bytes";
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / (1024 * 1024)).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} MiB`;
}
