import { describe, expect, it } from "vitest";
import { WeatherUnitSystem } from "../api/homeOpsApiClient";
import { formatTemperatureLabel, formatWeatherAccessibleLabel, formatWindSpeedLabel } from "./weatherPresentation";

describe("weather unit presentation", () => {
  it("keeps canonical metric facts while formatting the household unit preference", () => {
    expect(formatTemperatureLabel(20, WeatherUnitSystem.Metric)).toBe("20°");
    expect(formatTemperatureLabel(20, WeatherUnitSystem.Imperial)).toBe("68°F");
    expect(formatWindSpeedLabel(16.0934, WeatherUnitSystem.Metric)).toBe("16 km/u");
    expect(formatWindSpeedLabel(16.0934, WeatherUnitSystem.Imperial)).toBe("10 mph");
    expect(formatWeatherAccessibleLabel("School", 20, "Regen", "weercontext", WeatherUnitSystem.Imperial))
      .toBe("School, 68°F, Regen");
  });
});
