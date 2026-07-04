import { HomeOpsApiClient, type WeatherDetailProjection } from "../api/homeOpsApiClient";

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";

export function createWeatherDetailApiClient(): Pick<HomeOpsApiClient, "getWeatherDetail"> {
  return new HomeOpsApiClient(apiBaseUrl);
}

export async function loadWeatherDetail(
  client = createWeatherDetailApiClient(),
): Promise<WeatherDetailProjection | null> {
  return await client.getWeatherDetail();
}
