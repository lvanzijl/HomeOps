import { WeatherGlyph } from "./weatherPresentation";

export type WeatherTemperatureDisplay = {
  accessibleLabel: string;
  iconKey: string;
  temperatureLabel: string;
};

export type WeatherTemperatureBadgeVariant = "prominent" | "medium" | "compact";

export function WeatherTemperatureBadge({
  className,
  display,
  variant,
}: {
  className?: string;
  display: WeatherTemperatureDisplay;
  variant: WeatherTemperatureBadgeVariant;
}) {
  return (
    <span
      aria-label={display.accessibleLabel}
      className={[
        "weather-temperature-badge",
        `weather-temperature-badge--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="img"
      title={display.accessibleLabel}
    >
      <span className="weather-temperature-badge__icon" aria-hidden="true">
        <WeatherGlyph iconKey={display.iconKey} />
      </span>
      <span className="weather-temperature-badge__temperature">
        {display.temperatureLabel}
      </span>
    </span>
  );
}
