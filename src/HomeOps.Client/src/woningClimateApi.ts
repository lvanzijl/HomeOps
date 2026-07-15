import { HomeOpsApiClient, type FloorClimateStateDto, type HouseholdClimateSummaryDto, type RoomOverlayDto } from './api/homeOpsApiClient';

export const seedHouseholdId = '11111111-1111-1111-1111-111111111111';

export type WoningClimateClient = Pick<HomeOpsApiClient, 'getHouseholdClimateSummary' | 'getFloorClimateState' | 'getFloorRoomOverlays'>;

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
