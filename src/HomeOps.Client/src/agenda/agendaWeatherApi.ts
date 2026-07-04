import { HomeOpsApiClient, type AgendaWeatherProjection } from "../api/homeOpsApiClient";

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createAgendaWeatherApiClient(): Pick<HomeOpsApiClient, "getAgendaWeather"> {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadAgendaWeather(
  client = createAgendaWeatherApiClient(),
): Promise<AgendaWeatherProjection | null> {
  return await client.getAgendaWeather();
}
