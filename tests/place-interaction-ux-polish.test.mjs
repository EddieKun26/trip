import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot, trip, place, bindFullEditor, json, source } from './helpers/phase-c-browser.mjs';

const selectors = { area: '[data-area-tag-input]', restaurant: '[data-custom-restaurant-tag]', content: '[data-custom-content-tag]' };
const fixture = () => place('ebisu', { name: 'Local smoke', kind: 'restaurant', areaTags: ['既有地區'], restaurantTags: ['既有類別'], contentTags: ['既有內容'] });
for (const mode of Object.keys(selectors)) {
  test(`nested ${mode}: exclusive footer, empty disabled, Add draft only, Cancel preserves editor and draft`, async () => {
    const b = await boot(trip([fixture()])), form = bindFullEditor(b), before = json(b.state.places);
    const input = form.querySelector(selectors[mode]);
    // Restaurant's native checked inputs are the existing draft representation.
    const options = form.querySelector('.restaurant-tag-options');
    options.querySelectorAll = () => [];
    b.run(`beginNestedTagInput(form, '${mode}')`);
    assert.equal(form.placeEditorSession.nestedTag, mode);
    assert.equal(form.querySelector('[data-place-normal-actions]').hidden, true);
    assert.equal(form.querySelector('[data-place-tag-actions]').hidden, false);
    assert.equal(form.querySelector('[data-confirm-nested-tag]').disabled, true);
    input.value = '   '; form.fire('input', { target: input });
    assert.equal(form.querySelector('[data-confirm-nested-tag]').disabled, true);
    input.value = '  新標籤  '; form.fire('input', { target: input });
    assert.equal(form.querySelector('[data-confirm-nested-tag]').disabled, false);
    const requests = b.requests.length, writes = b.writes.length;
    form.fire('click', { target: { closest: s => s === '[data-confirm-nested-tag]' ? {} : null } });
    assert.equal(input.value, ''); assert.equal(form.placeEditorSession.nestedTag, null);
    if (mode === 'restaurant') assert.match(options.innerHTML, /value="新標籤" checked/);
    else assert.ok(form.placeEditorSession[`${mode}Tags`].includes('新標籤'));
    assert.equal(form.querySelector('[data-place-normal-actions]').hidden, false);
    assert.equal(form.querySelector('[data-place-tag-actions]').hidden, true);
    const draft = json({ area: form.placeEditorSession.areaTags, content: form.placeEditorSession.contentTags, restaurant: options.innerHTML });
    b.run(`beginNestedTagInput(form, '${mode}')`); input.value = '放棄';
    form.fire('click', { target: { closest: s => s === '[data-cancel-nested-tag]' ? {} : null } });
    assert.deepEqual(json({ area: form.placeEditorSession.areaTags, content: form.placeEditorSession.contentTags, restaurant: options.innerHTML }), draft);
    assert.equal(form.isConnected, true); assert.equal(input.value, '');
    assert.deepEqual(json(b.state.places), before);
    assert.equal(b.requests.length, requests); assert.equal(b.writes.length, writes);
  });
}

test('nested markup has one footer action pair and no adjacent Add/Cancel; terminology only changes display', async () => {
  const b = await boot(trip([fixture()]));
  b.sheet.querySelector = () => null;
  b.run('bindPlaceEditor = () => {}; openPlaceEditSheet(state.places[0].name)');
  const html = b.sheet.innerHTML;
  assert.match(html, /data-cancel-nested-tag>取消新增/);
  assert.match(html, /data-confirm-nested-tag disabled>加入標籤/);
  assert.match(html, /data-place-normal-actions[\s\S]*儲存變更/);
  for (const entry of html.matchAll(/class="tag-custom-entry" hidden>(.*?)<\/div>/g)) assert.doesNotMatch(entry[1], /<button/);
  assert.equal([...html.matchAll(/class="tag-custom-entry" hidden>/g)].length, 3);
  assert.match(b.app.innerHTML, /主要地區<\/label>/);
  b.run('openPlaceSheet(state.places[0].name, { refreshDetails: false })');
  assert.match(b.sheet.innerHTML, /主要地區：/);
  assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/).filter(line => !line.trimStart().startsWith('//')).join('\n'), /大地區/);
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.place-editor-sheet > \.modal-actions\[hidden\] \{ display: none; \}/);
});

test('content nested Add retains existing normalization and deduplication', async () => {
  const b = await boot(trip([fixture()])), form = bindFullEditor(b);
  for (const value of ['ＣＡＦＥ', ' cafe ']) {
    b.run('beginNestedTagInput(form, "content")');
    form.querySelector(selectors.content).value = value; b.run('confirmNestedTagInput(form)');
  }
  assert.equal(form.placeEditorSession.contentTags.length, 2);
});

test('nested Enter and IME cannot submit the whole editor', async () => {
  const b = await boot(trip([fixture()])), form = bindFullEditor(b);
  b.run('beginNestedTagInput(form, "content")'); form.querySelector(selectors.content).value = 'Enter標籤';
  let prevented = 0;
  form.fire('keydown', { key: 'Enter', isComposing: true, preventDefault() { prevented++; } });
  assert.equal(form.placeEditorSession.nestedTag, 'content');
  form.fire('keydown', { key: 'Enter', isComposing: false, preventDefault() { prevented++; } });
  assert.equal(prevented, 2); assert.equal(form.placeEditorSession.nestedTag, null);
  assert.ok(form.placeEditorSession.contentTags.includes('Enter標籤'));
  assert.equal(b.requests.filter(r => r.options.method === 'PUT').length, 0);
});

test('visual viewport resize preserves focused input, form identity and scroll while fitting keyboard height', async () => {
  const b = await boot(trip([fixture()])), form = bindFullEditor(b);
  const backdrop = { style: {} }; form.style = {}; form.scrollTop = 420;
  form.closest = () => backdrop; b.sheet.querySelector = () => form;
  b.context.window.visualViewport = { height: 360, offsetTop: 22 };
  b.run('syncPlaceEditorViewport()');
  assert.equal(backdrop.style.height, '360px'); assert.equal(backdrop.style.top, '22px');
  assert.equal(form.style.maxHeight, 'min(90dvh, 320px)'); assert.equal(form.scrollTop, 420);
  assert.equal(b.sheet.querySelector(), form);
});

async function voteBrowser(initial = false) {
  const payload = trip([fixture()]); payload.votes = { 'Local smoke': initial ? ['alice'] : [] };
  const b = await boot(payload);
  b.run('openPlaceSheet(state.places[0].name, { refreshDetails: false })');
  const node = () => ({ textContent: '', innerHTML: '' });
  const nodes = new Map(), attrs = {}, classes = new Set();
  const detail = { scrollTop: 437, querySelector(s) { if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); } };
  const button = { matches: () => false, dataset: { vote: 'Local smoke' }, textContent: '', setAttribute(k, v) { attrs[k] = v; },
    classList: { toggle(k, v) { v ? classes.add(k) : classes.delete(k); } },
    closest: s => s === '.place-detail-sheet' ? detail : s === '[data-vote]' ? button : null };
  b.context.document.querySelectorAll = s => s === '[data-vote]' ? [button] : [];
  b.run('render = openPlaceSheet = () => { throw Error("full render/reopen forbidden"); }; showToast = message => { voteToasts.push(message); }');
  b.context.voteToasts = [];
  const html = b.sheet.innerHTML;
  const click = async () => { for (const fn of b.listeners.click) await fn({ target: button }); };
  const check = active => {
    assert.equal(attrs['aria-pressed'], String(active)); assert.equal(classes.has('voted'), active);
    assert.equal(detail.querySelector('.vote-panel .section-row span').textContent, `${Number(active)} 人標記`);
    assert.equal(detail.querySelector('.voter-list').innerHTML.includes('alice'), active);
    assert.equal(b.state.votes['Local smoke'].includes('alice'), active);
    assert.equal(detail.scrollTop, 437); assert.equal(b.sheet.innerHTML, html);
  };
  const save = () => { const promise = b.run('saveSharedTrip()'); return { promise, request: b.requests.filter(r => r.options.method === 'PUT').at(-1) }; };
  const reply = async (pending, ok) => { await b.reply(pending.request, { revision: 2 }, ok ? 200 : 500); await pending.promise; };
  return { b, click, check, save, reply };
}

test('favorite normal on/off is immediate, keeps detail and scroll, persists once each, has no success toast or lookup', async () => {
  const h = await voteBrowser(), start = h.b.requests.length;
  for (const active of [true, false]) {
    await h.click(); h.check(active); const pending = h.save();
    assert.equal(JSON.parse(pending.request.options.body).votes['Local smoke'].includes('alice'), active);
    await h.reply(pending, true); h.check(active);
  }
  assert.equal(h.b.requests.length - start, 2);
  assert.ok(h.b.requests.slice(start).every(r => r.options.method === 'PUT' && r.url === '/api/trip?id=b'));
  assert.equal(h.b.context.voteToasts.length, 0);
});
for (const initial of [false, true]) test(`favorite ${initial ? 'off' : 'on'} failure rolls back UI, count, aria, indicator and shared memory`, async () => {
  const h = await voteBrowser(initial); await h.click(); h.check(!initial);
  await h.reply(h.save(), false); h.check(initial);
  assert.equal(h.b.context.voteToasts.length, 1); assert.match(h.b.context.voteToasts[0], /無法同步/);
});
for (const firstOk of [true, false]) for (const lastOk of [true, false]) {
  test(`rapid double toggle: first PUT ${firstOk}, final PUT ${lastOk} deterministically settles latest state`, async () => {
    const h = await voteBrowser(); await h.click(); const first = h.save();
    await h.click(); h.check(false); await h.reply(first, firstOk); h.check(false);
    await h.reply(h.save(), lastOk); h.check(lastOk ? false : firstOk);
    assert.equal(h.b.requests.filter(r => r.options.method === 'PUT').length, 2);
    assert.ok(h.b.context.voteToasts.every(s => /無法同步/.test(s)));
  });
}
test('rapid double toggle before debounce sends only the latest existing Trip payload without count drift', async () => {
  const h = await voteBrowser(); await h.click(); await h.click(); h.check(false);
  await h.reply(h.save(), true); h.check(false);
  assert.equal(h.b.requests.filter(r => r.options.method === 'PUT').length, 1);
  assert.equal(h.b.context.voteToasts.length, 0);
});
