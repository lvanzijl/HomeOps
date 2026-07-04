import {
  DepartureAdviceConfidence,
  type DepartureAdviceProjection,
  type HomeWeatherProjection,
  WeatherConditionCategory,
} from "../api/homeOpsApiClient";
import { getDepartureAdviceHeaderText } from "./weatherAdviceLocalization";

export type HomeWeatherDisplay = {
  accessibleLabel: string;
  advice: string;
  iconKey: string;
  temperatureLabel: string;
};

export function buildHomeWeatherDisplay(
  weather: HomeWeatherProjection | null,
): HomeWeatherDisplay {
  const advice = resolveDepartureAdviceHeadline(weather?.departureAdvice);
  const temperatureLabel = formatTemperatureLabel(weather?.temperatureCelsius);

  return {
    accessibleLabel:
      temperatureLabel === "—"
        ? `Weeradvies, ${advice}`
        : `Weeradvies, ${temperatureLabel}, ${advice}`,
    advice,
    iconKey: toWeatherIconKey(weather?.condition, weather?.iconKey),
    temperatureLabel,
  };
}

export function resolveDepartureAdviceHeadline(
  advice: DepartureAdviceProjection | null | undefined,
): string {
  const categories = advice?.categories ?? [];
  const categoryAdvice = categories
    .map((category) => getDepartureAdviceHeaderText(category))
    .find((copy): copy is string => Boolean(copy));

  if (categoryAdvice) {
    return categoryAdvice;
  }

  const summary = advice?.summary?.split("·")[0]?.trim();
  if (!summary) {
    return "Geen weeradvies";
  }

  if (summary.toLowerCase() === "geen bijzonder weeradvies") {
    return "Geen weeradvies";
  }

  return truncateWeatherAdvice(capitalizeWeatherCopy(summary));
}

export function getDepartureAdviceConfidenceText(
  confidence: DepartureAdviceConfidence | undefined,
): string | undefined {
  switch (confidence) {
    case DepartureAdviceConfidence.High:
      return "Zeker";
    case DepartureAdviceConfidence.Moderate:
      return "Redelijk zeker";
    case DepartureAdviceConfidence.Low:
      return "Voorzichtig";
    default:
      return undefined;
  }
}

export function formatTemperatureLabel(
  temperatureCelsius: number | undefined,
): string {
  return typeof temperatureCelsius === "number"
    ? `${Math.round(temperatureCelsius)}°`
    : "—";
}

export function formatWeatherAccessibleLabel(
  contextLabel: string,
  temperatureCelsius: number | undefined,
  summary: string | undefined,
  fallbackSummary = "weercontext",
): string {
  return `${contextLabel}, ${formatTemperatureLabel(temperatureCelsius)}, ${
    formatWeatherSentence(summary) ?? fallbackSummary
  }`;
}

export function formatWeatherSentence(
  copy: string | undefined,
): string | undefined {
  const normalized = normalizeWeatherCopy(copy);
  if (!normalized) {
    return undefined;
  }

  return capitalizeWeatherCopy(normalized);
}

export function toWeatherIconKey(
  condition: WeatherConditionCategory | undefined,
  iconKey?: string,
): string {
  if (iconKey) {
    return iconKey;
  }

  return `weather-${WeatherConditionCategory[
    condition ?? WeatherConditionCategory.Unknown
  ].toLowerCase()}`;
}

export function WeatherGlyph({ iconKey }: { iconKey: string }) {
  switch (iconKey) {
    case "weather-clear":
    case "weather-mostlyclear":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.25" />
          <path d="M12 2.75v2.5" />
          <path d="M12 18.75v2.5" />
          <path d="M2.75 12h2.5" />
          <path d="M18.75 12h2.5" />
          <path d="m5.45 5.45 1.8 1.8" />
          <path d="m16.75 16.75 1.8 1.8" />
          <path d="m18.55 5.45-1.8 1.8" />
          <path d="m7.25 16.75-1.8 1.8" />
        </svg>
      );
    case "weather-partlycloudy":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9.25 6.2a3.35 3.35 0 1 1 6.37 1.45" />
          <path d="M7.1 18.25h8.35a3.05 3.05 0 1 0-.55-6.05 4.6 4.6 0 0 0-8.87 1.55A2.3 2.3 0 0 0 7.1 18.25Z" />
          <path d="M15.4 5.65h2.25" />
          <path d="M14.6 3.7V1.75" />
        </svg>
      );
    case "weather-rain":
    case "weather-heavyrain":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6.8 15.2h9.15a3.15 3.15 0 1 0-.6-6.25 4.95 4.95 0 0 0-9.6 1.7A2.65 2.65 0 0 0 6.8 15.2Z" />
          <path d="m9 17.25-.9 2.2" />
          <path d="m13 17.25-.9 2.2" />
          <path d="m17 17.25-.9 2.2" />
        </svg>
      );
    case "weather-thunderstorm":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6.8 14.8h9.15a3.15 3.15 0 1 0-.6-6.25 4.95 4.95 0 0 0-9.6 1.7A2.65 2.65 0 0 0 6.8 14.8Z" />
          <path d="m12.65 15.65-2.05 3.1h2.05l-1.05 3.5 3.05-4.35H12.7l1.35-2.25" />
        </svg>
      );
    case "weather-snow":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6.8 14.9h9.15a3.15 3.15 0 1 0-.6-6.25 4.95 4.95 0 0 0-9.6 1.7A2.65 2.65 0 0 0 6.8 14.9Z" />
          <path d="M9 17.1v3.2" />
          <path d="M7.6 18.55 10.4 19.85" />
          <path d="M7.6 19.85 10.4 18.55" />
          <path d="M15 17.1v3.2" />
          <path d="M13.6 18.55 16.4 19.85" />
          <path d="M13.6 19.85 16.4 18.55" />
        </svg>
      );
    case "weather-fog":
    case "weather-cloudy":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6.8 13.75h9.15a3.15 3.15 0 1 0-.6-6.25 4.95 4.95 0 0 0-9.6 1.7A2.65 2.65 0 0 0 6.8 13.75Z" />
          <path d="M5.9 17.4h12.2" />
          <path d="M7.3 20.1h9.4" />
        </svg>
      );
    case "weather-wind":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3.5 9.25h10.75a2.25 2.25 0 1 0-2.25-2.25" />
          <path d="M3.5 13.5h14.5a2.5 2.5 0 1 1-2.5 2.5" />
          <path d="M3.5 17.75h8.75a2 2 0 1 1-2 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6.8 14.4h9.15a3.15 3.15 0 1 0-.6-6.25 4.95 4.95 0 0 0-9.6 1.7A2.65 2.65 0 0 0 6.8 14.4Z" />
          <path d="M9.4 18.6h5.2" />
          <path d="M12 16.8v3.6" />
        </svg>
      );
  }
}

function capitalizeWeatherCopy(copy: string): string {
  if (!copy) {
    return "Geen weeradvies";
  }

  return `${copy.charAt(0).toUpperCase()}${copy.slice(1)}`;
}

function truncateWeatherAdvice(copy: string): string {
  const normalized = normalizeWeatherCopy(copy);
  const maxLength = 24;
  if (!normalized) {
    return "Geen weeradvies";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeWeatherCopy(copy: string | undefined): string {
  return copy?.replace(/\s+/g, " ").trim() ?? "";
}
