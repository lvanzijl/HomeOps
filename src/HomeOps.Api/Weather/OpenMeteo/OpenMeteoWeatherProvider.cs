using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.OpenMeteo;

public sealed class OpenMeteoWeatherProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient httpClient;

    public OpenMeteoWeatherProvider(HttpClient httpClient)
    {
        this.httpClient = httpClient;
    }

    public async Task<FamilyBoardWeatherSnapshot> GetWeatherSnapshotAsync(
        OpenMeteoLocation location,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTimeOffset.UtcNow;

        try
        {
            using var response = await httpClient.GetAsync(BuildForecastUri(location), cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return CreateUnavailableSnapshot(location.HouseholdId, nowUtc, $"Open-Meteo returned {(int)response.StatusCode} {response.StatusCode}.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var forecast = await JsonSerializer.DeserializeAsync<OpenMeteoForecastResponse>(stream, JsonOptions, cancellationToken);

            if (forecast is null || forecast.Current is null)
            {
                return CreateUnavailableSnapshot(location.HouseholdId, nowUtc, "Open-Meteo returned an empty forecast response.");
            }

            return MapForecast(location.HouseholdId, forecast, nowUtc);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return CreateUnavailableSnapshot(location.HouseholdId, nowUtc, "Open-Meteo request timed out.");
        }
        catch (HttpRequestException exception)
        {
            return CreateUnavailableSnapshot(location.HouseholdId, nowUtc, $"Open-Meteo request failed: {exception.Message}");
        }
        catch (JsonException exception)
        {
            return CreateUnavailableSnapshot(location.HouseholdId, nowUtc, $"Open-Meteo response could not be parsed: {exception.Message}");
        }
    }

    public static Uri BuildForecastUri(OpenMeteoLocation location)
    {
        var query = string.Join('&',
            $"latitude={FormatCoordinate(location.Latitude)}",
            $"longitude={FormatCoordinate(location.Longitude)}",
            "timezone=UTC",
            "forecast_days=7",
            "forecast_hours=24",
            "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability",
            "hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m",
            "daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max");

        return new Uri($"https://api.open-meteo.com/v1/forecast?{query}");
    }

    private static FamilyBoardWeatherSnapshot MapForecast(Guid householdId, OpenMeteoForecastResponse forecast, DateTimeOffset refreshedAtUtc)
    {
        var currentObservedAtUtc = ParseDateTimeOffset(forecast.Current!.Time) ?? refreshedAtUtc;
        var hourlySlots = MapHourlySlots(forecast.Hourly).ToArray();
        var dailySummaries = MapDailySummaries(forecast.Daily).ToArray();

        return new FamilyBoardWeatherSnapshot(
            householdId,
            new CurrentWeather(
                ToDecimal(forecast.Current.Temperature2m),
                ToDecimal(forecast.Current.ApparentTemperature ?? forecast.Current.Temperature2m),
                MapWeatherCode(forecast.Current.WeatherCode),
                DescribeCondition(MapWeatherCode(forecast.Current.WeatherCode)),
                forecast.Current.RelativeHumidity2m,
                ToNullableDecimal(forecast.Current.WindSpeed10m),
                ToNullableDecimal(forecast.Current.PrecipitationProbability)),
            hourlySlots,
            dailySummaries,
            new WeatherFreshness(currentObservedAtUtc, refreshedAtUtc, refreshedAtUtc.AddMinutes(30)),
            WeatherProviderStatus.Available);
    }

    private static IEnumerable<HourlyWeatherSlot> MapHourlySlots(OpenMeteoHourlyForecast? hourly)
    {
        if (hourly?.Time is null)
        {
            yield break;
        }

        for (var index = 0; index < hourly.Time.Length; index++)
        {
            var startsAtUtc = ParseDateTimeOffset(hourly.Time[index]);
            if (startsAtUtc is null)
            {
                continue;
            }

            var condition = MapWeatherCode(GetAt(hourly.WeatherCode, index));
            yield return new HourlyWeatherSlot(
                startsAtUtc.Value,
                startsAtUtc.Value.AddHours(1),
                ToDecimal(GetAt(hourly.Temperature2m, index)),
                condition,
                DescribeCondition(condition),
                ToNullableDecimal(GetAt(hourly.PrecipitationProbability, index)),
                ToNullableDecimal(GetAt(hourly.WindSpeed10m, index)));
        }
    }

    private static IEnumerable<DailyWeatherSummary> MapDailySummaries(OpenMeteoDailyForecast? daily)
    {
        if (daily?.Time is null)
        {
            yield break;
        }

        for (var index = 0; index < daily.Time.Length; index++)
        {
            if (!DateOnly.TryParse(daily.Time[index], CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                continue;
            }

            var condition = MapWeatherCode(GetAt(daily.WeatherCode, index));
            yield return new DailyWeatherSummary(
                date,
                ToDecimal(GetAt(daily.Temperature2mMin, index)),
                ToDecimal(GetAt(daily.Temperature2mMax, index)),
                condition,
                DescribeCondition(condition),
                ToNullableDecimal(GetAt(daily.PrecipitationProbabilityMax, index)),
                ToNullableDecimal(GetAt(daily.WindSpeed10mMax, index)));
        }
    }

    private static FamilyBoardWeatherSnapshot CreateUnavailableSnapshot(Guid householdId, DateTimeOffset nowUtc, string message) =>
        new(
            householdId,
            new CurrentWeather(0, 0, WeatherConditionCategory.Unknown, "Weather unavailable"),
            Array.Empty<HourlyWeatherSlot>(),
            Array.Empty<DailyWeatherSummary>(),
            new WeatherFreshness(nowUtc, nowUtc, nowUtc),
            WeatherProviderStatus.Unavailable,
            message);

    internal static WeatherConditionCategory MapWeatherCode(int? weatherCode) => weatherCode switch
    {
        0 => WeatherConditionCategory.Clear,
        1 => WeatherConditionCategory.MostlyClear,
        2 => WeatherConditionCategory.PartlyCloudy,
        3 => WeatherConditionCategory.Cloudy,
        45 or 48 => WeatherConditionCategory.Fog,
        51 or 53 or 55 or 56 or 57 or 61 or 63 or 66 or 67 or 80 or 81 => WeatherConditionCategory.Rain,
        65 or 82 => WeatherConditionCategory.HeavyRain,
        71 or 73 or 75 or 77 or 85 or 86 => WeatherConditionCategory.Snow,
        95 or 96 or 99 => WeatherConditionCategory.Thunderstorm,
        _ => WeatherConditionCategory.Unknown
    };

    private static string DescribeCondition(WeatherConditionCategory condition) => condition switch
    {
        WeatherConditionCategory.Clear => "Clear",
        WeatherConditionCategory.MostlyClear => "Mostly clear",
        WeatherConditionCategory.PartlyCloudy => "Partly cloudy",
        WeatherConditionCategory.Cloudy => "Cloudy",
        WeatherConditionCategory.Rain => "Rain",
        WeatherConditionCategory.HeavyRain => "Heavy rain",
        WeatherConditionCategory.Thunderstorm => "Thunderstorm",
        WeatherConditionCategory.Snow => "Snow",
        WeatherConditionCategory.Fog => "Fog",
        WeatherConditionCategory.Wind => "Wind",
        _ => "Unknown"
    };

    private static DateTimeOffset? ParseDateTimeOffset(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTimeOffset.TryParse(
            value.EndsWith("Z", StringComparison.OrdinalIgnoreCase) ? value : $"{value}Z",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal,
            out var parsed)
            ? parsed.ToUniversalTime()
            : null;
    }

    private static decimal ToDecimal(double? value) => Convert.ToDecimal(value ?? 0, CultureInfo.InvariantCulture);

    private static decimal? ToNullableDecimal(double? value) => value is null ? null : Convert.ToDecimal(value.Value, CultureInfo.InvariantCulture);

    private static T? GetAt<T>(T[]? values, int index) => values is not null && index < values.Length ? values[index] : default;

    private static string FormatCoordinate(decimal coordinate) => coordinate.ToString(CultureInfo.InvariantCulture);

    private sealed class OpenMeteoForecastResponse
    {
        public OpenMeteoCurrentWeather? Current { get; set; }
        public OpenMeteoHourlyForecast? Hourly { get; set; }
        public OpenMeteoDailyForecast? Daily { get; set; }
    }

    private sealed class OpenMeteoCurrentWeather
    {
        public string? Time { get; set; }

        [JsonPropertyName("temperature_2m")]
        public double? Temperature2m { get; set; }

        [JsonPropertyName("relative_humidity_2m")]
        public int? RelativeHumidity2m { get; set; }

        [JsonPropertyName("apparent_temperature")]
        public double? ApparentTemperature { get; set; }

        [JsonPropertyName("weather_code")]
        public int? WeatherCode { get; set; }

        [JsonPropertyName("wind_speed_10m")]
        public double? WindSpeed10m { get; set; }

        [JsonPropertyName("precipitation_probability")]
        public double? PrecipitationProbability { get; set; }
    }

    private sealed class OpenMeteoHourlyForecast
    {
        public string[]? Time { get; set; }

        [JsonPropertyName("temperature_2m")]
        public double?[]? Temperature2m { get; set; }

        [JsonPropertyName("weather_code")]
        public int?[]? WeatherCode { get; set; }

        [JsonPropertyName("precipitation_probability")]
        public double?[]? PrecipitationProbability { get; set; }

        [JsonPropertyName("wind_speed_10m")]
        public double?[]? WindSpeed10m { get; set; }
    }

    private sealed class OpenMeteoDailyForecast
    {
        public string[]? Time { get; set; }

        [JsonPropertyName("weather_code")]
        public int?[]? WeatherCode { get; set; }

        [JsonPropertyName("temperature_2m_min")]
        public double?[]? Temperature2mMin { get; set; }

        [JsonPropertyName("temperature_2m_max")]
        public double?[]? Temperature2mMax { get; set; }

        [JsonPropertyName("precipitation_probability_max")]
        public double?[]? PrecipitationProbabilityMax { get; set; }

        [JsonPropertyName("wind_speed_10m_max")]
        public double?[]? WindSpeed10mMax { get; set; }
    }
}
