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
import { familyMembers } from "./familyMembers";

vi.mock("../agenda/calendarEventsApi", () => ({
  loadCalendarAgendaData: vi.fn(),
  createCalendarAgendaEvent: vi.fn(),
}));
vi.mock("../shopping/listsApi", () => ({
  createListsApiClient: vi.fn(() => ({})),
  loadShoppingList: vi.fn(),
  addShoppingListItem: vi.fn(),
}));
vi.mock("../shopping/listsSummaryApi", () => ({ loadListSummaries: vi.fn() }));
vi.mock("../tasks/tasksApi", () => ({ loadTasks: vi.fn() }));
vi.mock("../motivationData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../motivationData")>()),
  loadMotivationSnapshot: vi.fn(),
}));
vi.mock("../demo/demoAgendaData", () => ({
  demoReadOnlyEvents: [],
  demoReadOnlyEventSources: [],
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
    vi.mocked(listsSummary.loadListSummaries).mockResolvedValue([
      {
        id: "shopping",
        name: "Shopping",
        activeItems: [
          { id: "milk", text: "Milk" },
          { id: "bread", text: "Bread" },
          { id: "apples", text: "Apples" },
        ],
      },
      {
        id: "packing",
        name: "Vacation Packing",
        activeItems: [
          { id: "sunscreen", text: "Sunscreen" },
          { id: "chargers", text: "Chargers" },
        ],
      },
    ]);
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
        rewardLabel: "Board game night together",
      },
      individualGoals: [],
    });
  });

  it("renders the Home dashboard, family members, agenda summary, lists summary, and overflow", async () => {
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()} onAddFamilyMember={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Home dashboard")).not.toBeNull();
    expect(screen.getByLabelText("Family Members")).not.toBeNull();
    expect(screen.getByText("Alex")).not.toBeNull();
    expect(await screen.findByText("Event 1")).not.toBeNull();
    expect(screen.getAllByText("Tomorrow").length).toBeGreaterThan(0);
    expect(screen.getByText("Milk")).not.toBeNull();
    expect(screen.getByText("Vacation Packing")).not.toBeNull();
    expect(screen.getByText("+2 more")).not.toBeNull();
    expect(screen.getAllByText("+1 more")).toHaveLength(2);
    expect(screen.getByText("Tasks")).not.toBeNull();
    expect(screen.getByText("Overdue")).not.toBeNull();
    expect(screen.getByText("Due Today")).not.toBeNull();
    expect(screen.getByText("Upcoming")).not.toBeNull();
    expect(screen.getByText("Empty dishwasher")).not.toBeNull();
    expect(screen.getByText("Take recycling out")).not.toBeNull();
    expect(screen.getByText("Water plants")).not.toBeNull();
    expect(screen.getByText("Alex · Due 2026-06-18")).not.toBeNull();
    expect(
      screen.getByText("Shared Household · Due 2026-06-19"),
    ).not.toBeNull();
  });

  it("renders and navigates from the Home Motivation tile", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={onNavigate}
        onSelectFamilyMember={vi.fn()} onAddFamilyMember={vi.fn()}
      />,
    );

    const tile = screen.getByLabelText("Motivation summary");
    expect(await within(tile).findByText("Fill the family helper path")).not.toBeNull();
    expect(within(tile).getByText("13/20 helpful actions")).not.toBeNull();
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
        onSelectFamilyMember={onSelectFamilyMember} onAddFamilyMember={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Open Alex family member page" }),
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
        onSelectFamilyMember={vi.fn()} onAddFamilyMember={vi.fn()}
      />,
    );
    await screen.findByText("Event 1");

    await user.click(screen.getByText("Event 1"));
    expect(onNavigate).toHaveBeenCalledWith("agenda");

    await user.click(
      within(screen.getByLabelText("Lists summary")).getByRole("button", {
        name: "+1 more",
      }),
    );
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("lists"));

    await user.click(screen.getByLabelText("Tasks summary"));
    expect(onNavigate).toHaveBeenCalledWith("tasks");

    await user.click(
      within(screen.getByLabelText("Tasks summary")).getByRole("button", {
        name: "+1 more",
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith("tasks");
  });
  it("adds shopping items and calendar events directly from Home quick capture", async () => {
    const user = userEvent.setup();
    render(
      <HomeDashboard
        members={familyMembers}
        onNavigate={vi.fn()}
        onSelectFamilyMember={vi.fn()} onAddFamilyMember={vi.fn()}
      />,
    );
    await screen.findByText("Event 1");

    await user.type(screen.getByLabelText("Shopping item"), "Oat milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const lists = await listsApi();
    expect(lists.loadShoppingList).toHaveBeenCalled();
    expect(lists.addShoppingListItem).toHaveBeenCalledWith(
      expect.anything(),
      "shopping",
      "Oat milk",
    );
    expect(
      await screen.findByText("Added Oat milk to Shopping."),
    ).not.toBeNull();

    await user.type(screen.getByLabelText("What"), "Swimming lesson");
    await user.selectOptions(screen.getByLabelText("When"), "tomorrow");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const agenda = await agendaApi();
    expect(agenda.createCalendarAgendaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Swimming lesson", allDay: true }),
    );
    expect(
      await screen.findByText("Added Swimming lesson to Agenda."),
    ).not.toBeNull();
  });
});

describe("HomeDashboard empty states", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-06-19T08:30:00Z"));
    vi.mocked((await agendaApi()).loadCalendarAgendaData).mockResolvedValue({ sources: [], events: [] });
    vi.mocked((await listsSummaryApi()).loadListSummaries).mockResolvedValue([]);
    vi.mocked((await tasksApi()).loadTasks).mockResolvedValue([]);
    vi.mocked((await motivationApi()).loadMotivationSnapshot).mockResolvedValue({ individualGoals: [] });
  });

  it("shows lightweight first actions for empty household data", async () => {
    render(<HomeDashboard members={familyMembers} onNavigate={vi.fn()} onSelectFamilyMember={vi.fn()} onAddFamilyMember={vi.fn()} />);

    expect(await screen.findByText("Create your first event")).not.toBeNull();
    expect(screen.getByText("Add your first shopping item")).not.toBeNull();
    expect(screen.getByText("Create your first family goal")).not.toBeNull();
    expect(screen.getByText("Create your first task")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Open Agenda" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Open Lists" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Open Motivation" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Open Tasks" })).not.toBeNull();
  });
});
