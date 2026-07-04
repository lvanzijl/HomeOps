import { HomeOpsApiClient } from "../api/homeOpsApiClient";

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createWeatherApiClient() {
  return new HomeOpsApiClient(apiBaseUrl);
}
