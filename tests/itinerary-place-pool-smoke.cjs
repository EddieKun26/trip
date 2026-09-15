// Local-only browser acceptance for the Itinerary Place Pool. NODE_PATH may point to an installed
// Playwright runtime. Every request is served from this checkout or a synthetic API stub; no backend.
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
  // identical on the unmodified baseline) settle before the Place Pool phase is measured.
  await page.waitForTimeout(2500);
  await page.evaluate(() => { state.selectedDate = '9/20'; render(); });
  return { context, page, errors, requests, blocked, poolStart: requests.length };
}

const cards = (page) => page.locator('#place-pool-panel [data-pool-place]');
const savedItinerary = (requests) => {
  const put = requests.filter((request) => request.method === 'PUT' && request.path === '/api/trip').at(-1);
  return put ? JSON.parse(put.body).itinerary : null;
};
function networkSummary(requests, poolStart) {
  const describe = (list) => list.map((request) => `${request.method} ${request.path}`);
  const pool = describe(requests.slice(poolStart));
  assert.ok(pool.every((entry) => entry === 'PUT /api/trip'), `Place Pool phase made non-Trip requests: ${JSON.stringify(pool)}`);
  return { startup: describe(requests.slice(0, poolStart)), poolPhase: pool };
}

async function desktop(browser) {
  const { context, page, errors, requests, blocked, poolStart } = await open(browser, { viewport: { width: 1280, height: 860 } });
  const toggle = page.locator('[data-toggle-place-pool]'), panel = page.locator('#place-pool-panel');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.getAttribute('aria-controls'), 'place-pool-panel');
  assert.equal(await panel.isVisible(), false);
  assert.match(await toggle.textContent(), /地點池\s*5/);
  await toggle.click();
  await panel.waitFor({ state: 'visible' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const phone = await page.locator('.phone').boundingBox(), drawer = await page.locator('.place-pool-panel').boundingBox();
  assert.ok(phone.x + phone.width <= drawer.x, `docked drawer overlaps phone: ${JSON.stringify({ phone, drawer })}`);
  assert.equal(await page.locator('.place-pool-backdrop').isVisible(), false);
  assert.equal(await cards(page).count(), 5);
  assert.equal(await cards(page).first().getAttribute('draggable'), 'true');
  await page.locator('.place-pool-close').click();
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await toggle.click();
  await panel.waitFor({ state: 'visible' });

  await page.selectOption('#place-pool-filter-section', { label: '上野・淺草・秋葉原' });
  await page.waitForFunction(() => document.querySelectorAll('#place-pool-panel [data-pool-place]').length === 2);
  await page.selectOption('#place-pool-filter-section', '');
  await page.selectOption('#place-pool-filter-kind', 'lodging');
  await page.waitForFunction(() => document.querySelectorAll('#place-pool-panel [data-pool-place]').length === 1);
  await page.selectOption('#place-pool-filter-kind', 'all');
  await page.locator('[data-place-pool-favorite]').click();
  await page.waitForFunction(() => document.querySelectorAll('#place-pool-panel [data-pool-place]').length === 1);
  assert.match(await cards(page).first().textContent(), /上野動物園/);
  await page.locator('[data-place-pool-favorite]').click();
  await page.waitForFunction(() => document.querySelectorAll('#place-pool-panel [data-pool-place]').length === 5);
  assert.equal(requests.slice(poolStart).length, 0, 'opening, closing and filtering make no requests');

  await page.locator('[data-pool-place="app:smoke-asakusa"]').dragTo(page.locator('.date-button[data-date="9/21"]'));
  await page.waitForFunction(() => !document.querySelector('[data-pool-place="app:smoke-asakusa"]') && state.selectedDate === '9/21');
  assert.match(await page.locator('.timeline').textContent(), /淺草寺/);
  assert.equal(await page.evaluate(() => document.body.classList.contains('place-pool-dragging')), false);
  await page.waitForTimeout(250);
  assert.deepEqual(savedItinerary(requests)['9/21'], [{ name: '淺草寺', time: '11:00', id: 'place:9/21:淺草寺' }]);

  await page.locator('[data-pool-place="app:smoke-ueno"]').click();
  await page.locator('#add-place-day-form').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#add-place-day-form h2').textContent(), '加入行程');
  await page.selectOption('#place-trip-date', '9/22');
  await page.locator('#add-place-day-form button[type="submit"]').click();
  await page.waitForFunction(() => !document.querySelector('#add-place-day-form') && !document.querySelector('[data-pool-place="app:smoke-ueno"]') && state.selectedDate === '9/22');
  assert.match(await page.locator('.timeline').textContent(), /上野動物園/);
  await page.waitForTimeout(250);
  assert.equal(savedItinerary(requests)['9/22'][0].name, '上野動物園');
  await page.screenshot({ path: path.join(output, 'place-pool-desktop.png') });

  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  const result = { viewport: '1280x860', dockedBesidePhone: true, filters: 'section/kind/favorite', dragAdded: '淺草寺 → 9/21',
    clickFallbackAdded: '上野動物園 → 9/22', escapeCloses: true, network: networkSummary(requests, poolStart) };
  await context.close();
  return result;
}

async function mobile(browser) {
  const { context, page, errors, requests, blocked, poolStart } = await open(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const toggle = page.locator('[data-toggle-place-pool]'), panel = page.locator('#place-pool-panel');
  await toggle.tap();
  await panel.waitFor({ state: 'visible' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const sheet = await page.locator('.place-pool-panel').boundingBox();
  assert.ok(Math.abs(sheet.y + sheet.height - 844) <= 1 && sheet.width >= 389, `bottom sheet box ${JSON.stringify(sheet)}`);
  assert.equal(await page.locator('.place-pool-backdrop').isVisible(), true);
  assert.equal(await page.locator('#place-pool-panel [draggable]').count(), 0);
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector('.stage')).paddingRight), '408px', 'desktop dock is not applied');
  assert.match(await page.locator('#place-pool-hint').textContent(), /點選地點/);

  await page.selectOption('#place-pool-filter-kind', 'restaurant');
  await page.waitForFunction(() => document.querySelectorAll('#place-pool-panel [data-pool-place]').length === 1);
  await page.screenshot({ path: path.join(output, 'place-pool-mobile-sheet.png') });
  await page.locator('[data-pool-place="app:smoke-tsukiji"]').tap();
  const form = page.locator('#add-place-day-form');
  await form.waitFor({ state: 'visible' });
  const formBox = await form.boundingBox();
  const topmost = await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('#add-place-day-form')), { x: formBox.x + formBox.width / 2, y: formBox.y + 30 });
  assert.equal(topmost, true, 'date sheet sits above the Place Pool');
  await page.selectOption('#place-trip-date', '9/22');
  await page.locator('#add-place-day-form button[type="submit"]').tap();
  await page.waitForFunction(() => !document.querySelector('#add-place-day-form') && state.selectedDate === '9/22');
  assert.equal(await panel.isVisible(), true);
  assert.equal(await page.locator('[data-pool-place="app:smoke-tsukiji"]').count(), 0);
  assert.equal(await page.locator('.place-pool-empty').textContent(), '沒有符合篩選的未安排地點');
  await page.locator('.place-pool-close').tap();
  await panel.waitFor({ state: 'hidden' });
  assert.match(await page.locator('.timeline').textContent(), /築地壽司/);
  assert.match(await toggle.textContent(), /地點池\s*4/);
  await page.waitForTimeout(250);
  assert.equal(savedItinerary(requests)['9/22'][0].name, '築地壽司');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await page.screenshot({ path: path.join(output, 'place-pool-mobile-after.png') });
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  const result = { viewport: '390x844 touch', bottomSheet: true, draggableCards: 0, filter: 'kind=restaurant', tapAdded: '築地壽司 → 9/22',
    dateSheetAbovePool: true, noHorizontalOverflow: true, network: networkSummary(requests, poolStart) };
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
