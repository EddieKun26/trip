// Local-only browser acceptance. NODE_PATH may point to the bundled Playwright runtime.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.env.POLISH_SMOKE_OUTPUT || root;
const catalog = require('../lib/canonical-travel-catalog.js').catalog;
const place = { ...catalog.ebisu, id: 'synthetic-ebisu', placeId: 'synthetic-google-id', name: 'Local smoke',
  kind: 'restaurant', category: '餐廳', mark: 'L', swatch: '#123456', formattedAddress: 'Synthetic address',
  latitude: 35.643, longitude: 139.709, travelAreaResolved: true, travelAreaSource: 'automatic',
  travelAreaResolver: 'JP_TRAVEL_AREA', travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved',
  areaTags: ['惠比壽西'], restaurantTags: ['燒肉'], contentTags: ['晚餐候選'], description: 'Local only '.repeat(50) };
const payload = { id: 'b', title: 'Local synthetic smoke', destination: '東京', revision: 1,
  startDate: '2026-09-20', endDate: '2026-09-23', places: [place], flights: [], itinerary: {}, votes: {},
  members: { alice: 'alice' }, ownerId: 'alice', transports: [] };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      assert.equal(url.origin, 'http://127.0.0.1:4179', 'all external traffic is blocked');
      if (url.pathname.startsWith('/api/')) {
        requests.push({ path: url.pathname, method: req.method() });
        const data = url.pathname === '/api/trips' ? { trips: [{ id: 'b' }] }
          : url.pathname === '/api/trip' ? req.method() === 'PUT' ? { revision: 2 } : payload
          : url.pathname === '/api/shopping' ? { items: [], categories: [], tags: [], photos: {} } : {};
        return route.fulfill({ json: data });
      }
      const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      assert.ok(file.startsWith(root + path.sep));
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      const ext = path.extname(file), contentType = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
      return route.fulfill({ body: fs.readFileSync(file), contentType });
    });
    await page.addInitScript(() => {
      localStorage.setItem('tokyo-profile-v1', JSON.stringify({ id: 'alice', nickname: 'alice', authVersion: 2 }));
      localStorage.setItem('active-trip-v2:alice', '"b"');
      localStorage.setItem('trip-ui-v1:alice:b', '{"mainTab":"places"}');
      localStorage.setItem('tokyo-clean-test-data-v4', 'done');
    });
    await page.goto('http://127.0.0.1:4179/');
    await page.waitForFunction(() => state.hydrationStatus === 'ready' && state.tripId === 'b');
    assert.equal(await page.locator('label[for="places-filter-section"]').textContent(), '主要地區');
    await page.evaluate(() => openPlaceEditSheet('Local smoke'));
    await page.locator('[data-place-normal-actions]').waitFor({ state: 'visible' });
    const start = requests.length;
    for (const [mode, add, input] of [
      ['area', '[data-open-area-tag]', '[data-area-tag-input]'],
      ['restaurant', '[data-add-restaurant-tag]', '[data-custom-restaurant-tag]'],
      ['content', '[data-add-content-tag]', '[data-custom-content-tag]'],
    ]) {
      await page.locator(add).click(); await page.locator(input).fill('手機測試' + mode);
      await page.setViewportSize({ width: 390, height: 390 });
      await page.waitForFunction(() => document.querySelector('#place-editor-form').style.maxHeight.includes('350px'));
      assert.equal(await page.locator('[data-place-normal-actions]').isVisible(), false);
      assert.equal(await page.locator('[data-place-tag-actions]').isVisible(), true);
      assert.equal(await page.locator(input).evaluate(el => document.activeElement === el), true);
      assert.equal(await page.locator('.tag-custom-entry button').count(), 0);
      const box = await page.locator('[data-place-tag-actions]').boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= 391, JSON.stringify(box));
      await page.waitForFunction(selector => {
        const field = document.querySelector(selector).getBoundingClientRect();
        const footer = document.querySelector('[data-place-tag-actions]').getBoundingClientRect();
        return field.top >= 20 && field.bottom <= footer.top;
      }, input);
      if (mode === 'content') await page.screenshot({ path: path.join(output, 'place-polish-mobile-nested.png') });
      await page.locator('[data-confirm-nested-tag]').click();
      assert.equal(await page.locator('[data-place-normal-actions]').isVisible(), true);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator(add).click(); await page.locator(input).fill('discard');
      const draft = await page.evaluate(() => JSON.stringify(document.querySelector('#place-editor-form').placeEditorSession.contentTags));
      await page.locator('[data-cancel-nested-tag]').click();
      assert.equal(await page.locator('#place-editor-form').count(), 1);
      assert.equal(await page.evaluate(() => JSON.stringify(document.querySelector('#place-editor-form').placeEditorSession.contentTags)), draft);
    }
    assert.equal(requests.length, start, 'nested interactions have no network effects');
    await page.screenshot({ path: path.join(output, 'place-polish-mobile-normal.png') });
    await page.evaluate(() => { closeSheet(); openPlaceSheet('Local smoke', { refreshDetails: false }); });
    await page.locator('.place-detail-sheet [data-vote]').scrollIntoViewIfNeeded();
    await page.evaluate(() => { window.originalDetail = document.querySelector('.place-detail-sheet'); window.originalScroll = originalDetail.scrollTop; });
    const before = requests.length;
    for (const active of [true, false]) {
      await page.locator('.place-detail-sheet [data-vote]').click();
      await page.waitForFunction(value => document.querySelector('.place-detail-sheet [data-vote]').getAttribute('aria-pressed') === String(value), active);
      assert.equal(await page.evaluate(() => originalDetail === document.querySelector('.place-detail-sheet') && originalDetail.scrollTop === originalScroll), true);
      await page.waitForTimeout(180);
    }
    assert.deepEqual(requests.slice(before), [{ path: '/api/trip', method: 'PUT' }, { path: '/api/trip', method: 'PUT' }]);
    assert.equal(await page.locator('#toast-root').textContent(), '');
    assert.deepEqual(errors, []);
    const result = { mobileViewport: '390x844 / keyboard simulation 390x390', nestedModes: 3,
      inputFocusPreserved: true, footerVisibleAboveSimulatedKeyboard: true, nestedNetworkCalls: 0,
      detailIdentityPreserved: true, scrollTop: await page.evaluate(() => originalScroll), favoritePuts: 2,
      successToasts: 0, geocodeDetailsPhotoCalls: 0, realIPhoneKeyboard: 'not exercised' };
    fs.writeFileSync(path.join(output, 'place-polish-mobile-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
