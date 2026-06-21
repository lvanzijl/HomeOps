import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyMemberPage } from "./FamilyMemberPage";
import { familyMembers } from "./familyMembers";
import { loadMotivationSnapshot } from "../motivationData";
import { loadHelpfulMoments } from "../helpfulMomentsData";

vi.mock("../motivationData", async () => {
  const actual =
    await vi.importActual<typeof import("../motivationData")>(
      "../motivationData",
    );
  return { ...actual, loadMotivationSnapshot: vi.fn() };
});

vi.mock("../helpfulMomentsData", async () => {
  const actual = await vi.importActual<typeof import("../helpfulMomentsData")>(
    "../helpfulMomentsData",
  );
  return { ...actual, loadHelpfulMoments: vi.fn() };
});

afterEach(cleanup);

describe("FamilyMemberPage", () => {
  beforeEach(() => {
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 13,
        unitLabel: "helpful steps",
        celebration: {
          title: "Board game night",
          description: "A cozy game after teamwork.",
          status: 0,
        },
      },
      individualGoals: [
        {
          id: "riley-goal",
          familyMemberId: "riley",
          familyMemberName: "Riley",
          title: "Read before bed",
          targetCount: 5,
          currentProgress: 3,
          unitLabel: "stars",
          visualKind: "stars",
        },
        {
          id: "jordan-goal",
          familyMemberId: "jordan",
          familyMemberName: "Jordan",
          title: "Brush teeth",
          targetCount: 4,
          currentProgress: 2,
          unitLabel: "checks",
          visualKind: "stars",
        },
      ],
    });
    vi.mocked(loadHelpfulMoments).mockResolvedValue([
      {
        id: "moment-1",
        householdId: "household",
        familyMemberId: "riley",
        familyMemberName: "Riley",
        familyMemberDisplayColor: "#bbf7d0",
        familyMemberInitials: "R",
        title: "Helped set the table",
        description: "Noticed dinner was almost ready and jumped in.",
        recognitionTag: "Initiative",
        createdUtc: "2026-06-20T12:00:00Z",
      },
    ]);
  });

  it("renders member management details and avatar configuration", () => {
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Alex family member page")).not.toBeNull();
    expect(screen.getByText("Edit member")).not.toBeNull();
    expect(screen.getAllByText("Date of birth").length).toBeGreaterThan(0);
    expect(screen.getByText("Current avatar configuration")).not.toBeNull();
  });

  it("renders child progress with family and individual goals", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Riley Child Mode")).not.toBeNull();
    expect(screen.getByLabelText("Child hero area")).not.toBeNull();
    expect(screen.getByLabelText("Who I am")).not.toBeNull();
    expect(screen.getByLabelText("Current goal and progress")).not.toBeNull();
    expect(screen.getByLabelText("How I am helping my family")).not.toBeNull();
    expect(await screen.findByLabelText("Hero celebration")).not.toBeNull();
    expect(screen.getByText("This is me")).not.toBeNull();
    expect(screen.getByText("What I am working on")).not.toBeNull();
    expect(screen.getByText("How I am helping")).not.toBeNull();
    expect(screen.getByText("My Place In The Family")).not.toBeNull();
    expect(screen.getByText("How am I doing?")).not.toBeNull();
    expect(
      (await screen.findAllByText("Fill the family helper path")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Read before bed").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByLabelText("Family celebration")).not.toBeNull();
    expect(screen.getAllByText("Board game night").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/2 stars to go/).length).toBeGreaterThan(
      0,
    );
    expect(await screen.findByText("Helped set the table")).not.toBeNull();
    expect(screen.getByText("Initiative")).not.toBeNull();
    expect(screen.queryByText(/Gems|Shop|Leaderboard|balance/i)).toBeNull();
  });

  it("uses simpler visual language for younger children", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[3]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText("Stars to collect")).not.toBeNull();
    expect((await screen.findAllByText(/Brush teeth/)).length).toBeGreaterThan(
      0,
    );
  });

  it("uses richer progress language for school-age children", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText("Progress I am making")).not.toBeNull();
    expect(screen.getByLabelText("Hero progress")).not.toBeNull();
    expect(
      screen.getByLabelText("Progress for Read before bed"),
    ).not.toBeNull();
  });

  it("opens Parent Mode for child administration without making it the landing content", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Riley Child Mode")).not.toBeNull();
    expect(screen.queryByLabelText("Parent administration")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Parent Mode" }));

    expect(screen.getByLabelText("Parent administration")).not.toBeNull();
    expect(screen.getByText("Edit member")).not.toBeNull();
    expect(screen.getByText("Current avatar configuration")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Edit avatar" })).not.toBeNull();
  });

  it("keeps child-first ordering before Parent Mode controls", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      (await screen.findAllByText("Fill the family helper path")).length,
    ).toBeGreaterThan(0);
    const pageText = document.body.textContent ?? "";
    expect(pageText.indexOf("This is me")).toBeLessThan(
      pageText.indexOf("Helping the family goal"),
    );
    expect(pageText.indexOf("What I am working on")).toBeLessThan(
      pageText.indexOf("Helping the family goal"),
    );
    expect(pageText.indexOf("How am I doing?")).toBeLessThan(
      pageText.indexOf("Parent Mode"),
    );
    expect(pageText.indexOf("Fill the family helper path")).toBeLessThan(
      pageText.indexOf("Parent Mode"),
    );
    expect(pageText).not.toContain("Edit member");
  });

  it("edits member details and requires child date of birth", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Alex Parent");
    await user.selectOptions(screen.getByLabelText("Member type"), "child");
    await user.click(screen.getByRole("button", { name: "Save details" }));
    expect(
      screen.getByText("Date of birth is required for children."),
    ).not.toBeNull();

    await user.type(screen.getByLabelText("Date of birth"), "2015-05-06");
    await user.click(screen.getByRole("button", { name: "Save details" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alex Parent",
        memberKind: "child",
        dateOfBirth: "2015-05-06",
      }),
    );
  });

  it("confirms removal before notifying the shell", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove member" }));
    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "alex" }),
    );
  });

  it("owns avatar editing with live editor controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit avatar" }));

    expect(
      screen.getByRole("dialog", {
        name: "Alex household member avatar editor",
      }),
    ).not.toBeNull();
    await user.selectOptions(screen.getByLabelText("Hair style"), "curly");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "alex",
        avatar: expect.objectContaining({ hairStyle: "curly" }),
      }),
    );
  });
});
