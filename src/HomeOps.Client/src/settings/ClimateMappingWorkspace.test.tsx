import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomType } from "../api/homeOpsApiClient";
import { ClimateMappingWorkspace } from "./ClimateMappingWorkspace";
import { ClimateSourceRole, MappingHealth, ProviderType } from "./woningApi";
import * as api from "./woningApi";

vi.mock("./woningApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./woningApi")>()),
  loadRoomClimateMappings: vi.fn(),
  loadRoomClimateCapabilities: vi.fn(),
  createClimateMapping: vi.fn(),
  updateClimateMapping: vi.fn(),
  archiveClimateMapping: vi.fn(),
  restoreClimateMapping: vi.fn(),
}));

const room = { id: "r1", name: "Woonkamer", roomType: RoomType.LivingRoom } as any;
const provider = { id: "p1", displayName: "Home Assistant", providerType: ProviderType.HomeAssistant, isEnabled: true, isArchived: false } as any;
const active = {
  id: "m1",
  roomId: "r1",
  providerId: "p1",
  sourceRole: ClimateSourceRole.ComfortTemperature,
  source: { externalSourceId: "sensor.woonkamer", externalDisplayName: "Woonkamer sensor" },
  priority: 0,
  isEnabled: true,
  isArchived: false,
  health: MappingHealth.Healthy,
  diagnosticSummary: "Bron levert geldige temperatuur.",
  lastCheckedUtc: new Date("2026-08-08T10:00:00Z"),
  lastSuccessfulUtc: new Date("2026-08-08T09:59:00Z"),
  isSharedSource: true,
  sharedRoomIds: ["r2"],
} as any;
const archived = { ...active, id: "m2", source: { externalSourceId: "sensor.oud" }, priority: 2, isEnabled: false, isArchived: true, isSharedSource: false, sharedRoomIds: [] } as any;
const capabilities = {
  roomId: "r1",
  hasClimateConfiguration: true,
  isClimateEnabled: true,
  roles: [
    { role: ClimateSourceRole.ComfortTemperature, isRequired: true, status: "Healthy", activeCandidateCount: 1, totalCandidateCount: 2, hasHealthyMapping: true },
    { role: ClimateSourceRole.Humidity, isRequired: true, status: "RequiredUnmapped", activeCandidateCount: 0, totalCandidateCount: 0 },
  ],
} as any;

afterEach(() => cleanup());
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.loadRoomClimateMappings).mockResolvedValue([active, archived]);
  vi.mocked(api.loadRoomClimateCapabilities).mockResolvedValue(capabilities);
  vi.mocked(api.createClimateMapping).mockResolvedValue(active);
  vi.mocked(api.updateClimateMapping).mockResolvedValue(active);
  vi.mocked(api.archiveClimateMapping).mockResolvedValue(undefined);
  vi.mocked(api.restoreClimateMapping).mockResolvedValue(active);
});

function setup() { return render(<ClimateMappingWorkspace room={room} providers={[provider]} onClose={vi.fn()} onChanged={vi.fn()} />); }

describe("ClimateMappingWorkspace", () => {
  it("groups roles and displays health, safe diagnostics, timestamps, shared state, and archived mappings", async () => {
    setup();
    const role = await screen.findByRole("region", { name: "Kamertemperatuur" });
    expect(within(role).getByText("Woonkamer sensor")).toBeTruthy();
    expect(within(role).getAllByText(/In orde/).length).toBeGreaterThan(0);
    expect(within(role).getAllByText("Bron levert geldige temperatuur.").length).toBeGreaterThan(0);
    expect(within(role).getByText(/Gedeeld met/)).toBeTruthy();
    expect(within(role).getByText("Gearchiveerd (1)")).toBeTruthy();
    expect(screen.queryByLabelText(/service/i)).toBeNull();
    expect(screen.queryByLabelText(/json/i)).toBeNull();
  });

  it("creates a typed mapping and blocks duplicate active priorities before submission", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: "Koppeling toevoegen" }));
    await user.selectOptions(screen.getByLabelText("Semantische rol"), String(ClimateSourceRole.Humidity));
    await user.type(screen.getByLabelText("Entiteits-ID"), "sensor.vochtigheid");
    await user.clear(screen.getByLabelText(/Prioriteit/));
    await user.type(screen.getByLabelText(/Prioriteit/), "0");
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() => expect(api.createClimateMapping).toHaveBeenCalledWith("r1", expect.objectContaining({ providerId: "p1", sourceRole: ClimateSourceRole.Humidity, externalSourceId: "sensor.vochtigheid", priority: 0 })));

    await user.click(screen.getByRole("button", { name: "Koppeling toevoegen" }));
    await user.type(screen.getByLabelText("Entiteits-ID"), "sensor.tweede");
    await user.clear(screen.getByLabelText(/Prioriteit/));
    await user.type(screen.getByLabelText(/Prioriteit/), "0");
    expect(screen.getByRole("alert").textContent).toContain("wordt al gebruikt");
    expect((screen.getByRole("button", { name: "Opslaan" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("edits enablement and source fields without exposing writable diagnostics", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: "Bewerken" }));
    await user.clear(screen.getByLabelText("Entiteits-ID"));
    await user.type(screen.getByLabelText("Entiteits-ID"), "sensor.woonkamer_nieuw");
    await user.click(screen.getByLabelText(/Ingeschakeld/));
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() => expect(api.updateClimateMapping).toHaveBeenCalledWith("m1", expect.objectContaining({ externalSourceId: "sensor.woonkamer_nieuw", isEnabled: false })));
    expect(screen.queryByLabelText(/diagnose/i)).toBeNull();
  });

  it("archives with confirmation and reports restore dependency failures without closing", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    setup();
    await user.click(await screen.findByRole("button", { name: "Archiveren" }));
    await waitFor(() => expect(api.archiveClimateMapping).toHaveBeenCalledWith("m1"));
    vi.mocked(api.restoreClimateMapping).mockRejectedValueOnce({ status: 400 });
    await user.click(screen.getByText("Gearchiveerd (1)"));
    await user.click(screen.getByRole("button", { name: "Herstellen" }));
    expect((await screen.findByRole("alert")).textContent).toContain("afhankelijkheden");
    expect(screen.getByRole("dialog", { name: "Klimaatkoppelingen voor Woonkamer" })).toBeTruthy();
  });
});
