import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FloorPlanAssetAvailability, FloorPlanAssetState } from "../api/homeOpsApiClient";
import { FloorPlanUploadDialog } from "./FloorPlanUploadDialog";
import * as uploadApi from "./floorPlanUploadApi";
import * as reviewApi from "./floorPlanReplacementReviewApi";

vi.mock("./floorPlanUploadApi", async (original) => ({
  ...(await original<typeof import("./floorPlanUploadApi")>()),
  uploadFloorPlan: vi.fn(),
  activateFloorPlan: vi.fn(),
}));
vi.mock("./floorPlanReplacementReviewApi", async (original) => ({
  ...(await original<typeof import("./floorPlanReplacementReviewApi")>()),
  startReplacementReview: vi.fn(),
}));

const floor = { id: "floor-1", name: "Begane grond" } as any;
const uploaded = {
  id: "asset-2",
  floorId: "floor-1",
  originalFilename: "nieuwe-plattegrond.svg",
  detectedMediaType: "image/svg+xml",
  sourceWidth: 800,
  sourceHeight: 500,
  coordinateBasisWidth: 800,
  coordinateBasisHeight: 500,
  state: FloorPlanAssetState.Validated,
  derivativeAvailability: FloorPlanAssetAvailability.Available,
  derivativeUrl: "data:image/svg+xml,%3Csvg/%3E",
  validationSummary: "SVG sanitized; 1 unsafe element removed.",
} as any;
const active = { ...uploaded, id: "asset-1", state: FloorPlanAssetState.Active, originalFilename: "huidig.svg" } as any;

afterEach(() => cleanup());
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
  vi.mocked(uploadApi.uploadFloorPlan).mockResolvedValue(uploaded);
  vi.mocked(uploadApi.activateFloorPlan).mockResolvedValue({ ...uploaded, state: FloorPlanAssetState.Active });
  vi.mocked(reviewApi.startReplacementReview).mockResolvedValue({} as any);
});

describe("FloorPlanUploadDialog", () => {
  it("uploads, previews, explicitly activates the first plan, and offers boundary editing", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const onOpenEditor = vi.fn();
    render(<FloorPlanUploadDialog floor={floor} activeAsset={null} onClose={vi.fn()} onChanged={onChanged} onOpenEditor={onOpenEditor} onOpenReplacementReview={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Plattegrond uploaden voor Begane grond" });

    await user.upload(within(dialog).getByLabelText("Plattegrondbestand"), new File(["<svg viewBox='0 0 800 500'></svg>"], "nieuwe-plattegrond.svg", { type: "image/svg+xml" }));
    await user.click(within(dialog).getByRole("button", { name: "Uploaden en controleren" }));

    expect(await screen.findByAltText("Voorbeeld van nieuwe-plattegrond.svg")).toBeTruthy();
    expect(within(dialog).getByText("SVG sanitized; 1 unsafe element removed.")).toBeTruthy();
    expect(uploadApi.uploadFloorPlan).toHaveBeenCalledWith("floor-1", expect.objectContaining({ name: "nieuwe-plattegrond.svg" }));
    expect(within(dialog).queryByRole("button", { name: "Kamergrenzen tekenen" })).toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Plattegrond activeren" }));
    await waitFor(() => expect(uploadApi.activateFloorPlan).toHaveBeenCalledWith("floor-1", "asset-2"));
    expect(await within(dialog).findByText(/De eerste plattegrond is actief/)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Kamergrenzen tekenen" }));
    expect(onOpenEditor).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("keeps a replacement upload and error available for a review-start retry", async () => {
    vi.mocked(reviewApi.startReplacementReview).mockRejectedValueOnce({ status: 400 });
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenReplacementReview = vi.fn();
    render(<FloorPlanUploadDialog floor={floor} activeAsset={active} onClose={onClose} onChanged={vi.fn().mockResolvedValue(undefined)} onOpenEditor={vi.fn()} onOpenReplacementReview={onOpenReplacementReview} />);
    const dialog = screen.getByRole("dialog", { name: "Plattegrond uploaden voor Begane grond" });

    await user.upload(within(dialog).getByLabelText("Plattegrondbestand"), new File(["<svg viewBox='0 0 800 500'></svg>"], "nieuwe-plattegrond.svg", { type: "image/svg+xml" }));
    await user.click(within(dialog).getByRole("button", { name: "Uploaden en controleren" }));
    await user.click(await within(dialog).findByRole("button", { name: "Verder naar vervangingscontrole" }));
    expect((await within(dialog).findByRole("alert")).textContent).toContain("De vervangingscontrole starten lukt niet");
    expect(screen.getByAltText("Voorbeeld van nieuwe-plattegrond.svg")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Verder naar vervangingscontrole" }));
    await waitFor(() => expect(reviewApi.startReplacementReview).toHaveBeenCalledTimes(2));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenReplacementReview).toHaveBeenCalledTimes(1);
  });

  it("rejects empty, oversized, and unsupported files before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<FloorPlanUploadDialog floor={floor} activeAsset={null} onClose={vi.fn()} onChanged={vi.fn().mockResolvedValue(undefined)} onOpenEditor={vi.fn()} onOpenReplacementReview={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Plattegrond uploaden voor Begane grond" });
    const file = new File([new Uint8Array(uploadApi.maxFloorPlanUploadBytes + 1)], "plattegrond.txt", { type: "text/plain" });
    await user.upload(within(dialog).getByLabelText("Plattegrondbestand"), file);
    const alert = within(dialog).getByRole("alert");
    expect(alert.textContent).toContain("groter dan 10 MiB");
    expect(alert.textContent).toContain("SVG-, PNG-, JPG- of JPEG-bestand");
    expect((within(dialog).getByRole("button", { name: "Uploaden en controleren" }) as HTMLButtonElement).disabled).toBe(true);
    expect(uploadApi.uploadFloorPlan).not.toHaveBeenCalled();
  });
});
