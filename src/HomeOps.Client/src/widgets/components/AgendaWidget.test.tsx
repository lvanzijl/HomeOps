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

async function mockedCalendarEventsApi() {
  return await import("../../agenda/calendarEventsApi");
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
  await screen.findByRole("button", { name: "Gebeurtenis toevoegen" });
  await user.click(
    screen.getByRole("button", { name: "Gebeurtenis toevoegen" }),
  );
  return screen.getByRole("dialog", { name: "Gebeurtenis toevoegen" });
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
    expect(screen.getByText("Wat moet het gezin hierna weten?")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Week" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lijst" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Gebeurtenis toevoegen" }),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Maand bekijken" })).not.toBeNull();
    expect(
      screen.getByRole("group", { name: "Zichtbaar in de agenda" }),
    ).not.toBeNull();
    expect(screen.getByText("Bronnen")).not.toBeNull();

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
      screen.getByRole("dialog", { name: "Gebeurtenis toevoegen" }),
    ).not.toBeNull();
    await user.type(
      screen.getByLabelText("Wat gebeurt er?"),
      "New Calendar Event",
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Gebeurtenis maken" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Calendar Event" }),
    );
    expect(await screen.findByText("New Calendar Event")).not.toBeNull();
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
    await user.click(
      screen.getByRole("button", { name: "Gebeurtenis opslaan" }),
    );

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
    await user.click(screen.getByRole("button", { name: "Gebeurtenis maken" }));

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
    await user.click(screen.getByRole("button", { name: "Gebeurtenis maken" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "All Day Trip",
        startsAt: "2026-07-01T00:00",
        endsAt: "2026-07-02T00:00",
        allDay: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Gebeurtenis toevoegen" }),
    );
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Timed Trip");
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Gebeurtenis maken" }));

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
      screen.queryByRole("dialog", { name: "Gebeurtenis toevoegen" }),
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
    await user.click(
      screen.getByRole("button", { name: "Gebeurtenis opslaan" }),
    );

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
    expect(screen.getByText("Vandaag is nog open")).not.toBeNull();
  });

  it("renders family-friendly event indicators with overflow and detail card labels", async () => {
    const user = setupUser();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValueOnce({
      sources: [calendarSource],
      events: [dentistEvent, ...overflowEvents],
    });
    render(<AgendaWidget {...widgetProps} />);

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
    expect(screen.getByLabelText("Vandaag")).not.toBeNull();
    expect(screen.getByLabelText("Morgen")).not.toBeNull();
    expect(screen.getByLabelText("Later deze week")).not.toBeNull();
    expect(screen.getByLabelText("Binnenkort")).not.toBeNull();
    expect(screen.getByText("Straks")).not.toBeNull();
    expect(screen.getByText("Deze week")).not.toBeNull();
    expect(
      within(screen.getByLabelText("Vandaag")).getByText("Zwemles Thomas"),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Later deze week")).getByText(
        "Pannenkoeken ontbijt",
      ),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Binnenkort")).getByText("Volgende maandag"),
    ).not.toBeNull();

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
      expect(screen.getByText("Zwemles Thomas")).not.toBeNull();
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
    expect(
      within(screen.getByLabelText("Vandaag")).getByText("Zwemles Thomas"),
    ).not.toBeNull();
    expect(screen.getByText("Zwemles Thomas")).not.toBeNull();

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

    const planningText =
      screen.getByLabelText("Planningoverzicht").textContent ?? "";
    expect(
      planningText.indexOf("Tandarts controle"),
    ).toBeLessThan(planningText.indexOf("Voetbal training"));
    expect(
      planningText.indexOf("Voetbal training"),
    ).toBeLessThan(planningText.indexOf("Familie brunch"));

    const todayGroup = screen.getByLabelText("Vandaag");
    expect(within(todayGroup).getAllByTitle("Zorg").length).toBeGreaterThan(0);
    expect(within(todayGroup).getAllByTitle("Sport").length).toBeGreaterThan(0);

    await user.click(
      within(screen.getByText("Tandarts controle").closest("li")!).getByRole(
        "button",
        { name: "Bewerken" },
      ),
    );
    expect(
      screen.getByRole("dialog", { name: "Gebeurtenis bewerken" }),
    ).not.toBeNull();
    await user.keyboard("{Escape}");

    await user.click(
      within(screen.getByText("Tandarts controle").closest("li")!).getByRole(
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
    expect(screen.getByText("Geen volgende afspraak")).not.toBeNull();
    expect(screen.getByText("Vandaag is nog open")).not.toBeNull();
  });

  it("keeps source filtering functional for persisted calendar sources", async () => {
    const user = setupUser();
    render(<AgendaWidget {...widgetProps} />);

    await selectDentistDay(user);
    await user.click(screen.getByLabelText(/Gezin/));

    expect(screen.queryByText("Dentist Appointment")).toBeNull();
  });
});
