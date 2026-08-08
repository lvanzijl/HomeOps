import {
  ArchiveClimateProviderRequest,
  ClimateSourceRole,
  CreateClimateMappingRequest,
  CreateClimateProviderRequest,
  CreateFloorRequest,
  CreateRoomRequest,
  HomeAssistantResumeStrategyType,
  HomeAssistantConnectionTestOutcome,
  HomeOpsApiClient,
  ExternalSourceReferenceDto,
  MappingHealth,
  MoveRoomRequest,
  ProviderType,
  ReorderFloorsRequest,
  ReorderRoomsRequest,
  RoomType,
  UpdateClimateProviderRequest,
  UpdateClimateMappingRequest,
  UpdateHomeAssistantResumeStrategyRequest,
  UpdateFloorRequest,
  UpdateRoomRequest,
  type ClimateMappingDto,
  type ClimateCapabilitySummaryDto,
  type ClimateProviderDto,
  type FloorDto,
  type HomeAssistantClimateRefreshDiagnosticsDto,
  type HomeAssistantClimateRefreshSummary,
  type HomeAssistantConnectionTestDto,
  type HomeAssistantCredentialStatusDto,
  type HomeAssistantResumeStrategyConfigurationDto,
  type RoomClimateConfigurationDto,
  type RoomDto,
  type UpsertRoomClimateConfigurationRequest,
} from "../api/homeOpsApiClient";

export type ClimateProvider = ClimateProviderDto;
export type ClimateMapping = ClimateMappingDto;
export type ClimateCapabilitySummary = ClimateCapabilitySummaryDto;
export type HomeAssistantDiagnostics = HomeAssistantClimateRefreshDiagnosticsDto;
export type HomeAssistantRefreshSummary = HomeAssistantClimateRefreshSummary;
export type HomeAssistantConnectionTest = HomeAssistantConnectionTestDto;
export type HomeAssistantCredentialStatus = HomeAssistantCredentialStatusDto;
export type HomeAssistantResumeStrategyConfiguration = HomeAssistantResumeStrategyConfigurationDto;
export type Floor = FloorDto;
export type Room = RoomDto;
export type RoomClimateConfiguration = RoomClimateConfigurationDto;

export const roomTypeLabels: Record<RoomType, string> = {
  [RoomType.Bedroom]: "Slaapkamer",
  [RoomType.Bathroom]: "Badkamer",
  [RoomType.LivingRoom]: "Woonkamer",
  [RoomType.Kitchen]: "Keuken",
  [RoomType.Hall]: "Hal",
  [RoomType.Office]: "Werkkamer",
  [RoomType.LaundryRoom]: "Wasruimte",
  [RoomType.Storage]: "Berging",
  [RoomType.Landing]: "Overloop",
  [RoomType.Toilet]: "Toilet",
  [RoomType.UtilityRoom]: "Technische ruimte",
  [RoomType.Other]: "Anders",
};

export const roomTypeOptions = Object.values(RoomType)
  .filter((value): value is RoomType => typeof value === "number")
  .map((value) => ({ value, label: roomTypeLabels[value] }));

export { ClimateSourceRole, HomeAssistantConnectionTestOutcome, HomeAssistantResumeStrategyType, MappingHealth, ProviderType };

export function createWoningClient() {
  return new HomeOpsApiClient();
}

export async function loadFloors() {
  return createWoningClient().getFloors(true);
}

export async function loadRooms(floorId: string) {
  return createWoningClient().getFloorRooms(floorId, true);
}


export async function loadClimateProviders() {
  return createWoningClient().getClimateProviders(true);
}

export async function loadHomeAssistantCredentialStatus() {
  return createWoningClient().getHomeAssistantCredentialStatus();
}

export async function saveHomeAssistantProvider(provider: ClimateProvider | null, displayName: string, baseUrl: string, isEnabled: boolean) {
  const trimmedName = displayName.trim();
  const trimmedUrl = baseUrl.trim();
  if (provider?.id) {
    return createWoningClient().updateClimateProvider(provider.id, new UpdateClimateProviderRequest({ displayName: trimmedName, externalInstanceReference: trimmedUrl, isEnabled }));
  }

  return createWoningClient().createClimateProvider(new CreateClimateProviderRequest({ displayName: trimmedName, providerType: ProviderType.HomeAssistant, externalInstanceReference: trimmedUrl }));
}

export async function loadRoomClimateMappings(roomId: string) {
  return createWoningClient().getRoomClimateMappings(roomId, true);
}

export async function testHomeAssistantConnection(providerId: string) {
  return createWoningClient().testHomeAssistantConnection(providerId);
}

export async function archiveClimateProvider(providerId: string) {
  return createWoningClient().archiveClimateProvider(providerId, new ArchiveClimateProviderRequest({ confirmed: true }));
}

export async function restoreClimateProvider(providerId: string) {
  return createWoningClient().restoreClimateProvider(providerId);
}

export async function loadRoomClimateCapabilities(roomId: string) {
  return createWoningClient().getRoomClimateCapabilities(roomId);
}

export interface ClimateMappingDraft {
  providerId: string;
  sourceRole: ClimateSourceRole;
  externalSourceId: string;
  externalDisplayName?: string;
  externalSourceKind?: string;
  externalAreaName?: string;
  externalDeviceName?: string;
  priority: number;
  isEnabled: boolean;
}

function sourceReference(draft: ClimateMappingDraft) {
  return new ExternalSourceReferenceDto({
    externalSourceId: draft.externalSourceId.trim(),
    externalDisplayName: draft.externalDisplayName?.trim() || undefined,
    externalSourceKind: draft.externalSourceKind?.trim() || undefined,
    externalAreaName: draft.externalAreaName?.trim() || undefined,
    externalDeviceName: draft.externalDeviceName?.trim() || undefined,
  });
}

export function createClimateMapping(roomId: string, draft: ClimateMappingDraft) {
  return createWoningClient().createRoomClimateMapping(roomId, new CreateClimateMappingRequest({ providerId: draft.providerId, sourceRole: draft.sourceRole, source: sourceReference(draft), priority: draft.priority, isEnabled: draft.isEnabled }));
}

export function updateClimateMapping(mappingId: string, draft: ClimateMappingDraft) {
  return createWoningClient().updateClimateMapping(mappingId, new UpdateClimateMappingRequest({ source: sourceReference(draft), priority: draft.priority, isEnabled: draft.isEnabled }));
}

export function archiveClimateMapping(mappingId: string) {
  return createWoningClient().archiveClimateMapping(mappingId);
}

export function restoreClimateMapping(mappingId: string) {
  return createWoningClient().restoreClimateMapping(mappingId);
}

export async function refreshHomeAssistantProvider(providerId: string) {
  return createWoningClient().refreshHomeAssistantClimateProvider(providerId);
}

export async function refreshHomeAssistantRoom(roomId: string) {
  return createWoningClient().refreshHomeAssistantClimateRoom(roomId);
}

export async function refreshHomeAssistantMapping(mappingId: string) {
  return createWoningClient().refreshHomeAssistantClimateMapping(mappingId);
}

export async function loadHomeAssistantDiagnostics(providerId: string) {
  return createWoningClient().getHomeAssistantClimateProviderDiagnostics(providerId);
}

export async function loadHomeAssistantResumeStrategy(providerId: string) {
  return createWoningClient().getHomeAssistantResumeStrategy(providerId);
}

export async function updateHomeAssistantResumeStrategy(providerId: string, request: UpdateHomeAssistantResumeStrategyRequest) {
  return createWoningClient().updateHomeAssistantResumeStrategy(providerId, request);
}

export function createHomeAssistantResumeStrategyRequest(strategyType: HomeAssistantResumeStrategyType, scriptEntityReference?: string, climateEntityReference?: string, presetValue?: string) {
  return new UpdateHomeAssistantResumeStrategyRequest({ strategyType, scriptEntityReference, climateEntityReference, presetValue });
}

export async function loadClimateConfiguration(roomId: string) {
  return createWoningClient().getRoomClimateConfiguration(roomId);
}

export function saveClimateConfiguration(roomId: string, request: UpsertRoomClimateConfigurationRequest) {
  return createWoningClient().upsertRoomClimateConfiguration(roomId, request);
}

export function createFloor(name: string) {
  return createWoningClient().createFloor(new CreateFloorRequest({ name }));
}

export function updateFloor(floor: Floor, name: string) {
  return createWoningClient().updateFloor(floor.id ?? "", new UpdateFloorRequest({ name, isEnabled: floor.isEnabled }));
}

export function reorderFloors(floorIds: string[]) {
  return createWoningClient().reorderFloors(new ReorderFloorsRequest({ floorIds }));
}

export function archiveFloor(floorId: string) {
  return createWoningClient().archiveFloor(floorId);
}

export function restoreFloor(floorId: string) {
  return createWoningClient().restoreFloor(floorId);
}

export function deleteFloor(floorId: string) {
  return createWoningClient().deleteFloor(floorId);
}

export function createRoom(floorId: string, name: string, roomType: RoomType, familyMemberId?: string) {
  return createWoningClient().createRoom(floorId, new CreateRoomRequest({ name, roomType, familyMemberId }));
}

export function updateRoom(room: Room, name: string, roomType: RoomType, familyMemberId?: string) {
  return createWoningClient().updateRoom(room.id ?? "", new UpdateRoomRequest({ name, roomType, familyMemberId, isEnabled: room.isEnabled }));
}

export function reorderRooms(floorId: string, roomIds: string[]) {
  return createWoningClient().reorderRooms(new ReorderRoomsRequest({ floorId, roomIds }));
}

export function moveRoom(roomId: string, destinationFloorId: string) {
  return createWoningClient().moveRoom(roomId, new MoveRoomRequest({ destinationFloorId }));
}

export function archiveRoom(roomId: string) {
  return createWoningClient().archiveRoom(roomId);
}

export function restoreRoom(roomId: string) {
  return createWoningClient().restoreRoom(roomId);
}

export function deleteRoom(roomId: string) {
  return createWoningClient().deleteRoom(roomId);
}

export function getFriendlyWoningError(error: unknown, fallback: string) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 0;
  if (status === 400 || status === 409) return fallback;
  if (status === 404) return "Dit onderdeel bestaat niet meer. Vernieuw het overzicht.";
  return fallback;
}
