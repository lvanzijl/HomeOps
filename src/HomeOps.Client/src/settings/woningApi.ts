import {
  CreateFloorRequest,
  CreateRoomRequest,
  HomeOpsApiClient,
  MoveRoomRequest,
  ReorderFloorsRequest,
  ReorderRoomsRequest,
  RoomType,
  UpdateFloorRequest,
  UpdateRoomRequest,
  type FloorDto,
  type RoomClimateConfigurationDto,
  type RoomDto,
} from "../api/homeOpsApiClient";

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

export function createWoningClient() {
  return new HomeOpsApiClient();
}

export async function loadFloors() {
  return createWoningClient().getFloors(true);
}

export async function loadRooms(floorId: string) {
  return createWoningClient().getFloorRooms(floorId, true);
}

export async function loadClimateConfiguration(roomId: string) {
  try {
    return await createWoningClient().getRoomClimateConfiguration(roomId);
  } catch {
    return null;
  }
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
