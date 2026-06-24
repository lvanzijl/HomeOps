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

async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText("Dentist Appointment");
  await user.click(screen.getByRole("button", { name: "Add household event" }));
  return screen.getByRole("dialog", { name: "Add calendar event" });
}

async function continueThroughDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function continueToDetails(user: ReturnType<typeof userEvent.setup>) {
  await continueThroughDate(user);
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("AgendaWidget HomeOps Calendar event integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValue({
      sources: [calendarSource],
      events: [dentistEvent],
    });
    vi.mocked(calendarEventsApi.createCalendarAgendaEvent).mockResolvedValue({
      id: "new-event",
      sourceId: calendarSource.id,
      title: "New Calendar Event",
      startsAt: "2026-06-22T09:00:00.000Z",
      endsAt: "2026-06-22T10:00:00.000Z",
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

    expect(await screen.findByText("Dentist Appointment")).not.toBeNull();
    expect(screen.queryByText("Avery birthday")).toBeNull();
  });

  it("creates, updates, and deletes calendar events through the API-backed widget UI", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    expect(
      screen.getByRole("dialog", { name: "Add calendar event" }),
    ).not.toBeNull();
    await user.type(
      screen.getByLabelText("What is happening?"),
      "New Calendar Event",
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Calendar Event" }),
    );
    expect(await screen.findByText("New Calendar Event")).not.toBeNull();

    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Edit" },
      ),
    );
    expect(screen.getByLabelText("What is happening?")).toHaveProperty(
      "value",
      "Dentist Appointment",
    );
    await user.clear(screen.getByLabelText("What is happening?"));
    await user.type(
      screen.getByLabelText("What is happening?"),
      "Updated Dentist",
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(calendarEventsApi.updateCalendarAgendaEvent).toHaveBeenCalledWith(
      "dentist",
      expect.objectContaining({ title: "Updated Dentist" }),
    );
    expect(await screen.findByText("Updated Dentist")).not.toBeNull();

    await user.click(
      within(screen.getByText("Updated Dentist").closest("li")!).getByRole(
        "button",
        { name: "Delete" },
      ),
    );

    expect(calendarEventsApi.deleteCalendarAgendaEvent).toHaveBeenCalledWith(
      "dentist",
    );
    await waitFor(() =>
      expect(screen.queryByText("Updated Dentist")).toBeNull(),
    );
  });

  it("keeps Continue disabled until a required title exists", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);

    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("What is happening?"), "Family dinner");

    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("preserves existing event values when editing through the conversation", async () => {
    const user = userEvent.setup();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText("Dentist Appointment");
    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Edit" },
      ),
    );

    expect(screen.getByLabelText("What is happening?")).toHaveProperty(
      "value",
      "Dentist Appointment",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Pick a date")).toHaveProperty(
      "value",
      "2026-06-18",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("button", { name: "Pick a time" }).className).toContain(
      "selected",
    );
    expect(screen.getByLabelText("Start time")).toHaveProperty(
      "value",
      "09:30",
    );
    expect(screen.getByLabelText("End time")).toHaveProperty(
      "value",
      "10:15",
    );
  });

  it("prevents invalid timed event submission with existing validation", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("What is happening?"), "Invalid Range");
    await continueThroughDate(user);
    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "08:00" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Event end must be on or after event start.",
    );
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();
  });

  it("submits all-day and timed events with matching payloads", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("What is happening?"), "All Day Trip");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Pick a date"), {
      target: { value: "2026-07-01" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "All day" }));
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-07-02" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "All Day Trip",
        startsAt: "2026-07-01T00:00",
        endsAt: "2026-07-02T00:00",
        allDay: true,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Add household event" }),
    );
    await user.type(screen.getByLabelText("What is happening?"), "Timed Trip");
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Create event" }));

    expect(
      calendarEventsApi.createCalendarAgendaEvent,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Timed Trip",
        startsAt: "2026-06-22T09:00",
        endsAt: "2026-06-22T10:00",
        allDay: false,
      }),
    );
  });

  it("closes the agenda event dialog with Escape without saving", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await openCreateDialog(user);
    await user.type(screen.getByLabelText("What is happening?"), "Draft event");
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Add calendar event" }),
    ).toBeNull();
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();
  });

  it("shows API validation errors during edit and delete failures", async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(
      calendarEventsApi.updateCalendarAgendaEvent,
    ).mockRejectedValueOnce(
      Object.assign(new Error("Bad Request"), {
        response: JSON.stringify({
          errors: { EndUtc: ["Event end must be on or after event start."] },
        }),
      }),
    );
    vi.mocked(
      calendarEventsApi.deleteCalendarAgendaEvent,
    ).mockRejectedValueOnce(new Error("Delete failed"));
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText("Dentist Appointment");
    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Edit" },
      ),
    );
    await continueToDetails(user);
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Event end must be on or after event start.",
    );

    await user.click(
      within(screen.getByText("Dentist Appointment").closest("li")!).getByRole(
        "button",
        { name: "Delete" },
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

    expect(await screen.findByText("Create your first event")).not.toBeNull();
    expect(
      screen.getByText(
        "Events help the household remember important dates and activities.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Start with one household event." }),
    ).not.toBeNull();
  });

  it("keeps source filtering functional for persisted calendar sources", async () => {
    const user = userEvent.setup();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText("Dentist Appointment");
    await user.click(screen.getByLabelText(/HomeOps Calendar/));

    expect(screen.queryByText("Dentist Appointment")).toBeNull();
  });
});
