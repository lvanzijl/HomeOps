import { HomeOpsApiClient, type WeatherDetailProjection } from "../api/homeOpsApiClient";
import { createWeatherApiClient } from "../weather/weatherApiClient";

export function createWeatherDetailApiClient(): Pick<HomeOpsApiClient, "getWeatherDetail"> {
  return createWeatherApiClient();
}

export async function loadWeatherDetail(
  client = createWeatherDetailApiClient(),
): Promise<WeatherDetailProjection | null> {
  return await client.getWeatherDetail();
}
