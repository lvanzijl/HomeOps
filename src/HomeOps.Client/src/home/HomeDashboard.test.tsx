import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "./HomeDashboard";
import { avatarV2DefaultConfiguration } from "../avatarV2/avatarConfig";
import { familyMembers } from "./familyMembers";
import {
  DepartureAdviceCategory,
  DepartureAdviceProjection,
  HomeWeatherProjection,
  WeatherConditionCategory,
} from "../api/homeOpsApiClient";

vi.mock("../agenda/calendarEventsApi", () => ({
  loadCalendarAgendaData: vi.fn(),
  createCalendarAgendaEvent: vi.fn(),
}));
vi.mock("../shopping/listsApi", () => ({
  createListsApiClient: vi.fn(() => ({})),
  loadShoppingList: vi.fn(),
  addShoppingListItem: vi.fn(),
}));
vi.mock("../shopping/listsSummaryApi", () => ({ loadShoppingListSummary: vi.fn() }));
vi.mock("../tasks/tasksApi", () => ({ loadTasks: vi.fn(), createTask: vi.fn() }));
vi.mock("../motivationData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../motivationData")>()),
  loadMotivationSnapshot: vi.fn(),
}));
vi.mock("../demo/demoAgendaData", () => ({
  demoReadOnlyEvents: [],
  demoReadOnlyEventSources: [],
}));
vi.mock("./homeWeatherApi", () => ({
  loadHomeWeather: vi.fn(),
}));

async function agendaApi() {
  return await import("../agenda/calendarEventsApi");
}
async function listsSummaryApi() {
  return await import("../shopping/listsSummaryApi");
}
async function listsApi() {
  return await import("../shopping/listsApi");
}
async function tasksApi() {
  return await import("../tasks/tasksApi");
}
async function motivationApi() {
  return await import("../motivationData");
}
async function weatherApi() {
  return await import("./homeWeatherApi");
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("HomeDashboard", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-06-19T08:30:00Z"));
    const agenda = await agendaApi();
    vi.mocked(agenda.loadCalendarAgendaData).mockResolvedValue({
      sources: [
        {
          id: "calendar",
          name: "HomeOps Calendar",
          type: "manual",
          enabled: true,
          capability: "writable",
          visibility: { visibleByDefault: true },
          color: { hex: "#93c5fd" },
        },
      ],
      events: Array.from({ length: 7 }, (_, index) => ({
        id: `event-${index}`,
        sourceId: "calendar",
        title: `Event ${index + 1}`,
        startsAt: `2026-06-${index < 4 ? "19" : "20"}T${String(9 + index).padStart(2, "0")}:00:00.000Z`,
        endsAt: `2026-06-${index < 4 ? "19" : "20"}T${String(10 + index).padStart(2, "0")}:00:00.000Z`,
        allDay: false,
        editable: true,
      })),
    });
    const listsSummary = await listsSummaryApi();
    vi.mocked(listsSummary.loadShoppingListSummary).mockResolvedValue({
      id: "shopping",
      name: "Shopping",
      activeItems: [
        { id: "milk", text: "Milk", preferredStore: "Supermarket" },
        { id: "bread", text: "Bread", preferredStore: "Supermarket" },
        { id: "toothpaste", text: "Toothpaste", preferredStore: "Drugstore" },
        { id: "batteries", text: "Batteries" },
        { id: "apples", text: "Apples" },
        { id: "completed-coffee", text: "Coffee", preferredStore: "Supermarket", isCompleted: true },
        { id: "deleted-tea", text: "Tea", preferredStore: "Supermarket", isDeleted: true },
      ],
    });
    const lists = await listsApi();
    vi.mocked(lists.loadShoppingList).mockResolvedValue({
      listId: "shopping",
      items: [],
    });
    vi.mocked(lists.addShoppingListItem).mockResolvedValue({
      id: "new-milk",
      label: "Milk",
      completed: false,
    });

    const tasks = await tasksApi();
    vi.mocked(tasks.loadTasks).mockResolvedValue([
      {
        id: "overdue-task",
        title: "Empty dishwasher",
        dueDate: "2026-06-18",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-17T08:00:00.000Z",
        updatedUtc: "2026-06-17T08:00:00.000Z",
      },
      {
        id: "today-task",
        title: "Take recycling out",
        dueDate: "2026-06-19",
        ownershipKind: "SharedHousehold",
        familyMemberId: null,
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-18T08:00:00.000Z",
        updatedUtc: "2026-06-18T08:00:00.000Z",
      },
      {
        id: "alex-today-task",
        title: "Pack zwemtas",
        dueDate: "2026-06-19",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-18T08:15:00.000Z",
        updatedUtc: "2026-06-18T08:15:00.000Z",
      },
      {
        id: "upcoming-task",
        title: "Water plants",
        dueDate: "2026-06-21",
        ownershipKind: "Unassigned",
        familyMemberId: null,
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-18T09:00:00.000Z",
        updatedUtc: "2026-06-18T09:00:00.000Z",
      },
      {
        id: "hidden-task",
        title: "Pack library books",
        dueDate: "2026-06-22",
        ownershipKind: "FamilyMember",
        familyMemberId: "sam",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-18T10:00:00.000Z",
        updatedUtc: "2026-06-18T10:00:00.000Z",
      },
      {
        id: "hidden-task-2",
        title: "Charge tablet",
        dueDate: "2026-06-23",
        ownershipKind: "Unassigned",
        familyMemberId: null,
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-18T11:00:00.000Z",
        updatedUtc: "2026-06-18T11:00:00.000Z",
      },
      {
        id: "completed-alex-today-task",
        title: "Completed today task",
        dueDate: "2026-06-19",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        isCompleted: true,
        completedUtc: "2026-06-19T07:30:00.000Z",
        createdUtc: "2026-06-18T07:30:00.000Z",
        updatedUtc: "2026-06-19T07:30:00.000Z",
      },
    ]);
    vi.mocked(agenda.createCalendarAgendaEvent).mockResolvedValue({
      id: "new-event",
      sourceId: "calendar",
      title: "Swimming lesson",
      startsAt: "2026-06-20T00:00:00.000Z",
      allDay: true,
      editable: true,
    });
    const motivation = await motivationApi();
    vi.mocked(motivation.loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 13,
        unitLabel: "helpful actions",
        celebration: { title: "Board game night together", status: 0 },
      },
      individualGoals: [],
    });
    vi.mocked((await weatherApi()).loadHomeWeather).mockResolvedValue(
      new HomeWeatherProjection({
        iconKey: "weather-clear",
        condition: WeatherConditionCategory.Clear,
        temperatureCelsius: 21.2,
        departureAdvice: new DepartureAdviceProjection({
          summary: "geen jas nodig",
          categories: [DepartureAdviceCategory.NoJacketNeeded],
        }),
      }),
    );
  });

  it("renders the Thuisdashboard, family members, agenda summary, lists summary, and overflow", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Thuisdashboard")).not.toBeNull();
    expect(screen.getByLabelText("Gezinsleden")).not.toBeNull();
    expect(
      await screen.findByRole("button", { name: "Weeradvies, 21°, Geen jas nodig" }),
    ).not.toBeNull();
    expect(screen.getByText("21°")).not.toBeNull();
    expect(screen.getByText("Geen jas nodig")).not.toBeNull();
    expect(screen.getByText("Alex")).not.toBeNull();
    expect(await screen.findByText("Event 1")).not.toBeNull();
    expect(screen.getAllByText("Morgen").length).toBeGreaterThan(0);
    const listsTile = screen.getByLabelText("Boodschappenoverzicht");
    expect(within(listsTile).getByRole("heading", { name: "Drugstore" })).not.toBeNull();
    expect(within(listsTile).getByRole("heading", { name: "Supermarket" })).not.toBeNull();
    expect(within(listsTile).getByRole("heading", { name: "Zonder winkel" })).not.toBeNull();
    expect(within(listsTile).getAllByRole("heading", { name: "Supermarket" })).toHaveLength(1);
    expect(within(listsTile).getByText("Milk")).not.toBeNull();
    expect(within(listsTile).getByText("Bread")).not.toBeNull();
    expect(within(listsTile).getByText("Toothpaste")).not.toBeNull();
    expect(within(listsTile).getByText("Batteries")).not.toBeNull();
    expect(within(listsTile).queryByText(/Shared for \d+ household members\./)).toBeNull();
    expect(within(listsTile).queryByText("Milk (Supermarket)")).toBeNull();
    expect(within(listsTile).queryByText("Shopping")).toBeNull();
    expect(screen.queryByText("Vacation Packing")).toBeNull();
    expect(screen.queryByText("Sunscreen")).toBeNull();
    expect(screen.queryByText("Camping")).toBeNull();
    expect(screen.queryByText("Christmas")).toBeNull();
    expect(within(listsTile).queryByText("Coffee")).toBeNull();
    expect(within(listsTile).queryByText("Tea")).toBeNull();
    expect(within(listsTile).getByText("+1 meer")).not.toBeNull();
    expect(screen.getByText("Taken")).not.toBeNull();
    expect(screen.getAllByText("Vandaag").length).toBeGreaterThan(0);
    expect(screen.getByText("Empty dishwasher")).not.toBeNull();
    expect(screen.getByText("Take recycling out")).not.toBeNull();
    expect(screen.getByText("Pack zwemtas")).not.toBeNull();
    expect(screen.getByText("Alex · Datum 2026-06-18")).not.toBeNull();
    expect(
      screen.getByText("Gezinstaak · Datum 2026-06-19"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Gezinslid toevoegen" }),
    ).toBeNull();
  });

  it("renders the fixed Home card order and today-task badges only for matching family members", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    await screen.findByText("Event 1");

    const grid = screen.getByLabelText("Thuisdashboard").querySelector(".home-summary-grid");
    expect(grid).not.toBeNull();
    expect(
      within(grid as HTMLElement)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Boodschappen", "Agenda", "Taken", "Motivatie"]);

    expect(
      screen.getByLabelText("Alex heeft 1 open taken vandaag"),
    ).not.toBeNull();
    expect(
      screen.queryByLabelText("Sam heeft 1 open taken vandaag"),
    ).toBeNull();
    expect(
      screen.queryByLabelText("Jordan heeft 1 open taken vandaag"),
    ).toBeNull();
  });


  it("hides the Home Shopping group heading when only one visible group is shown", async () => {
    vi.mocked((await listsSummaryApi()).loadShoppingListSummary).mockResolvedValue({
      id: "shopping",
      name: "Shopping",
      activeItems: [
        { id: "bread", text: "Bread" },
        { id: "coffee", text: "Coffee" },
        { id: "milk", text: "Milk" },
      ],
    });

    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    const listsTile = screen.getByLabelText("Boodschappenoverzicht");
    expect(await within(listsTile).findByText("Bread")).not.toBeNull();
    expect(within(listsTile).getByText("Coffee")).not.toBeNull();
    expect(within(listsTile).getByText("Milk")).not.toBeNull();
    expect(within(listsTile).queryByRole("heading", { name: "Zonder winkel" })).toBeNull();
    expect(within(listsTile).queryByText(/Shared for \d+ household members\./)).toBeNull();
  });

  it("keeps Home Shopping group headings when multiple visible groups are shown", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    const listsTile = screen.getByLabelText("Boodschappenoverzicht");
    expect(await within(listsTile).findByRole("heading", { name: "Supermarket" })).not.toBeNull();
    expect(within(listsTile).getByRole("heading", { name: "Drugstore" })).not.toBeNull();
    expect(within(listsTile).getByRole("heading", { name: "Zonder winkel" })).not.toBeNull();
    expect(within(listsTile).getByText("+1 meer")).not.toBeNull();
  });

  it("keeps Home card actions compact and avoids duplicate Taken navigation labels", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    await screen.findByText("Event 1");

    expect(screen.queryByLabelText("Snel toevoegen")).toBeNull();
    expect(screen.queryByRole("button", { name: "View Taken" })).toBeNull();
    expect(screen.queryByText("Open Taken")).toBeNull();
    expect(screen.getByRole("button", { name: "Taak toevoegen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Taken openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Boodschappen openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Motivatie openen" })).not.toBeNull();
  });

  it("renders Avatar V2 in the Home family strip when configured", () => {
    render(
      <HomeDashboard
        members={[{ ...familyMembers[0], avatarV2Config: avatarV2DefaultConfiguration }]}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    const strip = screen.getByLabelText("Gezinsleden");
    const portrait = within(strip).getByRole("button", { name: "Alex gezinslidpagina openen" });
    const avatar = within(strip).getByRole("img", { name: "Alex household avatar" });
    expect(portrait.className).toContain("home-family-portrait");
    expect(portrait.className).not.toContain("family-chip");
    expect(within(portrait).getByText("Alex").className).toContain("home-family-portrait-caption");
    expect(avatar.className).toContain("family-avatar-v2");
  });

  it("renders and navigates from the Home Motivation tile", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={onNavigate}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    const tile = screen.getByLabelText("Motivatie-overzicht");
    expect(
      await within(tile).findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(within(tile).getByText("13/20 helpful actions")).not.toBeNull();
    expect(within(tile).getByLabelText("Viering thuis")).not.toBeNull();
    expect(within(tile).getByText("Komt dichterbij")).not.toBeNull();
    expect(
      within(tile).getByText(
        "Nog maar 7 helpful actions tot Board game night together.",
      ),
    ).not.toBeNull();
    expect(within(tile).queryByText(/shop/i)).toBeNull();
    expect(within(tile).queryByText(/^gems?$/i)).toBeNull();
    expect(within(tile).queryByText(/leaderboard/i)).toBeNull();

    await user.click(tile);
    expect(onNavigate).toHaveBeenCalledWith("motivation");
  });

  it("selects a family member instead of opening the avatar editor on Home", async () => {
    const user = userEvent.setup();
    const onSelectFamilyMember = vi.fn();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={onSelectFamilyMember}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Alex gezinslidpagina openen" }),
    );

    expect(onSelectFamilyMember).toHaveBeenCalledWith("alex");
    expect(screen.queryByRole("dialog", { name: /avatar editor/i })).toBeNull();
  });

  it("navigates from summary content and overflow", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={onNavigate}
        onSelectFamilyMember={vi.fn()}
      />,
    );
    await screen.findByText("Event 1");

    await user.click(screen.getByText("Event 1"));
    expect(onNavigate).toHaveBeenCalledWith("agenda");

    await user.click(
      within(screen.getByLabelText("Boodschappenoverzicht")).getByRole("button", {
        name: "+1 meer",
      }),
    );
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("lists"));

    await user.click(screen.getByLabelText("Takenoverzicht"));
    expect(onNavigate).toHaveBeenCalledWith("tasks");

  });
  it("adds shopping items, tasks, and calendar events from compact card actions", async () => {
    const user = userEvent.setup();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );
    await screen.findByText("Event 1");

    expect(screen.queryByLabelText("Snel toevoegen")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Boodschap toevoegen" }));
    expect(screen.getByRole("dialog", { name: "Boodschap toevoegen vanaf Thuis" })).not.toBeNull();
    await user.type(screen.getByLabelText("Wat hebben we nodig?"), "Oat milk");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    const lists = await listsApi();
    expect(lists.loadShoppingList).toHaveBeenCalled();
    expect(lists.addShoppingListItem).toHaveBeenCalledWith(
      expect.anything(),
      "shopping",
      "Oat milk",
    );
    expect(
      await screen.findByText("Oat milk toegevoegd aan Boodschappen."),
    ).not.toBeNull();

    expect(screen.queryByLabelText("Wat hebben we nodig?")).toBeNull();

    const tasks = await tasksApi();
    vi.mocked(tasks.createTask).mockResolvedValue({
      id: "new-task",
      title: "Sweep hallway",
      dueDate: "2026-06-19",
      ownershipKind: "Unassigned",
      familyMemberId: null,
      isCompleted: false,
      completedUtc: null,
      createdUtc: "2026-06-19T08:30:00.000Z",
      updatedUtc: "2026-06-19T08:30:00.000Z",
    });
    await user.click(screen.getByRole("button", { name: "Taak toevoegen" }));
    await user.type(screen.getByLabelText("Wat moet er gebeuren?"), "Sweep hallway");
    await user.click(screen.getByRole("button", { name: "Volgende" }));
    await user.click(screen.getByRole("button", { name: "Later beslissen" }));
    expect(tasks.createTask).toHaveBeenCalledWith({
      title: "Sweep hallway",
      dueDate: "2026-06-19",
      ownershipKind: "Unassigned",
    });
    expect(await screen.findByText("Sweep hallway toegevoegd aan Taken.")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Afspraak toevoegen" }));
    expect(
      screen.getByRole("dialog", { name: "Afspraak toevoegen vanaf Thuis" }),
    ).not.toBeNull();
    await user.type(screen.getByLabelText("Wat gebeurt er?"), "Swimming lesson");
    await user.click(screen.getByRole("button", { name: "Volgende" }));
    await user.click(screen.getByRole("button", { name: "Morgen" }));

    const agenda = await agendaApi();
    expect(agenda.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Swimming lesson", allDay: true }),
    );
    expect(
      await screen.findByText("Swimming lesson toegevoegd aan Agenda."),
    ).not.toBeNull();
  }, 10000);

  it("keeps Home quick-capture dialogs keyboard dismissible", async () => {
    const user = userEvent.setup();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );
    await screen.findByText("Event 1");

    await user.click(screen.getByRole("button", { name: "Taak toevoegen" }));
    expect(screen.getByRole("dialog", { name: "Taak toevoegen vanaf Thuis" })).not.toBeNull();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Taak toevoegen vanaf Thuis" })).toBeNull();
  });

  it("keeps a stable weather fallback when the Home weather request fails", async () => {
    vi.mocked((await weatherApi()).loadHomeWeather).mockRejectedValue(
      new Error("weather unavailable"),
    );

    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Weeradvies, Geen weeradvies" }),
    ).not.toBeNull();
    expect(screen.getByText("Geen weeradvies")).not.toBeNull();
    expect(screen.queryByText("weather unavailable")).toBeNull();
  });

});

describe("HomeDashboard empty states", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-06-19T08:30:00Z"));
    vi.mocked((await agendaApi()).loadCalendarAgendaData).mockResolvedValue({
      sources: [],
      events: [],
    });
    vi.mocked((await listsSummaryApi()).loadShoppingListSummary).mockResolvedValue(
      null,
    );
    vi.mocked((await tasksApi()).loadTasks).mockResolvedValue([]);
    vi.mocked((await motivationApi()).loadMotivationSnapshot).mockResolvedValue(
      { individualGoals: [] },
    );
  });

  it("shows lightweight first actions for empty household data", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()}
      />,
    );

    expect(await screen.findByText("Maak je eerste afspraak")).not.toBeNull();
    expect(screen.getByText("Voeg je eerste boodschap toe")).not.toBeNull();
    expect(screen.getByText("Maak je eerste gezinsdoel")).not.toBeNull();
    expect(screen.getByText("Maak je eerste taak")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Agenda openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Boodschappen openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Motivatie openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Taken openen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Afspraak toevoegen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Boodschap toevoegen" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Taak toevoegen" })).not.toBeNull();
  });
});
