import { HomeOpsApiClient, type AgendaWeatherProjection } from "../api/homeOpsApiClient";
import { createWeatherApiClient } from "../weather/weatherApiClient";

export function createAgendaWeatherApiClient(): Pick<HomeOpsApiClient, "getAgendaWeather"> {
  return createWeatherApiClient();
}

export async function loadAgendaWeather(
  client = createAgendaWeatherApiClient(),
): Promise<AgendaWeatherProjection | null> {
  return await client.getAgendaWeather();
}
