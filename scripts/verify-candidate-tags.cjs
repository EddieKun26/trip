// Real browser integration; all requests are fulfilled locally. No production App access.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/data/area-geometry/')) return route.fulfill({ contentType: 'application/json', body: fs.readFileSync('data/area-geometry/travel-area-boundaries.json') });
      return route.fulfill({ contentType: route.request().resourceType() === 'document' ? 'text/html' : 'application/json', body: route.request().resourceType() === 'document' ? fs.readFileSync('index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '') : '{}' });
    });
    await page.goto('http://local.test/');
    await page.addStyleTag({ content: fs.readFileSync('styles.css', 'utf8') });
    for (const file of ['lib/travel-area-audit.js', 'lib/area-tags.js', 'app.js']) {
      await page.addScriptTag({ content: fs.readFileSync(file, 'utf8').replace(/\bstartApp\(\);\s*$/, '') });
    }
    await page.evaluate(async () => {
      Object.assign(state, { tripId: 'test', trips: [{ id: 'test' }], tripTitle: '測試', destination: '東京', profile: { id: 'tester', nickname: 'Test' }, isGuest: false, hydrationStatus: 'ready', activeTab: 'places', placesMode: 'list', placeKind: 'all', places: [], votes: {}, itinerary: {}, transports: [], startDate: '2026-09-11', endDate: '2026-09-12' });
      state.hydratedMemberId = currentMemberId(); state.hydratedTripId = state.tripId;
      // Only persistence I/O is stubbed, never navigation, binding, Save, or rendering.
      persist = () => {};
      await loadAreaGeometry();
      pendingPlaceImports = [{ placeId: 'candidate-ginza', name: '候選餐廳', kind: 'restaurant', category: '燒肉店', formattedAddress: '東京都中央区銀座8丁目', countryCode: 'JP', latitude: 35.6672123, longitude: 139.7618203, canImport: true, selected: false, candidateGroupId: 'one', candidateRank: 1, sourceUrl: 'https://maps.google.com/?cid=1', photos: [], areaTags: [] }];
      window.originalSnapshot = JSON.stringify(pendingPlaceImports[0]);
      sheetRoot.innerHTML = importPlacesSheetMarkup();
      renderImportPreview(); updateImportConfirmState();
    });
    await page.locator('[data-preview-import-candidate]').first().click();
    const chips = () => page.locator('.import-candidate-sheet .highlight-tag').allTextContents();
    assert.deepEqual(await chips(), ['銀座', '燒肉']);
    await page.locator('[data-edit-import-candidate]').click();
    await page.locator('[data-area-tag-remove="銀座"]').click();
    await page.locator('[data-area-tag-input]').fill('有樂町');
    await page.locator('[data-area-tag-add]').click();
    await page.locator('input[name="restaurantTags"][value="燒肉"]').uncheck();
    await page.locator('[data-add-restaurant-tag]').click();
    await page.locator('[data-custom-restaurant-tag]').fill('居酒屋');
    await page.locator('[data-confirm-restaurant-tag]').click();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), ['有樂町', '居酒屋']);
    assert.equal(await page.evaluate(() => state.places.length), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(pendingPlaceImports[0]) === window.originalSnapshot), true);
    // Cancel is the shipped delegated click path, and must restore the committed draft.
    await page.locator('[data-edit-import-candidate]').click();
    await page.locator('[data-area-tag-remove="有樂町"]').click();
    await page.locator('#place-editor-form [data-close-sheet]').first().click();
    assert.deepEqual(await chips(), ['有樂町', '居酒屋']);
    // Clear both tag families and Save; reopen and selection cannot repopulate them.
    await page.locator('[data-edit-import-candidate]').click();
    await page.locator('[data-area-tag-remove="有樂町"]').click();
    await page.locator('input[name="restaurantTags"][value="居酒屋"]').uncheck();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), []);
    await page.locator('[data-edit-import-candidate]').click();
    assert.equal(await page.locator('[data-area-tags-selected] button').count(), 0);
    assert.equal(await page.locator('input[name="restaurantTags"]:checked').count(), 0);
    await page.locator('#place-editor-form [data-close-sheet]').first().click();
    await page.evaluate(() => {
      const p = pendingPlaceImports[0];
      selectImportCandidate(p.candidateGroupId, p.placeId, true);
      selectImportCandidate(p.candidateGroupId, p.placeId, false);
      selectImportCandidate(p.candidateGroupId, p.placeId, true);
      closeImportCandidatePreview();
    });
    await page.locator('#import-places-form button[type="submit"]').click();
    assert.deepEqual(await page.evaluate(() => [state.places[0].areaTags, state.places[0].restaurantTags]), [[], []]);
    assert.equal(await page.locator('.place-list-tags').count(), 0);
    // Persisted place -> real render -> placesScreen -> card DOM, independent of draft Map.
    await page.evaluate(() => {
      state.places[0].areaTags = ['原宿', '表參道']; state.places[0].restaurantTags = ['咖啡甜點'];
      candidateDraftStore.set('candidate-ginza', { areaTags: ['錯誤草稿'] });
      render();
    });
    assert.deepEqual(await page.locator('.place-list-tags .highlight-tag').allTextContents(), ['原宿', '表參道', '咖啡甜點']);
    await page.evaluate(() => { state.places[0].areaTags = Array.from({ length: 30 }, (_, i) => '很長的地區標籤' + i); render(); });
    assert.equal(await page.locator('.place-list-tags').evaluate(e => getComputedStyle(e).flexWrap), 'wrap');
    assert.ok(await page.locator('.place-list-tags').evaluate(e => e.getBoundingClientRect().height <= 76));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    // Rematch production intake must initialize even a candidate never opened in detail.
    await page.route('**/api/social-place-import', route => route.fulfill({ json: { candidates: [{ placeId: 'rematched-ginza', name: '新候選', kind: 'restaurant', category: '燒肉店', formattedAddress: '東京都中央区銀座8丁目', countryCode: 'JP', latitude: 35.6672123, longitude: 139.7618203, sourceUrl: 'https://maps.google.com/?cid=2' }] } }));
    await page.evaluate(() => {
      state.places = []; candidateDraftStore.clear(); areaGeometryCatalog = null; areaGeometryPromise = null;
      pendingPlaceImports = [{ placeId: 'old', isSocialCandidate: true, name: '待重搜', kind: 'restaurant', candidateCategory: 'restaurant', candidateGroupId: 'rematch' }];
      sheetRoot.innerHTML = importPlacesSheetMarkup(); openImportRematchSheet('rematch');
    });
    await page.locator('[data-run-import-rematch]').click();
    await page.waitForFunction(() => candidateDraftStore.has('rematched-ginza'));
    assert.deepEqual(await page.evaluate(() => { const d = candidateDraftStore.get('rematched-ginza'); return [d.areaTags, d.restaurantTags]; }), [['銀座'], ['燒肉']]);
    assert.equal(await page.locator('.import-candidate-sheet').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS real browser: click -> editor open/bind -> submit -> restore -> detail; Cancel; clear/reopen/select; batch-add; persisted render -> Places card; 393px wrap/height/overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
