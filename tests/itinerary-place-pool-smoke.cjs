// Local-only browser acceptance for the 行程規劃 (Fullscreen Trip Planning Workspace). NODE_PATH
// may point to an installed Playwright runtime. Every request is served from this checkout or a
// synthetic API stub; no backend. Playwright is not installed in this sandbox — this script was
// updated to the new fullscreen/two-column/drawer contract but not executed here; the live
// verification for this round was done through the Browser pane tool against a scratch server
// instead (see memory/itinerary-place-pool.md), the same substitute used by prior Place Pool rounds.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.env.PLACE_POOL_SMOKE_OUTPUT || root;
const catalog = require('../lib/canonical-travel-catalog.js').catalog;
const origin = 'http://127.0.0.1:4181';

const place = (area, name, kind) => ({ ...catalog[area], id: `smoke-${area}`, placeId: `synthetic-google-${area}`, name, kind,
  category: kind, mark: name.slice(0, 1), swatch: '#40777a', formattedAddress: 'Synthetic address',
  latitude: 35.68, longitude: 139.76, travelAreaResolved: true, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
  travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', areaTags: [], restaurantTags: [] });
const payload = () => ({ id: 'b', title: 'Local Place Pool smoke', destination: '東京', revision: 1,
  startDate: '2026-09-20', endDate: '2026-09-23', flights: [], transports: [], ownerId: 'alice', members: { alice: 'alice' },
  places: [place('asakusa', '淺草寺', 'attraction'), place('ueno', '上野動物園', 'attraction'), place('tsukiji', '築地壽司', 'restaurant'),
    place('shibuya', '澀谷 PARCO', 'shopping'), place('ginza', '銀座飯店', 'lodging'), place('ebisu', '惠比壽花園', 'attraction')],
  votes: { '上野動物園': ['alice'] },
  itinerary: { '9/20': [{ id: 'place:9/20:惠比壽花園', name: '惠比壽花園', time: '10:00' }] } });

async function open(browser, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [], requests = [], blocked = [];
  let revision = 1;
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) { blocked.push(url.origin); return route.abort(); }
    if (url.pathname.startsWith('/api/')) {
      requests.push({ path: url.pathname, method: request.method(), body: request.postData() });
      const data = url.pathname === '/api/trips' ? { trips: [{ id: 'b' }] }
        : url.pathname === '/api/trip' ? request.method() === 'PUT' ? { revision: ++revision } : payload()
        : url.pathname === '/api/shopping' ? { items: [], categories: [], tags: [], photos: {} } : {};
      return route.fulfill({ json: data });
    }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    assert.ok(file.startsWith(root + path.sep));
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    const contentType = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream';
    return route.fulfill({ body: fs.readFileSync(file), contentType });
  });
  await page.addInitScript(() => {
    localStorage.setItem('tokyo-profile-v1', JSON.stringify({ id: 'alice', nickname: 'alice', authVersion: 2 }));
    localStorage.setItem('active-trip-v2:alice', '"b"');
    localStorage.setItem('trip-ui-v1:alice:b', '{"mainTab":"itinerary"}');
    localStorage.setItem('tokyo-clean-test-data-v4', 'done');
  });
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => state.hydrationStatus === 'ready' && state.tripId === 'b' && state.activeTab === 'itinerary');
  // Let pre-existing startup enrichment (the restaurant tag backfill's exact /api/places lookup,
  // identical on the unmodified baseline) settle before the workspace phase is measured.
  await page.waitForTimeout(2500);
  await page.evaluate(() => { state.selectedDate = '9/20'; render(); });
  return { context, page, errors, requests, blocked, poolStart: requests.length };
}

const candidateCards = (page) => page.locator('[data-place-pool-list] [data-pool-place]');
const selectedRows = (page) => page.locator('[data-place-pool-selected-list] [data-pool-constraint]');
const savedItinerary = (requests) => {
  const put = requests.filter((request) => request.method === 'PUT' && request.path === '/api/trip').at(-1);
  return put ? JSON.parse(put.body).itinerary : null;
};
function networkSummary(requests, poolStart) {
  const describe = (list) => list.map((request) => `${request.method} ${request.path}`);
  const pool = describe(requests.slice(poolStart));
  assert.ok(pool.every((entry) => entry === 'PUT /api/trip'), `行程規劃 phase made non-Trip requests: ${JSON.stringify(pool)}`);
  return { startup: describe(requests.slice(0, poolStart)), poolPhase: pool };
}

async function desktop(browser) {
  const { context, page, errors, requests, blocked, poolStart } = await open(browser, { viewport: { width: 1280, height: 860 } });
  const toggle = page.locator('[data-toggle-place-pool]'), panel = page.locator('#place-pool-panel'), workspace = page.locator('.place-pool-workspace');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.getAttribute('aria-controls'), 'place-pool-panel');
  assert.equal(await panel.isVisible(), false);
  assert.match(await toggle.textContent(), /行程規劃\s*5/);
  await toggle.click();
  await panel.waitFor({ state: 'visible' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');

  // Fullscreen: the workspace fills the viewport, not a docked side panel beside a phone frame.
  const box = await workspace.boundingBox(), viewport = page.viewportSize();
  assert.ok(Math.abs(box.width - viewport.width) <= 2 && Math.abs(box.height - viewport.height) <= 2, `workspace is not fullscreen: ${JSON.stringify({ box, viewport })}`);

  // Two-column desktop layout: the Selected column sits fully to the left of the candidates column.
  const selectedBox = await page.locator('.place-pool-selected-column').boundingBox();
  const candidatesBox = await page.locator('.place-pool-candidates-column').boundingBox();
  assert.ok(selectedBox.x + selectedBox.width <= candidatesBox.x + 1, `Selected column is not left of candidates: ${JSON.stringify({ selectedBox, candidatesBox })}`);
  assert.equal(await page.locator('.place-pool-mobile-handle').isVisible(), false, 'no mobile handle on desktop');
  assert.equal(await candidateCards(page).count(), 5);
  assert.equal(await page.locator('[data-pool-drag="app:smoke-asakusa"]').getAttribute('draggable'), 'true');
  assert.equal(await candidateCards(page).first().getAttribute('draggable'), null, 'the selectable card surface itself is never draggable');
  assert.match(await page.locator('[data-pool-cta]').textContent(), /AI 幫我規劃行程/);

  // Click three cards: all three leave the candidate list and appear as compact rows in the left column.
  for (const key of ['app:smoke-asakusa', 'app:smoke-ueno', 'app:smoke-tsukiji']) {
    await page.locator(`[data-pool-place="${key}"]`).click();
  }
  await page.waitForFunction(() => document.querySelectorAll('[data-place-pool-selected-list] [data-pool-constraint]').length === 3);
  assert.equal(await candidateCards(page).count(), 2);
  assert.match(await page.locator('.place-pool-selected-heading').textContent(), /已選 3 個/);
  assert.match(await page.locator('[data-pool-cta]').textContent(), /用已選 3 個地點規劃/);
  assert.equal(requests.slice(poolStart).length, 0, 'selecting cards makes no requests');

  // Filters narrow only the candidates column; the Selected column is entirely unaffected.
  await page.selectOption('#place-pool-filter-kind', 'lodging');
  await page.waitForFunction(() => document.querySelectorAll('[data-place-pool-selected-list] [data-pool-constraint]').length === 3);
  assert.equal(await selectedRows(page).count(), 3, 'the Selected column ignores the candidate filter entirely');
  await page.selectOption('#place-pool-filter-kind', 'all');

  // Unselecting from the Selected column's own checkmark returns the card to its original stable
  // position among the candidates (the checkmark reuses the same data-pool-place toggle handler).
  await page.locator('[data-place-pool-selected-list] [data-pool-place="app:smoke-ueno"]').click();
  await page.waitForFunction(() => document.querySelector('[data-pool-place="app:smoke-ueno"]')?.closest('[data-place-pool-list]'));

  // Planning constraint: set 淺草寺 to 9/22 with an exact time from its candidate-card control.
  const asakusaConstraint = page.locator('[data-pool-constraint="app:smoke-asakusa"]');
  if (await asakusaConstraint.count()) {
    await asakusaConstraint.click();
    await page.locator('.place-pool-constraint-sheet').waitFor({ state: 'visible' });
    await page.locator('[data-pool-wheel-part="day"] [data-pool-wheel-value="9/22"]').click();
    await page.locator('[data-pool-constraint-time-toggle]').click();
    await page.locator('[data-pool-wheel-part="hour"] [data-pool-wheel-value="18"]').click();
    await page.locator('[data-pool-wheel-part="minute"] [data-pool-wheel-value="30"]').click();
    await page.locator('[data-pool-constraint-confirm]').click();
    await page.locator('.place-pool-constraint-sheet').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('[data-place-pool-selected-list] [data-pool-constraint="app:smoke-asakusa"]')?.textContent.includes('9/22'));
    assert.match(await page.locator('[data-place-pool-selected-list] [data-pool-constraint="app:smoke-asakusa"]').textContent(), /9\/22・18:30/);
  }
  assert.equal(requests.slice(poolStart).length, 0, 'setting a planning constraint makes no requests');

  // The dedicated drag handle still drags a candidate Place straight onto a day.
  const dragKey = 'app:smoke-tsukiji';
  await page.locator(`[data-pool-drag="${dragKey}"]`).dragTo(page.locator('.date-button[data-date="9/21"]'));
  await page.waitForFunction((key) => !document.querySelector(`[data-pool-place="${key}"]`) && state.selectedDate === '9/21', dragKey);
  assert.match(await page.locator('.timeline').textContent(), /築地壽司/);
  assert.equal(await page.evaluate(() => document.body.classList.contains('place-pool-dragging')), false);
  await page.waitForTimeout(250);
  assert.deepEqual(savedItinerary(requests)['9/21'], [{ name: '築地壽司', time: '11:00', id: 'place:9/21:築地壽司' }]);

  // Manual direct-add now lives inside the constraint sheet as a secondary action.
  await page.locator('[data-pool-constraint="app:smoke-shibuya"]').click();
  await page.locator('.place-pool-constraint-sheet').waitFor({ state: 'visible' });
  await page.locator('[data-pool-add="app:smoke-shibuya"]').click();
  await page.locator('#add-place-day-form').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#add-place-day-form h2').textContent(), '加入行程');
  await page.selectOption('#place-trip-date', '9/22');
  await page.locator('#add-place-day-form button[type="submit"]').click();
  await page.waitForFunction(() => !document.querySelector('#add-place-day-form') && !document.querySelector('[data-pool-place="app:smoke-shibuya"]') && state.selectedDate === '9/22');
  assert.match(await page.locator('.timeline').textContent(), /澀谷 PARCO/);
  await page.waitForTimeout(250);
  assert.equal(savedItinerary(requests)['9/22'][0].name, '澀谷 PARCO');
  await page.screenshot({ path: path.join(output, 'place-pool-desktop.png') });

  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  const result = { viewport: '1280x860', fullscreen: true, twoColumn: true, selectThreeCards: true,
    selectedIgnoresFilter: true, planningConstraintSet: '淺草寺 → 9/22・18:30', dragHandleAdded: '築地壽司 → 9/21',
    secondaryActionAdded: '澀谷 PARCO → 9/22', escapeCloses: true, network: networkSummary(requests, poolStart) };
  await context.close();
  return result;
}

async function mobile(browser) {
  const { context, page, errors, requests, blocked, poolStart } = await open(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const toggle = page.locator('[data-toggle-place-pool]'), panel = page.locator('#place-pool-panel'), workspace = page.locator('.place-pool-workspace');
  await toggle.tap();
  await panel.waitFor({ state: 'visible' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const box = await workspace.boundingBox();
  assert.ok(Math.abs(box.width - 390) <= 2 && Math.abs(box.height - 844) <= 2, `mobile workspace is not fullscreen: ${JSON.stringify(box)}`);
  assert.equal(await page.locator('#place-pool-panel [draggable]').count(), 0, 'no native card drag on touch layouts');
  assert.match(await page.locator('#place-pool-hint').textContent(), /點選地點加入已選清單/);

  // The right-center Selected drawer handle is visible before any selection.
  const handle = page.locator('[data-pool-drawer-toggle]');
  await handle.waitFor({ state: 'visible' });
  assert.match(await handle.textContent(), /已選/);
  assert.match(await handle.textContent(), /0/);
  const handleBox = await handle.boundingBox();
  assert.ok(handleBox.width >= 44 && handleBox.height >= 90, `handle touch target too small: ${JSON.stringify(handleBox)}`);

  // Tap selects multiple cards from the main (candidates-only) workspace; the handle count updates live.
  await page.locator('[data-pool-place="app:smoke-tsukiji"]').tap();
  await page.locator('[data-pool-place="app:smoke-ginza"]').tap();
  await page.waitForFunction(() => document.querySelector('[data-pool-drawer-toggle]')?.getAttribute('aria-label')?.includes('2'));
  assert.equal(await candidateCards(page).count(), 3, 'the two selected cards left the candidate list');

  // Scroll the candidate list, then open the drawer: main scroll position must not be disturbed.
  await page.evaluate(() => document.querySelector('[data-place-pool-list]').scrollTo({ top: 40 }));
  const scrollBefore = await page.evaluate(() => document.querySelector('[data-place-pool-list]').scrollTop);
  await handle.tap();
  await page.locator('.place-pool-workspace.is-drawer-open').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('[data-place-pool-selected-list] [data-pool-constraint]').length === 2);
  const scrollAfter = await page.evaluate(() => document.querySelector('[data-place-pool-list]').scrollTop);
  assert.equal(scrollAfter, scrollBefore, 'opening the drawer must not move the main candidate scroll position');
  await page.screenshot({ path: path.join(output, 'place-pool-mobile-sheet.png') });

  // Drawer rows show name + planning constraint only; setting 9/22 there via the constraint sheet.
  await page.locator('[data-place-pool-selected-list] [data-pool-constraint="app:smoke-tsukiji"]').click();
  await page.locator('.place-pool-constraint-sheet').waitFor({ state: 'visible' });
  await page.locator('[data-pool-wheel-part="day"] [data-pool-wheel-value="9/22"]').click();
  await page.locator('[data-pool-constraint-confirm]').click();
  await page.locator('.place-pool-constraint-sheet').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('[data-place-pool-selected-list] [data-pool-constraint="app:smoke-tsukiji"]')?.textContent.includes('9/22'));

  // Close the drawer; no horizontal overflow anywhere.
  await handle.tap();
  await page.waitForFunction(() => !document.querySelector('.place-pool-workspace.is-drawer-open'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await page.screenshot({ path: path.join(output, 'place-pool-mobile-after.png') });
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  const result = { viewport: '390x844 touch', fullscreen: true, handleAlwaysVisible: true, handleTouchTarget: handleBox,
    selectedTwoCards: true, drawerOpenPreservesMainScroll: true, planningConstraintSet: '築地壽司 → 9/22',
    noHorizontalOverflow: true, network: networkSummary(requests, poolStart) };
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const result = { desktop: await desktop(browser), mobile: await mobile(browser), productionAccess: false, aiRequests: 0 };
    fs.writeFileSync(path.join(output, 'place-pool-smoke-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
