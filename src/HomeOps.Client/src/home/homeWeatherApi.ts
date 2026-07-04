import { HomeOpsApiClient, type HomeWeatherProjection } from "../api/homeOpsApiClient";

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createHomeWeatherApiClient(): Pick<HomeOpsApiClient, "getHomeWeather"> {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadHomeWeather(
  client = createHomeWeatherApiClient(),
): Promise<HomeWeatherProjection | null> {
  return await client.getHomeWeather();
}
