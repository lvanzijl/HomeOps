import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeOpsApiClient, RoomOverlayState } from "../api/homeOpsApiClient";
import { loadFloorRoomOverlays, loadRoomOverlayValidation, loadRoomOverlays } from "./roomOverlayEditorApi";

afterEach(() => vi.restoreAllMocks());

describe("roomOverlayEditorApi", () => {
  it("uses typed generated overlay list responses without runtime normalization", async () => {
    const overlays = [{ id: "o1", roomId: "r1", floorId: "f1", floorPlanAssetId: "a1", state: RoomOverlayState.Valid, polygon: [] }] as any;
    vi.spyOn(HomeOpsApiClient.prototype, "getFloorRoomOverlays").mockResolvedValue(overlays);
    vi.spyOn(HomeOpsApiClient.prototype, "getRoomOverlays").mockResolvedValue(overlays);

    await expect(loadFloorRoomOverlays("f1")).resolves.toBe(overlays);
    await expect(loadRoomOverlays("r1")).resolves.toBe(overlays);
  });

  it("uses typed generated validation responses", async () => {
    const validation = { overlayId: "o1", isValid: false, blockers: [{ code: "TooFewVertices", message: "Plaats minimaal drie punten." }], warnings: [] } as any;
    vi.spyOn(HomeOpsApiClient.prototype, "getRoomOverlayValidation").mockResolvedValue(validation);

    await expect(loadRoomOverlayValidation("o1")).resolves.toBe(validation);
  });
});
