import { useId } from "react";
import type { WeatherDetailProjection } from "../api/homeOpsApiClient";
import {
  formatTemperatureLabel,
  formatWeatherSentence,
  getDepartureAdviceConfidenceText,
  resolveDepartureAdviceHeadline,
  toWeatherIconKey,
  WeatherGlyph,
} from "./weatherPresentation";

interface WeatherDetailDialogProps {
  detail: WeatherDetailProjection | null;
  onClose(): void;
  status: "loading" | "ready" | "error";
}

const hourFormatter = new Intl.DateTimeFormat("nl-NL", {
  hour: "numeric",
  minute: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  timeZone: "UTC",
});

export function WeatherDetailDialog({
  detail,
  onClose,
  status,
}: WeatherDetailDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const advice = detail?.departureAdvice;
  const adviceHeadline = resolveDepartureAdviceHeadline(advice);
  const confidenceLabel = getDepartureAdviceConfidenceText(advice?.confidence);
  const explanation = buildExplanation(detail, adviceHeadline);
  const summaryItems = buildSummaryItems(detail, adviceHeadline, explanation);
  const hourlyItems = (detail?.hourly ?? []).filter(
    (item) => item.startsAtUtc instanceof Date,
  );
  const dailyItems = (detail?.daily ?? []).filter(
    (item) => item.date instanceof Date,
  );
  const detailItems = buildDetailItems(detail);
  const hasContent =
    Boolean(detail?.current) ||
    Boolean(detail?.departureAdvice) ||
    summaryItems.length > 0 ||
    hourlyItems.length > 0 ||
    dailyItems.length > 0 ||
    detailItems.length > 0;
  const currentIconKey = toWeatherIconKey(detail?.current?.condition);

  return (
    <div
      className="avatar-editor-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="home-capture-dialog weather-detail-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <p className="eyebrow">Weer</p>
            <h3 id={titleId}>Weer voor vandaag</h3>
            <p id={descriptionId}>
              Uitleg bij het vertrekadvies zonder de Home-header te veranderen.
            </p>
          </div>
          <button
            aria-label="Weerdetails sluiten"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6 18 18" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </header>

        {status === "loading" ? (
          <div className="weather-detail-state">
            <strong>Weer wordt bijgewerkt.</strong>
            <p>Een compacte uitleg staat zo voor je klaar.</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="weather-detail-state" role="status">
            <strong>We kunnen het weer nu even niet ophalen.</strong>
            <p>Thuis blijft gewoon bruikbaar. Probeer het later nog eens.</p>
          </div>
        ) : null}

        {status === "ready" && !hasContent ? (
          <div className="weather-detail-state" role="status">
            <strong>Er is nog geen weeruitleg beschikbaar.</strong>
            <p>De plek blijft rustig staan totdat er weerdata is.</p>
          </div>
        ) : null}

        {status === "ready" && hasContent ? (
          <div className="weather-detail-body">
            <section className="weather-detail-section weather-detail-hero">
              <span className="weather-detail-hero-icon" aria-hidden="true">
                <WeatherGlyph iconKey={currentIconKey} />
              </span>
              <div className="weather-detail-hero-copy">
                <div className="weather-detail-hero-row">
                  <span className="weather-detail-temperature">
                    {formatTemperatureLabel(detail?.current?.temperatureCelsius)}
                  </span>
                  {confidenceLabel ? (
                    <span className="weather-detail-confidence">
                      {confidenceLabel}
                    </span>
                  ) : null}
                </div>
                <h4>{adviceHeadline}</h4>
                {explanation ? (
                  <p className="weather-detail-explanation">{explanation}</p>
                ) : null}
              </div>
            </section>

            {summaryItems.length > 0 ? (
              <section className="weather-detail-section">
                <div className="weather-detail-section-heading">
                  <h5>Samenvatting vandaag</h5>
                </div>
                <ul className="weather-detail-summary-list">
                  {summaryItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hourlyItems.length > 0 ? (
              <section className="weather-detail-section">
                <div className="weather-detail-section-heading">
                  <h5>Uurverwachting</h5>
                </div>
                <ul className="weather-detail-hourly-list">
                  {hourlyItems.slice(0, 8).map((item) => (
                    <li key={item.startsAtUtc!.toISOString()}>
                      <span className="weather-detail-hour">
                        {hourFormatter.format(item.startsAtUtc!)}
                      </span>
                      <span className="weather-detail-hour-icon" aria-hidden="true">
                        <WeatherGlyph iconKey={toWeatherIconKey(item.condition)} />
                      </span>
                      <span className="weather-detail-hour-temp">
                        {formatTemperatureLabel(item.temperatureCelsius)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {dailyItems.length > 0 ? (
              <section className="weather-detail-section">
                <div className="weather-detail-section-heading">
                  <h5>Komende dagen</h5>
                </div>
                <ul className="weather-detail-day-list">
                  {dailyItems.slice(0, 5).map((item) => (
                    <li key={item.date!.toISOString()}>
                      <span className="weather-detail-day-name">
                        {capitalizeDayLabel(weekdayFormatter.format(item.date!))}
                      </span>
                      <span className="weather-detail-day-icon" aria-hidden="true">
                        <WeatherGlyph iconKey={toWeatherIconKey(item.condition)} />
                      </span>
                      <span className="weather-detail-day-range">
                        {formatTemperatureLabel(item.lowTemperatureCelsius)} /{" "}
                        {formatTemperatureLabel(item.highTemperatureCelsius)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detailItems.length > 0 ? (
              <section className="weather-detail-section">
                <div className="weather-detail-section-heading">
                  <h5>Details</h5>
                </div>
                <dl className="weather-detail-facts">
                  {detailItems.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function buildExplanation(
  detail: WeatherDetailProjection | null,
  adviceHeadline: string,
): string | undefined {
  return firstDistinctSummary(
    [detail?.summary, detail?.current?.summary, detail?.daily?.[0]?.summary],
    [adviceHeadline, detail?.departureAdvice?.summary],
  );
}

function buildSummaryItems(
  detail: WeatherDetailProjection | null,
  adviceHeadline: string,
  explanation: string | undefined,
): string[] {
  const blockedValues = [
    adviceHeadline,
    detail?.departureAdvice?.summary,
    explanation,
  ];
  const uniqueItems: string[] = [];

  for (const source of [
    detail?.summary,
    detail?.current?.summary,
    ...(detail?.hourly ?? []).map((item) => item.summary),
    ...(detail?.daily ?? []).map((item) => item.summary),
  ]) {
    const sentence = formatWeatherSentence(source);
    if (!sentence || matchesAnyBlockedValue(sentence, blockedValues)) {
      continue;
    }

    if (
      uniqueItems.some(
        (existing) => existing.toLocaleLowerCase("nl-NL") === sentence.toLocaleLowerCase("nl-NL"),
      )
    ) {
      continue;
    }

    uniqueItems.push(sentence);

    if (uniqueItems.length === 4) {
      break;
    }
  }

  return uniqueItems;
}

function buildDetailItems(detail: WeatherDetailProjection | null) {
  const current = detail?.current;
  const detailValues = detail?.details;

  return [
    formatFact("Gevoel", formatTemperatureLabelOrNothing(current?.feelsLikeTemperatureCelsius)),
    formatFact("Wind", formatNumberFact(detailValues?.windSpeedKph ?? current?.windSpeedKph, "km/u")),
    formatFact(
      "Luchtvochtigheid",
      formatNumberFact(
        detailValues?.relativeHumidityPercent ?? current?.relativeHumidityPercent,
        "%",
      ),
    ),
    formatFact("UV", formatUv(detailValues?.uvIndex ?? current?.uvIndex)),
    formatFact(
      "Neerslag",
      formatNumberFact(
        detailValues?.precipitationChancePercent ?? current?.precipitationChancePercent,
        "%",
      ),
    ),
  ].filter((item): item is { label: string; value: string } => item !== null);
}

function formatFact(label: string, value: string | undefined) {
  if (!value) {
    return null;
  }

  return { label, value };
}

function formatNumberFact(
  value: number | undefined,
  suffix: string,
): string | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  return `${Math.round(value)}${suffix}`;
}

function formatTemperatureLabelOrNothing(
  value: number | undefined,
): string | undefined {
  return typeof value === "number" ? formatTemperatureLabel(value) : undefined;
}

function formatUv(value: number | undefined): string | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  return `${Math.round(value * 10) / 10}`;
}

function firstDistinctSummary(
  values: Array<string | undefined>,
  blockedValues: Array<string | undefined>,
): string | undefined {
  for (const value of values) {
    const sentence = formatWeatherSentence(value);
    if (!sentence || matchesAnyBlockedValue(sentence, blockedValues)) {
      continue;
    }

    return sentence;
  }

  return undefined;
}

function matchesAnyBlockedValue(
  value: string,
  blockedValues: Array<string | undefined>,
): boolean {
  const normalizedValue = value.toLocaleLowerCase("nl-NL");
  return blockedValues.some((blockedValue) => {
    const sentence = formatWeatherSentence(blockedValue);
    return sentence?.toLocaleLowerCase("nl-NL") === normalizedValue;
  });
}

function capitalizeDayLabel(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}
