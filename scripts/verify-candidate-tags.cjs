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
    await page.locator('[data-area-tag-toggle="銀座"]').click();
    await page.locator('[data-area-tag-input]').fill('有樂町');
    await page.locator('[data-area-tag-add]').click();
    await page.locator('input[name="restaurantTags"][value="燒肉"]').uncheck();
    await page.locator('[data-add-restaurant-tag]').click();
    await page.locator('[data-custom-restaurant-tag]').fill('居酒屋');
    await page.locator('[data-confirm-restaurant-tag]').click();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), ['有樂町', '居酒屋']);
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['有樂町', '居酒屋']);
    assert.equal(await page.evaluate(() => state.places.length), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(pendingPlaceImports[0]) === window.originalSnapshot), true);
    // Cancel is the shipped delegated click path, and must restore the committed draft.
    await page.locator('[data-edit-import-candidate]').click();
    await page.locator('[data-area-tag-toggle="有樂町"]').click();
    await page.locator('#place-editor-form [data-close-sheet]').first().click();
    assert.deepEqual(await chips(), ['有樂町', '居酒屋']);
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['有樂町', '居酒屋']);
    // Clear both tag families and Save; reopen and selection cannot repopulate them.
    await page.locator('[data-edit-import-candidate]').click();
    await page.locator('[data-area-tag-toggle="有樂町"]').click();
    await page.locator('input[name="restaurantTags"][value="居酒屋"]').uncheck();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), []);
    assert.equal(await page.locator('.import-place-copy .place-list-tags').count(), 0);
    await page.locator('[data-edit-import-candidate]').click();
    assert.equal(await page.locator('[data-area-tags-selected] button[aria-pressed="true"]').count(), 0);
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
    await page.evaluate(() => { state.places[0].detailsLocked = true; window.savedIdentity = [state.places[0].placeId, state.places[0].latitude, state.places[0].longitude]; });
    await page.locator('.place-copy-button').first().click();
    const topEdit = page.locator('.place-detail-header-actions [data-edit-place]');
    assert.equal(await page.locator('.place-detail-sheet [data-edit-place]').count(), 1);
    assert.ok((await topEdit.boundingBox()).y < 852);
    await topEdit.click();
    assert.equal(await page.locator('#place-editor-form').getAttribute('data-editor-mode'), 'persisted-place');
    await page.locator('input[name="restaurantTags"][value="咖啡甜點"]').uncheck();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await page.locator('.place-detail-sheet .detail-area-tags .highlight-tag').allTextContents(), ['原宿', '表參道']);
    await topEdit.click();
    await page.locator('[data-area-tag-toggle="原宿"]').click();
    await page.locator('#place-editor-form [data-close-sheet]').first().click();
    assert.deepEqual(await page.locator('.place-detail-sheet .detail-area-tags .highlight-tag').allTextContents(), ['原宿', '表參道']);
    assert.equal(await page.evaluate(() => JSON.stringify(window.savedIdentity) === JSON.stringify([state.places[0].placeId, state.places[0].latitude, state.places[0].longitude])), true);
    await page.locator('.place-detail-sheet [data-close-sheet]').click();
    await page.evaluate(() => { state.places[0].areaTags = Array.from({ length: 30 }, (_, i) => '很長的地區標籤' + i); render(); });
    assert.equal(await page.locator('.place-list-tags').evaluate(e => getComputedStyle(e).flexWrap), 'wrap');
    assert.ok(await page.locator('.place-list-tags').evaluate(e => e.getBoundingClientRect().height <= 76));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    // Rematch production intake must initialize even a candidate never opened in detail.
    await page.route('**/api/social-place-import', route => route.fulfill({ json: { candidates: [{ placeId: 'rematched-ginza', name: '新候選', kind: 'restaurant', category: '餐廳', primaryType: 'hot_pot_restaurant', types: ['hot_pot_restaurant', 'restaurant', 'food'], formattedAddress: '東京都中央区銀座8丁目', countryCode: 'JP', latitude: 35.6672123, longitude: 139.7618203, sourceUrl: 'https://maps.google.com/?cid=2' }] } }));
    await page.evaluate(() => {
      state.places = []; candidateDraftStore.clear(); areaGeometryCatalog = null; areaGeometryPromise = null;
      pendingPlaceImports = [{ placeId: 'old', isSocialCandidate: true, name: '待重搜', kind: 'restaurant', candidateCategory: 'restaurant', candidateGroupId: 'rematch' }];
      sheetRoot.innerHTML = importPlacesSheetMarkup(); openImportRematchSheet('rematch');
    });
    await page.locator('[data-run-import-rematch]').click();
    await page.waitForFunction(() => candidateDraftStore.has('rematched-ginza'));
    assert.deepEqual(await page.evaluate(() => { const d = candidateDraftStore.get('rematched-ginza'); return [d.areaTags, d.restaurantTags]; }), [['銀座'], ['火鍋']]);
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['銀座', '火鍋']);
    assert.equal(await page.locator('.import-candidate-sheet').count(), 0);
    // Initial Maps analysis (not just rematch) must preserve type evidence through enrichment.
    await page.route('**/api/places', route => {
      const request = route.request().postDataJSON();
      return route.fulfill({ json: { places: request.places.map(p => ({ requestUrl: p.sourceUrl, placeId: 'maps-hotpot', name: 'Maps 火鍋', category: '餐廳', primaryType: 'hot_pot_restaurant', types: ['restaurant', 'hot_pot_restaurant'], primaryTypeDisplayName: '火鍋餐廳', formattedAddress: '東京都中央区銀座8丁目', countryCode: 'JP', latitude: 35.6672123, longitude: 139.7618203, googleMapsUrl: p.sourceUrl })) } });
    });
    await page.evaluate(() => openAddPlaceSheet({ initialText: 'https://www.google.com/maps/search/?api=1&query=TestHotpot' }));
    await page.locator('[data-analyze-places]').click();
    await page.waitForFunction(() => candidateDraftStore.has('maps-hotpot'));
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['銀座', '火鍋']);
    await page.locator('[data-preview-import-candidate]').first().click();
    assert.deepEqual(await chips(), ['銀座', '火鍋']);
    const vocabulary = () => page.evaluate(() => placesFilterModel(state.places, { placeKind: 'all' }).tags);
    assert.deepEqual(await vocabulary(), []);
    await page.evaluate(() => { window.tagPersistCalls = []; persist = () => window.tagPersistCalls.push(JSON.parse(JSON.stringify(sharedTripPayload()))); });
    const tagMetrics = selector => page.locator(selector).evaluateAll(elements => elements.map(e => {
      const r = e.getBoundingClientRect(), parent = e.parentElement.getBoundingClientRect(), css = getComputedStyle(e);
      return { text: e.textContent, x: r.x - parent.x, y: r.y - parent.y, width: r.width, height: r.height,
        weight: css.fontWeight, size: css.fontSize, padding: css.padding, border: css.borderWidth };
    }));
    const stableToggle = async (selector, chip) => {
      const before = await tagMetrics(selector);
      assert.ok(before.every(m => m.weight === '400' && !m.text.includes('×')));
      await page.locator(selector).evaluateAll(elements => elements.forEach(e => e.__sameChip = true));
      await chip.click();
      assert.deepEqual(await tagMetrics(selector), before, 'toggle must preserve every chip position, size and font');
      assert.equal(await page.locator(selector).evaluateAll(elements => elements.every(e => e.__sameChip)), true);
    };
    const stableCustomInput = async () => {
      const row = page.locator('.tag-add-row');
      const dimensions = () => row.evaluate(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
      const before = await dimensions(), chipsBefore = await tagMetrics('.restaurant-tag-options label');
      await page.locator('[data-add-restaurant-tag]').click();
      assert.deepEqual(await dimensions(), before);
      await page.locator('[data-custom-restaurant-tag]').fill('placeholder width should never stretch the chips');
      assert.deepEqual(await dimensions(), before);
      assert.deepEqual(await tagMetrics('.restaurant-tag-options label'), chipsBefore);
      await page.locator('[data-cancel-restaurant-tag]').click();
      assert.deepEqual(await dimensions(), before);
      assert.deepEqual(await tagMetrics('.restaurant-tag-options label'), chipsBefore);
    };
    const removeHotpot = () => page.locator('.restaurant-tag-options label:has(input[value="火鍋"])');
    await page.locator('[data-edit-import-candidate]').click();
    assert.equal(await removeHotpot().isVisible(), true);
    await stableCustomInput();
    await stableToggle('.restaurant-tag-options label', removeHotpot());
    await stableToggle('[data-area-tags-options] button', page.locator('[data-area-tag-toggle="銀座"]'));
    assert.equal(await page.locator('.restaurant-tag-options input:checked').count(), 0);
    assert.deepEqual(await page.evaluate(() => candidateDraftStore.get('maps-hotpot').restaurantTags), ['火鍋']);
    await page.locator('#place-editor-form [data-close-sheet]').first().click();
    assert.deepEqual(await chips(), ['銀座', '火鍋']);
    await page.locator('[data-edit-import-candidate]').click();
    await removeHotpot().click();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), ['銀座']);
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['銀座']);
    await page.locator('[data-edit-import-candidate]').click();
    assert.equal(await page.locator('.restaurant-tag-options input:checked').count(), 0);
    await page.locator('[data-add-restaurant-tag]').click();
    await page.locator('[data-custom-restaurant-tag]').fill('未加入自訂餐廳');
    await page.locator('[data-confirm-restaurant-tag]').click();
    await page.locator('[data-area-tag-input]').fill('未加入自訂地區');
    await page.locator('[data-area-tag-add]').click();
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await vocabulary(), []);
    assert.deepEqual(await page.evaluate(() => AreaTags.tripTags(state.places)), []);
    await page.locator('[data-close-import-candidate]').first().click();
    const choice = () => page.locator('[data-social-place-candidate]').first();
    await choice().uncheck(); assert.deepEqual(await vocabulary(), []);
    await choice().check(); assert.deepEqual(await vocabulary(), []);
    await choice().uncheck();
    await page.locator('#import-places-form [data-close-sheet]').first().click();
    assert.deepEqual(await vocabulary(), []);
    assert.equal(await page.evaluate(() => candidateDraftStore.size), 0);
    assert.equal(await page.evaluate(() => window.tagPersistCalls.length), 0);
    // Fresh session; only successful batch add introduces the new tag to the Trip.
    await page.evaluate(() => openAddPlaceSheet({ initialText: 'https://www.google.com/maps/search/?api=1&query=TestHotpot' }));
    await page.locator('[data-analyze-places]').click();
    await page.waitForFunction(() => candidateDraftStore.has('maps-hotpot'));
    assert.deepEqual(await vocabulary(), []);
    await choice().uncheck(); assert.deepEqual(await vocabulary(), []);
    await choice().check(); assert.deepEqual(await vocabulary(), []);
    await page.locator('[data-preview-import-candidate]').first().click();
    await page.locator('[data-edit-import-candidate]').click();
    assert.equal(await page.locator('.restaurant-tag-options').innerText(), '火鍋');
    await stableToggle('.restaurant-tag-options label', removeHotpot());
    const beforeAdd = await tagMetrics('.restaurant-tag-options label');
    await page.locator('[data-add-restaurant-tag]').click();
    await page.locator('[data-custom-restaurant-tag]').fill('麻辣鍋');
    await page.locator('[data-confirm-restaurant-tag]').click();
    assert.deepEqual((await tagMetrics('.restaurant-tag-options label')).slice(0, 1), beforeAdd);
    assert.equal(await page.locator('.restaurant-tag-options label').first().evaluate(e => e.__sameChip), true);
    assert.deepEqual(await vocabulary(), []);
    assert.equal(await page.evaluate(() => window.tagPersistCalls.length), 0);
    await page.locator('#place-editor-form button[type="submit"]').click();
    assert.deepEqual(await chips(), ['銀座', '麻辣鍋']);
    assert.deepEqual(await page.locator('.import-place-copy .place-list-tags .highlight-tag').allTextContents(), ['銀座', '麻辣鍋']);
    assert.deepEqual(await vocabulary(), []);
    await page.locator('[data-close-import-candidate]').first().click();
    await page.locator('#import-places-form button[type="submit"]').click();
    assert.deepEqual(await vocabulary(), ['麻辣鍋']);
    assert.deepEqual(await page.evaluate(() => state.places[0].restaurantTags), ['麻辣鍋']);
    assert.equal(await page.evaluate(() => window.tagPersistCalls.length), 1);
    // Actual switch handler and hydrated response, not swapping state.places in the test.
    const tripA = await page.evaluate(() => { state.places[0].detailsLocked = true; return { id: state.tripId, ...sharedTripPayload(), revision: 100 }; });
    await page.route('**/api/trip?*', route => route.fulfill({ json: new URL(route.request().url()).searchParams.get('id') === 'trip-b'
      ? { ...tripA, id: 'trip-b', title: 'Empty Trip B', places: [], votes: {}, itinerary: {}, transports: [] } : tripA }));
    await page.evaluate(() => { state.trips.push({ id: 'trip-b', title: 'Empty Trip B' }); openTripsSheet(); });
    await page.locator('[data-switch-trip="trip-b"]').click();
    await page.waitForFunction(() => state.tripId === 'trip-b' && tripIsHydrated());
    assert.deepEqual(await vocabulary(), []);
    assert.equal(await page.locator('[data-restaurant-tag-filter]').count(), 0);
    await page.evaluate(() => openTripsSheet());
    await page.locator('[data-switch-trip="test"]').click();
    await page.waitForFunction(() => state.tripId === 'test' && tripIsHydrated());
    assert.deepEqual(await vocabulary(), ['麻辣鍋']);
    assert.deepEqual(await page.locator('.place-copy .highlight-tag').allTextContents(), ['銀座', '麻辣鍋']);
    // Two persisted places share a tag. Every mutation below goes through the real editor Save.
    await page.evaluate(() => {
      const base = { ...state.places[0], areaTags: [], restaurantTags: ['火鍋'], formattedAddress: '測試地址', manualAddress: '測試地址',
        address: '測試地址', addressComponents: [], addressComponentsOriginal: [], latitude: null, longitude: null };
      state.places = [{ ...base, id: 'a', name: 'Place A', fullName: 'Place A', placeId: 'persisted-a' }, { ...base, id: 'b', name: 'Place B', fullName: 'Place B', placeId: 'persisted-b' }];
      render();
    });
    for (const [index, expected] of [[0, ['火鍋']], [1, []]]) {
      await page.locator(`.place-copy-button[data-open-place="app:${index === 0 ? 'a' : 'b'}"]`).click();
      await page.locator('.place-detail-header-actions [data-edit-place]').click();
      const emptyRow = page.locator('[data-area-tags-options]');
      assert.equal(await emptyRow.locator('button').count(), 0);
      assert.equal(await emptyRow.evaluate(e => e.getBoundingClientRect().height), 0);
      assert.equal(await emptyRow.evaluate(e => getComputedStyle(e).display), 'none');
      assert.equal(await page.locator('[data-area-tag-address-suggestions]').count(), 0);
      // Header and add input are adjacent visible rows, with only the intended 10px gap.
      assert.equal(await page.locator('[data-area-tag-editor]').evaluate(e =>
        e.querySelector('.area-tag-autocomplete').getBoundingClientRect().top - e.querySelector('strong').getBoundingClientRect().bottom), 10);
      // Regular font and same-row wrapping for four restaurant chips, also after custom add/blur.
      await stableCustomInput();
      if (index === 0) {
        for (const tag of ['拉麵', '燒肉', '牛排']) {
          await page.locator('[data-add-restaurant-tag]').click();
          await page.locator('[data-custom-restaurant-tag]').fill(tag);
          await page.locator('[data-confirm-restaurant-tag]').click();
        }
        const four = await tagMetrics('.restaurant-tag-options label');
        assert.equal(new Set(four.map(m => m.y)).size, 1);
        for (const tag of ['拉麵', '燒肉', '牛排']) await stableToggle('.restaurant-tag-options label', page.locator(`.restaurant-tag-options label:has(input[value="${tag}"])`));
        for (const tag of ['銀座', '新宿', '原宿', '表參道']) {
          const input = page.locator('[data-area-tag-input]');
          const before = await input.boundingBox();
          await input.fill(tag);
          assert.deepEqual(await input.boundingBox(), before, 'focus/fill cannot resize the independent area input');
          await page.locator('[data-area-tag-add]').click();
        }
        for (const tag of ['銀座', '新宿', '原宿', '表參道']) await stableToggle('[data-area-tags-options] button', page.locator(`[data-area-tag-toggle="${tag}"]`));
        // Persisted Cancel discards both families, including new custom values.
        await page.locator('#place-editor-form [data-close-sheet]').first().click();
        assert.deepEqual(await page.evaluate(() => [state.places[0].restaurantTags, state.places[0].areaTags]), [['火鍋'], []]);
        await page.locator('.place-detail-header-actions [data-edit-place]').click();
      }
      await stableToggle('.restaurant-tag-options label', removeHotpot());
      await page.locator('#place-editor-form button[type="submit"]').click();
      assert.deepEqual(await vocabulary(), expected);
      assert.deepEqual(await page.evaluate(index => state.places.find(p => p.id === (index === 0 ? 'a' : 'b')).restaurantTags, index), []);
      assert.equal(await page.locator('.place-detail-sheet .detail-area-tags').count(), 0);
      await page.locator('.place-detail-sheet [data-close-sheet]').click();
    }
    assert.equal(await page.locator('.place-copy .highlight-tag').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS stable no-icon toggle chips, 400 weight/same footprints/row positions/node identity, fixed custom inputs, hidden empty area row; hot_pot -> custom replacement -> Save -> batch -> persisted vocabulary; abandoned draft isolation; shared A/B removal; real browser structured intake/list and persisted top Edit: click -> editor open/bind -> submit -> restore -> detail; Cancel; clear/reopen/select; batch-add; persisted render -> Places card; 393px wrap/height/overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
