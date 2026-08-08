import {
  ApiException,
  HomeOpsApiClient,
  UpdateHouseholdWeatherLocationRequest,
  WeatherProviderStatus,
  WeatherUnitSystem,
  type HouseholdWeatherLocationDto,
} from "../api/homeOpsApiClient";

export type HouseholdWeatherLocation = HouseholdWeatherLocationDto;

export interface WeatherLocationFormValues {
  displayName: string;
  latitude: string;
  longitude: string;
  unitSystem: WeatherUnitSystem;
}

export { WeatherProviderStatus, WeatherUnitSystem };

export function createWeatherLocationClient() {
  return new HomeOpsApiClient();
}

export function loadHouseholdWeatherLocation() {
  return createWeatherLocationClient().getCurrentHouseholdWeatherLocation();
}

export function refreshHouseholdWeatherLocation() {
  return createWeatherLocationClient().refreshCurrentHouseholdWeatherLocation();
}

export function createWeatherLocationFormValues(
  location?: HouseholdWeatherLocation | null,
): WeatherLocationFormValues {
  return {
    displayName: location?.displayName ?? "",
    latitude: typeof location?.latitude === "number" ? `${location.latitude}` : "",
    longitude: typeof location?.longitude === "number" ? `${location.longitude}` : "",
    unitSystem: location?.unitSystem ?? WeatherUnitSystem.Metric,
  };
}

export function validateWeatherLocationForm(values: WeatherLocationFormValues) {
  const errors: string[] = [];
  const latitude = parseCoordinate(values.latitude);
  const longitude = parseCoordinate(values.longitude);

  if (!values.displayName.trim()) errors.push("Vul een herkenbare locatienaam in.");
  else if (values.displayName.trim().length > 120) errors.push("De locatienaam mag maximaal 120 tekens bevatten.");
  if (latitude === null || latitude < -90 || latitude > 90) errors.push("Breedtegraad moet tussen -90 en 90 liggen.");
  if (longitude === null || longitude < -180 || longitude > 180) errors.push("Lengtegraad moet tussen -180 en 180 liggen.");

  return errors;
}

export async function saveHouseholdWeatherLocation(values: WeatherLocationFormValues) {
  const errors = validateWeatherLocationForm(values);
  if (errors.length > 0) throw new WeatherLocationFormError(errors);

  return createWeatherLocationClient().updateCurrentHouseholdWeatherLocation(
    new UpdateHouseholdWeatherLocationRequest({
      displayName: values.displayName.trim(),
      latitude: parseCoordinate(values.latitude)!,
      longitude: parseCoordinate(values.longitude)!,
      unitSystem: values.unitSystem,
    }),
  );
}

export class WeatherLocationFormError extends Error {
  constructor(public readonly validationErrors: readonly string[]) {
    super(validationErrors[0] ?? "De weerlocatie is niet geldig.");
  }
}

export function getWeatherLocationError(error: unknown) {
  if (error instanceof WeatherLocationFormError) return error.message;
  if (error instanceof ApiException) {
    try {
      const body = JSON.parse(error.response) as { errors?: Record<string, string[]>; title?: string };
      const validation = Object.values(body.errors ?? {}).flat();
      return validation[0] ?? body.title ?? "De weerlocatie kon niet worden opgeslagen.";
    } catch {
      return "De weerlocatie kon niet worden opgeslagen.";
    }
  }
  return "De weerlocatie kon niet worden opgeslagen.";
}

function parseCoordinate(value: string): number | null {
  const normalized = value.trim();
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
