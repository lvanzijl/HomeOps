import { HomeOpsApiClient, type HomeWeatherProjection } from "../api/homeOpsApiClient";
import { createWeatherApiClient } from "../weather/weatherApiClient";

export function createHomeWeatherApiClient(): Pick<HomeOpsApiClient, "getHomeWeather"> {
  return createWeatherApiClient();
}

export async function loadHomeWeather(
  client = createHomeWeatherApiClient(),
): Promise<HomeWeatherProjection | null> {
  return await client.getHomeWeather();
}
