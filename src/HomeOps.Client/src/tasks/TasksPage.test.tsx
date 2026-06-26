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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TasksPage empty state", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([]);
  });

  it("guides households to create the first task when no tasks exist", async () => {
    render(<TasksPage members={familyMembers} />);

    expect(
      await screen.findByText("Add the first thing to help with"),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Tasks keep family help visible without turning the day into admin.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Add a family task" }),
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
      container.textContent?.indexOf("Routine starters") ?? -1,
    );
    expect(screen.getByLabelText("Task primary action")).not.toBeNull();
    expect(screen.getByLabelText("Task planning actions")).not.toBeNull();
    expect(screen.queryByText("Morning Routine")).toBeNull();
  });

  it("guides task creation through one friendly question at a time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.createTask).mockResolvedValue(
      task({ id: "new", title: "Water plants" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(screen.getByRole("button", { name: "Add family task" }));

    const dialog = screen.getByRole("dialog", { name: "Add family task" });
    expect(within(dialog).getByText("What needs to be done?")).not.toBeNull();
    expect(within(dialog).queryByText("Who should do this?")).toBeNull();
    expect(
      within(dialog)
        .getByRole("button", { name: "Continue" })
        .hasAttribute("disabled"),
    ).toBe(true);

    await user.type(
      within(dialog).getByLabelText("What needs to be done?"),
      "Water plants",
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(within(dialog).getByText("Who should do this?")).not.toBeNull();
    await user.click(
      within(dialog).getByRole("button", { name: "Whole family" }),
    );

    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(within(dialog).getByText("When should it happen?")).not.toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Tomorrow" }));

    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(within(dialog).getByText("Anything else?")).not.toBeNull();
    await user.selectOptions(
      within(dialog).getByLabelText("Repeats"),
      "Weekly",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );

    expect(vi.mocked(api.createTask)).toHaveBeenCalledWith({
      title: "Water plants",
      dueDate: "2026-06-21",
      ownershipKind: "SharedHousehold",
      familyMemberId: null,
      recurrenceFrequency: "Weekly",
    });
  });

  it("preserves task editing and closes the dialog with Escape", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.updateTask).mockResolvedValue(
      task({ id: "overdue", title: "Return library bags" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(
      within(screen.getByText("Return library books").closest("li")!).getByRole(
        "button",
        { name: "Adjust" },
      ),
    );

    const dialog = screen.getByRole("dialog", { name: "Adjust task" });
    await user.clear(within(dialog).getByLabelText("What needs to be done?"));
    await user.type(
      within(dialog).getByLabelText("What needs to be done?"),
      "Return library bags",
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(
      within(dialog).getByRole("button", { name: "One person" }),
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Choose someone"),
      "alex",
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(within(dialog).getByRole("button", { name: "Someday" }));
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(within(dialog).getByRole("button", { name: "Save task" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("overdue", {
      title: "Return library bags",
      dueDate: null,
      ownershipKind: "FamilyMember",
      familyMemberId: "alex",
      recurrenceFrequency: "None",
    });

    await user.click(screen.getByRole("button", { name: "Add family task" }));
    expect(
      screen.getByRole("dialog", { name: "Add family task" }),
    ).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Add family task" }),
    ).toBeNull();
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

    await screen.findByText("Add the first thing to help with");
    expect(screen.queryByText("Morning Routine")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Routine starters" }));
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
    await user.click(screen.getByRole("button", { name: "Plan the week (1)" }));
    await user.click(
      screen.getByRole("button", { name: "Keep for this week" }),
    );

    expect(vi.mocked(api.keepTaskActive)).toHaveBeenCalledWith("review");
  });
});
