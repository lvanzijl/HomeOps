import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeatherProviderStatus, WeatherUnitSystem } from "../api/homeOpsApiClient";
import { HouseholdWeatherLocationDialog } from "./HouseholdWeatherLocationDialog";

const { loadLocation, saveLocation, refreshLocation } = vi.hoisted(() => ({
  loadLocation: vi.fn(),
  saveLocation: vi.fn(),
  refreshLocation: vi.fn(),
}));

vi.mock("./householdWeatherLocationApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./householdWeatherLocationApi")>();
  return {
    ...actual,
    loadHouseholdWeatherLocation: loadLocation,
    saveHouseholdWeatherLocation: saveLocation,
    refreshHouseholdWeatherLocation: refreshLocation,
  };
});

const unconfigured = {
  isConfigured: false,
  unitSystem: WeatherUnitSystem.Metric,
  providerName: "Open-Meteo",
  providerStatus: WeatherProviderStatus.Unknown,
  statusMessage: "Stel eerst een weerlocatie in.",
};

afterEach(cleanup);

describe("HouseholdWeatherLocationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadLocation.mockResolvedValue(unconfigured);
    saveLocation.mockResolvedValue({
      ...unconfigured,
      isConfigured: true,
      displayName: "Amsterdam thuis",
      latitude: 52.3676,
      longitude: 4.9041,
      unitSystem: WeatherUnitSystem.Imperial,
      statusMessage: "De locatie is opgeslagen en wacht op een eerste verversing.",
    });
  });

  it("keeps coordinate entry bounded and saves a complete household location", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(<HouseholdWeatherLocationDialog onChanged={onChanged} onClose={() => {}} />);

    const dialog = await screen.findByRole("dialog", { name: "Weerlocatie" });
    expect(within(dialog).queryByLabelText(/adres/i)).toBeNull();
    expect(within(dialog).queryByText(/browserlocatie/i)).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Weer vernieuwen" })).toHaveProperty("disabled", true);

    await user.type(within(dialog).getByLabelText("Naam voor thuis"), "Amsterdam thuis");
    await user.type(within(dialog).getByLabelText("Breedtegraad"), "52.3676");
    await user.type(within(dialog).getByLabelText("Lengtegraad"), "4.9041");
    await user.selectOptions(within(dialog).getByLabelText("Eenheden"), `${WeatherUnitSystem.Imperial}`);
    await user.click(within(dialog).getByRole("button", { name: "Locatie opslaan" }));

    await waitFor(() => expect(saveLocation).toHaveBeenCalledWith({
      displayName: "Amsterdam thuis",
      latitude: "52.3676",
      longitude: "4.9041",
      unitSystem: WeatherUnitSystem.Imperial,
    }));
    expect(await within(dialog).findByText(/De weerlocatie is opgeslagen/i)).not.toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByRole("button", { name: "Weer vernieuwen" })).toHaveProperty("disabled", false);
  });

  it("retains entered values and shows coordinate validation without submitting", async () => {
    const user = userEvent.setup();
    render(<HouseholdWeatherLocationDialog onClose={() => {}} />);
    const dialog = await screen.findByRole("dialog", { name: "Weerlocatie" });

    await user.type(within(dialog).getByLabelText("Naam voor thuis"), "Thuis");
    await user.type(within(dialog).getByLabelText("Breedtegraad"), "91");
    await user.type(within(dialog).getByLabelText("Lengtegraad"), "4.9");
    await user.click(within(dialog).getByRole("button", { name: "Locatie opslaan" }));

    expect(await within(dialog).findByText("Breedtegraad moet tussen -90 en 90 liggen.")).not.toBeNull();
    expect(within(dialog).getByLabelText("Naam voor thuis")).toHaveProperty("value", "Thuis");
    expect(within(dialog).getByLabelText("Breedtegraad")).toHaveProperty("value", "91");
    expect(saveLocation).not.toHaveBeenCalled();
  });

  it("shows normalized provider failure and keeps retry available", async () => {
    const user = userEvent.setup();
    loadLocation.mockResolvedValueOnce({
      ...unconfigured,
      isConfigured: true,
      displayName: "Thuis",
      latitude: 52.36,
      longitude: 4.9,
    });
    refreshLocation.mockResolvedValueOnce({
      ...unconfigured,
      isConfigured: true,
      displayName: "Thuis",
      latitude: 52.36,
      longitude: 4.9,
      providerStatus: WeatherProviderStatus.Unavailable,
      lastRefreshedUtc: new Date("2026-08-08T13:00:00Z"),
      statusMessage: "Open-Meteo is nu niet bereikbaar. Probeer opnieuw.",
    });

    render(<HouseholdWeatherLocationDialog onClose={() => {}} />);
    const dialog = await screen.findByRole("dialog", { name: "Weerlocatie" });
    await user.click(within(dialog).getByRole("button", { name: "Weer vernieuwen" }));

    expect(await within(dialog).findByText("Open-Meteo is nu niet bereikbaar. Probeer opnieuw.")).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Weer vernieuwen" })).toHaveProperty("disabled", false);
  });
});
