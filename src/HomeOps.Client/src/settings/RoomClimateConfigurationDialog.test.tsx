import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClimateRangeDto, HeatingPolicyIntent, RoomClimateConfigurationDto, RoomDto, RoomType } from "../api/homeOpsApiClient";
import { RoomClimateConfigurationDialog } from "./RoomClimateConfigurationDialog";
import * as api from "./woningApi";

vi.mock("./woningApi", async (importOriginal) => ({ ...(await importOriginal<typeof import("./woningApi")>()), saveClimateConfiguration: vi.fn() }));

const room = new RoomDto({ id: "room-1", floorId: "floor-1", name: "Woonkamer", roomType: RoomType.LivingRoom, isEnabled: true, isArchived: false });
const configured = new RoomClimateConfigurationDto({ roomId: "room-1", isConfigured: true, isClimateEnabled: true, isBedtimeRelevant: true, temperatureRange: new ClimateRangeDto({ minimum: 18, maximum: 22 }), humidityRange: new ClimateRangeDto({ minimum: 40, maximum: 60 }), heatingPolicyIntent: HeatingPolicyIntent.ReadOnlyStatus, requiredSourceRoles: [] });

afterEach(() => cleanup());
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.saveClimateConfiguration).mockResolvedValue(configured); });

describe("RoomClimateConfigurationDialog", () => {
  it("creates all generated climate settings and confirms saving and saved states", async () => {
    let resolveSave!: (value: RoomClimateConfigurationDto) => void;
    vi.mocked(api.saveClimateConfiguration).mockReturnValueOnce(new Promise((resolve) => { resolveSave = resolve; }));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<RoomClimateConfigurationDialog room={room} onClose={() => undefined} onSaved={onSaved} />);

    expect(screen.getByText("Niet-opgeslagen klimaatinstellingen.")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: /Voorkeurstemperatuur instellen/ }));
    await user.click(screen.getByRole("checkbox", { name: /Voorkeursluchtvochtigheid instellen/ }));
    await user.click(screen.getByRole("checkbox", { name: /Meenemen rond bedtijd/ }));
    await user.selectOptions(screen.getByLabelText("Gewenste verwarmingsbediening"), String(HeatingPolicyIntent.BoundedControl));
    await user.click(screen.getByRole("button", { name: "Klimaat opslaan" }));

    expect(screen.getByText("Klimaatinstellingen opslaan…")).toBeTruthy();
    expect(api.saveClimateConfiguration).toHaveBeenCalledWith("room-1", expect.objectContaining({ isClimateEnabled: true, isBedtimeRelevant: true, heatingPolicyIntent: HeatingPolicyIntent.BoundedControl, temperatureRange: expect.objectContaining({ minimum: 18, maximum: 22 }), humidityRange: expect.objectContaining({ minimum: 40, maximum: 60 }) }));
    resolveSave(new RoomClimateConfigurationDto({ ...configured, heatingPolicyIntent: HeatingPolicyIntent.BoundedControl }));
    expect(await screen.findByText("Klimaatinstellingen zijn opgeslagen.")).toBeTruthy();
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ heatingPolicyIntent: HeatingPolicyIntent.BoundedControl }));
  });

  it("validates supported bounds and requires a strict minimum before sending", async () => {
    const user = userEvent.setup();
    render(<RoomClimateConfigurationDialog room={room} onClose={() => undefined} onSaved={() => undefined} />);
    await user.click(screen.getByRole("checkbox", { name: /Voorkeurstemperatuur instellen/ }));
    const minimum = screen.getByLabelText("Voorkeurstemperatuur minimum");
    const maximum = screen.getByLabelText("Voorkeurstemperatuur maximum");
    await user.clear(minimum); await user.type(minimum, "22");
    await user.clear(maximum); await user.type(maximum, "22");
    expect(screen.getByRole("alert").textContent).toContain("het minimum moet lager zijn dan het maximum");
    expect(screen.getByRole("button", { name: "Klimaat opslaan" }).hasAttribute("disabled")).toBe(true);
    expect(api.saveClimateConfiguration).not.toHaveBeenCalled();

    await user.clear(minimum); await user.type(minimum, "-31");
    expect(screen.getByRole("alert").textContent).toContain("waarden tussen -30 en 60");
  });

  it("retains edited input and shows a local backend error", async () => {
    vi.mocked(api.saveClimateConfiguration).mockRejectedValueOnce({ status: 500 });
    const user = userEvent.setup();
    render(<RoomClimateConfigurationDialog room={room} configuration={configured} onClose={() => undefined} onSaved={() => undefined} />);
    const maximum = screen.getByLabelText("Voorkeurstemperatuur maximum") as HTMLInputElement;
    await user.clear(maximum); await user.type(maximum, "23");
    await user.click(screen.getByRole("button", { name: "Klimaat opslaan" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Klimaatinstellingen opslaan lukt niet");
    expect(maximum.value).toBe("23");
  });

  it("disables bedtime truthfully and persists an explicitly disabled configuration", async () => {
    const disabledResult = new RoomClimateConfigurationDto({ ...configured, isClimateEnabled: false, isBedtimeRelevant: false });
    vi.mocked(api.saveClimateConfiguration).mockResolvedValueOnce(disabledResult);
    const user = userEvent.setup();
    render(<RoomClimateConfigurationDialog room={room} configuration={configured} onClose={() => undefined} onSaved={() => undefined} />);
    await user.click(screen.getByRole("checkbox", { name: /Klimaat voor deze kamer gebruiken/ }));
    const bedtime = screen.getByRole("checkbox", { name: /Meenemen rond bedtijd/ });
    expect(bedtime.hasAttribute("disabled")).toBe(true);
    expect((bedtime as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByRole("button", { name: "Klimaat opslaan" }));
    await waitFor(() => expect(api.saveClimateConfiguration).toHaveBeenCalledWith("room-1", expect.objectContaining({ isClimateEnabled: false, isBedtimeRelevant: false })));
  });
});
