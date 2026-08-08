import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
  loadArchivedTasks: vi.fn(),
  createTask: vi.fn(),
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
  updateTask: vi.fn(),
  deleteRecurringTask: vi.fn(),
  loadTaskTemplates: vi.fn(),
  loadArchivedTaskTemplates: vi.fn(),
  createTaskTemplate: vi.fn(),
  updateTaskTemplate: vi.fn(),
  archiveTaskTemplate: vi.fn(),
  restoreTaskTemplate: vi.fn(),
  deleteArchivedTaskTemplate: vi.fn(),
  applyTaskTemplate: vi.fn(),
  keepTaskActive: vi.fn(),
  moveTaskToSomeday: vi.fn(),
  archiveTask: vi.fn(),
  restoreArchivedTask: vi.fn(),
  deleteArchivedTask: vi.fn(),
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
    avatarSelection: {
      schemaVersion: "avatar-catalog-v1",
      selections: {} as never,
    },
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

beforeEach(async () => {
  const api = await tasksApi();
  vi.mocked(api.loadArchivedTasks).mockResolvedValue([]);
  vi.mocked(api.loadArchivedTaskTemplates).mockResolvedValue([]);
});

describe("TasksPage empty state", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
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
    expect(
      within(lunchCard).queryByRole("button", { name: /Morgen plannen/ }),
    ).toBeNull();
    const moreActions = within(lunchCard).getByRole("button", {
      name: /Meer acties voor Pack lunches/,
    });
    await user.click(moreActions);
    expect(
      screen.getByRole("menuitem", {
        name: /Herhaling beheren: Pack lunches/,
      }),
    ).not.toBeNull();
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: /Week plannen \(1\)/ }),
    );
    expect(await screen.findByText("Fix hallway hook")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Ooit/ }));
    expect(await screen.findByText("Paint garage")).not.toBeNull();
  });

  it("opens planning detail instead of showing future lists by default", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
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
    expect(
      await screen.findByRole("dialog", { name: "Planning" }),
    ).not.toBeNull();
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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({ id: "normal", title: "Empty dishwasher", dueDate: "2026-06-20" }),
      task({
        id: "overdue",
        title: "Return library books",
        dueDate: "2026-06-19",
      }),
      task({
        id: "recurring",
        title: "Pack lunches",
        dueDate: "2026-06-20",
        recurrenceFrequency: "Weekly",
        recurringTaskSeriesId: "series-lunches",
      }),
      task({
        id: "already-tomorrow",
        title: "Bring gym bag",
        dueDate: "2026-06-21",
      }),
    ]);
    vi.mocked(api.updateTask).mockImplementation(async (taskId, input) =>
      task({
        id: taskId,
        title: input.title,
        dueDate: input.dueDate ?? null,
        ownershipKind: input.ownershipKind ?? "Unassigned",
        familyMemberId: input.familyMemberId ?? null,
        recurrenceFrequency: input.recurrenceFrequency ?? "None",
      }),
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

    const normalCard = within(searchRoot)
      .getByText("Empty dishwasher")
      .closest("li")!;
    const overdueCard = within(searchRoot)
      .getByText("Return library books")
      .closest("li")!;
    await user.click(
      within(normalCard).getByRole("button", { name: /Morgen plannen/ }),
    );
    await user.click(
      within(overdueCard).getByRole("button", { name: /Morgen plannen/ }),
    );

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
    expect(
      within(screen.getByText("Pack lunches").closest("li")!).queryByRole(
        "button",
        { name: /Morgen plannen/ },
      ),
    ).toBeNull();
    expect(vi.mocked(api.updateTask)).toHaveBeenCalledTimes(2);
  });

  it("exposes direct semantic task controls and restores focus from the More menu", async () => {
    const user = userEvent.setup();
    render(<TasksPage members={familyMembers} />);

    const card = (await screen.findByText("Return library books")).closest("li")!;
    expect(card.hasAttribute("tabindex")).toBe(false);
    expect(card.hasAttribute("aria-selected")).toBe(false);
    expect(
      within(card).getByRole("button", {
        name: "Details van Return library books openen",
      }),
    ).not.toBeNull();
    expect(
      within(card).getByRole("button", {
        name: "Klaar: Return library books",
      }),
    ).not.toBeNull();
    expect(
      within(card).getByRole("button", {
        name: "Morgen plannen: Return library books",
      }),
    ).not.toBeNull();

    const more = within(card).getByRole("button", {
      name: "Meer acties voor Return library books",
    });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    more.focus();
    await user.keyboard("{Enter}");

    const menu = screen.getByRole("menu", {
      name: "Meer acties voor Return library books",
    });
    const edit = within(menu).getByRole("menuitem", {
      name: "Aanpassen: Return library books",
    });
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(more.getAttribute("aria-controls")).toBe(menu.id);
    expect(document.activeElement).toBe(edit);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(more);

    await user.click(more);
    expect(screen.getByRole("menu")).not.toBeNull();
    await user.click(
      screen.getByRole("heading", { name: "Taken voor het gezin" }),
    );
    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(more);
    window.dispatchEvent(new Event("scroll"));
    expect(screen.getByRole("menu")).not.toBeNull();
    window.dispatchEvent(new WheelEvent("wheel"));
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("keeps Reopen directly available for completed tasks", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({
        id: "completed",
        title: "Put coats away",
        isCompleted: true,
        completedUtc: "2026-06-20T09:00:00Z",
      }),
    ]);
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Planning");
    await user.click(screen.getByRole("button", { name: /Afgerond1/ }));
    const card = (await screen.findByText("Put coats away")).closest("li")!;
    expect(
      within(card).getByRole("button", {
        name: "Terugzetten: Put coats away",
      }),
    ).not.toBeNull();
  });

  it("guides task creation through one friendly question at a time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-20T08:00:00Z"));
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
    vi.mocked(api.createTask).mockResolvedValue(
      task({ id: "new", title: "Water plants" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(
      screen.getByRole("button", { name: "Gezinstaak toevoegen" }),
    );

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
    expect(
      within(dialog).getByText("Wanneer moet dit gebeuren?"),
    ).not.toBeNull();
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
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
    vi.mocked(api.updateTask).mockResolvedValue(
      task({ id: "overdue", title: "Return library bags" }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(
      within(screen.getByText("Return library books").closest("li")!).getByRole(
        "button",
        { name: "Details van Return library books openen" },
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
    await user.click(
      within(dialog).getByRole("button", { name: "Taak opslaan" }),
    );

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("overdue", {
      title: "Return library bags",
      dueDate: null,
      ownershipKind: "FamilyMember",
      familyMemberId: "alex",
      recurrenceFrequency: "None",
    });

    await user.click(
      screen.getByRole("button", { name: "Gezinstaak toevoegen" }),
    );
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
    vi.mocked(api.createTask).mockResolvedValue(
      task({
        id: "new",
        title: "Grandma gift",
        recurrenceFrequency: "Weekly",
        decorativeAvatar: {
          referenceType: "knownPerson",
          referenceId: "known-1",
        },
      }),
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Return library books");
    await user.click(
      screen.getByRole("button", { name: "Gezinstaak toevoegen" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Gezinstaak toevoegen" });
    await user.type(
      within(dialog).getByLabelText("Wat moet er gebeuren?"),
      "Grandma gift",
    );
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.selectOptions(
      within(dialog).getByLabelText("Herhaling"),
      "Weekly",
    );
    const avatarSelect = within(dialog).getByLabelText(
      "Decoratieve avatar voor taak",
    );
    expect(
      within(avatarSelect).getByRole("group", { name: "Voorgesteld" }),
    ).not.toBeNull();
    await user.selectOptions(avatarSelect, "knownPerson:known-1");
    await user.click(
      within(dialog).getByRole("button", { name: "Taak maken" }),
    );

    expect(vi.mocked(api.createTask)).toHaveBeenCalledWith({
      title: "Grandma gift",
      dueDate: "2026-06-20",
      ownershipKind: "Unassigned",
      familyMemberId: null,
      recurrenceFrequency: "Weekly",
      decorativeAvatar: {
        referenceType: "knownPerson",
        referenceId: "known-1",
      },
    });
  });

  it("renders inherited decorative avatars and sends clears while assignment stays unchanged", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({
        id: "recurring-decorated",
        title: "Grandma gift",
        dueDate: "2026-06-20",
        recurrenceFrequency: "Weekly",
        recurringTaskSeriesId: "series-1",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        decorativeAvatar: {
          referenceType: "knownPerson",
          referenceId: "known-1",
        },
      }),
    ]);
    vi.mocked(api.updateTask).mockResolvedValue(
      task({
        id: "recurring-decorated",
        title: "Grandma gift",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        recurrenceFrequency: "Weekly",
        recurringTaskSeriesId: "series-1",
        decorativeAvatar: null,
      }),
    );
    render(<TasksPage members={familyMembers} />);

    const card = (await screen.findByText("Grandma gift")).closest("li")!;
    expect(
      within(card).getByLabelText("Decoratieve avatar voor Grandma gift"),
    ).not.toBeNull();
    expect(within(card).getByText("Alex")).not.toBeNull();
    await user.click(
      within(card).getByRole("button", {
        name: "Details van Grandma gift openen",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Taak aanpassen" });
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.selectOptions(
      within(dialog).getByLabelText("Decoratieve avatar voor taak"),
      "",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Taak opslaan" }),
    );

    const scopeDialog = screen.getByRole("dialog", { name: "Welke taken aanpassen?" });
    expect((within(scopeDialog).getByRole("radio", { name: /Alleen deze taak/ }) as HTMLInputElement).checked).toBe(true);
    await user.click(within(scopeDialog).getByRole("button", { name: "Wijziging toepassen" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
      "recurring-decorated",
      {
        title: "Grandma gift",
        dueDate: "2026-06-20",
        ownershipKind: "FamilyMember",
        familyMemberId: "alex",
        recurrenceFrequency: "Weekly",
        decorativeAvatar: null,
        recurrenceScope: "Occurrence",
      },
    );
  });

  it("retains a recurring edit draft while choosing occurrence scope", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const recurring = task({ id: "scope-edit", title: "Water plants", recurringTaskSeriesId: "series-scope", recurrenceFrequency: "Weekly" });
    vi.mocked(api.loadTasks).mockResolvedValue([recurring]);
    vi.mocked(api.updateTask).mockResolvedValue({ ...recurring, title: "Water all plants" });
    render(<TasksPage members={familyMembers} />);

    await user.click(await screen.findByRole("button", { name: "Details van Water plants openen" }));
    const editor = screen.getByRole("dialog", { name: "Taak aanpassen" });
    const titleInput = within(editor).getByLabelText("Wat moet er gebeuren?");
    await user.clear(titleInput);
    await user.type(titleInput, "Water all plants");
    await user.click(within(editor).getByRole("button", { name: "Verder" }));
    await user.click(within(editor).getByRole("button", { name: "Verder" }));
    await user.click(within(editor).getByRole("button", { name: "Verder" }));
    await user.click(within(editor).getByRole("button", { name: "Taak opslaan" }));

    let scopeDialog = screen.getByRole("dialog", { name: "Welke taken aanpassen?" });
    await user.click(within(scopeDialog).getByRole("button", { name: "Terug naar aanpassen" }));
    expect(screen.getByText(/Water all plants is voor iedereen/)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Taak opslaan" }));
    scopeDialog = screen.getByRole("dialog", { name: "Welke taken aanpassen?" });
    await user.click(within(scopeDialog).getByLabelText(/Deze en volgende/));
    await user.click(within(scopeDialog).getByRole("button", { name: "Wijziging toepassen" }));

    expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith("scope-edit", expect.objectContaining({ title: "Water all plants", recurrenceScope: "ThisAndFuture" }));
  });

  it("requires confirmation and retains failures when removing recurring scope", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const recurring = task({ id: "scope-delete", title: "Weekly bins", recurringTaskSeriesId: "series-delete", recurrenceFrequency: "Weekly" });
    vi.mocked(api.loadTasks).mockResolvedValueOnce([recurring]).mockResolvedValueOnce([]);
    vi.mocked(api.deleteRecurringTask).mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce();
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Weekly bins");
    await user.click(screen.getByRole("button", { name: "Meer acties voor Weekly bins" }));
    await user.click(screen.getByRole("menuitem", { name: "Herhaling beheren: Weekly bins" }));
    const scopeDialog = screen.getByRole("dialog", { name: "Welke taken verwijderen?" });
    const removeButton = within(scopeDialog).getByRole("button", { name: "Verwijderen" });
    expect(removeButton.hasAttribute("disabled")).toBe(true);
    await user.click(within(scopeDialog).getByLabelText(/Deze en volgende/));
    await user.click(within(scopeDialog).getByLabelText(/Ik begrijp dat/));
    await user.click(removeButton);
    expect((await within(scopeDialog).findByRole("alert")).textContent).toContain("ongewijzigd gebleven");
    expect((within(scopeDialog).getByLabelText(/Ik begrijp dat/) as HTMLInputElement).checked).toBe(true);

    await user.click(removeButton);
    await waitFor(() => expect(vi.mocked(api.deleteRecurringTask)).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.deleteRecurringTask)).toHaveBeenLastCalledWith("scope-delete", "ThisAndFuture");
    expect(screen.queryByRole("dialog", { name: "Welke taken verwijderen?" })).toBeNull();
  });
});

describe("TasksPage templates", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
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
          {
            id: "item-2",
            title: "Pack school bag",
            ownershipKind: "FamilyMember",
            familyMemberId: "riley",
            recurrenceFrequency: "Weekly",
            dueOffsetDays: 1,
            position: 1,
          },
        ],
      },
    ]);
  });

  it("keeps templates secondary while preserving template access", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
    render(<TasksPage members={familyMembers} />);

    await screen.findByText("Voeg de eerste helpende taak toe");
    expect(screen.queryByText("Morning Routine")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Routines/ }));
    expect(await screen.findByText("Morning Routine")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Toepassen" }));

    expect(vi.mocked(api.applyTaskTemplate)).toHaveBeenCalledWith("template-1");
  });

  it("uses a dedicated ordered-item editor for routine creation", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.createTaskTemplate).mockResolvedValue({
      id: "created-routine",
      name: "Schoolstart",
      description: "Rustige ochtend",
      active: true,
      createdUtc: "2026-08-08T00:00:00Z",
      updatedUtc: "2026-08-08T00:00:00Z",
      items: [],
    });
    render(<TasksPage members={familyMembers} />);

    await user.click(await screen.findByRole("button", { name: /Routines/ }));
    await user.click(screen.getByRole("button", { name: "Nieuwe routine" }));
    const editor = screen.getByRole("form", { name: "Nieuwe routine maken" });
    expect(screen.queryByRole("dialog", { name: "Gezinstaak toevoegen" })).toBeNull();
    await user.type(within(editor).getByLabelText("Routinenaam"), "Schoolstart");
    await user.type(within(editor).getByLabelText("Beschrijving"), "Rustige ochtend");
    await user.type(within(editor).getByLabelText("Titel stap 1"), "Tanden poetsen");
    await user.click(within(editor).getByRole("button", { name: "Stap toevoegen" }));
    await user.type(within(editor).getByLabelText("Titel stap 2"), "Tas inpakken");
    await user.selectOptions(within(editor).getByLabelText("Herhaling stap 2"), "Weekly");
    await user.click(within(editor).getByRole("button", { name: "Stap 2 omhoog" }));
    await user.click(within(editor).getByRole("button", { name: "Routine maken" }));

    expect(vi.mocked(api.createTaskTemplate)).toHaveBeenCalledWith({
      name: "Schoolstart",
      description: "Rustige ochtend",
      items: [
        { title: "Tas inpakken", ownershipKind: "Unassigned", familyMemberId: null, recurrenceFrequency: "Weekly", dueOffsetDays: null },
        { title: "Tanden poetsen", ownershipKind: "Unassigned", familyMemberId: null, recurrenceFrequency: "None", dueOffsetDays: null },
      ],
    });
  });

  it("loads every routine item for editing and keeps prospective-change copy visible", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.updateTaskTemplate).mockResolvedValue((await api.loadTaskTemplates())[0]);
    render(<TasksPage members={familyMembers} />);

    await user.click(await screen.findByRole("button", { name: /Routines/ }));
    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    const editor = screen.getByRole("form", { name: "Routine Morning Routine aanpassen" });
    expect(within(editor).getByDisplayValue("Brush teeth")).not.toBeNull();
    expect(within(editor).getByDisplayValue("Pack school bag")).not.toBeNull();
    expect(within(editor).getByText("Wijzigingen gelden alleen voor toekomstige toepassingen.")).not.toBeNull();
    await user.click(within(editor).getByRole("button", { name: "Stap 1 omlaag" }));
    await user.click(within(editor).getByRole("button", { name: "Stap 2 verwijderen" }));
    await user.click(within(editor).getByRole("button", { name: "Routine opslaan" }));

    expect(vi.mocked(api.updateTaskTemplate)).toHaveBeenCalledWith("template-1", expect.objectContaining({
      items: [expect.objectContaining({ title: "Pack school bag", recurrenceFrequency: "Weekly" })],
    }));
  });

  it("archives and restores routines through the bounded routine archive", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const active = (await api.loadTaskTemplates())[0];
    const archived = { ...active, active: false };
    vi.mocked(api.loadTaskTemplates).mockReset()
      .mockResolvedValueOnce([active])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([active]);
    vi.mocked(api.loadArchivedTaskTemplates).mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([archived])
      .mockResolvedValueOnce([]);
    vi.mocked(api.archiveTaskTemplate).mockResolvedValue();
    vi.mocked(api.restoreTaskTemplate).mockResolvedValue();
    render(<TasksPage members={familyMembers} />);

    await user.click(await screen.findByRole("button", { name: /Routines/ }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));
    await user.click(await screen.findByRole("tab", { name: "Archief (1)" }));
    await user.click(screen.getByRole("button", { name: "Herstellen" }));

    expect(vi.mocked(api.archiveTaskTemplate)).toHaveBeenCalledWith("template-1");
    expect(vi.mocked(api.restoreTaskTemplate)).toHaveBeenCalledWith("template-1");
    expect(await screen.findByText("Het routinearchief is leeg.")).not.toBeNull();
  });

  it("requires task-specific confirmation and retains archived routine on deletion failure", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const archived = { ...(await api.loadTaskTemplates())[0], active: false };
    vi.mocked(api.loadTaskTemplates).mockReset().mockResolvedValue([]);
    vi.mocked(api.loadArchivedTaskTemplates).mockReset()
      .mockResolvedValueOnce([archived])
      .mockResolvedValueOnce([]);
    vi.mocked(api.deleteArchivedTaskTemplate)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce();
    render(<TasksPage members={familyMembers} />);

    await user.click(await screen.findByRole("button", { name: /Routines/ }));
    await user.click(screen.getByRole("tab", { name: "Archief (1)" }));
    await user.click(screen.getByRole("button", { name: "Permanent verwijderen" }));
    expect(screen.getByText("De routine en haar stappen verdwijnen permanent. Eerder aangemaakte taken blijven bestaan.")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(screen.getByText("Morning Routine")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Permanent verwijderen" }));
    await user.click(screen.getByRole("button", { name: "Definitief verwijderen" }));
    expect((await screen.findByRole("alert")).textContent).toContain("routine is behouden");
    await user.click(screen.getByRole("button", { name: "Definitief verwijderen" }));
    expect(vi.mocked(api.deleteArchivedTaskTemplate)).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Het routinearchief is leeg.")).not.toBeNull();
  });

  it("keeps Weekly Reset secondary while preserving review actions", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(
      knownPeople,
    );
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
    await user.click(
      screen.getByRole("button", { name: /Week plannen \(1\)/ }),
    );
    await user.click(screen.getByRole("button", { name: "Deze week houden" }));

    expect(vi.mocked(api.keepTaskActive)).toHaveBeenCalledWith("review");
  });
});

describe("TasksPage normal-task archive", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked((await knownPeopleApi()).listKnownPeople).mockResolvedValue(knownPeople);
    vi.mocked((await tasksApi()).loadTaskTemplates).mockResolvedValue([]);
  });

  it("archives a normal task from More and restores it from the bounded archive", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const active = task({ id: "archive-me", title: "Winterjassen opruimen" });
    const archived = task({
      ...active,
      noDateReviewState: "Archived",
      archivedUtc: "2026-08-08T10:00:00Z",
    });
    vi.mocked(api.loadTasks)
      .mockResolvedValueOnce([active])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([active]);
    vi.mocked(api.loadArchivedTasks)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([archived])
      .mockResolvedValueOnce([]);
    vi.mocked(api.archiveTask).mockResolvedValue(archived);
    vi.mocked(api.restoreArchivedTask).mockResolvedValue(active);

    render(<TasksPage members={familyMembers} />);
    await screen.findByText("Winterjassen opruimen");
    await user.click(screen.getByRole("button", { name: "Meer acties voor Winterjassen opruimen" }));
    await user.click(screen.getByRole("menuitem", { name: "Archiveren: Winterjassen opruimen" }));

    expect(vi.mocked(api.archiveTask)).toHaveBeenCalledWith("archive-me");
    await user.click(await screen.findByRole("button", { name: /Archief/ }));
    expect(await screen.findByRole("dialog", { name: "Archief" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Herstellen" }));

    expect(vi.mocked(api.restoreArchivedTask)).toHaveBeenCalledWith("archive-me");
    expect(await screen.findByText("Het archief is leeg.")).not.toBeNull();
  });

  it("keeps deletion task-specific, confirmed, and recoverable after failure", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    const archived = task({
      id: "delete-me",
      title: "Oude keldertaak",
      noDateReviewState: "Archived",
      archivedUtc: "2026-08-08T10:00:00Z",
    });
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadArchivedTasks)
      .mockResolvedValueOnce([archived])
      .mockResolvedValueOnce([]);
    vi.mocked(api.deleteArchivedTask)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce();

    render(<TasksPage members={familyMembers} />);
    await user.click(await screen.findByRole("button", { name: /Archief/ }));
    await user.click(screen.getByRole("button", { name: "Permanent verwijderen" }));
    expect(screen.getByText("Deze taak verdwijnt permanent. Dit kan niet ongedaan worden gemaakt.")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(screen.getByText("Oude keldertaak")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Permanent verwijderen" }));
    await user.click(screen.getByRole("button", { name: "Definitief verwijderen" }));
    expect((await screen.findByRole("alert")).textContent).toContain("De gearchiveerde taak is behouden");
    expect(screen.getByText("Oude keldertaak")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Definitief verwijderen" }));
    expect(vi.mocked(api.deleteArchivedTask)).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Het archief is leeg.")).not.toBeNull();
  });

  it("does not offer normal-task archive for a recurring task", async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([
      task({ id: "routine", title: "Vuilnisroutine", recurringTaskSeriesId: "series", recurrenceFrequency: "Weekly" }),
    ]);

    render(<TasksPage members={familyMembers} />);
    await screen.findByText("Vuilnisroutine");
    await user.click(screen.getByRole("button", { name: "Meer acties voor Vuilnisroutine" }));
    expect(screen.queryByRole("menuitem", { name: "Archiveren: Vuilnisroutine" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Herhaling beheren: Vuilnisroutine" })).not.toBeNull();
  });
});
