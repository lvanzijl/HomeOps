import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const taskTitle = "Zwemtas klaarzetten";

test("fresh install completes atomically and stays completed after refresh", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Welkom bij FamilyBoard" })).toBeVisible();
  await page.getByRole("button", { name: "Installatie starten" }).click();
  const adultForm = page.getByRole("form", { name: "Volwassene toevoegen" });
  await adultForm.getByLabel("Naam").fill("Alex");
  await adultForm.getByRole("button", { name: "Volwassene toevoegen" }).click();
  await page.getByRole("button", { name: "Doorgaan" }).click();
  await page.getByRole("button", { name: "Gezin controleren" }).click();
  await page.getByRole("button", { name: "Doorgaan" }).click();

  const completionResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname === "/api/onboarding/complete");
  await page.getByRole("button", { name: "Afronden en Thuis openen" }).click();
  expect((await completionResponse).ok()).toBe(true);
  await expect(page.getByLabel("Dagelijkse gezinsplekken")).toBeVisible();
  const checklist = page.getByRole("dialog", { name: "Volgende stappen voor je huishouden" });
  await expect(checklist).toBeVisible();
  await expect(checklist.getByText("Weerlocatie")).toBeVisible();
  await expect(checklist.getByText("Woning en Home Assistant")).toBeVisible();
  await expectNoDocumentScroll(page, "Setup checklist at 1366x768");

  const dismissalResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname === "/api/onboarding/setup-checklist/dismiss");
  await checklist.getByRole("button", { name: "Nu niet, naar Thuis" }).click();
  expect((await dismissalResponse).ok()).toBe(true);
  await expect(checklist).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Welkom bij FamilyBoard" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Volgende stappen voor je huishouden" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Alex gezinslidpagina openen" })).toBeVisible();
});

test("family-member avatar and profile saves survive refresh", async ({ page, request }) => {
  await resetFixture(request, "visual-marketing-family");
  await page.goto("/");
  await page.getByRole("button", { name: "Dad gezinslidpagina openen" }).click();
  await page.getByRole("button", { name: "Avatar bewerken" }).first().click();
  const avatarChoices = page.getByLabel("Avatarkeuzes voor Dad");
  await page
    .getByLabel("Avatarkeuzes voor Dad navigatie")
    .getByText("Accessoires")
    .click();
  const bow = avatarChoices.getByRole("button", { name: /Strik accessoire/i });
  await bow.click();

  const saveResponse = page.waitForResponse((response) =>
    response.request().method() === "PUT"
      && new URL(response.url()).pathname.startsWith("/api/family-members/"));
  await page.getByRole("button", { name: "Opslaan", exact: true }).click();
  expect((await saveResponse).ok()).toBe(true);

  await page.reload();
  await page.getByRole("button", { name: "Dad gezinslidpagina openen" }).click();
  await page.getByRole("button", { name: "Avatar bewerken" }).first().click();
  await page
    .getByLabel("Avatarkeuzes voor Dad navigatie")
    .getByText("Accessoires")
    .click();
  await expect(
    page.getByLabel("Avatarkeuzes voor Dad").getByRole("button", { name: /Strik accessoire/i }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Avatarbewerker sluiten" }).click();
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Instellingen voor Dad" });
  await settings.getByLabel("Name").fill("Dad Persisted");
  const profileSaveResponse = page.waitForResponse((response) =>
    response.request().method() === "PUT"
      && new URL(response.url()).pathname.startsWith("/api/family-members/"));
  await settings.getByRole("button", { name: "Gegevens opslaan" }).click();
  expect((await profileSaveResponse).ok()).toBe(true);
  await expect(settings.getByRole("status")).toContainText("Gegevens opgeslagen.");

  await page.reload();
  await page.getByRole("button", { name: "Dad Persisted gezinslidpagina openen" }).click();
  await expect(page.getByRole("heading", { name: "Dad Persisted", level: 1 })).toBeVisible();
});

test("empty-roster family administration can add, remove, and restore across refresh", async ({ page, request }) => {
  await resetFixture(request, "visual-marketing-family");
  const membersResponse = await request.get("/api/family-members");
  expect(membersResponse.ok(), await membersResponse.text()).toBe(true);
  const members = await membersResponse.json() as { id: string }[];
  for (const member of members) {
    const deleteResponse = await request.delete(`/api/family-members/${encodeURIComponent(member.id)}`);
    expect(deleteResponse.ok(), await deleteResponse.text()).toBe(true);
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welkom bij FamilyBoard" })).toHaveCount(0);
  await openFamilyAdministration(page);
  await expect(page.getByText("Er zijn nog geen actieve gezinsleden. Voeg iemand toe om te beginnen.")).toBeVisible();

  await page.getByRole("button", { name: "Gezinslid toevoegen" }).click();
  const addForm = page.getByLabel("Gezinslid toevoegen");
  await addForm.getByLabel("Naam").fill("Taylor");
  const createResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname === "/api/family-members");
  await addForm.getByRole("button", { name: "Gezinslid toevoegen" }).click();
  expect((await createResponse).ok()).toBe(true);
  await expect(page.getByRole("list", { name: "Actieve gezinsleden" }).getByText("Taylor")).toBeVisible();

  const activeMembers = page.getByRole("list", { name: "Actieve gezinsleden" });
  await activeMembers.getByRole("button", { name: "Verwijderen" }).click();
  const confirmation = page.getByLabel("Gezinslid verwijderen");
  await expect(confirmation).toContainText("verwijzingen blijven behouden");
  const removeResponse = page.waitForResponse((response) =>
    response.request().method() === "DELETE"
      && new URL(response.url()).pathname.startsWith("/api/family-members/"));
  await confirmation.getByRole("button", { name: "Verwijderen bevestigen" }).click();
  expect((await removeResponse).ok()).toBe(true);

  await page.reload();
  await openFamilyAdministration(page);
  const removedMembers = page.getByRole("list", { name: "Verwijderde gezinsleden" });
  const removedTaylor = removedMembers.locator("article").filter({ hasText: "Taylor" });
  await expect(removedTaylor).toBeVisible();
  const restoreResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname.endsWith("/restore"));
  await removedTaylor.getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);

  await page.reload();
  await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Thuis", exact: true }).click();
  await expect(page.getByRole("button", { name: "Taylor gezinslidpagina openen" })).toBeVisible();
});

test("Home Today event stays on the household-local day", async ({ page, request }) => {
  await resetFixture(request, "visual-marketing-home");
  await page.goto("/");

  const title = `E2E vandaag ${Date.now()}`;
  await page.getByRole("button", { name: "Afspraak toevoegen" }).click();
  await page.getByLabel("Wat gebeurt er?").fill(title);
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Vandaag", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`${title} toegevoegd aan Agenda`);

  await page.reload();
  const today = page.getByRole("region", { name: "Vandaag" });
  await expect(today.getByText(title)).toBeVisible();
});

test("task controls are direct, keyboard operable, and unclipped at 1280x720", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  await test.step("Details", async () => {
    const card = await openTaskCard(page, request);
    const details = card.getByRole("button", { name: `Details van ${taskTitle} openen` });
    await expectRealHitTarget(details);
    await details.click();
    await expect(page.getByRole("dialog", { name: "Taak aanpassen" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await test.step("Complete", async () => {
    const card = await openTaskCard(page, request);
    const complete = card.getByRole("button", { name: `Klaar: ${taskTitle}` });
    await expectRealHitTarget(complete);
    const completionResponse = page.waitForResponse((response) =>
      response.request().method() === "POST"
        && new URL(response.url()).pathname.endsWith("/complete"));
    await complete.click();
    expect((await completionResponse).ok()).toBe(true);
    await expect(card).toHaveCount(0);
  });

  await test.step("Tomorrow", async () => {
    const card = await openTaskCard(page, request);
    const tomorrow = card.getByRole("button", { name: `Morgen plannen: ${taskTitle}` });
    await expectRealHitTarget(tomorrow);
    await tomorrow.click();
    await expect(card).toHaveCount(0);
  });

  await test.step("Edit", async () => {
    const card = await openTaskCard(page, request);
    const more = card.getByRole("button", { name: `Meer acties voor ${taskTitle}` });
    await expectRealHitTarget(more);
    await more.click();
    const menu = page.getByRole("menu", { name: `Meer acties voor ${taskTitle}` });
    await expect(menu).toBeVisible();
    await expectWithinViewport(menu, { width: 1280, height: 720 });
    const edit = menu.getByRole("menuitem", { name: `Aanpassen: ${taskTitle}` });
    await expectRealHitTarget(edit);
    await edit.click();
    await expect(page.getByRole("dialog", { name: "Taak aanpassen" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await test.step("Keyboard, outside click, and page containment", async () => {
    const card = await openTaskCard(page, request);
    const more = card.getByRole("button", { name: `Meer acties voor ${taskTitle}` });
    await more.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: `Meer acties voor ${taskTitle}` });
    const edit = menu.getByRole("menuitem", { name: `Aanpassen: ${taskTitle}` });
    await expect(edit).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(more).toBeFocused();

    await page.keyboard.press("Space");
    await expect(page.getByRole("menu", { name: `Meer acties voor ${taskTitle}` })).toBeVisible();
    await page.getByRole("heading", { name: "Taken voor het gezin" }).click();
    await expect(page.getByRole("menu", { name: `Meer acties voor ${taskTitle}` })).toHaveCount(0);
    await expectNoDocumentOverflow(page, "Tasks controls at 1280x720");
  });
});

test("normal tasks archive reversibly and delete only after archive confirmation", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await resetFixture(request, "visual-marketing-tasks");
  await page.goto("/");
  await page.getByRole("button", { name: "Taken", exact: true }).click();

  const taskCard = () => page.locator(".operational-task-card").filter({ hasText: taskTitle }).first();
  const archiveFromCard = async () => {
    const card = taskCard();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: `Meer acties voor ${taskTitle}` }).click();
    const menu = page.getByRole("menu", { name: `Meer acties voor ${taskTitle}` });
    await expect(menu).toBeVisible();
    const archiveAction = menu.getByRole("menuitem", { name: `Archiveren: ${taskTitle}` });
    await expect(archiveAction).toBeVisible();
    const archiveResponse = page.waitForResponse((response) =>
      response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/archive"));
    await archiveAction.click();
    expect((await archiveResponse).ok()).toBe(true);
    await expect(card).toHaveCount(0);
  };

  await archiveFromCard();
  await page.getByRole("button", { name: /Archief/ }).click();
  const archiveDialog = page.getByRole("dialog", { name: "Archief" });
  await expect(archiveDialog.getByText(taskTitle)).toBeVisible();
  await expectNoDocumentOverflow(page, "Task archive at 1280x720");

  const restoreResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/restore"));
  const restoredTasksReload = page.waitForResponse((response) =>
    response.request().method() === "GET" && new URL(response.url()).pathname === "/api/tasks");
  const restoredArchiveReload = page.waitForResponse((response) =>
    response.request().method() === "GET" && new URL(response.url()).pathname === "/api/tasks/archived");
  await archiveDialog.getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);
  expect((await restoredTasksReload).ok()).toBe(true);
  expect((await restoredArchiveReload).ok()).toBe(true);
  await expect(archiveDialog.getByText("Het archief is leeg.")).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Sluiten" }).click();
  await expect(taskCard()).toBeVisible();

  await archiveFromCard();
  await page.getByRole("button", { name: /Archief/ }).click();
  await archiveDialog.getByRole("button", { name: "Permanent verwijderen" }).click();
  await expect(archiveDialog.getByText("Deze taak verdwijnt permanent. Dit kan niet ongedaan worden gemaakt.")).toBeVisible();
  await expectNoDocumentOverflow(page, "Task permanent-delete confirmation at 1280x720");
  await archiveDialog.getByRole("button", { name: "Annuleren" }).click();
  await expect(archiveDialog.getByText(taskTitle)).toBeVisible();

  await archiveDialog.getByRole("button", { name: "Permanent verwijderen" }).click();
  const deleteResponse = page.waitForResponse((response) =>
    response.request().method() === "DELETE" && new URL(response.url()).pathname.startsWith("/api/tasks/"));
  await archiveDialog.getByRole("button", { name: "Definitief verwijderen" }).click();
  expect((await deleteResponse).ok()).toBe(true);
  await expect(archiveDialog.getByText("Het archief is leeg.")).toBeVisible();
});

test("routines use an ordered editor and bounded archive lifecycle", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await resetFixture(request, "visual-marketing-tasks");
  await page.goto("/");
  await page.getByRole("button", { name: "Taken", exact: true }).click();
  await page.getByRole("button", { name: /Routines/ }).click();
  const routinesDialog = page.getByRole("dialog", { name: "Routines" });

  await routinesDialog.getByRole("button", { name: "Nieuwe routine" }).click();
  const createEditor = routinesDialog.getByRole("form", { name: "Nieuwe routine maken" });
  await createEditor.getByLabel("Routinenaam").fill("E2E schoolstart");
  await createEditor.getByLabel("Beschrijving").fill("Voor school");
  await createEditor.getByLabel("Titel stap 1").fill("Drinkbeker vullen");
  await createEditor.getByRole("button", { name: "Stap toevoegen" }).click();
  await createEditor.getByLabel("Titel stap 2").fill("Schooltas controleren");
  await createEditor.getByLabel("Herhaling stap 2").selectOption("Weekly");
  await createEditor.getByRole("button", { name: "Stap 2 omhoog" }).click();
  await expectNoDocumentOverflow(page, "Routine editor at 1280x720");
  const createResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/task-templates");
  await createEditor.getByRole("button", { name: "Routine maken" }).click();
  expect((await createResponse).ok()).toBe(true);

  const routineRow = () => routinesDialog.locator(".task-routine-list-item").filter({ hasText: "E2E schoolstart" });
  await expect(routineRow()).toBeVisible();
  await routineRow().getByRole("button", { name: "Aanpassen" }).click();
  const editEditor = routinesDialog.getByRole("form", { name: "Routine E2E schoolstart aanpassen" });
  await expect(editEditor.getByLabel("Titel stap 1")).toHaveValue("Schooltas controleren");
  await expect(editEditor.getByLabel("Titel stap 2")).toHaveValue("Drinkbeker vullen");
  await editEditor.getByLabel("Titel stap 1").fill("Schooltas en fruit controleren");
  const updateResponse = page.waitForResponse((response) =>
    response.request().method() === "PUT" && new URL(response.url()).pathname.startsWith("/api/task-templates/"));
  await editEditor.getByRole("button", { name: "Routine opslaan" }).click();
  expect((await updateResponse).ok()).toBe(true);

  const archiveResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/archive"));
  await routineRow().getByRole("button", { name: "Archiveren" }).click();
  expect((await archiveResponse).ok()).toBe(true);
  await routinesDialog.getByRole("tab", { name: "Archief (1)" }).click();
  await expect(routineRow()).toBeVisible();
  const restoreResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/restore"));
  await routineRow().getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);
  await expect(routinesDialog.getByText("Het routinearchief is leeg.")).toBeVisible();

  await routinesDialog.getByRole("tab", { name: /Actief/ }).click();
  await expect(routineRow()).toBeVisible();
  await routineRow().getByRole("button", { name: "Archiveren" }).click();
  await routinesDialog.getByRole("tab", { name: "Archief (1)" }).click();
  await routineRow().getByRole("button", { name: "Permanent verwijderen" }).click();
  await expect(routinesDialog.getByText("De routine en haar stappen verdwijnen permanent. Eerder aangemaakte taken blijven bestaan.")).toBeVisible();
  await expectNoDocumentOverflow(page, "Routine delete confirmation at 1280x720");
  await routinesDialog.getByRole("button", { name: "Annuleren" }).click();
  await expect(routineRow()).toBeVisible();

  await routineRow().getByRole("button", { name: "Permanent verwijderen" }).click();
  const deleteResponse = page.waitForResponse((response) =>
    response.request().method() === "DELETE" && new URL(response.url()).pathname.startsWith("/api/task-templates/"));
  await routinesDialog.getByRole("button", { name: "Definitief verwijderen" }).click();
  expect((await deleteResponse).ok()).toBe(true);
  await expect(routinesDialog.getByText("Het routinearchief is leeg.")).toBeVisible();
});

test("recurring tasks require explicit occurrence scope and destructive confirmation", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await resetFixture(request, "visual-marketing-tasks");
  const title = `E2E terugkeer ${Date.now()}`;
  const dueDate = new Date().toISOString().slice(0, 10);
  const createResponse = await request.post("/api/tasks", {
    data: { title, dueDate, ownershipKind: "Unassigned", familyMemberId: null, recurrenceFrequency: "Weekly" },
  });
  expect(createResponse.ok(), await createResponse.text()).toBe(true);

  await page.goto("/");
  await page.getByRole("button", { name: "Taken", exact: true }).click();
  await page.locator(".task-summary-link").filter({ hasText: "Later" }).click();
  const card = () => page.locator(".operational-task-card").filter({ hasText: title }).first();
  await expect(card()).toBeVisible();
  await card().getByRole("button", { name: `Details van ${title} openen` }).click();
  const editor = page.getByRole("dialog", { name: "Taak aanpassen" });
  await editor.getByLabel("Wat moet er gebeuren?").fill(`${title} aangepast`);
  await editor.getByRole("button", { name: "Verder" }).click();
  await editor.getByRole("button", { name: "Verder" }).click();
  await editor.getByRole("button", { name: "Verder" }).click();
  await page.evaluate(() => {
    const form = document.querySelector<HTMLElement>('[aria-label="Taak aanpassen"] form') as HTMLFormElement | null;
    form?.requestSubmit();
  });

  const editScope = page.getByRole("dialog", { name: "Welke taken aanpassen?" });
  await expect(editScope.getByRole("radio", { name: /Alleen deze taak/ })).toBeChecked();
  await expectNoDocumentOverflow(page, "Recurring edit scope at 1280x720");
  const updateResponse = page.waitForResponse((response) =>
    response.request().method() === "PUT" && new URL(response.url()).pathname.startsWith("/api/tasks/"));
  await editScope.getByRole("button", { name: "Wijziging toepassen" }).click();
  const occurrenceUpdate = await updateResponse;
  expect(occurrenceUpdate.status()).toBe(200);

  const editedTitle = `${title} aangepast`;
  const editedCard = page.locator(".operational-task-card").filter({ hasText: editedTitle }).first();
  await expect(editedCard).toBeVisible();
  await editedCard.getByRole("button", { name: `Meer acties voor ${editedTitle}` }).click();
  await page.getByRole("menuitem", { name: `Herhaling beheren: ${editedTitle}` }).click();
  const deleteScope = page.getByRole("dialog", { name: "Welke taken verwijderen?" });
  const removeButton = deleteScope.getByRole("button", { name: "Verwijderen" });
  await expect(removeButton).toBeDisabled();
  await deleteScope.getByRole("radio", { name: /Hele reeks/ }).check();
  await deleteScope.getByLabel(/Ik begrijp dat/).check();
  await expectNoDocumentOverflow(page, "Recurring delete scope at 1280x720");
  const deleteResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/recurrence/delete"));
  await removeButton.click();
  expect((await deleteResponse).ok()).toBe(true);
  await expect(editedCard).toHaveCount(0);
});

test("weekly reset decisions resume after refresh and complete into read-only history", async ({ page, request }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await resetFixture(request, "visual-weekly-reset");

  const openWeeklyReset = async () => {
    await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Taken", exact: true }).click();
    await page.getByRole("button", { name: "Gezinsreset openen" }).click();
    await expect(page.getByRole("heading", { name: "Weekritueel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Kies bewust wat meegaat|Deze week is afgerond/ })).toBeVisible();
  };

  await page.goto("/");
  await openWeeklyReset();
  await expectNoDocumentScroll(page, "Open Weekly Reset at 1366x768");
  const progress = page.locator(".weekly-reset-progress");
  const total = await page.locator(".weekly-reset-candidate").count();
  expect(total).toBeGreaterThan(0);
  await expect(progress).toContainText(`0/${total}`);

  const firstDecisionResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname.includes("/api/weekly-reset/candidates/"));
  await page.locator(".weekly-reset-candidate").first().locator(".weekly-reset-candidate-actions button").first().click();
  expect((await firstDecisionResponse).ok()).toBe(true);
  await expect(progress).toContainText(`1/${total}`);

  await page.reload();
  await openWeeklyReset();
  await expect(progress).toContainText(`1/${total}`);

  while (await page.locator(".weekly-reset-candidate").count()) {
    const candidateCount = await page.locator(".weekly-reset-candidate").count();
    const decisionButton = page.locator(".weekly-reset-candidate").first().locator(".weekly-reset-candidate-actions button").first();
    await expect(decisionButton).toBeEnabled();
    const decisionResponse = page.waitForResponse((response) =>
      response.request().method() === "POST"
        && new URL(response.url()).pathname.includes("/api/weekly-reset/candidates/"));
    await decisionButton.click();
    expect((await decisionResponse).ok()).toBe(true);
    await expect(page.locator(".weekly-reset-candidate")).toHaveCount(candidateCount - 1);
  }

  const completeButton = page.getByRole("button", { name: "Week afronden" });
  await expect(completeButton).toBeEnabled();
  const completeResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
      && new URL(response.url()).pathname === "/api/weekly-reset/complete");
  await completeButton.click();
  expect((await completeResponse).ok()).toBe(true);
  await expect(page.getByText("Deze week is afgerond")).toBeVisible();
  await expect(page.getByText("Alleen-lezen", { exact: true })).toBeVisible();

  await page.reload();
  await openWeeklyReset();
  await expect(page.getByText("Deze week is afgerond")).toBeVisible();
  await page.getByRole("button", { name: "Eerdere weken" }).click();
  const history = page.getByRole("dialog", { name: "Eerdere weken" });
  await expect(history.getByText("Week afgerond")).toBeVisible();
  await expectNoDocumentScroll(page, "Weekly Reset history at 1366x768");
});

test("Woning supports stable summary and climate deep links with browser history", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  await seedWoningRuntime(request);
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.goto("/woning");
  await expect(page.getByRole("button", { name: "Woning", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Huisstatus" })).toBeVisible();
  await expectNoDocumentScroll(page, "Woning summary deep link at 1366x768");

  await page.getByRole("button", { name: "Klimaat bekijken" }).click();
  await expect(page).toHaveURL(/\/woning\/klimaat$/);
  await expect(page.getByRole("heading", { name: "Klimaat per verdieping en kamer" })).toBeVisible();
  await expect(page.getByText("Deze kamer is nog niet gekoppeld aan een klimaatbron.").first()).toBeVisible();
  await expect(page.getByText("De klimaatbron is niet beschikbaar.").first()).toBeVisible();
  await expectNoDocumentScroll(page, "Woning climate route at 1366x768");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Klimaat per verdieping en kamer" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/woning$/);
  await expect(page.getByRole("heading", { name: "Huisstatus" })).toBeVisible();
});

test("room climate settings create, validate, persist, edit, and disable", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  await seedWoningRuntime(request);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
  let woning = page.getByRole("dialog", { name: "Woning", exact: true });
  await expect(woning.getByText("Herstel een kamer voordat je de klimaatinstellingen kunt wijzigen.")).toBeVisible();

  const rooms = woning.getByRole("list", { name: "Kamers op geselecteerde verdieping" });
  const workRoom = rooms.locator("article").filter({ hasText: "Werkkamer" });
  await workRoom.getByRole("button", { name: "Klimaat instellen" }).click();
  let climateDialog = page.getByRole("dialog", { name: "Klimaatinstellingen voor Werkkamer" });
  await expectNoDocumentScroll(page, "New room climate settings at 1366x768");
  await climateDialog.getByRole("checkbox", { name: /Voorkeurstemperatuur instellen/ }).click();
  await climateDialog.getByLabel("Voorkeurstemperatuur minimum").fill("23");
  await climateDialog.getByLabel("Voorkeurstemperatuur maximum").fill("23");
  await expect(climateDialog.getByRole("alert")).toContainText("het minimum moet lager zijn dan het maximum");
  await expect(climateDialog.getByRole("button", { name: "Klimaat opslaan" })).toBeDisabled();
  await climateDialog.getByLabel("Voorkeurstemperatuur minimum").fill("19");
  await climateDialog.getByRole("checkbox", { name: /Voorkeursluchtvochtigheid instellen/ }).click();
  await climateDialog.getByLabel("Gewenste verwarmingsbediening").selectOption("2");
  await climateDialog.getByRole("button", { name: "Klimaat opslaan" }).click();
  await expect(climateDialog.getByRole("status")).toContainText("zijn opgeslagen");
  await climateDialog.getByRole("button", { name: "Sluiten" }).first().click();
  await expect(workRoom).toContainText("Tijdelijke bediening gewenst");

  const livingRoom = rooms.locator("article").filter({ hasText: "Woonkamer" });
  await livingRoom.getByRole("button", { name: "Klimaat bewerken" }).click();
  climateDialog = page.getByRole("dialog", { name: "Klimaatinstellingen voor Woonkamer" });
  await climateDialog.getByLabel("Voorkeurstemperatuur maximum").fill("23");
  await climateDialog.getByRole("button", { name: "Klimaat opslaan" }).click();
  await expect(climateDialog.getByRole("status")).toContainText("zijn opgeslagen");
  await climateDialog.getByRole("button", { name: "Sluiten" }).first().click();
  await woning.getByRole("button", { name: "Sluiten" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
  woning = page.getByRole("dialog", { name: "Woning", exact: true });
  const persistedLivingRoom = woning.getByRole("list", { name: "Kamers op geselecteerde verdieping" }).locator("article").filter({ hasText: "Woonkamer" });
  await persistedLivingRoom.getByRole("button", { name: "Klimaat bewerken" }).click();
  climateDialog = page.getByRole("dialog", { name: "Klimaatinstellingen voor Woonkamer" });
  await expect(climateDialog.getByLabel("Voorkeurstemperatuur maximum")).toHaveValue("23");
  await climateDialog.getByRole("checkbox", { name: /Klimaat voor deze kamer gebruiken/ }).click();
  await climateDialog.getByRole("button", { name: "Klimaat opslaan" }).click();
  await expect(climateDialog.getByRole("status")).toContainText("zijn opgeslagen");
  await climateDialog.getByRole("button", { name: "Sluiten" }).first().click();
  await expect(persistedLivingRoom).toContainText("Klimaat uitgeschakeld");
});

test("climate mappings create, edit, archive, and restore in the bounded workspace", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  const { configuredRoom } = await seedWoningRuntime(request);
  await ensureClimateProvider(request);
  const existingMappings = await request.get(`/api/rooms/${configuredRoom.id}/climate-mappings?includeArchived=true`);
  expect(existingMappings.ok(), await existingMappings.text()).toBe(true);
  for (const mapping of await existingMappings.json() as { id: string }[]) {
    const remove = await request.delete(`/api/climate-mappings/${mapping.id}`);
    expect(remove.ok(), await remove.text()).toBe(true);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
  const woning = page.getByRole("dialog", { name: "Woning", exact: true });
  const roomMappingCard = woning.locator(".ha-room").filter({ hasText: "Woonkamer" });
  await roomMappingCard.getByRole("button", { name: "Koppelingen beheren" }).click();
  const mappings = page.getByRole("dialog", { name: "Klimaatkoppelingen voor Woonkamer" });
  await expect(mappings).toBeVisible();
  await expectNoDocumentScroll(page, "Climate mappings at 1366x768");
  await expect(mappings.getByText("Deze werkruimte voert geen vrije Home Assistant-services uit.")).toBeVisible();
  await expect(mappings.getByLabel(/service/i)).toHaveCount(0);
  await expect(mappings.getByLabel(/json/i)).toHaveCount(0);

  await mappings.getByRole("button", { name: "Koppeling toevoegen" }).click();
  await mappings.getByLabel("Entiteits-ID").fill("sensor.e2e_woonkamer");
  await mappings.getByLabel("Weergavenaam (optioneel)").fill("E2E woonkamer temperatuur");
  const createResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/rooms/${configuredRoom.id}/climate-mappings`);
  await mappings.getByRole("button", { name: "Opslaan" }).click();
  expect((await createResponse).ok()).toBe(true);
  await expect(mappings.getByText("Prioriteit 0 · Ingeschakeld · Nog niet gecontroleerd")).toBeVisible();
  await expect(mappings.getByText("Geen extra veilige diagnose.")).toBeVisible();

  await mappings.getByRole("button", { name: "Bewerken" }).click();
  await mappings.getByRole("checkbox", { name: /Ingeschakeld/ }).uncheck();
  const updateResponse = page.waitForResponse((response) => response.request().method() === "PUT" && new URL(response.url()).pathname.startsWith("/api/climate-mappings/"));
  await mappings.getByRole("button", { name: "Opslaan" }).click();
  expect((await updateResponse).ok()).toBe(true);
  await expect(mappings.getByText("Prioriteit 0 · Uitgeschakeld · Nog niet gecontroleerd")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  const archiveResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/archive"));
  await mappings.getByRole("button", { name: "Archiveren" }).click();
  expect((await archiveResponse).ok()).toBe(true);
  await mappings.getByText("Gearchiveerd (1)").click();
  await expect(mappings.getByRole("button", { name: "Herstellen" })).toBeVisible();
  const restoreResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/restore"));
  await mappings.getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);
  await expect(mappings.getByText("Prioriteit 0 · Ingeschakeld · Controle nodig")).toBeVisible();
  await expectNoDocumentScroll(page, "Restored climate mapping at 1366x768");
});

test("Home Assistant credentials stay server-managed while provider archive and restore preserve mappings", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  const { configuredRoom } = await seedWoningRuntime(request);
  const provider = await ensureClimateProvider(request);
  const existingMappings = await request.get(`/api/rooms/${configuredRoom.id}/climate-mappings?includeArchived=true`);
  expect(existingMappings.ok(), await existingMappings.text()).toBe(true);
  for (const mapping of await existingMappings.json() as { id: string }[]) {
    const remove = await request.delete(`/api/climate-mappings/${mapping.id}`);
    expect(remove.ok(), await remove.text()).toBe(true);
  }
  const mappingResponse = await request.post(`/api/rooms/${configuredRoom.id}/climate-mappings`, {
    data: { providerId: provider.id, sourceRole: 0, source: { externalSourceId: "sensor.lifecycle_e2e", externalDisplayName: "Lifecycle sensor" }, priority: 0, isEnabled: true },
  });
  expect(mappingResponse.ok(), await mappingResponse.text()).toBe(true);
  const mapping = await mappingResponse.json() as { id: string };

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
  const woning = page.getByRole("dialog", { name: "Woning", exact: true });
  await woning.getByRole("button", { name: "Home Assistant beheren" }).click();
  let management = page.getByRole("dialog", { name: "Home Assistant beheren" });
  await expect(management).toBeVisible();
  await expect(management.getByText("HOMEASSISTANT__ACCESSTOKEN")).toBeVisible();
  await expect(management.locator('input[type="password"]')).toHaveCount(0);
  await expectNoDocumentScroll(page, "Home Assistant management at 1366x768");

  const testResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/climate-providers/${provider.id}/connection-test`);
  await management.getByRole("button", { name: "Verbinding testen" }).click();
  expect((await testResponse).ok()).toBe(true);
  await expect(management.locator(".ha-connection-result")).toBeVisible();
  await expect(management.locator(".ha-connection-result")).not.toContainText(/token|authorization|bearer/i);

  await management.getByRole("button", { name: "Archiveren" }).click();
  await expect(management.getByRole("heading", { name: new RegExp(`${provider.displayName} archiveren`) })).toBeVisible();
  const archiveConfirmation = management.getByLabel("Archiveren bevestigen");
  await expect(archiveConfirmation.getByText("Actieve koppelingen")).toBeVisible();
  await expect(archiveConfirmation.locator("dl")).toContainText("1");
  await management.getByRole("button", { name: "Terug" }).click();
  await expect(management.getByLabel("Providergegevens")).toBeVisible();
  await management.getByRole("button", { name: "Archiveren" }).click();
  const archiveResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/climate-providers/${provider.id}/archive`);
  await management.getByRole("button", { name: `${provider.displayName} archiveren` }).click();
  expect((await archiveResponse).ok()).toBe(true);
  await expect(management).toHaveCount(0);

  const archiveRow = woning.getByLabel("Gearchiveerde Home Assistant-providers").locator("article").filter({ hasText: provider.displayName });
  await expect(archiveRow.getByText("1 bewaarde koppelingen")).toBeVisible();
  const restoreResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/climate-providers/${provider.id}/restore`);
  await archiveRow.getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);
  await expect(woning.getByText(/is hersteld; controleer nu de verbinding/)).toBeVisible();

  const restoredMappingResponse = await request.get(`/api/climate-mappings/${mapping.id}`);
  expect(restoredMappingResponse.ok(), await restoredMappingResponse.text()).toBe(true);
  const restoredMapping = await restoredMappingResponse.json() as { health: number; lastCheckedUtc?: string };
  expect(restoredMapping.health).toBe(0);
  expect(restoredMapping.lastCheckedUtc).toBeFalsy();
});

test("floor-plan upload activates the first plan and enters cancellable replacement review", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  const floorName = `E2E upload ${Date.now()}`;
  const floorResponse = await request.post("/api/floors", { data: { name: floorName } });
  expect(floorResponse.ok(), await floorResponse.text()).toBe(true);
  const floor = await floorResponse.json() as { id: string };
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
  const woning = page.getByRole("dialog", { name: "Woning", exact: true });
  await woning.getByRole("button", { name: new RegExp(floorName) }).click();
  await woning.getByRole("button", { name: "Plattegrond uploaden" }).click();
  let upload = page.getByRole("dialog", { name: `Plattegrond uploaden voor ${floorName}` });
  await expect(upload).toBeVisible();
  await expectNoDocumentScroll(page, "Floor-plan upload entry at 1366x768");

  await upload.getByLabel("Plattegrondbestand").setInputFiles({ name: "geen-afbeelding.txt", mimeType: "text/plain", buffer: Buffer.from("geen afbeelding") });
  await expect(upload.getByRole("alert")).toContainText("SVG-, PNG-, JPG- of JPEG-bestand");
  await expect(upload.getByRole("button", { name: "Uploaden en controleren" })).toBeDisabled();

  const firstSvg = "<svg viewBox='0 0 120 80' xmlns='http://www.w3.org/2000/svg' onload='bad()'><script>bad()</script><rect width='120' height='80'/></svg>";
  await upload.getByLabel("Plattegrondbestand").setInputFiles({ name: "eerste.svg", mimeType: "image/svg+xml", buffer: Buffer.from(firstSvg) });
  const firstUploadResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/floors/${floor.id}/floor-plan-assets`);
  await upload.getByRole("button", { name: "Uploaden en controleren" }).click();
  expect((await firstUploadResponse).ok()).toBe(true);
  await expect(upload.getByAltText("Voorbeeld van eerste.svg")).toBeVisible();
  await expect(upload.getByRole("heading", { name: "Veilige afgeleide afbeelding" })).toBeVisible();
  await expectNoDocumentScroll(page, "Floor-plan derivative preview at 1366x768");

  const activateResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/activate"));
  await upload.getByRole("button", { name: "Plattegrond activeren" }).click();
  expect((await activateResponse).ok()).toBe(true);
  await expect(upload.getByText(/De eerste plattegrond is actief/)).toBeVisible();
  await upload.getByRole("button", { name: "Later afronden" }).click();
  await expect(woning.getByText(/eerste.svg is actief/)).toBeVisible();

  await woning.getByRole("button", { name: "Nieuwe plattegrond uploaden" }).click();
  upload = page.getByRole("dialog", { name: `Plattegrond uploaden voor ${floorName}` });
  const replacementSvg = "<svg viewBox='0 0 120 80' xmlns='http://www.w3.org/2000/svg'><rect width='120' height='80'/></svg>";
  await upload.getByLabel("Plattegrondbestand").setInputFiles({ name: "vervanging.svg", mimeType: "image/svg+xml", buffer: Buffer.from(replacementSvg) });
  await upload.getByRole("button", { name: "Uploaden en controleren" }).click();
  await expect(upload.getByAltText("Voorbeeld van vervanging.svg")).toBeVisible();
  const startResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/floors/${floor.id}/floor-plan-replacement-reviews`);
  await upload.getByRole("button", { name: "Verder naar vervangingscontrole" }).click();
  expect((await startResponse).ok()).toBe(true);
  await expect(woning.getByText(`Plattegrond vervangen · ${floorName}`)).toBeVisible();
  await expectNoDocumentScroll(page, "Floor-plan replacement review at 1366x768");

  await woning.getByRole("button", { name: "Beoordeling annuleren" }).click();
  const cancelDialog = page.getByRole("dialog", { name: "Beoordeling annuleren" });
  const cancelResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/cancel"));
  await cancelDialog.getByRole("button", { name: "Annuleren" }).last().click();
  expect((await cancelResponse).ok()).toBe(true);
  await woning.getByRole("button", { name: "Nieuwe plattegrond beoordelen" }).click();
  const retryDialog = page.getByRole("dialog", { name: "Beoordeling starten" });
  const retryResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/floors/${floor.id}/floor-plan-replacement-reviews`);
  await retryDialog.getByRole("button", { name: "Beoordeling starten" }).click();
  expect((await retryResponse).ok()).toBe(true);
  await expect(woning.getByText("Wordt beoordeeld")).toBeVisible();
});

test("household weather location persists coordinates and units in the bounded Settings dialog", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  const initialResponse = await request.put("/api/households/current/weather-location/", {
    data: {
      displayName: "Amsterdam thuis",
      latitude: 52.3676,
      longitude: 4.9041,
      unitSystem: 0,
    },
  });
  expect(initialResponse.ok(), await initialResponse.text()).toBe(true);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.getByRole("button", { name: "Weerlocatie" }).click();
  const dialog = page.getByRole("dialog", { name: "Weerlocatie" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Open-Meteo", { exact: true })).toBeVisible();
  await expectNoDocumentScroll(page, "Weerlocatie at 1366x768");
  await expectWithinViewport(dialog.getByRole("button", { name: "Locatie opslaan" }), { width: 1366, height: 768 });

  await dialog.getByLabel("Naam voor thuis").fill("Rotterdam thuis");
  await dialog.getByLabel("Breedtegraad").fill("51.9225");
  await dialog.getByLabel("Lengtegraad").fill("4.47917");
  await dialog.getByLabel("Eenheden").selectOption({ label: "Fahrenheit en mph" });
  const saveResponse = page.waitForResponse((response) =>
    response.request().method() === "PUT"
      && new URL(response.url()).pathname === "/api/households/current/weather-location");
  await dialog.getByRole("button", { name: "Locatie opslaan" }).click();
  expect((await saveResponse).ok()).toBe(true);
  await expect(dialog.getByRole("status")).toContainText("De weerlocatie is opgeslagen.");

  await page.getByRole("button", { name: "Weerlocatie sluiten" }).click();
  await page.getByRole("button", { name: "Weerlocatie" }).click();
  const reopened = page.getByRole("dialog", { name: "Weerlocatie" });
  await expect(reopened.getByLabel("Naam voor thuis")).toHaveValue("Rotterdam thuis");
  await expect(reopened.getByLabel("Breedtegraad")).toHaveValue("51.9225");
  await expect(reopened.getByLabel("Lengtegraad")).toHaveValue("4.47917");
  await expect(reopened.getByLabel("Eenheden")).toHaveValue("1");
});

test("shopping lists can be created, archived, restored, and permanently deleted in one bounded surface", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Boodschappen", exact: true }).click();
  await page.getByRole("button", { name: "Lijsten" }).click();
  const dialog = page.getByRole("dialog", { name: "Lijsten", exact: true });
  const listName = `Weekend ${Date.now()}`;
  await dialog.getByLabel("Nieuwe lijst").fill(listName);
  const createResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/lists");
  await dialog.getByRole("button", { name: "Lijst maken" }).click();
  expect((await createResponse).ok()).toBe(true);
  await expect(dialog.getByRole("status")).toContainText(`${listName} is gemaakt en geopend.`);
  await expectNoDocumentScroll(page, "Shopping list directory at 1366x768");

  const createdList = dialog.getByLabel(listName);
  await createdList.getByRole("button", { name: "Archiveren" }).click();
  let confirmation = dialog.getByRole("alertdialog", { name: "Archiveren bevestigen" });
  await expect(confirmation).toContainText("beschikbaar om te herstellen");
  const archiveResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/archive"));
  await confirmation.getByRole("button", { name: "Archiveren" }).click();
  expect((await archiveResponse).ok()).toBe(true);
  await expect(dialog.getByRole("status")).toContainText(`${listName} is gearchiveerd.`);

  const archivedLists = dialog.getByLabel("Gearchiveerde lijsten");
  let archivedList = archivedLists.locator("article").filter({ hasText: listName });
  const restoreResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/restore"));
  await archivedList.getByRole("button", { name: "Herstellen" }).click();
  expect((await restoreResponse).ok()).toBe(true);
  await expect(dialog.getByRole("status")).toContainText(`${listName} is hersteld en geopend.`);

  await dialog.getByLabel(listName).getByRole("button", { name: "Archiveren" }).click();
  confirmation = dialog.getByRole("alertdialog", { name: "Archiveren bevestigen" });
  const secondArchiveResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/archive"));
  await confirmation.getByRole("button", { name: "Archiveren" }).click();
  expect((await secondArchiveResponse).ok()).toBe(true);

  archivedList = archivedLists.locator("article").filter({ hasText: listName });
  await archivedList.getByRole("button", { name: "Permanent verwijderen" }).click();
  confirmation = dialog.getByRole("alertdialog", { name: "Gearchiveerde lijst permanent verwijderen bevestigen" });
  await expect(confirmation).toContainText("verdwijnen definitief");
  const deleteResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/permanent-delete"));
  await confirmation.getByRole("button", { name: "Permanent verwijderen" }).click();
  expect((await deleteResponse).status()).toBe(204);
  await expect(archivedLists.getByText(listName, { exact: true })).toHaveCount(0);
  await expectNoDocumentScroll(page, "Shopping list lifecycle at 1366x768");
});

test("shopping item corrections persist and feed shared Home suggestions", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Boodschappen", exact: true }).click();

  const milkRow = page.locator(".shopping-item").filter({ hasText: "Melk" }).first();
  await milkRow.getByRole("button", { name: "Aanpassen" }).click();
  const editor = page.getByRole("dialog", { name: "Boodschap aanpassen" });
  await editor.getByLabel("Naam").fill("Havermelk");
  await editor.getByLabel("Hoeveelheid").fill("2 pakken");
  await editor.getByLabel("Winkel", { exact: true }).fill("Bakker");
  await expectNoDocumentScroll(page, "Shopping item editor at 1366x768");
  const editResponse = page.waitForResponse((response) => response.request().method() === "PATCH" && /\/api\/lists\/[^/]+\/items\/[^/]+$/.test(new URL(response.url()).pathname));
  await editor.getByRole("button", { name: "Wijzigingen opslaan" }).click();
  expect((await editResponse).ok()).toBe(true);
  await expect(editor.getByRole("status")).toContainText("Boodschap is bijgewerkt.");
  await editor.getByRole("button", { name: "Sluit boodschappenpaneel" }).click();

  await page.reload();
  await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Boodschappen", exact: true }).click();
  await expect(page.getByText("Havermelk", { exact: true })).toBeVisible();
  await expect(page.getByText("2 pakken", { exact: true })).toBeVisible();

  await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Thuis", exact: true }).click();
  await page.getByRole("button", { name: "Boodschap toevoegen" }).click();
  await expect(page.locator('#home-shopping-suggestions option[value="Havermelk"]')).toHaveCount(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoDocumentScroll(page, "Home shared shopping suggestions at 1440x900");
});

test("primary pages do not create document-level vertical scrolling", async ({ page, request }) => {
  await resetFixture(request, "visual-full");
  await seedWoningRuntime(request);
  await ensureClimateProvider(request);

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    for (const label of ["Thuis", "Agenda", "Taken", "Boodschappen", "Motivatie", "Woning"]) {
      await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: label, exact: true }).click();
      await expectNoDocumentScroll(page, `${label} at ${viewport.width}x${viewport.height}`);
    }

    await page.getByRole("button", { name: "Klimaat bekijken" }).click();
    await expect(page.getByRole("heading", { name: "Klimaat per verdieping en kamer" })).toBeVisible();
    await expectNoDocumentScroll(page, `Woning klimaat at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Terug naar Woning" }).click();

    await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Taken", exact: true }).click();
    await page.getByRole("button", { name: "Gezinsreset openen" }).click();
    await expectNoDocumentScroll(page, `Weekritueel at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Eerdere weken" }).click();
    await expect(page.getByRole("dialog", { name: "Eerdere weken" })).toBeVisible();
    await expectNoDocumentScroll(page, `Weekritueelgeschiedenis at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Sluiten" }).click();

    await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
    await expectNoDocumentScroll(page, `Instellingen at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Kalendercontrole" }).click();
    await expect(page.getByRole("dialog", { name: "Kalendercontrole" })).toBeVisible();
    await expectNoDocumentScroll(page, `Kalendercontrole at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Kalendercontrole sluiten" }).click();
    await page.getByRole("button", { name: "Tijdzone" }).click();
    await expect(page.getByRole("dialog", { name: "Huishoudtijdzone" })).toBeVisible();
    await expect(page.getByLabel("Tijdzone zoeken")).toBeEnabled();
    await expectNoDocumentScroll(page, `Huishoudtijdzone at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Huishoudtijdzone sluiten" }).click();
    await page.getByRole("button", { name: "Gezinsleden" }).click();
    await expect(page.getByRole("dialog", { name: "Gezinsleden" })).toBeVisible();
    await expectNoDocumentScroll(page, `Gezinsledenbeheer at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Gezinsleden sluiten" }).click();
    await page.getByRole("button", { name: "Weerlocatie" }).click();
    const weatherLocationDialog = page.getByRole("dialog", { name: "Weerlocatie" });
    await expect(weatherLocationDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Weerlocatie at ${viewport.width}x${viewport.height}`);
    await expectWithinViewport(weatherLocationDialog.getByRole("button", { name: "Locatie opslaan" }), viewport);
    await page.getByRole("button", { name: "Weerlocatie sluiten" }).click();
    await page.locator(".settings-action-rail").getByRole("button", { name: "Woning", exact: true }).click();
    const woningDialog = page.getByRole("dialog", { name: "Woning", exact: true });
    await expect(woningDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Woningbeheer at ${viewport.width}x${viewport.height}`);
    const mappingRoom = woningDialog.locator(".ha-room").filter({ hasText: "Woonkamer" });
    await mappingRoom.getByRole("button", { name: "Koppelingen beheren" }).click();
    const mappingDialog = page.getByRole("dialog", { name: "Klimaatkoppelingen voor Woonkamer" });
    await expect(mappingDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Klimaatkoppelingen at ${viewport.width}x${viewport.height}`);
    await mappingDialog.getByRole("button", { name: "Sluiten" }).click();
    await woningDialog.getByRole("button", { name: "Home Assistant beheren" }).click();
    const providerDialog = page.getByRole("dialog", { name: "Home Assistant beheren" });
    await expect(providerDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Home Assistant-beheer at ${viewport.width}x${viewport.height}`);
    await providerDialog.getByRole("button", { name: "Sluiten" }).click();
    const livingRoom = woningDialog.getByRole("list", { name: "Kamers op geselecteerde verdieping" }).locator("article").filter({ hasText: "Woonkamer" });
    await livingRoom.getByRole("button", { name: "Klimaat bewerken" }).click();
    const climateDialog = page.getByRole("dialog", { name: "Klimaatinstellingen voor Woonkamer" });
    await expect(climateDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Klimaatinstellingen at ${viewport.width}x${viewport.height}`);
    await climateDialog.getByRole("button", { name: "Sluiten" }).first().click();
    await woningDialog.getByRole("button", { name: "Plattegrond uploaden" }).click();
    const uploadDialog = page.getByRole("dialog", { name: /Plattegrond uploaden voor/ });
    await expect(uploadDialog).toBeVisible();
    await expectNoDocumentScroll(page, `Plattegrondupload at ${viewport.width}x${viewport.height}`);
    await uploadDialog.getByRole("button", { name: "Sluiten" }).click();
    await woningDialog.getByRole("button", { name: "Sluiten" }).click();

    await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Thuis", exact: true }).click();
    await page.getByRole("button", { name: "Afspraak toevoegen" }).click();
    await expectNoDocumentScroll(page, `Home quick-add at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Afspraak toevoegen sluiten" }).click();
    await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Agenda", exact: true }).click();
    await page.getByRole("button", { name: "Dit apparaat" }).click();
    await expect(page.getByRole("dialog", { name: "Agenda-instellingen voor dit apparaat" })).toBeVisible();
    await expectNoDocumentScroll(page, `Agenda-apparaatinstellingen at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Apparaatinstellingen sluiten" }).click();
    await page.getByRole("button", { name: "Afspraak plannen" }).click();
    await expectNoDocumentScroll(page, `Agenda editor at ${viewport.width}x${viewport.height}`);
    const agendaEditor = page.getByRole("dialog", { name: "Afspraak toevoegen" });
    await agendaEditor.getByLabel("Wat gebeurt er?").fill("Viewport controle");
    await agendaEditor.getByRole("button", { name: "Verder" }).click();
    await expect(agendaEditor.getByText("Wanneer is het?")).toBeVisible();
    await agendaEditor.getByRole("button", { name: "Verder" }).click();
    await expect(agendaEditor.getByText("Duurt het de hele dag?")).toBeVisible();
    await agendaEditor.getByRole("button", { name: "Verder" }).click();
    await expect(agendaEditor.getByText("HomeOps bewaart afspraken, maar stuurt geen herinneringen of notificaties.")).toBeVisible();
    await expectNoDocumentScroll(page, `Agenda details zonder herinneringen at ${viewport.width}x${viewport.height}`);
    await page.keyboard.press("Escape");
    await expect(agendaEditor).toHaveCount(0);
    await page.getByLabel("Dagelijkse gezinsplekken").getByRole("button", { name: "Thuis", exact: true }).click();
    await page.getByRole("button", { name: "Alex gezinslidpagina openen" }).click();
    await expectNoDocumentScroll(page, `Mijn pagina at ${viewport.width}x${viewport.height}`);
  }
});

async function resetFixture(request: APIRequestContext, scenario: string) {
  const response = await request.post(`/api/visual-review-fixtures/${scenario}/reset`);
  expect(response.ok(), await response.text()).toBe(true);
}

async function seedWoningRuntime(request: APIRequestContext) {
  const floorsResponse = await request.get("/api/floors");
  expect(floorsResponse.ok(), await floorsResponse.text()).toBe(true);
  const floors = await floorsResponse.json() as { id: string; name: string }[];
  let floor = floors.find((candidate) => candidate.name === "E2E Klimaat");
  if (!floor) {
    const floorResponse = await request.post("/api/floors", { data: { name: "E2E Klimaat" } });
    expect(floorResponse.ok(), await floorResponse.text()).toBe(true);
    floor = await floorResponse.json() as { id: string; name: string };
  }

  const roomsResponse = await request.get(`/api/floors/${floor.id}/rooms?includeArchived=true`);
  expect(roomsResponse.ok(), await roomsResponse.text()).toBe(true);
  const rooms = await roomsResponse.json() as { id: string; isArchived: boolean; name: string }[];
  const ensureRoom = async (name: string, roomType: number) => {
    const existing = rooms.find((candidate) => candidate.name === name);
    if (existing) return existing;
    const response = await request.post(`/api/floors/${floor.id}/rooms`, { data: { name, roomType } });
    expect(response.ok(), await response.text()).toBe(true);
    const created = await response.json() as { id: string; isArchived: boolean; name: string };
    rooms.push(created);
    return created;
  };

  const configuredRoom = await ensureRoom("Woonkamer", 2);

  const configurationResponse = await request.put(`/api/rooms/${configuredRoom.id}/climate-configuration`, {
    data: {
      heatingPolicyIntent: 1,
      humidityRange: { maximum: 60, minimum: 40 },
      isBedtimeRelevant: false,
      isClimateEnabled: true,
      temperatureRange: { maximum: 22, minimum: 18 },
    },
  });
  expect(configurationResponse.ok(), await configurationResponse.text()).toBe(true);

  const unconfiguredRoom = await ensureRoom("Werkkamer", 5);
  const clearConfigurationResponse = await request.delete(`/api/rooms/${unconfiguredRoom.id}/climate-configuration`);
  expect([204, 404], await clearConfigurationResponse.text()).toContain(clearConfigurationResponse.status());

  const archivedRoom = await ensureRoom("Archiefkamer", 6);
  if (!archivedRoom.isArchived) {
    const archiveResponse = await request.post(`/api/rooms/${archivedRoom.id}/archive`);
    expect(archiveResponse.ok(), await archiveResponse.text()).toBe(true);
  }

  return { configuredRoom, floor, unconfiguredRoom };
}

async function ensureClimateProvider(request: APIRequestContext) {
  const response = await request.get("/api/climate-providers?includeArchived=true");
  expect(response.ok(), await response.text()).toBe(true);
  const providers = await response.json() as { id: string; isArchived: boolean; isEnabled: boolean; displayName: string; providerType: number }[];
  const active = providers.find((provider) => provider.providerType === 0 && !provider.isArchived && provider.isEnabled);
  if (active) return active;
  const create = await request.post("/api/climate-providers", { data: { displayName: `E2E Home Assistant ${Date.now()}`, providerType: 0, externalInstanceReference: "http://127.0.0.1:8123" } });
  expect(create.ok(), await create.text()).toBe(true);
  return await create.json() as { id: string; displayName: string };
}

async function openFamilyAdministration(page: Page) {
  await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
  await page.getByRole("button", { name: "Gezinsleden" }).click();
  await expect(page.getByRole("dialog", { name: "Gezinsleden" })).toBeVisible();
}

async function openTaskCard(page: Page, request: APIRequestContext): Promise<Locator> {
  await resetFixture(request, "visual-marketing-tasks");
  await page.goto("/");
  await page.getByRole("button", { name: "Taken", exact: true }).click();
  const card = page.locator(".operational-task-card").filter({ hasText: taskTitle }).first();
  await expect(card).toBeVisible();
  return card;
}

async function expectRealHitTarget(locator: Locator) {
  await expect(locator).toBeVisible();
  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return { height: rect.height, receivesPointerAtCenter: false, width: rect.width };
    }
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      height: rect.height,
      receivesPointerAtCenter: target === element || (target !== null && element.contains(target)),
      width: rect.width,
    };
  });
  expect(geometry.receivesPointerAtCenter).toBe(true);
  expect(geometry.width).toBeGreaterThanOrEqual(40);
  expect(geometry.height).toBeGreaterThanOrEqual(40);
}

async function expectWithinViewport(
  locator: Locator,
  viewport: { width: number; height: number },
) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
}

async function expectNoDocumentOverflow(page: Page, context: string) {
  await page.waitForTimeout(100);
  const overflow = await page.evaluate(() => ({
    bodyVertical: document.body.scrollHeight - document.body.clientHeight,
    bodyHorizontal: document.body.scrollWidth - document.body.clientWidth,
    documentVertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    documentHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(overflow.bodyVertical, `${context}: body vertical overflow`).toBeLessThanOrEqual(1);
  expect(overflow.bodyHorizontal, `${context}: body horizontal overflow`).toBeLessThanOrEqual(1);
  expect(overflow.documentVertical, `${context}: document vertical overflow`).toBeLessThanOrEqual(1);
  expect(overflow.documentHorizontal, `${context}: document horizontal overflow`).toBeLessThanOrEqual(1);
}

async function expectNoDocumentScroll(page: Page, context: string) {
  await page.waitForTimeout(100);
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollHeight - document.body.clientHeight,
    document: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  expect(overflow.body, `${context}: body vertical overflow`).toBeLessThanOrEqual(1);
  expect(overflow.document, `${context}: document vertical overflow`).toBeLessThanOrEqual(1);
}
