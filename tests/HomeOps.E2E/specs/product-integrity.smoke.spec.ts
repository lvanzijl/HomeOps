import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const taskTitle = "Zwemtas klaarzetten";

test("fresh install completes atomically and stays completed after refresh", async ({ page }) => {
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

  await page.reload();
  await expect(page.getByRole("heading", { name: "Welkom bij FamilyBoard" })).toHaveCount(0);
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

test("Home Today event stays on the household-local day", async ({ page, request }) => {
  test.fail(true, "Known TIME-01 defect: Home converts a local calendar date through UTC.");
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

    await page.getByRole("button", { name: "Thuis", exact: true }).click();
    await page.getByRole("button", { name: "Alex gezinslidpagina openen" }).click();
    await expectNoDocumentScroll(page, `Mijn pagina at ${viewport.width}x${viewport.height}`);
  }
});

async function resetFixture(request: APIRequestContext, scenario: string) {
  const response = await request.post(`/api/visual-review-fixtures/${scenario}/reset`);
  expect(response.ok(), await response.text()).toBe(true);
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
