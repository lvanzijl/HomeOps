import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyMembers } from "../home/familyMembers";
import { TasksPage } from "./TasksPage";
import type { HouseholdTask } from "./tasksModel";
import type { KnownPerson } from "../knownPeople/knownPeople";

vi.mock("../knownPeople/knownPeopleApi", () => ({
  listKnownPeople: vi.fn(),
}));

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

async function knownPeopleApi() {
  return await import("../knownPeople/knownPeopleApi");
}

const knownPeople: KnownPerson[] = [
  {
    id: "known-1",
    displayName: "Grandma",
    nickname: null,
    relationshipType: "grandparent",
    customRelationshipLabel: null,
    scope: "shared",
    familyMemberId: null,
    initials: "G",
    avatarSelection: { schemaVersion: "avatar-catalog-v1", selections: {} as never },
  },
];

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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([]);
  });

  it("guides households to create the first task when no tasks exist", async () => {
    render(<TasksPage members={familyMembers} />);

    expect(
      await screen.findByText("Voeg de eerste helpende taak toe"),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Taken maken hulp zichtbaar zonder van de dag administratie te maken.",
      ),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Gezinstaak toevoegen" }).length,
    ).toBeGreaterThan(0);
  });
});

describe("TasksPage hierarchy compaction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
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
        recurrenceFrequency: "Weekly",
        recurringTaskSeriesId: "series-lunches",
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

  it("keeps planning and management secondary until opened", async () => {
    const user = userEvent.setup();
    render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText("Return library books")).not.toBeNull();
    expect(screen.getByLabelText("Primaire taakactie")).not.toBeNull();
    expect(screen.getByLabelText("Taakplanning acties")).not.toBeNull();
    expect(screen.getByText("Planning")).not.toBeNull();
    expect(screen.queryByText("Morning Routine")).toBeNull();
    expect(screen.queryByText("Fix hallway hook")).toBeNull();
    expect(screen.queryByText("Paint garage")).toBeNull();
    const lunchCard = screen.getByText("Pack lunches").closest("li")!;
    expect(within(lunchCard).getByText("Herhaalt wekelijks")).not.toBeNull();
    expect(within(lunchCard).queryByRole("button", { name: "Morgen" })).toBeNull();
    expect(within(lunchCard).getByRole("button", { name: "Routine verwijderen" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Week plannen \(1\)/ }));
    expect(await screen.findByText("Fix hallway hook")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Ooit/ }));
    expect(await screen.findByText("Paint garage")).not.toBeNull();
  });

  it("opens planning detail instead of showing future lists by default", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({ id: "today", title: "Pack lunches", dueDate: "2026-06-20" }),
      task({ id: "tomorrow", title: "Prep swim bag", dueDate: "2026-06-21" }),
      task({ id: "week", title: "Book dentist", dueDate: "2026-06-24" }),
    ]);

    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Pack lunches");
    expect(screen.queryByText("Prep swim bag")).toBeNull();
    expect(screen.queryByText("Book dentist")).toBeNull();

    await user.click(
      within(screen.getByLabelText("Planning")).getByRole("button", {
        name: /Morgen/,
      }),
    );
    expect(await screen.findByRole("dialog", { name: "Planning" })).not.toBeNull();
    expect(screen.getByText("Prep swim bag")).not.toBeNull();
    expect(screen.queryByText("Book dentist")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Deze week \(1\)/ }));
    expect(await screen.findByText("Book dentist")).not.toBeNull();
  });


  it("moves normal and overdue tasks to Morgen without changing recurring tasks", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({ id: "normal", title: "Empty dishwasher", dueDate: "2026-06-20" }),
      task({ id: "overdue", title: "Return library books", dueDate: "2026-06-19" }),
      task({ id: "recurring", title: "Pack lunches", dueDate: "2026-06-20", recurrenceFrequency: "Weekly", recurringTaskSeriesId: "series-lunches" }),
      task({ id: "already-tomorrow", title: "Bring gym bag", dueDate: "2026-06-21" }),
    ]);
    vi.mocked(api.updateTask).mockImplementation(async (taskId, input) =>
      task({ id: taskId, title: input.title, dueDate: input.dueDate ?? null, ownershipKind: input.ownershipKind ?? "Unassigned", familyMemberId: input.familyMemberId ?? null, recurrenceFrequency: input.recurrenceFrequency ?? "None" }),
    );

    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Pack lunches");
    let searchRoot = document.body;

    if (!screen.queryByText("Empty dishwasher")) {
      await user.click(
        within(screen.getByLabelText("Planning")).getByRole("button", {
          name: /Morgen/,
        }),
      );
      searchRoot = await screen.findByRole("dialog", { name: "Planning" });
    }

    const normalCard = within(searchRoot).getByText("Empty dishwasher").closest("li")!;
    const overdueCard = within(searchRoot).getByText("Return library books").closest("li")!;
    await user.click(within(normalCard).getByRole("button", { name: "Morgen" }));
    await user.click(within(overdueCard).getByRole("button", { name: "Morgen" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("normal", {
      title: "Empty dishwasher",
      dueDate: "2026-06-21",
      ownershipKind: "Unassigned",
      familyMemberId: null,
      recurrenceFrequency: "None",
    });
    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("overdue", {
      title: "Return library books",
      dueDate: "2026-06-21",
      ownershipKind: "Unassigned",
      familyMemberId: null,
      recurrenceFrequency: "None",
    });
    expect(within(screen.getByText("Pack lunches").closest("li")!).queryByRole("button", { name: "Morgen" })).toBeNull();
    expect(vi.mocked(api.updateTask)).toHaveBeenCalledTimes(2);
  });

  it("guides task creation through one friendly question at a time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked(api.createTask).mockResolvedValue(
      task({ id: "new", title: "Water plants" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(screen.getByRole("button", { name: "Gezinstaak toevoegen" }));

    const dialog = screen.getByRole("dialog", { name: "Gezinstaak toevoegen" });
    expect(within(dialog).getByText("Wat moet er gebeuren?")).not.toBeNull();
    expect(within(dialog).queryByText("Wie pakt dit op?")).toBeNull();
    expect(
      within(dialog)
        .getByRole("button", { name: "Verder" })
        .hasAttribute("disabled"),
    ).toBe(true);

    await user.type(
      within(dialog).getByLabelText("Wat moet er gebeuren?"),
      "Water plants",
    );
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    expect(within(dialog).getByText("Wie pakt dit op?")).not.toBeNull();
    await user.click(
      within(dialog).getByRole("button", { name: "Hele gezin" }),
    );

    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    expect(within(dialog).getByText("Wanneer moet dit gebeuren?")).not.toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Morgen" }));

    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    expect(within(dialog).getByText("Nog iets?")).not.toBeNull();
    await user.selectOptions(
      within(dialog).getByLabelText("Herhaling"),
      "Weekly",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Taak maken" }),
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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked(api.updateTask).mockResolvedValue(
      task({ id: "overdue", title: "Return library bags" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(
      within(screen.getByText("Return library books").closest("li")!).getByRole(
        "button",
        { name: "Aanpassen" },
      ),
    );

    const dialog = screen.getByRole("dialog", { name: "Taak aanpassen" });
    await user.clear(within(dialog).getByLabelText("Wat moet er gebeuren?"));
    await user.type(
      within(dialog).getByLabelText("Wat moet er gebeuren?"),
      "Return library bags",
    );
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Eén persoon" }),
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Kies iemand"),
      "alex",
    );
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Ooit" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Taak opslaan" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("overdue", {
      title: "Return library bags",
      dueDate: null,
      ownershipKind: "FamilyMember",
      familyMemberId: "alex",
      recurrenceFrequency: "None",
    });

    await user.click(screen.getByRole("button", { name: "Gezinstaak toevoegen" }));
    expect(
      screen.getByRole("dialog", { name: "Gezinstaak toevoegen" }),
    ).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Gezinstaak toevoegen" }),
    ).toBeNull();
  });


  it("sends decorative avatar fields when creating a recurring task", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.createTask).mockResolvedValue(task({ id: "new", title: "Grandma gift", recurrenceFrequency: "Weekly", decorativeAvatar: { referenceType: "knownPerson", referenceId: "known-1" } }));
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(screen.getByRole("button", { name: "Gezinstaak toevoegen" }));
    const dialog = screen.getByRole("dialog", { name: "Gezinstaak toevoegen" });
    await user.type(within(dialog).getByLabelText("Wat moet er gebeuren?"), "Grandma gift");
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.selectOptions(within(dialog).getByLabelText("Herhaling"), "Weekly");
    const avatarSelect = within(dialog).getByLabelText("Decoratieve avatar voor taak");
    expect(within(avatarSelect).getByRole("group", { name: "Suggested" })).not.toBeNull();
    await user.selectOptions(avatarSelect, "knownPerson:known-1");
    await user.click(within(dialog).getByRole("button", { name: "Taak maken" }));

    expect(vi.mocked(api.createTask)).toHaveBeenCalledWith({
      title: "Grandma gift",
      dueDate: "2026-06-20",
      ownershipKind: "Unassigned",
      familyMemberId: null,
      recurrenceFrequency: "Weekly",
      decorativeAvatar: { referenceType: "knownPerson", referenceId: "known-1" },
    });
  });

  it("renders inherited decorative avatars and sends clears while assignment stays unchanged", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({ id: "recurring-decorated", title: "Grandma gift", dueDate: "2026-06-20", recurrenceFrequency: "Weekly", recurringTaskSeriesId: "series-1", ownershipKind: "FamilyMember", familyMemberId: "alex", decorativeAvatar: { referenceType: "knownPerson", referenceId: "known-1" } }),
    ]);
    vi.mocked(api.updateTask).mockResolvedValue(task({ id: "recurring-decorated", title: "Grandma gift", ownershipKind: "FamilyMember", familyMemberId: "alex", recurrenceFrequency: "Weekly", recurringTaskSeriesId: "series-1", decorativeAvatar: null }));
    render(<TasksPage members={familyMembers} />);

    const card = (await screen.findByText("Grandma gift")).closest("li")!;
    expect(within(card).getByLabelText("Decoratieve avatar voor Grandma gift")).not.toBeNull();
    expect(within(card).getByText("Alex")).not.toBeNull();
    await user.click(within(card).getByRole("button", { name: "Aanpassen" }));
    const dialog = screen.getByRole("dialog", { name: "Taak aanpassen" });
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.selectOptions(within(dialog).getByLabelText("Decoratieve avatar voor taak"), "");
    await user.click(within(dialog).getByRole("button", { name: "Taak opslaan" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("recurring-decorated", {
      title: "Grandma gift",
      dueDate: "2026-06-20",
      ownershipKind: "FamilyMember",
      familyMemberId: "alex",
      recurrenceFrequency: "Weekly",
      decorativeAvatar: null,
    });
  });

});

describe("TasksPage templates", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Voeg de eerste helpende taak toe");
    expect(screen.queryByText("Morning Routine")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Routines/ }));
    expect(await screen.findByText("Morning Routine")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Toepassen" }));

    expect(vi.mocked(api.applyTaskTemplate)).toHaveBeenCalledWith("template-1");
  });

  it("keeps Weekly Reset secondary while preserving review actions", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
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

    expect(await screen.findByText("Planning")).not.toBeNull();
    expect(screen.queryByText("Fix hallway hook")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Week plannen \(1\)/ }));
    await user.click(
      screen.getByRole("button", { name: "Deze week houden" }),
    );

    expect(vi.mocked(api.keepTaskActive)).toHaveBeenCalledWith("review");
  });
});
