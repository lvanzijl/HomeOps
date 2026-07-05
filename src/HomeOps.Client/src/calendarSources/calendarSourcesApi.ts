import {
  ApiException,
  CreateEventSourceRequest,
  EventSourceDto,
  EventSourceHealthStatus,
  EventSourcePollInterval,
  EventSourceProviderConfigurationKind,
  EventSourceType,
  HomeOpsApiClient,
  HttpValidationProblemDetails,
  ICalFeedSourceConfigurationRequest,
  ICalFileSourceConfigurationRequest,
  RefreshAllResultDto,
  SyncSourceResultDto,
  UpdateEventSourceRequest,
  EventSourceProviderConfigurationRequest,
} from "../api/homeOpsApiClient";

export type CalendarSourceKind = "manual" | "iCalFeed" | "iCalFile" | "googleCalendar" | "calDav" | "exchange" | "schoolHolidays" | "tvSeries" | "birthdays" | "provider";
export type CalendarSourceState = "healthy" | "failed" | "neverSynced" | "disabled";
export type CalendarSourcePollIntervalOption = "hourly" | "every8Hours" | "daily";

export interface CalendarSourceLastError {
  code?: string;
  message?: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  icon: string;
  type: CalendarSourceKind;
  enabled: boolean;
  writable: boolean;
  isSystem: boolean;
  state: CalendarSourceState;
  canDisplayEvents: boolean;
  pollInterval: CalendarSourcePollIntervalOption;
  lastSyncAttemptUtc?: string;
  lastSuccessfulSyncUtc?: string;
  lastFailedSyncUtc?: string;
  nextSyncAfterUtc?: string;
  lastError?: CalendarSourceLastError;
  providerSourceId?: string;
  providerConfiguration: CalendarSourceProviderConfiguration | null;
}

export type CalendarSourceProviderConfiguration =
  | {
      kind: "iCalFeed";
      feedUrl: string;
      eTag?: string;
      lastModified?: string;
      lastContentHash?: string;
    }
  | {
      kind: "iCalFile";
      fileReference: string;
      originalFilename: string;
      contentHash: string;
      uploadedUtc?: string;
    };

export interface CalendarSourceFormValues {
  name: string;
  icon: string;
  enabled: boolean;
  type: Extract<CalendarSourceKind, "iCalFeed" | "iCalFile">;
  pollInterval: CalendarSourcePollIntervalOption;
  providerConfiguration:
    | {
        kind: "iCalFeed";
        feedUrl: string;
      }
    | {
        kind: "iCalFile";
        fileReference: string;
        originalFilename: string;
        contentHash: string;
      };
}

export interface CalendarSourceRefreshResult {
  sourceId: string;
  succeeded: boolean;
  state: CalendarSourceState;
  attemptedAtUtc: string;
  successfulAtUtc?: string;
  failedAtUtc?: string;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  unchangedCount: number;
  warningCount: number;
  duration?: string;
  error?: CalendarSourceLastError;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createCalendarSourcesClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadCalendarSources(client = createCalendarSourcesClient()): Promise<CalendarSource[]> {
  const sources = await client.listEventSources();
  return sources.map(toCalendarSource);
}

export async function createCalendarSource(input: CalendarSourceFormValues, client = createCalendarSourcesClient()): Promise<CalendarSource> {
  const created = await client.createEventSource(
    new CreateEventSourceRequest({
      name: input.name.trim(),
      icon: input.icon.trim(),
      sourceType: toApiSourceType(input.type),
      enabled: input.enabled,
      pollInterval: toApiPollInterval(input.pollInterval),
      providerConfiguration: toProviderConfigurationRequest(input.providerConfiguration),
    }),
  );

  return toCalendarSource(created);
}

export async function updateCalendarSource(sourceId: string, input: CalendarSourceFormValues, client = createCalendarSourcesClient()): Promise<CalendarSource> {
  const updated = await client.updateEventSource(
    sourceId,
    new UpdateEventSourceRequest({
      name: input.name.trim(),
      icon: input.icon.trim(),
      enabled: input.enabled,
      pollInterval: toApiPollInterval(input.pollInterval),
      providerConfiguration: toProviderConfigurationRequest(input.providerConfiguration),
    }),
  );

  return toCalendarSource(updated);
}

export async function setCalendarSourceEnabled(source: CalendarSource, enabled: boolean, client = createCalendarSourcesClient()): Promise<CalendarSource> {
  return updateCalendarSource(source.id, createCalendarSourceFormValues(source, enabled), client);
}

export async function deleteCalendarSource(sourceId: string, client = createCalendarSourcesClient()): Promise<void> {
  await client.deleteEventSource(sourceId);
}

export async function refreshCalendarSource(sourceId: string, client = createCalendarSourcesClient()): Promise<CalendarSourceRefreshResult> {
  return toCalendarSourceRefreshResult(await client.refreshEventSource(sourceId));
}

export async function refreshAllCalendarSources(client = createCalendarSourcesClient()): Promise<CalendarSourceRefreshResult[]> {
  const result = await client.refreshAllEventSources();
  return toCalendarSourceRefreshResults(result);
}

export function createCalendarSourceFormValues(source?: CalendarSource, enabled = source?.enabled ?? true): CalendarSourceFormValues {
  if (!source) {
    return {
      name: "",
      icon: "🌐",
      enabled: true,
      type: "iCalFeed",
      pollInterval: "every8Hours",
      providerConfiguration: {
        kind: "iCalFeed",
        feedUrl: "",
      },
    };
  }

  const providerConfiguration =
    source.providerConfiguration?.kind === "iCalFile"
      ? {
          kind: "iCalFile" as const,
          fileReference: source.providerConfiguration.fileReference,
          originalFilename: source.providerConfiguration.originalFilename,
          contentHash: source.providerConfiguration.contentHash,
        }
      : {
          kind: "iCalFeed" as const,
          feedUrl: source.providerConfiguration?.kind === "iCalFeed" ? source.providerConfiguration.feedUrl : "",
        };

  return {
    name: source.name,
    icon: source.icon,
    enabled,
    type: source.type === "iCalFile" ? "iCalFile" : "iCalFeed",
    pollInterval: source.pollInterval,
    providerConfiguration,
  };
}

export function getFriendlyCalendarSourceError(error: unknown): string {
  const validationErrors = getCalendarSourceValidationErrors(error);
  if (validationErrors.length > 0) {
    return validationErrors.join(" ");
  }

  if (ApiException.isApiException(error)) {
    if (error.status === 404) {
      return "Deze kalenderbron bestaat niet meer. Vernieuw de lijst en probeer het opnieuw.";
    }

    if (error.status === 400) {
      return "HomeOps kon deze kalenderbron niet opslaan. Controleer de ingevulde gegevens en probeer het opnieuw.";
    }

    if (error.status >= 500) {
      return "HomeOps kon de kalenderbron nu niet verwerken. Probeer het zo opnieuw.";
    }
  }

  return "HomeOps kon de kalenderbron nu niet verwerken.";
}

export function getCalendarSourceValidationErrors(error: unknown): string[] {
  if (!ApiException.isApiException(error)) {
    return [];
  }

  const parsed = parseProblemDetails(error.response);
  const errors = parsed.errors ?? {};
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${toFriendlyFieldLabel(field)}: ${message}`),
  );
}

export function getCalendarSourceTypeLabel(type: CalendarSourceKind): string {
  switch (type) {
    case "manual":
      return "Handmatig";
    case "iCalFeed":
      return "iCal-feed";
    case "iCalFile":
      return "iCal-bestand";
    case "googleCalendar":
      return "Google Agenda";
    case "calDav":
      return "CalDAV";
    case "exchange":
      return "Exchange";
    case "schoolHolidays":
      return "Schoolvakanties";
    case "tvSeries":
      return "Tv-series";
    case "birthdays":
      return "Verjaardagen";
    default:
      return "Externe bron";
  }
}

export function getCalendarSourcePollIntervalLabel(value: CalendarSourcePollIntervalOption): string {
  switch (value) {
    case "hourly":
      return "Elk uur";
    case "daily":
      return "Dagelijks";
    default:
      return "Elke 8 uur";
  }
}

export function getCalendarSourceStateLabel(source: Pick<CalendarSource, "enabled" | "state">): string {
  if (!source.enabled || source.state === "disabled") {
    return "Uitgeschakeld";
  }

  switch (source.state) {
    case "healthy":
      return "In orde";
    case "failed":
      return "Mislukt";
    case "neverSynced":
      return "Nog niet ververst";
    default:
      return "Uitgeschakeld";
  }
}

export function getCalendarSourceStateTone(source: Pick<CalendarSource, "enabled" | "state">): "ready" | "attention" | "pending" {
  if (!source.enabled || source.state === "disabled") {
    return "pending";
  }

  if (source.state === "healthy") {
    return "ready";
  }

  return "attention";
}

export function getCalendarSourceStatusMessage(source: CalendarSource): string {
  if (!source.enabled || source.state === "disabled") {
    return "Deze bron staat uit en laat nu geen agenda-items zien.";
  }

  if (source.state === "healthy") {
    return source.lastSuccessfulSyncUtc
      ? `Laatst ververst op ${formatCalendarSourceDateTime(source.lastSuccessfulSyncUtc)}.`
      : "Deze bron is klaar voor agendaweergave.";
  }

  if (source.state === "neverSynced") {
    return "Deze bron is opgeslagen, maar moet nog voor het eerst worden ververst.";
  }

  return source.lastError?.message ?? "De laatste verversing is niet gelukt.";
}

export function formatCalendarSourceDateTime(value?: string): string {
  if (!value) {
    return "Nog niet beschikbaar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Nog niet beschikbaar";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatCalendarSourceSyncSummary(result: CalendarSourceRefreshResult): string {
  if (!result.succeeded) {
    return result.error?.message ?? "De verversing is niet gelukt.";
  }

  const changes = [
    result.createdCount ? `${result.createdCount} nieuw` : null,
    result.updatedCount ? `${result.updatedCount} bijgewerkt` : null,
    result.deletedCount ? `${result.deletedCount} verwijderd` : null,
    result.unchangedCount ? `${result.unchangedCount} gelijk gebleven` : null,
  ].filter(Boolean);

  const summary = changes.length > 0 ? changes.join(", ") : "geen wijzigingen";
  const warningSummary = result.warningCount > 0 ? ` met ${result.warningCount} waarschuwing${result.warningCount === 1 ? "" : "en"}` : "";
  return `Verversd: ${summary}${warningSummary}.`;
}

export function hasCalendarSourceAttention(sources: readonly CalendarSource[]): boolean {
  return sources.some((source) => source.enabled && source.state === "failed");
}

export function countActionableCalendarSources(sources: readonly CalendarSource[]): number {
  return sources.filter((source) => !source.writable).length;
}

export function hasOnlyManualCalendarSource(sources: readonly CalendarSource[]): boolean {
  return sources.length === 1 && sources[0]?.type === "manual" && sources[0]?.isSystem;
}

export function toCalendarSource(dto: EventSourceDto): CalendarSource {
  const enabled = dto.enabled ?? true;
  const state = toCalendarSourceState(enabled, dto.healthStatus);

  return {
    id: requireString(dto.id, "calendar source id"),
    name: dto.name?.trim() || "Agenda",
    icon: dto.icon?.trim() || "📅",
    type: toCalendarSourceKind(dto.sourceType),
    enabled,
    writable: dto.writable ?? false,
    isSystem: dto.isSystem ?? false,
    state,
    canDisplayEvents: state === "healthy",
    pollInterval: toCalendarSourcePollInterval(dto.pollInterval),
    lastSyncAttemptUtc: dto.lastSyncAttemptUtc?.toISOString(),
    lastSuccessfulSyncUtc: dto.lastSuccessfulSyncUtc?.toISOString(),
    lastFailedSyncUtc: dto.lastFailedSyncUtc?.toISOString(),
    nextSyncAfterUtc: dto.nextSyncAfterUtc?.toISOString(),
    lastError: dto.lastError ? { code: dto.lastError.code, message: dto.lastError.message } : undefined,
    providerSourceId: dto.providerSourceId ?? undefined,
    providerConfiguration: toCalendarSourceProviderConfiguration(dto),
  };
}

export function toCalendarSourceRefreshResult(dto: SyncSourceResultDto): CalendarSourceRefreshResult {
  const enabledState = dto.healthStatus === EventSourceHealthStatus.Healthy;
  return {
    sourceId: requireString(dto.sourceId, "calendar source id"),
    succeeded: dto.succeeded ?? false,
    state: toCalendarSourceState(enabledState, dto.healthStatus),
    attemptedAtUtc: dto.attemptedAtUtc?.toISOString() ?? new Date().toISOString(),
    successfulAtUtc: dto.successfulAtUtc?.toISOString(),
    failedAtUtc: dto.failedAtUtc?.toISOString(),
    createdCount: dto.createdCount ?? 0,
    updatedCount: dto.updatedCount ?? 0,
    deletedCount: dto.deletedCount ?? 0,
    unchangedCount: dto.unchangedCount ?? 0,
    warningCount: dto.warningCount ?? 0,
    duration: dto.duration ?? undefined,
    error: dto.error ? { code: dto.error.code, message: dto.error.message } : undefined,
  };
}

function toCalendarSourceRefreshResults(dto: RefreshAllResultDto): CalendarSourceRefreshResult[] {
  return (dto.results ?? []).map(toCalendarSourceRefreshResult);
}

function toCalendarSourceProviderConfiguration(dto: EventSourceDto): CalendarSourceProviderConfiguration | null {
  const configuration = dto.providerConfiguration;
  if (!configuration) {
    return null;
  }

  if (configuration.kind === EventSourceProviderConfigurationKind.ICalFile) {
    return {
      kind: "iCalFile",
      fileReference: configuration.iCalFile?.fileReference ?? "",
      originalFilename: configuration.iCalFile?.originalFilename ?? "",
      contentHash: configuration.iCalFile?.contentHash ?? "",
      uploadedUtc: configuration.iCalFile?.uploadedUtc?.toISOString(),
    };
  }

  return {
    kind: "iCalFeed",
    feedUrl: configuration.iCalFeed?.feedUrl ?? "",
    eTag: configuration.iCalFeed?.eTag ?? undefined,
    lastModified: configuration.iCalFeed?.lastModified ?? undefined,
    lastContentHash: configuration.iCalFeed?.lastContentHash ?? undefined,
  };
}

function toProviderConfigurationRequest(configuration: CalendarSourceFormValues["providerConfiguration"]): EventSourceProviderConfigurationRequest {
  if (configuration.kind === "iCalFile") {
    return new EventSourceProviderConfigurationRequest({
      kind: EventSourceProviderConfigurationKind.ICalFile,
      iCalFile: new ICalFileSourceConfigurationRequest({
        fileReference: configuration.fileReference.trim(),
        originalFilename: configuration.originalFilename.trim(),
        contentHash: configuration.contentHash.trim(),
      }),
    });
  }

  return new EventSourceProviderConfigurationRequest({
    kind: EventSourceProviderConfigurationKind.ICalFeed,
    iCalFeed: new ICalFeedSourceConfigurationRequest({
      feedUrl: configuration.feedUrl.trim(),
    }),
  });
}

function toApiSourceType(type: CalendarSourceFormValues["type"]): EventSourceType {
  return type === "iCalFile" ? EventSourceType.ICalFile : EventSourceType.ICalFeed;
}

function toApiPollInterval(value: CalendarSourcePollIntervalOption): EventSourcePollInterval {
  switch (value) {
    case "hourly":
      return EventSourcePollInterval.EveryHour;
    case "daily":
      return EventSourcePollInterval.EveryDay;
    default:
      return EventSourcePollInterval.Every8Hours;
  }
}

function toCalendarSourceKind(type?: EventSourceType): CalendarSourceKind {
  switch (type) {
    case EventSourceType.Manual:
      return "manual";
    case EventSourceType.ICalFeed:
      return "iCalFeed";
    case EventSourceType.ICalFile:
      return "iCalFile";
    case EventSourceType.GoogleCalendar:
      return "googleCalendar";
    case EventSourceType.CalDav:
      return "calDav";
    case EventSourceType.Exchange:
      return "exchange";
    case EventSourceType.SchoolHolidays:
      return "schoolHolidays";
    case EventSourceType.TvSeries:
      return "tvSeries";
    case EventSourceType.Birthdays:
      return "birthdays";
    default:
      return "provider";
  }
}

function toCalendarSourcePollInterval(value?: EventSourcePollInterval): CalendarSourcePollIntervalOption {
  switch (value) {
    case EventSourcePollInterval.EveryHour:
      return "hourly";
    case EventSourcePollInterval.EveryDay:
      return "daily";
    default:
      return "every8Hours";
  }
}

function toCalendarSourceState(enabled: boolean, healthStatus?: EventSourceHealthStatus): CalendarSourceState {
  if (!enabled) {
    return "disabled";
  }

  switch (healthStatus) {
    case EventSourceHealthStatus.Healthy:
      return "healthy";
    case EventSourceHealthStatus.Failed:
      return "failed";
    case EventSourceHealthStatus.NeverSynced:
    default:
      return "neverSynced";
  }
}

function toFriendlyFieldLabel(field: string): string {
  switch (field) {
    case "Name":
    case "name":
      return "Naam";
    case "Icon":
    case "icon":
      return "Icoon";
    case "SourceType":
    case "sourceType":
      return "Brontype";
    case "PollInterval":
    case "pollInterval":
      return "Verversritme";
    case "EventSource.IsSystem":
    case "IsSystem":
      return "Standaardbron";
    case "providerConfiguration.iCalFeed.feedUrl":
    case "IcalFeed":
    case "iCalFeed":
      return "Feedadres";
    case "providerConfiguration.iCalFile.fileReference":
    case "providerConfiguration.iCalFile.originalFilename":
    case "providerConfiguration.iCalFile.contentHash":
    case "iCalFile":
      return "Bestandsinstellingen";
    default:
      return field;
  }
}

function parseProblemDetails(response: string): HttpValidationProblemDetails {
  if (!response) {
    return new HttpValidationProblemDetails();
  }

  try {
    return HttpValidationProblemDetails.fromJS(JSON.parse(response));
  } catch {
    return new HttpValidationProblemDetails();
  }
}

function requireString(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} from Calendar Sources API response.`);
  }

  return value;
}
