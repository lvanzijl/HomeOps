import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyMembers } from "./home/familyMembers";
import { FamilyCelebrationStatus } from "./api/homeOpsApiClient";
import { MotivationPage } from "./MotivationPage";
import {
  archiveIndividualGoal,
  createFamilyGoal,
  createIndividualGoal,
  loadMotivationSnapshot,
  markFamilyGoalCelebrated,
  updateFamilyGoal,
  updateIndividualGoal,
} from "./motivationData";

vi.mock("./motivationData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./motivationData")>()),
  loadMotivationSnapshot: vi.fn(),
  createFamilyGoal: vi.fn(),
  updateFamilyGoal: vi.fn(),
  createIndividualGoal: vi.fn(),
  updateIndividualGoal: vi.fn(),
  archiveIndividualGoal: vi.fn(),
  markFamilyGoalCelebrated: vi.fn(),
}));

afterEach(() => cleanup());

describe("MotivationPage", () => {
  beforeEach(() => {
    vi.mocked(createFamilyGoal).mockReset();
    vi.mocked(updateFamilyGoal).mockReset();
    vi.mocked(markFamilyGoalCelebrated).mockReset();
    vi.mocked(createIndividualGoal).mockReset();
    vi.mocked(updateIndividualGoal).mockReset();
    vi.mocked(archiveIndividualGoal).mockReset();
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 13,
        unitLabel: "helpful actions",
        celebration: {
          title: "Board game night together",
          status: FamilyCelebrationStatus.Planned,
        },
      },
      celebrationMemories: [
        {
          familyGoalId: "old-goal",
          title: "Ice Cream",
          description: "Scoops after teamwork.",
          celebratedUtc: "2026-06-20T12:00:00Z",
        },
      ],
      individualGoals: [
        {
          id: "alex-goal",
          familyMemberId: "alex",
          familyMemberName: "Alex",
          title: "Finish morning routine",
          targetCount: 5,
          currentProgress: 3,
          unitLabel: "checkmarks",
          visualKind: "checkmarks",
        },
        {
          id: "sam-goal",
          familyMemberId: "sam",
          familyMemberName: "Sam",
          title: "Help with dinner",
          targetCount: 3,
          currentProgress: 2,
          unitLabel: "stars",
          visualKind: "stars",
        },
      ],
    });
  });

  it("renders the family goal and individual family member goal cards", async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(screen.getByLabelText("Motivation page")).not.toBeNull();
    expect(
      await screen.findByLabelText("Things My Family Appreciates"),
    ).not.toBeNull();
    expect(screen.getByText("My Family Appreciates")).not.toBeNull();
    const familyGoal = screen.getByLabelText("Active family goal");
    expect(
      await within(familyGoal).findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(
      familyGoal
        .querySelector(".motivation-ownership-asset img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-family-participation'");
    expect(within(familyGoal).getByText("13/20")).not.toBeNull();
    expect(
      within(familyGoal).getAllByText(
        "Only 7 more helpful actions until Board game night together.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      within(familyGoal).getByLabelText("Celebration surface"),
    ).not.toBeNull();
    expect(
      within(familyGoal)
        .getByLabelText("Celebration surface")
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='celebration-upcoming'");
    expect(
      within(familyGoal).getAllByText(/Board game night together/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Celebration memories")).not.toBeNull();
    expect(screen.getByText("Celebrations we remember")).not.toBeNull();
    expect(screen.getByText("Ice Cream")).not.toBeNull();
    expect(screen.getByText(/We made this happen together/)).not.toBeNull();
    expect(
      screen
        .getByText(/We made this happen together/)
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-my-help-mattered'");

    const individualGoals = screen.getByLabelText(
      "Individual encouragement goals",
    );
    expect(within(individualGoals).getByText("Alex")).not.toBeNull();
    expect(
      within(individualGoals).getByRole("img", { name: "Alex household avatar" }).className,
    ).toContain("family-avatar-v2");
    expect(
      within(individualGoals).getByText("Finish morning routine"),
    ).not.toBeNull();
    expect(
      individualGoals
        .querySelector(".motivation-ownership-asset img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-my-progress'");
    expect(within(individualGoals).getByText("Sam")).not.toBeNull();
    expect(
      within(individualGoals).getByText("Help with dinner"),
    ).not.toBeNull();
  });

  it("marks a ready family celebration as celebrated", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 20,
        unitLabel: "helpful actions",
        celebration: {
          title: "Movie night",
          status: FamilyCelebrationStatus.ReadyToCelebrate,
        },
      },
      individualGoals: [],
    });
    vi.mocked(markFamilyGoalCelebrated).mockResolvedValueOnce({
      id: "family-goal",
      title: "Fill the family helper path",
      targetCount: 20,
      currentProgress: 20,
      unitLabel: "helpful actions",
      celebration: {
        title: "Movie night",
        status: FamilyCelebrationStatus.Celebrated,
        celebratedUtc: "2026-06-21T10:00:00Z",
      },
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Celebration surface")).not.toBeNull();
    expect(screen.getByText("We did it — ready to celebrate")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Mark celebrated" }));

    expect(markFamilyGoalCelebrated).toHaveBeenCalledWith("family-goal");
    expect(await screen.findByText("Celebrated together")).not.toBeNull();
    expect(screen.getAllByText("Movie night").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("Celebration memories")).not.toBeNull();
  });

  it("does not render reward economy or competitive wording", async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(screen.queryByText(/shop/i)).toBeNull();
    expect(screen.queryByText(/^gems?$/i)).toBeNull();
    expect(screen.queryByText(/leaderboard/i)).toBeNull();
    expect(screen.queryByText(/balance/i)).toBeNull();
  });

  it("renders an actionable empty state that creates the first family goal", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });
    vi.mocked(createFamilyGoal).mockResolvedValueOnce({
      id: "new-family-goal",
      title: "Complete 10 helpful tasks",
      targetCount: 10,
      currentProgress: 0,
      unitLabel: "helpful tasks",
      celebration: {
        title: "Movie night together",
        status: FamilyCelebrationStatus.Planned,
      },
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("No family goal yet.")).not.toBeNull();
    expect(screen.getByText("Create one shared goal.")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Create family goal" }),
    );
    expect(screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled")).toBe(true);
    await user.type(
      screen.getByLabelText("Family goal title"),
      "Complete 10 helpful tasks",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(screen.getByLabelText("Target count"));
    await user.type(screen.getByLabelText("Target count"), "10");
    await user.clear(screen.getByLabelText("Progress label"));
    await user.type(screen.getByLabelText("Progress label"), "helpful tasks");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(
      screen.getByLabelText("Family celebration title, optional"),
      "Movie night together",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Family goal review")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    expect(vi.mocked(createFamilyGoal)).toHaveBeenCalledWith({
      title: "Complete 10 helpful tasks",
      targetCount: 10,
      unitLabel: "helpful tasks",
      celebrationTitle: "Movie night together",
      celebrationDescription: undefined,
    });
    expect(await screen.findByText("Complete 10 helpful tasks")).not.toBeNull();
    expect(screen.getByText("0/10")).not.toBeNull();
  });

  it("edits the active family goal without introducing reward economy concepts", async () => {
    const user = userEvent.setup();
    vi.mocked(updateFamilyGoal).mockResolvedValueOnce({
      id: "family-goal",
      title: "Complete 15 helpful household tasks",
      targetCount: 15,
      currentProgress: 13,
      unitLabel: "helpful tasks",
      celebration: undefined,
    });

    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Edit family goal" }));
    expect((screen.getByLabelText("Family goal title") as HTMLInputElement).value).toBe(
      "Fill the family helper path",
    );
    await user.clear(screen.getByLabelText("Family goal title"));
    await user.type(
      screen.getByLabelText("Family goal title"),
      "Complete 15 helpful household tasks",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect((screen.getByLabelText("Target count") as HTMLInputElement).value).toBe("20");
    await user.clear(screen.getByLabelText("Target count"));
    await user.type(screen.getByLabelText("Target count"), "15");
    await user.clear(screen.getByLabelText("Progress label"));
    await user.type(screen.getByLabelText("Progress label"), "helpful tasks");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(
      screen.getByLabelText("Family celebration title, optional"),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save goal" }));

    expect(vi.mocked(updateFamilyGoal)).toHaveBeenCalledWith("family-goal", {
      title: "Complete 15 helpful household tasks",
      targetCount: 15,
      unitLabel: "helpful tasks",
      celebrationTitle: undefined,
      celebrationDescription: undefined,
    });
    expect(
      await screen.findByText("Complete 15 helpful household tasks"),
    ).not.toBeNull();
    expect(screen.getByText("13/15")).not.toBeNull();
    expect(
      screen.queryByText(/coins?|tokens?|shop|leaderboard|negative points/i),
    ).toBeNull();
  });


  it("validates required title and numeric target in the family goal conversation", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("No family goal yet.");
    await user.click(screen.getByRole("button", { name: "Create family goal" }));
    expect(screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByLabelText("Family goal title"), "Try a family reset");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(screen.getByLabelText("Target count"));
    await user.type(screen.getByLabelText("Target count"), "0");
    expect(screen.getByText("Use a target from 1 to 999 and a progress label.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled")).toBe(true);
    expect(createFamilyGoal).not.toHaveBeenCalled();
  });

  it("allows creating a family goal while skipping the optional celebration", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });
    vi.mocked(createFamilyGoal).mockResolvedValueOnce({
      id: "skip-celebration-goal",
      title: "Clear the landing zone",
      targetCount: 5,
      currentProgress: 0,
      unitLabel: "quick resets",
      celebration: undefined,
    });

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("No family goal yet.");
    await user.click(screen.getByRole("button", { name: "Create family goal" }));
    await user.type(screen.getByLabelText("Family goal title"), "Clear the landing zone");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(screen.getByLabelText("Target count"));
    await user.type(screen.getByLabelText("Target count"), "5");
    await user.clear(screen.getByLabelText("Progress label"));
    await user.type(screen.getByLabelText("Progress label"), "quick resets");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("No celebration yet — we can add one later.")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    expect(createFamilyGoal).toHaveBeenCalledWith({
      title: "Clear the landing zone",
      targetCount: 5,
      unitLabel: "quick resets",
      celebrationTitle: undefined,
      celebrationDescription: undefined,
    });
  });

  it("closes the family goal dialog with Escape without saving", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("Fill the family helper path");
    await user.click(screen.getByRole("button", { name: "Edit family goal" }));
    expect(screen.getByRole("dialog", { name: "Edit family goal" })).not.toBeNull();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Edit family goal" })).toBeNull();
    expect(updateFamilyGoal).not.toHaveBeenCalled();
    expect(screen.getByText("Fill the family helper path")).not.toBeNull();
  });

  it("creates a personal goal for a family member", async () => {
    const user = userEvent.setup();
    vi.mocked(createIndividualGoal).mockResolvedValueOnce({
      id: "read-goal",
      familyMemberId: "alex",
      familyMemberName: "Alex",
      title: "Read books",
      targetCount: 4,
      currentProgress: 0,
      unitLabel: "books",
      visualKind: "stars",
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("Personal goals this week")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Add personal goal" }));
    const createForm = screen.getByLabelText("Create individual goal form");
    await user.selectOptions(
      within(createForm).getByLabelText("Family member"),
      "alex",
    );
    await user.type(
      within(createForm).getByLabelText("Goal title"),
      "Read books",
    );
    await user.clear(within(createForm).getByLabelText("Target count"));
    await user.type(within(createForm).getByLabelText("Target count"), "4");
    await user.clear(within(createForm).getByLabelText("Unit label"));
    await user.type(within(createForm).getByLabelText("Unit label"), "books");
    await user.click(
      screen.getByRole("button", { name: "Save personal goal" }),
    );

    expect(createIndividualGoal).toHaveBeenCalledWith({
      familyMemberId: "alex",
      title: "Read books",
      targetCount: 4,
      unitLabel: "books",
    });
    expect(await screen.findByText("Read books")).not.toBeNull();
  });

  it("edits a personal goal and preserves returned progress", async () => {
    const user = userEvent.setup();
    vi.mocked(updateIndividualGoal).mockResolvedValueOnce({
      id: "alex-goal",
      familyMemberId: "sam",
      familyMemberName: "Sam",
      title: "Bedtime routine",
      targetCount: 2,
      currentProgress: 2,
      unitLabel: "nights",
      visualKind: "stars",
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("Finish morning routine")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Manage personal goals" }),
    );
    const alexCard = screen
      .getByText("Finish morning routine")
      .closest("article")!;
    await user.click(within(alexCard).getByRole("button", { name: "Edit" }));
    const editForm = screen.getByLabelText("Edit individual goal form");
    await user.selectOptions(
      within(editForm).getByLabelText("Family member"),
      "sam",
    );
    await user.clear(within(editForm).getByLabelText("Goal title"));
    await user.type(
      within(editForm).getByLabelText("Goal title"),
      "Bedtime routine",
    );
    await user.clear(within(editForm).getByLabelText("Target count"));
    await user.type(within(editForm).getByLabelText("Target count"), "2");
    await user.clear(within(editForm).getByLabelText("Unit label"));
    await user.type(within(editForm).getByLabelText("Unit label"), "nights");
    await user.click(
      screen.getByRole("button", { name: "Save personal goal" }),
    );

    expect(updateIndividualGoal).toHaveBeenCalledWith("alex-goal", {
      familyMemberId: "sam",
      title: "Bedtime routine",
      targetCount: 2,
      unitLabel: "nights",
    });
    expect(await screen.findByText("Bedtime routine")).not.toBeNull();
    expect(screen.getByLabelText("2 of 2 nights")).not.toBeNull();
  });

  it("retires a personal goal from active motivation display", async () => {
    const user = userEvent.setup();
    vi.mocked(archiveIndividualGoal).mockResolvedValueOnce(undefined);

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("Finish morning routine")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Manage personal goals" }),
    );
    const alexCard = screen
      .getByText("Finish morning routine")
      .closest("article")!;
    await user.click(within(alexCard).getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Retire goal" }));

    expect(archiveIndividualGoal).toHaveBeenCalledWith("alex-goal");
    expect(screen.queryByText("Finish morning routine")).toBeNull();
    expect(screen.getByText("Help with dinner")).not.toBeNull();
  });

  it("keeps detail workflows behind progressive disclosure", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Manage personal goals" }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Manage personal goals" }),
    );
    expect(
      screen.getAllByRole("button", { name: "Edit" }).length,
    ).toBeGreaterThan(0);
  });

  it("opens Motivation detail access for memories and helpful moments", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Celebration memories")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "View memory history" }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "View memory history" }),
    );
    expect(
      screen.getByRole("button", { name: "Show recent memory" }),
    ).not.toBeNull();

    expect(
      await screen.findByLabelText("Things My Family Appreciates"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Add appreciation" }));
    expect(screen.getByLabelText("Create helpful moment")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "View all appreciation" }),
    ).not.toBeNull();
  });
});
