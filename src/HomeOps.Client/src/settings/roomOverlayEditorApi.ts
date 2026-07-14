import {
  CreateRoomOverlayRequest,
  FloorPlanAssetAvailability,
  FloorPlanAssetState,
  HomeOpsApiClient,
  NormalizedPoint,
  RoomOverlayState,
  UpdateRoomOverlayGeometryRequest,
  UpdateRoomOverlayLabelAnchorRequest,
  type FloorPlanAssetDto,
  type RoomOverlayDto,
  type RoomOverlayValidationResultDto,
} from "../api/homeOpsApiClient";

export type RoomOverlay = RoomOverlayDto & { validationBlockerCount?: number; validationWarningCount?: number };
export interface OverlayValidation { blockers: { code: string; message?: string; roomName?: string }[]; warnings: { code: string; message?: string; roomName?: string }[] }
export type EditorPoint = Pick<NormalizedPoint, "x" | "y">;

function client() { return new HomeOpsApiClient(); }
function toNormalizedPoint(point: EditorPoint) { return new NormalizedPoint({ x: point.x, y: point.y }); }
function toNormalizedPolygon(polygon: readonly EditorPoint[]) { return polygon.map(toNormalizedPoint); }

export async function loadActiveFloorPlanAsset(floorId: string): Promise<FloorPlanAssetDto | null> { try { return await client().getActiveFloorPlanAsset(floorId); } catch { return null; } }
export function isUsableActiveAsset(asset?: FloorPlanAssetDto | null) { return !!asset?.id && asset.state === FloorPlanAssetState.Active && asset.derivativeAvailability !== FloorPlanAssetAvailability.Missing && asset.derivativeAvailability !== FloorPlanAssetAvailability.Corrupt; }
export function loadFloorRoomOverlays(floorId: string) { return client().getFloorRoomOverlays(floorId, true); }
export function loadRoomOverlays(roomId: string) { return client().getRoomOverlays(roomId, true); }
export function createRoomOverlay(floorId: string, roomId: string, floorPlanAssetId: string, polygon: readonly EditorPoint[], state: RoomOverlayState, labelAnchor?: EditorPoint) { return client().createRoomOverlay(floorId, new CreateRoomOverlayRequest({ roomId, floorPlanAssetId, polygon: toNormalizedPolygon(polygon), state, labelAnchor: labelAnchor ? toNormalizedPoint(labelAnchor) : undefined })); }
export function updateRoomOverlayGeometry(id: string, polygon: readonly EditorPoint[]) { return client().updateRoomOverlayGeometry(id, new UpdateRoomOverlayGeometryRequest({ polygon: toNormalizedPolygon(polygon) })); }
export function updateRoomOverlayLabelAnchor(id: string, labelAnchor: EditorPoint) { return client().updateRoomOverlayLabelAnchor(id, new UpdateRoomOverlayLabelAnchorRequest({ labelAnchor: toNormalizedPoint(labelAnchor) })); }
export function resetRoomOverlayLabelAnchor(id: string) { return client().resetRoomOverlayLabelAnchor(id); }
export function trustRoomOverlay(id: string) { return client().trustRoomOverlay(id); }
export function markRoomOverlayNeedsReview(id: string) { return client().markRoomOverlayNeedsReview(id); }
export function archiveRoomOverlay(id: string) { return client().archiveRoomOverlay(id); }
export function restoreRoomOverlay(id: string) { return client().restoreRoomOverlay(id); }
export function deleteRoomOverlay(id: string) { return client().deleteRoomOverlay(id); }
export function loadRoomOverlayValidation(id: string) { return client().getRoomOverlayValidation(id); }

export function overlayStateLabel(state?: RoomOverlayState, hasOverlay = true) { if (!hasOverlay) return "Nog geen grens"; switch (state) { case RoomOverlayState.Draft: return "Concept"; case RoomOverlayState.Valid: return "Geldig"; case RoomOverlayState.NeedsReview: return "Controle nodig"; case RoomOverlayState.Trusted: return "Klaar voor gebruik"; case RoomOverlayState.Invalid: return "Ongeldig"; case RoomOverlayState.Archived: return "Gearchiveerd"; default: return "Nog geen grens"; } }
export function friendlyOverlayError(error: unknown, fallback: string) { const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 0; if (status === 404) return "Deze grens bestaat niet meer. Vernieuw het overzicht."; if (status === 409 || status === 400) return "Deze grens kan nog niet klaar voor gebruik worden gemaakt."; return fallback; }
export function friendlyValidationMessage(code: string, message?: string, roomName?: string) { const lower = code.toLowerCase(); if (lower.includes("toofew") || lower.includes("few") || lower.includes("min")) return "Plaats minimaal drie punten."; if (lower.includes("self")) return "Deze grens kruist zichzelf."; if (lower.includes("bounds") || lower.includes("outsideimage") || lower.includes("range")) return "Een deel van de grens ligt buiten de plattegrond."; if (lower.includes("overlap")) return `Deze grens overlapt met ${roomName ?? "een andere kamer"}.`; if (lower.includes("anchor")) return "De kamernaam staat buiten de kamer."; return message || "De backend vraagt om controle van deze grens."; }
