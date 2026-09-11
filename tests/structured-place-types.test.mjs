import assert from 'node:assert/strict';
import test from 'node:test';
import placesHandler from '../api/places.mjs';

test('search and exact-details responses retain specific Google types without extra lookups', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = 'test';
  const calls = [];
  const place = { id: 'specific-place', displayName: { text: 'Test' }, primaryType: 'hot_pot_restaurant',
    types: ['hot_pot_restaurant', 'restaurant', 'food'], primaryTypeDisplayName: { text: '火鍋餐廳' },
    addressComponents: [{ longText: '日本', shortText: 'JP', types: ['country'] }],
    location: { latitude: 35.67, longitude: 139.76 } };
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), mask: options.headers['X-Goog-FieldMask'] });
    return Response.json(String(url).includes('places:searchText') ? { places: [place] } : place);
  };
  try {
    for (const input of [{ hintName: 'Test', sourceUrl: 'https://www.google.com/maps/search/?api=1&query=Test' },
      { resolveDetails: true, placeId: 'specific-place' }]) {
      const response = { status(code) { this.code = code; return this; }, setHeader() {}, json(body) { this.body = body; } };
      const offset = calls.length;
      await placesHandler({ method: 'POST', body: { places: [input] } }, response);
      assert.equal(response.code, 200);
      const result = response.body.places[0];
      assert.equal(result.primaryType, 'hot_pot_restaurant');
      assert.deepEqual(result.types, place.types);
      assert.equal(result.primaryTypeDisplayName, '火鍋餐廳');
      assert.equal(result.placeId, 'specific-place');
      assert.equal(calls.length - offset, 2, 'existing primary request plus local-language address request only');
      const mask = calls[offset].mask.split(',');
      assert.ok(mask.includes(input.resolveDetails ? 'primaryType' : 'places.primaryType'));
      assert.ok(mask.includes(input.resolveDetails ? 'types' : 'places.types'));
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = previousKey;
  }
});
