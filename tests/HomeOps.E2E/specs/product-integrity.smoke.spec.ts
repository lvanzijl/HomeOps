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

test("task Complete, Tomorrow, and Edit controls are real hit targets", async ({ page, request }) => {
  test.fail(true, "Known TASK-UI-01/TASK-UI-02 defects: expanded task controls are clipped and do not receive pointer input.");
  await test.step("Complete", async () => {
    const card = await openTaskCard(page, request);
    const complete = card.getByRole("button", { name: "Klaar" });
    await expectRealHitTarget(complete);
    await complete.click();
    await expect(card).toContainText("Afgerond");
  });

  await test.step("Tomorrow", async () => {
    const card = await openTaskCard(page, request);
    const tomorrow = card.getByRole("button", { name: "Morgen" });
    await expectRealHitTarget(tomorrow);
    await tomorrow.click();
    await expect(card).toHaveCount(0);
  });

  await test.step("Edit", async () => {
    const card = await openTaskCard(page, request);
    const more = card.getByText("Meer", { exact: true });
    await expectRealHitTarget(more);
    await more.click();
    const edit = card.getByRole("button", { name: "Aanpassen" });
    await expectRealHitTarget(edit);
    await edit.click();
    await expect(page.getByRole("dialog", { name: "Taak aanpassen" })).toBeVisible();
  });
});

test("primary pages do not create document-level vertical scrolling", async ({ page, request }) => {
  await resetFixture(request, "visual-full");

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    for (const label of ["Thuis", "Agenda", "Taken", "Boodschappen", "Motivatie"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expectNoDocumentScroll(page, `${label} at ${viewport.width}x${viewport.height}`);
    }

    await page.getByRole("button", { name: "Instellingen voor gezinsinstellingen" }).click();
    await expectNoDocumentScroll(page, `Instellingen at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Kalendercontrole" }).click();
    await expect(page.getByRole("dialog", { name: "Kalendercontrole" })).toBeVisible();
    await expectNoDocumentScroll(page, `Kalendercontrole at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Kalendercontrole sluiten" }).click();
    await page.getByRole("button", { name: "Gezinsleden" }).click();
    await expect(page.getByRole("dialog", { name: "Gezinsleden" })).toBeVisible();
    await expectNoDocumentScroll(page, `Gezinsledenbeheer at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Gezinsleden sluiten" }).click();

    await page.getByRole("button", { name: "Thuis", exact: true }).click();
    await page.getByRole("button", { name: "Afspraak toevoegen" }).click();
    await expectNoDocumentScroll(page, `Home quick-add at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Afspraak toevoegen sluiten" }).click();
    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await page.getByRole("button", { name: "Afspraak plannen" }).click();
    await expectNoDocumentScroll(page, `Agenda editor at ${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Sluit gebeurtenisvenster" }).click();
    await page.getByRole("button", { name: "Thuis", exact: true }).click();
    await page.getByRole("button", { name: "Alex gezinslidpagina openen" }).click();
    await expectNoDocumentScroll(page, `Mijn pagina at ${viewport.width}x${viewport.height}`);
  }
});

async function resetFixture(request: APIRequestContext, scenario: string) {
  const response = await request.post(`/api/visual-review-fixtures/${scenario}/reset`);
  expect(response.ok(), await response.text()).toBe(true);
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
  await card.click();
  return card;
}

async function expectRealHitTarget(locator: Locator) {
  await expect(locator).toBeVisible();
  const receivesPointerAtCenter = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return target === element || (target !== null && element.contains(target));
  });
  expect(receivesPointerAtCenter).toBe(true);
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
