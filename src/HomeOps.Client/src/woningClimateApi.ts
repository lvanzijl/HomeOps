import { HomeOpsApiClient, type FloorClimateStateDto, type RoomHeatingControlCapabilityDto, type RoomHeatingCommandResponse, RoomHeatingResumeScheduleRequest, RoomHeatingTemporaryCommandRequest, type HouseholdClimateSummaryDto, type RoomOverlayDto } from './api/homeOpsApiClient';

export const seedHouseholdId = '11111111-1111-1111-1111-111111111111';

export type WoningClimateClient = Pick<HomeOpsApiClient, 'getHouseholdClimateSummary' | 'getFloorClimateState' | 'getFloorRoomOverlays' | 'getRoomHeatingControlCapability' | 'submitRoomHeatingTemporaryWarmer' | 'submitRoomHeatingTemporaryCooler' | 'submitRoomHeatingResumeSchedule'>;

export function createWoningClimateClient(): WoningClimateClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}

export function loadHouseholdClimateSummary(client = createWoningClimateClient()): Promise<HouseholdClimateSummaryDto> {
  return client.getHouseholdClimateSummary(seedHouseholdId);
}

export function loadFloorClimateState(floorId: string, client = createWoningClimateClient()): Promise<FloorClimateStateDto> {
  return client.getFloorClimateState(floorId);
}

export function loadFloorRuntimeOverlays(floorId: string, client = createWoningClimateClient()): Promise<RoomOverlayDto[]> {
  return client.getFloorRoomOverlays(floorId, false);
}


export function loadRoomHeatingControlCapability(roomId: string, client = createWoningClimateClient()): Promise<RoomHeatingControlCapabilityDto> {
  return client.getRoomHeatingControlCapability(roomId);
}

export function submitTemporaryWarmer(roomId: string, targetTemperatureCelsius: number, durationMinutes: number, idempotencyKey: string, client = createWoningClimateClient()): Promise<RoomHeatingCommandResponse> {
  return client.submitRoomHeatingTemporaryWarmer(roomId, new RoomHeatingTemporaryCommandRequest({ targetTemperatureCelsius, durationMinutes, idempotencyKey }));
}

export function submitTemporaryCooler(roomId: string, targetTemperatureCelsius: number, durationMinutes: number, idempotencyKey: string, client = createWoningClimateClient()): Promise<RoomHeatingCommandResponse> {
  return client.submitRoomHeatingTemporaryCooler(roomId, new RoomHeatingTemporaryCommandRequest({ targetTemperatureCelsius, durationMinutes, idempotencyKey }));
}

export function submitResumeSchedule(roomId: string, idempotencyKey: string, client = createWoningClimateClient()): Promise<RoomHeatingCommandResponse> {
  return client.submitRoomHeatingResumeSchedule(roomId, new RoomHeatingResumeScheduleRequest({ idempotencyKey }));
}
