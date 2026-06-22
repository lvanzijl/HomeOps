import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyMembers } from "../home/familyMembers";
import { TasksPage } from "./TasksPage";
import type { HouseholdTask } from "./tasksModel";

vi.mock("./tasksApi", () => ({
  loadTasks: vi.fn(),
  createTask: vi.fn(),
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
  updateTask: vi.fn(),
  deleteRecurringTaskSeries: vi.fn(),
  loadTaskTemplates: vi.fn(),
  createTaskTemplate: vi.fn(),
  updateTaskTemplate: vi.fn(),
  archiveTaskTemplate: vi.fn(),
  applyTaskTemplate: vi.fn(),
  keepTaskActive: vi.fn(),
  moveTaskToSomeday: vi.fn(),
  archiveTask: vi.fn(),
}));

async function tasksApi() {
  return await import("./tasksApi");
}

function task(overrides: Partial<HouseholdTask>): HouseholdTask {
  return {
    id: "task-1",
    title: "Take bins out",
    dueDate: "2026-06-20",
    ownershipKind: "Unassigned",
    familyMemberId: null,
    isCompleted: false,
    completedUtc: null,
    createdUtc: "2026-06-19T00:00:00Z",
    updatedUtc: "2026-06-19T00:00:00Z",
    recurrenceFrequency: "None",
    recurringTaskSeriesId: null,
    noDateReviewState: "Active",
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("TasksPage empty state", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([]);
  });

  it("guides households to create the first task when no tasks exist", async () => {
    render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText("Create your first task")).not.toBeNull();
    expect(
      screen.getByText("Tasks help organize household responsibilities."),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Start with one household task." }),
    ).not.toBeNull();
  });
});

describe("TasksPage hierarchy compaction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({
        id: "overdue",
        title: "Return library books",
        dueDate: "2026-06-19",
      }),
      task({
        id: "today",
        title: "Pack lunches",
        dueDate: new Date().toISOString().slice(0, 10),
      }),
      task({
        id: "review",
        title: "Fix hallway hook",
        dueDate: null,
        noDateReviewState: "NeedsReview",
      }),
      task({
        id: "someday",
        title: "Paint garage",
        dueDate: null,
        noDateReviewState: "Someday",
      }),
    ]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([
      {
        id: "template-1",
        name: "Morning Routine",
        description: "Start the day",
        active: true,
        createdUtc: "2026-06-20T00:00:00Z",
        updatedUtc: "2026-06-20T00:00:00Z",
        items: [
          {
            id: "item-1",
            title: "Brush teeth",
            ownershipKind: "Unassigned",
            familyMemberId: null,
            recurrenceFrequency: "None",
            dueOffsetDays: null,
            position: 0,
          },
        ],
      },
    ]);
  });

  it("renders active task groups before management sections", async () => {
    const { container } = render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText("Return library books")).not.toBeNull();
    expect(container.textContent?.indexOf("Return library books")).toBeLessThan(
      container.textContent?.indexOf("Add task") ?? -1,
    );
    expect(screen.queryByLabelText("Add task")).toBeNull();
    expect(screen.queryByText("Morning Routine")).toBeNull();
  });

  it("opens compact task creation on demand and preserves task creation fields", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.createTask).mockResolvedValue(
      task({ id: "new", title: "Water plants" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Title"), "Water plants");
    await user.selectOptions(screen.getByLabelText("Owner"), "SharedHousehold");
    await user.type(screen.getByLabelText("Due date"), "2026-06-22");
    await user.selectOptions(screen.getByLabelText("Repeats"), "Weekly");
    await user.click(
      within(screen.getByLabelText("Add task")).getByRole("button", {
        name: "Add task",
      }),
    );

    expect(vi.mocked(api.createTask)).toHaveBeenCalledWith({
      title: "Water plants",
      dueDate: "2026-06-22",
      ownershipKind: "SharedHousehold",
      familyMemberId: null,
      recurrenceFrequency: "Weekly",
    });
  });
});

describe("TasksPage templates", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([
      {
        id: "template-1",
        name: "Morning Routine",
        description: "Start the day",
        active: true,
        createdUtc: "2026-06-20T00:00:00Z",
        updatedUtc: "2026-06-20T00:00:00Z",
        items: [
          {
            id: "item-1",
            title: "Brush teeth",
            ownershipKind: "Unassigned",
            familyMemberId: null,
            recurrenceFrequency: "None",
            dueOffsetDays: null,
            position: 0,
          },
        ],
      },
    ]);
  });

  it("keeps templates secondary while preserving template access", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Create your first task");
    expect(screen.queryByText("Morning Routine")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Templates" }));
    expect(await screen.findByText("Morning Routine")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(vi.mocked(api.applyTaskTemplate)).toHaveBeenCalledWith("template-1");
  });

  it("keeps Weekly Reset secondary while preserving review actions", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({
        id: "review",
        title: "Fix hallway hook",
        dueDate: null,
        noDateReviewState: "NeedsReview",
      }),
    ]);
    vi.mocked(api.keepTaskActive).mockResolvedValue(
      task({ id: "review", noDateReviewState: "Active" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Fix hallway hook");
    await user.click(screen.getByRole("button", { name: "Weekly Reset (1)" }));
    await user.click(screen.getByRole("button", { name: "Keep Active" }));

    expect(vi.mocked(api.keepTaskActive)).toHaveBeenCalledWith("review");
  });
});
