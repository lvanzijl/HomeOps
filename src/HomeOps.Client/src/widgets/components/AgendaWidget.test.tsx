import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AgendaWeatherProjection,
  AgendaWeatherSlotProjection,
  WeatherConditionCategory,
} from "../../api/homeOpsApiClient";
import type {
  EventSource,
  NormalizedEvent,
} from "../../events/eventSourceModel";
import { AgendaWidget } from "./AgendaWidget";

vi.mock("../../demo/demoAgendaData", () => ({
  demoReadOnlyEvents: [],
  demoReadOnlyEventSources: [],
  demoToday: "2026-06-18",
}));

vi.mock("../../agenda/calendarEventsApi", () => ({
  loadCalendarAgendaData: vi.fn(),
  createCalendarAgendaEvent: vi.fn(),
  updateCalendarAgendaEvent: vi.fn(),
  deleteCalendarAgendaEvent: vi.fn(),
}));
vi.mock("../../agenda/agendaWeatherApi", () => ({
  loadAgendaWeather: vi.fn(),
}));

async function mockedCalendarEventsApi() {
  return await import("../../agenda/calendarEventsApi");
}

async function mockedAgendaWeatherApi() {
  return await import("../../agenda/agendaWeatherApi");
}

const calendarSource: EventSource = {
  id: "manual-source",
  name: "HomeOps Calendar",
  type: "manual",
  enabled: true,
  capability: "writable",
  visibility: { visibleByDefault: true, groupName: "Household" },
  color: { hex: "#4f46e5" },
};

const dentistEvent: NormalizedEvent = {
  id: "dentist",
  sourceId: calendarSource.id,
  title: "Dentist Appointment",
  startsAt: "2026-06-18T09:30:00.000Z",
  endsAt: "2026-06-18T10:15:00.000Z",
  allDay: false,
  editable: true,
};

const overflowEvents: NormalizedEvent[] = [
  {
    id: "football",
    sourceId: calendarSource.id,
    title: "Voetbal training",
    startsAt: "2026-06-18T12:00:00.000Z",
    endsAt: "2026-06-18T13:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "shopping",
    sourceId: calendarSource.id,
    title: "Boodschappen markt",
    startsAt: "2026-06-18T14:00:00.000Z",
    endsAt: "2026-06-18T15:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "family",
    sourceId: calendarSource.id,
    title: "Familie eten",
    startsAt: "2026-06-18T17:00:00.000Z",
    endsAt: "2026-06-18T18:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "work",
    sourceId: calendarSource.id,
    title: "Werk overleg",
    startsAt: "2026-06-18T19:00:00.000Z",
    endsAt: "2026-06-18T20:00:00.000Z",
    allDay: false,
    editable: true,
  },
];

const currentWeekEvents: NormalizedEvent[] = [
  {
    id: "week-school",
    sourceId: calendarSource.id,
    title: "School ouderavond",
    startsAt: "2026-06-27T08:00:00.000Z",
    endsAt: "2026-06-27T09:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "week-sports",
    sourceId: calendarSource.id,
    title: "Voetbal wedstrijd",
    startsAt: "2026-06-27T10:00:00.000Z",
    endsAt: "2026-06-27T11:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "week-shopping",
    sourceId: calendarSource.id,
    title: "Boodschappen supermarkt",
    startsAt: "2026-06-27T12:00:00.000Z",
    endsAt: "2026-06-27T13:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "week-family",
    sourceId: calendarSource.id,
    title: "Familie bezoek",
    startsAt: "2026-06-27T14:00:00.000Z",
    endsAt: "2026-06-27T15:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "week-doctor",
    sourceId: calendarSource.id,
    title: "Tandarts controle",
    startsAt: "2026-06-27T16:00:00.000Z",
    endsAt: "2026-06-27T16:30:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "week-sunday",
    sourceId: calendarSource.id,
    title: "Oma eten",
    startsAt: "2026-06-28T17:00:00.000Z",
    endsAt: "2026-06-28T18:30:00.000Z",
    allDay: false,
    editable: true,
  },
];

const marketingAgendaEvents: NormalizedEvent[] = [
  {
    id: "canonical-tuesday",
    sourceId: calendarSource.id,
    title: "Zwemles Thomas",
    startsAt: "2026-06-16T15:30:00.000Z",
    endsAt: "2026-06-16T16:15:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "canonical-sunday",
    sourceId: calendarSource.id,
    title: "Pannenkoeken ontbijt",
    startsAt: "2026-06-21T08:30:00.000Z",
    endsAt: "2026-06-21T09:30:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "following-monday",
    sourceId: calendarSource.id,
    title: "Volgende maandag",
    startsAt: "2026-06-22T09:00:00.000Z",
    endsAt: "2026-06-22T10:00:00.000Z",
    allDay: false,
    editable: true,
  },
];

const timelineEvents: NormalizedEvent[] = [
  {
    id: "past-event",
    sourceId: calendarSource.id,
    title: "Verleden afspraak",
    startsAt: "2026-06-27T10:00:00.000Z",
    endsAt: "2026-06-27T11:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "today-late",
    sourceId: calendarSource.id,
    title: "Voetbal training",
    startsAt: "2026-06-28T16:00:00.000Z",
    endsAt: "2026-06-28T17:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "today-early",
    sourceId: calendarSource.id,
    title: "Tandarts controle",
    startsAt: "2026-06-28T09:00:00.000Z",
    endsAt: "2026-06-28T09:30:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "tomorrow-family",
    sourceId: calendarSource.id,
    title: "Familie brunch",
    startsAt: "2026-06-29T11:00:00.000Z",
    endsAt: "2026-06-29T12:00:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "next-week-school",
    sourceId: calendarSource.id,
    title: "School rapportgesprek",
    startsAt: "2026-06-30T15:00:00.000Z",
    endsAt: "2026-06-30T15:30:00.000Z",
    allDay: false,
    editable: true,
  },
  {
    id: "later-shopping",
    sourceId: calendarSource.id,
    title: "Boodschappen voorraad",
    startsAt: "2026-07-13T10:00:00.000Z",
    endsAt: "2026-07-13T11:00:00.000Z",
    allDay: false,
    editable: true,
  },
];

const fallbackToday = new Date("2026-06-28T07:05:00+00:00");
const canonicalMarketingAnchorUtc = "2026-06-16T07:05:00+00:00";

function setupUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

function mockVisualReviewMarketingTime(anchorUtc: string | null = null) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ anchorUtc }),
    }),
  );
}

const widgetProps = {
  definition: {
    id: "agenda-mvp",
    type: "agenda" as const,
    title: "Agenda",
    settings: {},
  },
  instance: {
    id: "home-agenda-widget",
    widgetDefinitionId: "agenda-mvp",
    title: "Agenda",
    settings: {},
  },
};

async function selectDentistDay(user: ReturnType<typeof userEvent.setup>) {
  await openMonthView(user);
  await screen.findByRole("button", { name: /18 juni 2026, 1 gebeurtenis/ });
  await user.click(
    screen.getByRole("button", { name: /18 juni 2026, 1 gebeurtenis/ }),
  );
}

async function openMonthView(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByLabelText("Maandplanning")) return;
  await user.click(screen.getByRole("button", { name: "Maand bekijken" }));
  await screen.findByLabelText("Maandplanning");
}

async function returnToPlanning(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByLabelText("Planningoverzicht")) return;
  await user.click(screen.getByRole("button", { name: "Terug naar planning" }));
  await screen.findByLabelText("Planningoverzicht");
}

async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger =
    screen.queryByRole("button", { name: "Afspraak plannen" }) ??
    (await screen.findByRole("button", { name: "Afspraak toevoegen" }));
  await user.click(trigger);
  return screen.getByRole("dialog", { name: "Afspraak toevoegen" });
}

async function continueThroughDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Verder" }));
  await user.click(screen.getByRole("button", { name: "Verder" }));
}

async function continueToDetails(user: ReturnType<typeof userEvent.setup>) {
  await continueThroughDate(user);
  await user.click(screen.getByRole("button", { name: "Verder" }));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AgendaWidget HomeOps Calendar event integration", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(fallbackToday);
    vi.clearAllMocks();
    window.localStorage.clear();
    mockVisualReviewMarketingTime(null);
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValue({
      sources: [calendarSource],
      events: [dentistEvent],
    });
    vi.mocked(calendarEventsApi.createCalendarAgendaEvent).mockResolvedValue({
      id: "new-event",
      sourceId: calendarSource.id,
      title: "New Calendar Event",
      startsAt: "2026-06-28T09:00:00.000Z",
      endsAt: "2026-06-28T10:00:00.000Z",
      allDay: false,
      editable: true,
    });
    vi.mocked(calendarEventsApi.updateCalendarAgendaEvent).mockResolvedValue({
      ...dentistEvent,
      title: "Updated Dentist",
    });
    vi.mocked(calendarEventsApi.deleteCalendarAgendaEvent).mockResolvedValue(
      undefined,
    );
    vi.mocked((await mockedAgendaWeatherApi()).loadAgendaWeather).mockResolvedValue(
      new AgendaWeatherProjection({ slots: [] }),
    );
  });

  it("loads persisted calendar events while keeping birthday events available", async () => {
    render(<AgendaWidget {...widgetProps} />);
    const user = setupUser();
    await selectDentistDay(user);

    expect(await screen.findByText("Dentist Appointment")).not.toBeNull();
    expect(screen.queryByText("Avery birthday")).toBeNull();
  });

  it("opens on planning and keeps month contextual", async () => {
    const user = setupUser();
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "Agenda", level: 3 })).toBeNull();
    expect(screen.queryByText("Familieplanning")).toBeNull();
    expect(screen.queryByText("Wat moet het gezin hierna weten?")).toBeNull();
    expect(screen.queryByRole("button", { name: "Week" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lijst" })).toBeNull();
    expect(screen.getByLabelText("Vandaag briefing")).not.toBeNull();
    expect(screen.getByLabelText("Vooruitkijken")).not.toBeNull();
    expect(screen.getByLabelText("Plannen")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Afspraak plannen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Maand bekijken" })).not.toBeNull();
    expect(
      within(screen.getByLabelText("Plannen")).getByRole("group", {
        name: "Zichtbaar in de agenda",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Agenda's")).not.toBeNull();

    await openMonthView(user);
    expect(screen.getByRole("button", { name: "Terug naar planning" })).not.toBeNull();
    await returnToPlanning(user);
    expect(screen.getByLabelText("Planningoverzicht")).not.toBeNull();
  });

  it("creates, updates, and deletes calendar events through the API-backed widget UI", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    expect(
      screen.getByRole("dialog", { name: "Afspraak toevoegen" }),
    ).not.toBeNull();
    await user.type(
      screen.getByLabelText("Wat gebeurt er?"),
      "New Calendar Event",
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Afspraak maken" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Calendar Event" }),
    );
    expect((await screen.findAllByText("New Calendar Event")).length).toBeGreaterThan(0);
    await selectDentistDay(user);

    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Bewerken" },
      ),
    );
    expect(screen.getByLabelText("Wat gebeurt er?")).toHaveProperty(
      "value",
      "Dentist Appointment",
    );
    await user.clear(screen.getByLabelText("Wat gebeurt er?"));
    await user.type(
      screen.getByLabelText("Wat gebeurt er?"),
      "Updated Dentist",
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Afspraak opslaan" }));

    expect(calendarEventsApi.updateCalendarAgendaEvent).toHaveBeenCalledWith(
      "dentist",
      expect.objectContaining({ title: "Updated Dentist" }),
    );
    expect(await screen.findByText("Updated Dentist")).not.toBeNull();

    await user.click(
      within(screen.getByText("Updated Dentist").closest("li")!).getByRole(
        "button",
        { name: "Verwijderen" },
      ),
    );

    expect(calendarEventsApi.deleteCalendarAgendaEvent).toHaveBeenCalledWith(
      "dentist",
    );
    await waitFor(() =>
      expect(screen.queryByText("Updated Dentist")).toBeNull(),
    );
  });

  it("keeps Verder disabled until a required title exists", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);

    expect(screen.getByRole("button", { name: "Verder" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Family dinner");

    expect(screen.getByRole("button", { name: "Verder" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("uses the controlled fallback date for Today and Tomorrow quick choices when no VisualReview anchor is active", async () => {
    const user = setupUser();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(
      screen.getByLabelText("Wat gebeurt er?"),
      "Fallback date check",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));

    await user.click(screen.getByRole("button", { name: "Vandaag" }));
    expect(screen.getByLabelText("Kies datum")).toHaveProperty(
      "value",
      "2026-06-28",
    );

    await user.click(screen.getByRole("button", { name: "Morgen" }));
    expect(screen.getByLabelText("Kies datum")).toHaveProperty(
      "value",
      "2026-06-29",
    );
  });

  it("preserves existing event values when editing through the conversation", async () => {
    const user = setupUser();
    render(<AgendaWidget {...widgetProps} />);

    await selectDentistDay(user);
    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Bewerken" },
      ),
    );

    expect(screen.getByLabelText("Wat gebeurt er?")).toHaveProperty(
      "value",
      "Dentist Appointment",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    expect(screen.getByLabelText("Kies datum")).toHaveProperty(
      "value",
      "2026-06-18",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    expect(
      screen.getByRole("button", { name: "Kies een tijd" }).className,
    ).toContain("selected");
    expect(screen.getByLabelText("Begintijd")).toHaveProperty("value", "09:30");
    expect(screen.getByLabelText("Eindtijd")).toHaveProperty("value", "10:15");
  });

  it("prevents invalid timed event submission with existing validation", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Invalid Range");
    await continueThroughDate(user);
    fireEvent.change(screen.getByLabelText("Eindtijd"), {
      target: { value: "08:00" },
    });
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.click(screen.getByRole("button", { name: "Afspraak maken" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "De eindtijd moet gelijk aan of na de begintijd zijn.",
    );
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();
  });

  it("submits all-day and timed events with matching payloads", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "All Day Trip");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    fireEvent.change(screen.getByLabelText("Kies datum"), {
      target: { value: "2026-07-01" },
    });
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.click(screen.getByRole("button", { name: "Hele dag" }));
    fireEvent.change(screen.getByLabelText("Einddatum"), {
      target: { value: "2026-07-02" },
    });
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.click(screen.getByRole("button", { name: "Afspraak maken" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "All Day Trip",
        startsAt: "2026-07-01T00:00",
        endsAt: "2026-07-02T00:00",
        allDay: true,
      }),
    );

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Timed Trip");
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Afspraak maken" }));

    expect(
      calendarEventsApi.createCalendarAgendaEvent,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Timed Trip",
        startsAt: "2026-06-28T09:00",
        endsAt: "2026-06-28T10:00",
        allDay: false,
      }),
    );
  });

  it("closes the agenda event dialog with Escape without saving", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Draft event");
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Afspraak toevoegen" }),
    ).toBeNull();
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();
  });

  it("shows API validation errors during edit and delete failures", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(
      calendarEventsApi.updateCalendarAgendaEvent,
    ).mockRejectedValueOnce(
      Object.assign(new Error("Bad Request"), {
        response: JSON.stringify({
          errors: {
            EndUtc: ["De eindtijd moet gelijk aan of na de begintijd zijn."],
          },
        }),
      }),
    );
    vi.mocked(
      calendarEventsApi.deleteCalendarAgendaEvent,
    ).mockRejectedValueOnce(new Error("Delete failed"));
    render(<AgendaWidget {...widgetProps} />);

    await selectDentistDay(user);
    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Bewerken" },
      ),
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Afspraak opslaan" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "De eindtijd moet gelijk aan of na de begintijd zijn.",
    );

    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Verwijderen" },
      ),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Delete failed",
    );
  });

  it("shows agenda empty guidance when no events exist", async () => {
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: [],
    });
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    expect(screen.getByText("Rustige dag")).not.toBeNull();
    expect(
      within(screen.getByLabelText("Vandaag briefing")).getAllByText(
        "Vandaag blijft open",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders family-friendly event indicators with overflow and detail card labels", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: [dentistEvent, ...overflowEvents],
    });
    render(<AgendaWidget {...widgetProps} />);

    await openMonthView(user);
    const busyDay = await screen.findByRole("button", {
      name: /18 juni 2026, 5 gebeurtenissen/,
    });
    expect(within(busyDay).getByTitle("Zorg")).not.toBeNull();
    expect(within(busyDay).getByTitle("Sport")).not.toBeNull();
    expect(within(busyDay).getByTitle("Boodschappen")).not.toBeNull();
    expect(within(busyDay).getByText("+2")).not.toBeNull();

    await user.click(busyDay);

    expect(await screen.findByText("Zorg")).not.toBeNull();
    expect(screen.getByText("Sport")).not.toBeNull();
    expect(screen.getByText("Boodschappen")).not.toBeNull();
    expect(screen.getByText("Familie")).not.toBeNull();
    expect(screen.getByText("Werk")).not.toBeNull();
    expect(
      screen.getByText("Dentist Appointment").closest("li")?.className,
    ).toContain("agenda-event");
  });

  it("shows agenda weather across today, week, outlook, and the selected planning day", async () => {
    const calendarEventsApi = await mockedCalendarEventsApi();
    mockVisualReviewMarketingTime(canonicalMarketingAnchorUtc);
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: marketingAgendaEvents,
    });
    vi.mocked((await mockedAgendaWeatherApi()).loadAgendaWeather).mockResolvedValueOnce(
      new AgendaWeatherProjection({
        slots: [
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-16T07:00:00.000Z"),
            endsAtUtc: new Date("2026-06-16T08:00:00.000Z"),
            temperatureCelsius: 21,
            condition: WeatherConditionCategory.Clear,
            summary: "Helder",
          }),
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-16T15:00:00.000Z"),
            endsAtUtc: new Date("2026-06-16T16:00:00.000Z"),
            temperatureCelsius: 19,
            condition: WeatherConditionCategory.Cloudy,
            summary: "Bewolkt",
          }),
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-21T08:00:00.000Z"),
            endsAtUtc: new Date("2026-06-21T09:00:00.000Z"),
            temperatureCelsius: 18,
            condition: WeatherConditionCategory.Cloudy,
            summary: "Bewolkt",
          }),
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-22T09:00:00.000Z"),
            endsAtUtc: new Date("2026-06-22T10:00:00.000Z"),
            temperatureCelsius: 17,
            condition: WeatherConditionCategory.Rain,
            summary: "Regen",
          }),
        ],
      }),
    );
    render(<AgendaWidget {...widgetProps} />);

    const todayBriefing = await screen.findByLabelText("Vandaag briefing");
    const planningTools = screen.getByLabelText("Plannen");
    const weekBriefing = screen.getByLabelText("Deze week");
    const outlookBriefing = screen.getByLabelText("Vooruitkijken");

    expect(within(todayBriefing).getByTitle("Vandaag, 21°, Helder")).not.toBeNull();
    expect(
      within(todayBriefing)
        .getByRole("img", { name: "Vandaag, 21°, Helder" })
        .className,
    ).toContain("agenda-weather-cluster--today-header");
    await waitFor(() => {
      expect(within(todayBriefing).getByText("Zwemles Thomas")).not.toBeNull();
    });

    const timedEvent = within(todayBriefing).getByText("Zwemles Thomas").closest("li");
    expect(timedEvent).not.toBeNull();
    expect(within(timedEvent!).getByText("19°")).not.toBeNull();
    expect(
      within(timedEvent!).getByRole("img", { name: "Zwemles Thomas, 19°, Bewolkt" })
        .className,
    ).toContain("agenda-weather-cluster--row");
    expect(within(planningTools).getByText("21°")).not.toBeNull();
    expect(
      within(planningTools)
        .getByRole("img", { name: "dinsdag 16 juni 2026, 21°, Helder" })
        .className,
    ).toContain("agenda-weather-cluster--selected-day");

    const weekEvent = within(weekBriefing).getByText("Pannenkoeken ontbijt").closest("li");
    const weekDaySection = within(weekBriefing)
      .getByText("Pannenkoeken ontbijt")
      .closest("section");
    expect(weekDaySection).not.toBeNull();
    expect(weekEvent).not.toBeNull();
    expect(within(weekDaySection!).getByText("18°")).not.toBeNull();
    expect(
      within(weekDaySection!)
        .getByRole("img", { name: "zondag 21 juni 2026, 18°, Bewolkt" })
        .className,
    ).toContain("agenda-weather-cluster--day-header");
    expect(within(weekEvent!).queryByText("18°")).toBeNull();

    const outlookEvent = within(outlookBriefing).getByText("Volgende maandag").closest("li");
    expect(outlookEvent).not.toBeNull();
    expect(within(outlookEvent!).getByText("17°")).not.toBeNull();
    expect(
      within(outlookEvent!).getByRole("img", { name: "Volgende maandag, 17°, Regen" })
        .className,
    ).toContain("agenda-weather-cluster--row");
    expect(screen.queryByText("DepartureAdvice")).toBeNull();
    expect(screen.queryByText("Regenjas mee")).toBeNull();
    expect(screen.queryByText("Geen jas nodig")).toBeNull();
    expect(screen.queryByText("Open-Meteo")).toBeNull();
  });

  it("matches day weather by local agenda date while keeping timed rows on slot intervals", async () => {
    const nodeProcess = globalThis as typeof globalThis & {
      process?: { env: Record<string, string | undefined> };
    };
    const originalTimeZone = nodeProcess.process?.env.TZ;
    if (nodeProcess.process) {
      nodeProcess.process.env.TZ = "Europe/Amsterdam";
    }
    try {
      vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));
      const calendarEventsApi = await mockedCalendarEventsApi();
      vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
        sources: [calendarSource],
        events: [
          {
            id: "local-day-timed",
            sourceId: calendarSource.id,
            title: "Ochtend overleg",
            startsAt: "2026-06-17T10:00:00.000Z",
            endsAt: "2026-06-17T11:00:00.000Z",
            allDay: false,
            editable: true,
          },
        ],
      });
      vi.mocked((await mockedAgendaWeatherApi()).loadAgendaWeather).mockResolvedValueOnce(
        new AgendaWeatherProjection({
          slots: [
            new AgendaWeatherSlotProjection({
              startsAtUtc: new Date("2026-06-16T23:30:00.000Z"),
              endsAtUtc: new Date("2026-06-17T00:30:00.000Z"),
              temperatureCelsius: 20,
              condition: WeatherConditionCategory.Clear,
              summary: "Helder",
            }),
          ],
        }),
      );

      render(<AgendaWidget {...widgetProps} />);

      const todayBriefing = await screen.findByLabelText("Vandaag briefing");
      expect(within(todayBriefing).getByTitle("Vandaag, 20°, Helder")).not.toBeNull();
      await waitFor(() => {
        expect(within(todayBriefing).getByText("Ochtend overleg")).not.toBeNull();
      });

      const timedEvent = within(todayBriefing).getByText("Ochtend overleg").closest("li");
      expect(timedEvent).not.toBeNull();
      expect(within(timedEvent!).queryByText("20°")).toBeNull();
      expect(
        within(timedEvent!).queryByRole("img", { name: /Ochtend overleg, 20°, Helder/ }),
      ).toBeNull();
    } finally {
      if (nodeProcess.process) {
        if (originalTimeZone === undefined) {
          delete nodeProcess.process.env.TZ;
        } else {
          nodeProcess.process.env.TZ = originalTimeZone;
        }
      }
    }
  });

  it("shows day weather only for all-day items in Vooruitkijken", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    const todayAllDayEvent: NormalizedEvent = {
      id: "all-day-today",
      sourceId: calendarSource.id,
      title: "Gezinsuitje",
      startsAt: "2026-06-28T00:00:00.000Z",
      endsAt: "2026-06-28T23:59:00.000Z",
      allDay: true,
      editable: true,
    };
    const weekAllDayEvent: NormalizedEvent = {
      id: "all-day-week",
      sourceId: calendarSource.id,
      title: "Kampdag",
      startsAt: "2026-06-29T00:00:00.000Z",
      endsAt: "2026-06-29T23:59:00.000Z",
      allDay: true,
      editable: true,
    };
    const outlookAllDayEvent: NormalizedEvent = {
      id: "all-day-outlook",
      sourceId: calendarSource.id,
      title: "Vakantie start",
      startsAt: "2026-07-13T00:00:00.000Z",
      endsAt: "2026-07-13T23:59:00.000Z",
      allDay: true,
      editable: true,
    };
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: [todayAllDayEvent, weekAllDayEvent, outlookAllDayEvent],
    });
    vi.mocked((await mockedAgendaWeatherApi()).loadAgendaWeather).mockResolvedValueOnce(
      new AgendaWeatherProjection({
        slots: [
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-28T09:00:00.000Z"),
            endsAtUtc: new Date("2026-06-28T10:00:00.000Z"),
            temperatureCelsius: 24,
            condition: WeatherConditionCategory.Clear,
            summary: "Helder",
          }),
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-06-29T09:00:00.000Z"),
            endsAtUtc: new Date("2026-06-29T10:00:00.000Z"),
            temperatureCelsius: 22,
            condition: WeatherConditionCategory.Cloudy,
            summary: "Bewolkt",
          }),
          new AgendaWeatherSlotProjection({
            startsAtUtc: new Date("2026-07-13T09:00:00.000Z"),
            endsAtUtc: new Date("2026-07-13T10:00:00.000Z"),
            temperatureCelsius: 26,
            condition: WeatherConditionCategory.Clear,
            summary: "Zonnig",
          }),
        ],
      }),
    );
    render(<AgendaWidget {...widgetProps} />);

    const todayBriefing = await screen.findByLabelText("Vandaag briefing");
    const weekBriefing = screen.getByLabelText("Deze week");
    const outlookBriefing = screen.getByLabelText("Vooruitkijken");
    await waitFor(() => {
      expect(within(todayBriefing).getByText("Gezinsuitje")).not.toBeNull();
      expect(within(weekBriefing).getByText("Kampdag")).not.toBeNull();
      expect(within(outlookBriefing).getByText("Vakantie start")).not.toBeNull();
    });

    const todayAllDayCard = within(todayBriefing).getByText("Gezinsuitje").closest("li");
    const weekAllDayCard = within(weekBriefing).getByText("Kampdag").closest("li");
    const outlookAllDayCard = within(outlookBriefing)
      .getByText("Vakantie start")
      .closest("li");

    expect(todayAllDayCard).not.toBeNull();
    expect(weekAllDayCard).not.toBeNull();
    expect(outlookAllDayCard).not.toBeNull();
    expect(within(todayAllDayCard!).queryByText("24°")).toBeNull();
    expect(within(weekAllDayCard!).queryByText("22°")).toBeNull();
    expect(within(outlookAllDayCard!).getByText("26°")).not.toBeNull();
    expect(
      within(outlookAllDayCard!).getByRole("img", {
        name: "Vakantie start, 26°, Zonnig",
      })
        .className,
    ).toContain("agenda-weather-cluster--row");

    await openMonthView(user);
    await user.click(
      await screen.findByRole("button", {
        name: /28 juni 2026, 1 gebeurtenis/,
      }),
    );

    const selectedDayAllDayCard = within(screen.getByLabelText("Gekozen dag"))
      .getByText("Gezinsuitje")
      .closest("li");
    expect(selectedDayAllDayCard).not.toBeNull();
    expect(within(selectedDayAllDayCard!).queryByText("24°")).toBeNull();
  });

  it("shows planning summaries and grouped upcoming events by default", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    mockVisualReviewMarketingTime(canonicalMarketingAnchorUtc);
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: marketingAgendaEvents,
    });
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    expect(screen.getByLabelText("Vandaag briefing")).not.toBeNull();
    expect(screen.getByLabelText("Deze week")).not.toBeNull();
    expect(screen.getByLabelText("Vooruitkijken")).not.toBeNull();
    expect(screen.getByLabelText("Plannen")).not.toBeNull();
    expect(screen.queryByLabelText("Morgen")).toBeNull();
    expect(screen.getByText("Deze week")).not.toBeNull();
    await waitFor(() => {
      expect(
        within(screen.getByLabelText("Vandaag briefing")).getByText(
          "Zwemles Thomas",
        ),
      ).not.toBeNull();
      expect(
        within(screen.getByLabelText("Deze week")).getByText(
          "Pannenkoeken ontbijt",
        ),
      ).not.toBeNull();
      expect(
        within(screen.getByLabelText("Vooruitkijken")).getByText(
          "Volgende maandag",
        ),
      ).not.toBeNull();
    });

    await openMonthView(user);
    expect(screen.getByLabelText("Maandplanning")).not.toBeNull();
  });

  it("uses the VisualReview marketing anchor for Today and Tomorrow quick choices", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    mockVisualReviewMarketingTime(canonicalMarketingAnchorUtc);
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: marketingAgendaEvents,
    });

    render(<AgendaWidget {...widgetProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Planningoverzicht")).not.toBeNull();
      expect(
        within(screen.getByLabelText("Vandaag briefing")).getByText(
          "Zwemles Thomas",
        ),
      ).not.toBeNull();
    });

    await openCreateDialog(user);
    await user.type(
      screen.getByLabelText("Wat gebeurt er?"),
      "Marketing date check",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));

    await user.click(screen.getByRole("button", { name: "Vandaag" }));
    expect(screen.getByLabelText("Kies datum")).toHaveProperty(
      "value",
      "2026-06-16",
    );

    await user.click(screen.getByRole("button", { name: "Morgen" }));
    expect(screen.getByLabelText("Kies datum")).toHaveProperty(
      "value",
      "2026-06-17",
    );
  });

  it("synchronizes planning and month to the VisualReview marketing anchor", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    mockVisualReviewMarketingTime(canonicalMarketingAnchorUtc);
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: marketingAgendaEvents,
    });
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    await waitFor(() => {
      expect(
        within(screen.getByLabelText("Vandaag briefing")).getByText(
          "Zwemles Thomas",
        ),
      ).not.toBeNull();
    });

    await openMonthView(user);
    await waitFor(() => {
      const canonicalToday = screen.getByRole("button", {
        name: /dinsdag 16 juni 2026, 1 gebeurtenis/,
      });
      expect(canonicalToday.className).toContain("today");
      expect(within(canonicalToday).getByText("Vandaag")).not.toBeNull();
    });
  });

  it("keeps planning editing actions available for upcoming grouped events", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: timelineEvents,
    });
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    expect(screen.queryByText("Verleden afspraak")).toBeNull();

    const todayGroup = screen.getByLabelText("Vandaag briefing");
    const todayText = todayGroup.textContent ?? "";
    expect(todayText.indexOf("Tandarts controle")).toBeLessThan(
      todayText.indexOf("Voetbal training"),
    );
    expect(
      within(screen.getByLabelText("Deze week")).getByText("Familie brunch"),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Vooruitkijken")).getByText(
        "Boodschappen voorraad",
      ),
    ).not.toBeNull();

    const dentistCard = within(todayGroup).getByText("Tandarts controle").closest("li");
    expect(dentistCard).not.toBeNull();

    await user.click(
      within(dentistCard!).getByRole("button", { name: /Tandarts controle/ }),
    );
    await user.click(
      within(dentistCard!).getByRole(
        "button",
        { name: "Bewerken" },
      ),
    );
    expect(
      screen.getByRole("dialog", { name: "Afspraak bewerken" }),
    ).not.toBeNull();
    await user.keyboard("{Escape}");

    await user.click(
      within(dentistCard!).getByRole(
        "button",
        { name: "Verwijderen" },
      ),
    );

    expect(calendarEventsApi.deleteCalendarAgendaEvent).toHaveBeenCalledWith(
      "today-early",
    );
    await waitFor(() =>
      expect(screen.queryByText("Tandarts controle")).toBeNull(),
    );
  });

  it("shows calm planning empty guidance when no upcoming events exist", async () => {
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: [timelineEvents[0]],
    });
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByLabelText("Planningoverzicht")).not.toBeNull();
    expect(screen.getByText("Rustige dag")).not.toBeNull();
    expect(
      within(screen.getByLabelText("Vandaag briefing")).getAllByText(
        "Vandaag blijft open",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("keeps source filtering functional for persisted calendar sources", async () => {
    const user = setupUser();
    render(<AgendaWidget {...widgetProps} />);

    await selectDentistDay(user);
    await user.click(screen.getByLabelText(/Gezin/));

    expect(screen.queryByText("Dentist Appointment")).toBeNull();
  });
});
