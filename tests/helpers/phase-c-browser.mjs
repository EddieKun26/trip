import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import PlanningGeography from '../../lib/planning-geography.js';
import canonicalCatalog from '../../lib/canonical-travel-catalog.js';
import AreaTags from '../../lib/area-tags.js';
import audit from '../../lib/travel-area-audit.js';
import migration from '../../lib/canonical-travel-migration.js';
import manifest from '../../lib/canonical-travel-manifest.js';
import { tagOptionsNode } from './tag-options-node.mjs';

const { catalog } = canonicalCatalog;
const { getPlacePlanningGeography: geo } = PlanningGeography;
const source = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const json = value => JSON.parse(JSON.stringify(value));
function place(key, extra = {}) {
  return { ...catalog[key], id: `synthetic-${key}`, placeId: `google-${key}`, name: `Place ${key}`,
    kind: 'attraction', category: '景點', mark: 'P', swatch: '#123456',
    travelAreaResolved: true, travelAreaSource: 'automatic', travelAreaResolver: 'JP_TRAVEL_AREA',
    travelAreaResolutionVersion: 5, travelAreaResolutionStatus: 'resolved', travelAreaResolutionError: '',
    formattedAddress: 'Synthetic address', latitude: 35.6428156, longitude: 139.6972423,
    areaTags: ['Raw locality'], restaurantTags: [], ...extra };
}


const startup = readFileSync(new URL('../startup.test.mjs', import.meta.url), 'utf8');
const fixture = startup.slice(startup.indexOf('const member ='), startup.indexOf('\ntest('))
  .replace('vm.createContext({ AreaTags,', 'vm.createContext({ PlanningGeography, AreaTags,');
const browser = new Function('AreaTags', 'audit', 'migration', 'manifest', 'canonicalCatalog', 'PlanningGeography', 'source', 'assert', 'vm',
  `${fixture}; return browser;`)(AreaTags, audit, migration, manifest, canonicalCatalog, PlanningGeography, source, assert, vm);
function trip(places) {
  return { id: 'b', title: 'Phase C synthetic trip', destination: '東京', revision: 1,
    startDate: '2026-09-20', endDate: '2026-09-23', places, flights: [], itinerary: {}, votes: {},
    members: { alice: 'alice' }, ownerId: 'alice', transports: [] };
}
async function boot(payload) {
  const b = browser({ canonical: true, stored: { 'active-trip-v2:alice': '"b"', 'trip-ui-v1:alice:b': '{"mainTab":"places"}' } });
  await b.list(['b']); await b.ready('b', payload);
  assert.equal(b.state.hydrationStatus, 'ready');
  return b;
}


function editorForm(existing) {
  const node = (value = '') => ({ value, dataset: {}, disabled: false, hidden: false, listeners: {}, ...tagOptionsNode(),
    setAttribute() {}, removeAttribute() {}, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    fire(type, event) { for (const fn of this.listeners[type] || []) fn(event); } });
  const form = node();
  Object.assign(form, { id: 'place-editor-form', isConnected: true, dataset: { originalPlaceName: existing.name, originalAddress: existing.formattedAddress } });
  form.elements = Object.fromEntries(['name', 'address', 'sourceUrl', 'referenceUrl', 'sourcePlatform', 'sourceLodgingName', 'sourceListingId',
    'photoOrigin', 'travelAreaKey', 'kind', 'category'].map(key => [key, node(key === 'address' ? existing.formattedAddress : existing[key] || '')]));
  const nodes = new Map();
  form.querySelector = selector => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  form.querySelectorAll = () => Object.values(form.elements);
  return form;
}


function bindFullEditor(b) {
  const existing = b.state.places[0], form = editorForm(existing);
  // Match the actual select: noncatalog records have the empty preserve-only option.
  form.elements.travelAreaKey.value = geo(existing)?.primaryAreaKey || '';
  b.context.FormData = class {
    constructor(target) { this.target = target; }
    get(key) { return this.target.elements?.[key]?.value ?? this.target.values?.[key] ?? null; }
    getAll() { return []; }
  };
  b.context.form = form;
  b.run('bindPlaceEditor(form, state.places[0], {})');
  return form;
}
function edit(form, key, value) {
  Object.assign(form.elements[key], { name: key, value });
  form.fire('input', { target: form.elements[key] });
}
async function submitFull(b, form, resolved) {
  const pending = Promise.all(b.listeners.submit.map(submit => submit({ target: form, preventDefault() {} })));
  const request = b.requests.find(r => r.url === '/api/places' && !r.replied);
  if (request) await b.reply(request, { places: [resolved || place('shinjuku')] });
  await pending;
}

export { boot, trip, place, editorForm, bindFullEditor, edit, submitFull, json, source };
