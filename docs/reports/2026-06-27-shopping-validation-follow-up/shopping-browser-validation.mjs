import { createRequire } from 'node:module';

const playwrightPackagePath = process.env.PLAYWRIGHT_PACKAGE_PATH ?? '/tmp/pwvalidate/node_modules/playwright';
const { chromium } = createRequire(import.meta.url)(playwrightPackagePath);

const appUrl = process.env.SHOPPING_VALIDATION_APP_URL ?? 'http://127.0.0.1:5173/';
const viewports = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

function initialShoppingItems() {
  return [
    { id: 'ah-bread', listId: 'shopping-list-id', text: 'Brood', isCompleted: false, isDeleted: false, preferredStore: 'Albert Heijn', storeSuggestions: [{ store: 'Albert Heijn', purchaseCount: 5 }] },
    { id: 'ah-milk', listId: 'shopping-list-id', text: 'Melk', isCompleted: false, isDeleted: false, preferredStore: 'Albert Heijn', storeSuggestions: [{ store: 'Albert Heijn', purchaseCount: 4 }] },
    { id: 'ah-cheese', listId: 'shopping-list-id', text: 'Kaas', isCompleted: false, isDeleted: false, preferredStore: 'Albert Heijn', storeSuggestions: [{ store: 'Albert Heijn', purchaseCount: 3 }] },
    { id: 'ah-yogurt', listId: 'shopping-list-id', text: 'Yoghurt', isCompleted: false, isDeleted: false, preferredStore: 'Albert Heijn', storeSuggestions: [{ store: 'Albert Heijn', purchaseCount: 2 }] },
    { id: 'ah-apples', listId: 'shopping-list-id', text: 'Appels', isCompleted: false, isDeleted: false, preferredStore: 'Albert Heijn', storeSuggestions: [{ store: 'Albert Heijn', purchaseCount: 1 }] },
    { id: 'etos-soap', listId: 'shopping-list-id', text: 'Zeep', isCompleted: false, isDeleted: false, preferredStore: 'Etos', storeSuggestions: [{ store: 'Etos', purchaseCount: 2 }] },
    { id: 'market-flowers', listId: 'shopping-list-id', text: 'Bloemen', isCompleted: false, isDeleted: false, preferredStore: 'Market', storeSuggestions: [{ store: 'Market', purchaseCount: 2 }] },
  ];
}

function listItemResponse(item) {
  return {
    id: item.id,
    listId: item.listId,
    text: item.text,
    isCompleted: item.isCompleted,
    completedUtc: item.completedUtc ?? null,
    isDeleted: item.isDeleted ?? false,
    deletedUtc: item.deletedUtc ?? null,
    preferredStore: item.preferredStore ?? null,
    storeSuggestions: item.storeSuggestions ?? [],
    createdUtc: item.createdUtc ?? '2026-06-27T12:00:00Z',
    updatedUtc: item.updatedUtc ?? '2026-06-27T12:00:00Z',
  };
}

function listResponse(id, name, items) {
  return { id, name, items: items.map(listItemResponse), createdUtc: '2026-06-27T12:00:00Z', updatedUtc: '2026-06-27T12:00:00Z' };
}

async function validateViewport(browser, viewport) {
  let shoppingItems = initialShoppingItems();
  let otherItems = [{ id: 'packing-towel', listId: 'packing-list-id', text: 'Handdoek', isCompleted: false, isDeleted: false, preferredStore: null, storeSuggestions: [] }];
  const requests = [];
  const page = await browser.newPage({ viewport });

  page.on('request', (request) => {
    if (request.url().includes('/api/lists')) {
      requests.push({ method: request.method(), url: request.url(), postData: request.postData() });

    }
  });

  await page.route('**/api/lists**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === 'GET' && path === '/api/lists') {
      await route.fulfill({ json: [{ id: 'shopping-list-id', name: 'Shopping' }, { id: 'packing-list-id', name: 'Vakantie' }] });
      return;
    }

    if (method === 'GET' && path === '/api/lists/shopping-list-id') {
      await route.fulfill({ json: listResponse('shopping-list-id', 'Shopping', shoppingItems) });
      return;
    }

    if (method === 'GET' && path === '/api/lists/packing-list-id') {
      await route.fulfill({ json: listResponse('packing-list-id', 'Vakantie', otherItems) });
      return;
    }

    if (method === 'POST' && path === '/api/lists/shopping-list-id/items') {
      const body = JSON.parse(request.postData() || '{}');
      const text = body.text ?? body.Text ?? 'Pasta';
      const item = { id: 'quick-pasta', listId: 'shopping-list-id', text, isCompleted: false, isDeleted: false, preferredStore: null, storeSuggestions: [] };
      shoppingItems = [...shoppingItems, item];
      await route.fulfill({ status: 201, json: listItemResponse(item) });
      return;
    }

    if (method === 'POST' && path === '/api/lists/packing-list-id/items') {
      const body = JSON.parse(request.postData() || '{}');
      const text = body.text ?? body.Text ?? 'Zonnebrand';
      const item = { id: 'packing-sunscreen', listId: 'packing-list-id', text, isCompleted: false, isDeleted: false, preferredStore: null, storeSuggestions: [] };
      otherItems = [...otherItems, item];
      await route.fulfill({ status: 201, json: listItemResponse(item) });
      return;
    }

    if (method === 'POST' && path === '/api/lists/shopping-list-id/items/ah-bread/toggle') {
      const existing = shoppingItems.find((item) => item.id === 'ah-bread');
      const updated = { ...existing, isCompleted: true, completedUtc: '2026-06-27T12:05:00Z' };
      shoppingItems = shoppingItems.map((item) => item.id === updated.id ? updated : item);
      await route.fulfill({ json: listItemResponse(updated) });
      return;
    }

    if (method === 'POST' && path === '/api/lists/shopping-list-id/items/ah-bread/undo') {
      const existing = shoppingItems.find((item) => item.id === 'ah-bread');
      const updated = { ...existing, isCompleted: false, completedUtc: null, isDeleted: false, deletedUtc: null };
      shoppingItems = shoppingItems.map((item) => item.id === updated.id ? updated : item);
      await route.fulfill({ json: listItemResponse(updated) });
      return;
    }

    if (method === 'DELETE' && path === '/api/lists/shopping-list-id/items/etos-soap') {
      const existing = shoppingItems.find((item) => item.id === 'etos-soap');
      const updated = { ...existing, isDeleted: true, deletedUtc: '2026-06-27T12:10:00Z' };
      shoppingItems = shoppingItems.map((item) => item.id === updated.id ? updated : item);
      await route.fulfill({ json: listItemResponse(updated) });
      return;
    }

    if (method === 'POST' && path === '/api/lists/shopping-list-id/items/etos-soap/undo') {
      const existing = shoppingItems.find((item) => item.id === 'etos-soap');
      const updated = { ...existing, isDeleted: false, deletedUtc: null };
      shoppingItems = shoppingItems.map((item) => item.id === updated.id ? updated : item);
      await route.fulfill({ json: listItemResponse(updated) });
      return;
    }

    await route.abort('failed');
  });

  await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Shopping$/ }).click();
  await page.waitForSelector('#shopping-new-item');

  const quickInput = page.locator('#shopping-new-item');
  await quickInput.focus();
  const quickFocused = await quickInput.evaluate((element) => document.activeElement === element);
  await quickInput.fill('Pasta');
  await page.locator('.shopping-quick-add-panel form').getByRole('button', { name: 'Toevoegen' }).click();
  await page.waitForFunction(() => document.body.innerText.includes('Pasta'));

  const albertCard = page.locator('.shopping-store-group').filter({ hasText: 'Albert Heijn' }).first();
  const albertCountBeforeToggle = (await albertCard.locator('.shopping-store-card-header span').innerText()).trim();
  const hiddenAlbertItemsInitially = await albertCard.locator('.shopping-store-complete-list .shopping-item').count();
  await albertCard.locator(':scope > .shopping-store-complete-list > summary').click();
  const hiddenAlbertItemsExpanded = await albertCard.locator(':scope > .shopping-store-complete-list[open] .shopping-item').count();
  await albertCard.locator(':scope > .shopping-store-complete-list > summary').click();
  const albertCollapsed = await albertCard.locator(':scope > .shopping-store-complete-list').evaluate((element) => !element.hasAttribute('open'));

  await albertCard.locator('.shopping-item').filter({ hasText: 'Brood' }).locator('label').first().click();
  await page.waitForFunction(() => [...document.querySelectorAll('.shopping-section')].some((section) => section.textContent?.includes('Afgevinkt') && section.textContent?.includes('Brood')));
  const albertCountAfterToggle = (await albertCard.locator('.shopping-store-card-header span').innerText()).trim();
  await page.locator('.shopping-section').filter({ hasText: 'Afgevinkt' }).locator('.shopping-item').filter({ hasText: 'Brood' }).getByRole('button', { name: 'Terugzetten' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.shopping-section-primary .shopping-item')].some((element) => element.textContent?.includes('Brood')));
  const albertCountAfterUndo = (await albertCard.locator('.shopping-store-card-header span').innerText()).trim();

  const etosCard = page.locator('.shopping-section-primary .shopping-store-group').filter({ hasText: 'Etos' }).first();
  await etosCard.locator('.shopping-item').filter({ hasText: 'Zeep' }).getByRole('button', { name: 'Weg' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.shopping-section')].some((section) => section.textContent?.includes('Recent verwijderd') && section.textContent?.includes('Zeep')));
  const etosCountAfterRemove = await page.locator('.shopping-section-primary .shopping-store-group').filter({ hasText: 'Etos' }).count() === 0 ? '0 open' : (await page.locator('.shopping-section-primary .shopping-store-group').filter({ hasText: 'Etos' }).first().locator('.shopping-store-card-header span').innerText()).trim();
  await page.locator('.shopping-section').filter({ hasText: 'Recent verwijderd' }).locator('.shopping-item').filter({ hasText: 'Zeep' }).getByRole('button', { name: 'Terugzetten' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.shopping-section-primary .shopping-item')].some((element) => element.textContent?.includes('Zeep')));
  const etosCountAfterRemoveUndo = (await page.locator('.shopping-section-primary .shopping-store-group').filter({ hasText: 'Etos' }).first().locator('.shopping-store-card-header span').innerText()).trim();

  await page.locator('.other-list-card summary').filter({ hasText: 'Vakantie' }).click();
  await page.waitForSelector('text=Handdoek');
  await page.locator('.other-list-card').filter({ hasText: 'Vakantie' }).locator('input[type="text"]').first().fill('Zonnebrand');
  await page.locator('.other-list-card').filter({ hasText: 'Vakantie' }).getByRole('button', { name: 'Toevoegen' }).click();
  await page.waitForSelector('text=Zonnebrand');

  await page.evaluate(() => window.scrollTo(0, 0));

  const metrics = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom };
    };
    const text = document.body.innerText;
    return {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      workspaceHeight: document.querySelector('.shopping-workspace')?.getBoundingClientRect().height ?? null,
      heroHeight: document.querySelector('.shopping-workspace-hero')?.getBoundingClientRect().height ?? null,
      quickAddHeight: document.querySelector('.shopping-quick-add-panel')?.getBoundingClientRect().height ?? null,
      storeCardHeights: [...document.querySelectorAll('.shopping-section-primary .shopping-store-group')].map((element) => ({ label: element.querySelector('h5')?.textContent ?? '', height: element.getBoundingClientRect().height })),
      otherListsHeight: document.querySelector('.other-lists-section')?.getBoundingClientRect().height ?? null,
      recentlyAddedHeight: document.querySelector('.shopping-recent-panel')?.getBoundingClientRect().height ?? null,
      heroRect: rectFor('.shopping-workspace-hero'),
      quickAddRect: rectFor('.shopping-quick-add-panel'),
      scrollingRequired: document.documentElement.scrollHeight > window.innerHeight,
      hasSmartSuggestions: /smart suggestions|slimme suggesties|suggestiepanelen/i.test(text),
      hasBijnaOp: /bijna op/i.test(text),
      hasGamification: /gamification|punten|beloning|reward|rewards/i.test(text),
      hasRecentlyAdded: /laatst toegevoegd/i.test(text) && text.includes('Pasta'),
      hasOtherLists: text.includes('Ondersteunende lijsten') && text.includes('Vakantie') && text.includes('Zonnebrand'),
    };
  });

  const result = {
    viewport,
    quickAdd: {
      focused: quickFocused,
      requestObserved: requests.some((request) => request.method === 'POST' && /\/api\/lists\/shopping-list-id\/items$/.test(request.url) && request.postData?.includes('Pasta')),
      newItemVisible: await page.getByText('Pasta').count() > 0,
    },
    grouping: {
      albertCountBeforeToggle,
      hiddenAlbertItemsInitially,
      hiddenAlbertItemsExpanded,
      albertCollapsed,
      albertCountAfterToggle,
      albertCountAfterUndo,
      etosCountAfterRemove,
      etosCountAfterRemoveUndo,
      storeLabels: await page.locator('.shopping-section-primary .shopping-store-card-header h5').allInnerTexts(),
    },
    lifecycle: {
      toggleRequestObserved: requests.some((request) => request.method === 'POST' && /ah-bread\/toggle$/.test(request.url)),
      undoRequestObserved: requests.some((request) => request.method === 'POST' && /ah-bread\/undo$/.test(request.url)),
      removeRequestObserved: requests.some((request) => request.method === 'DELETE' && /etos-soap$/.test(request.url)),
      removeUndoRequestObserved: requests.some((request) => request.method === 'POST' && /etos-soap\/undo$/.test(request.url)),
    },
    otherLists: {
      expanded: await page.locator('.other-list-card[open]').filter({ hasText: 'Vakantie' }).count() === 1,
      addRequestObserved: requests.some((request) => request.method === 'POST' && /\/api\/lists\/packing-list-id\/items$/.test(request.url) && request.postData?.includes('Zonnebrand')),
      newItemVisible: await page.getByText('Zonnebrand').count() > 0,
    },
    metrics,
  };

  await page.close();
  return result;
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const viewport of viewports) {
    results.push(await validateViewport(browser, viewport));
  }
  console.log(JSON.stringify({ appUrl, results }, null, 2));
} finally {
  await browser.close();
}
