import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const section = (from, to) => app.slice(app.indexOf(from), app.indexOf(to, app.indexOf(from)));
const reference = "https://www.threads.com/share/GhWXu9wLy/";
const recognized = { details: { brand: "品牌", name: "餅乾", benefits: "", price: 0, currency: "", categoryId: "daily" }, confidence: 0.9, annotation: { summary: "待確認", productImages: [] } };
function harness(sourceUrl = reference) {
  const input = { value: sourceUrl }, resultHost = { innerHTML: "" }, confirm = { disabled: true };
  const form = { id: "shopping-import-form", isConnected: true, dataset: {}, querySelector: (selector) => selector === "[data-shopping-source-url]" ? input : selector === "[data-shopping-import-results]" ? resultHost : selector === 'button[type="submit"]' ? confirm : null, querySelectorAll: () => [] };
  const button = { disabled: false, closest: () => form };
  const calls = [], saved = [];
  const context = vm.createContext({ URL, crypto: { randomUUID }, Date, console, pendingShoppingImports: [], tripContextVersion: 1,
    state: { tripId: "trip-one", shopping: { items: [], photos: {} } }, memberId: "owner", currentMemberId: () => context.memberId,
    canManageShopping: () => true, tripIsHydrated: () => true, SHOPPING_IMPORT_MAX_FILES: 12,
    escapeHtml: (value) => String(value).replaceAll('"', "&quot;"), shoppingCurrencies: ["JPY", "TWD"], defaultShoppingCurrency: () => "JPY",
    shoppingCategoryOptions: () => '<option value="daily">日常</option>', shoppingImportImageOptions: () => "", shoppingImportProgressMarkup: () => "",
    setShoppingRecognitionStatus: () => {}, showToast: () => {}, guestOnlyMessage: () => {},
    compressShoppingScreenshot: async () => "data:image/jpeg;base64,QUJDRA==", compressAiProductImage: async () => null,
    shoppingRecognitionErrorMessage: () => "辨識失敗", normalizeShoppingPrice: (v) => Number(v) || 0,
    recordShoppingUndo: () => {}, shoppingRecipientTagIds: () => [], shoppingCustomCategory: () => "daily", pruneShoppingPhotos: () => {},
    closeSheet: () => { form.isConnected = false; }, render: () => {}, FormData: class { get() { return ""; } },
    saveShopping: async () => { const payload = JSON.parse(JSON.stringify(context.state.shopping)); saved.push(payload); return payload; },
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => structuredClone(recognized) }; },
  });
  vm.runInContext(section("function shoppingCurrencyOptions(", "function shoppingMoneyLabel(") + section("function syncPendingShoppingImportEdits(", "function shoppingImportImageOptions(") + section("function renderShoppingImportRows(", "async function refreshShoppingImportImages(") + section("async function recognizeShoppingScreenshotWithAi(", "async function compressAiProductImage("), context);
  vm.runInContext(`async function submit(event) { ${section('  if (event.target.id === "shopping-import-form")', '  if (event.target.id === "transport-form")')} }`, context);
  return { context, form, button, input, calls, saved, resultHost, confirm };
}
async function save(h) { await h.context.submit({ target: h.form, preventDefault() {} }); }

test("Threads link enters the shared editable pending entry and saves source plus user edits", async () => {
  const h = harness(); await h.context.readShoppingLink(h.button);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].body.action, "social-source"); assert.equal(h.calls[0].body.recognize, true);
  assert.equal(h.context.pendingShoppingImports.length, 1);
  const entry = h.context.pendingShoppingImports[0];
  assert.equal(entry.recognized, true); assert.equal(h.confirm.disabled, false); assert.match(h.resultHost.innerHTML, /data-import-name/);
  entry.details.name = "我修改的商品";
  await save(h);
  assert.equal(h.saved.length, 1); assert.equal(h.saved[0].items[0].name, "我修改的商品");
  assert.equal(h.saved[0].items[0].sourceReferenceUrl, reference); assert.equal(h.saved[0].items[0].sourceType, "threads");
  assert.equal(h.saved[0].items[0].currency, "");
});

for (const status of ["blocked", "partial", "unsupported"]) test(`${status} keeps the same entry through screenshot Vision, editor and save`, async () => {
  const h = harness(); let requests = 0;
  h.context.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); h.calls.push(body);
    return { ok: true, json: async () => ++requests === 1 ? { socialDraft: { readStatus: status }, requiresScreenshot: true } : structuredClone(recognized) };
  };
  await h.context.readShoppingLink(h.button);
  const entry = h.context.pendingShoppingImports[0], id = entry.id;
  assert.equal(entry.needsScreenshot, true); assert.match(h.resultHost.innerHTML, /上傳截圖辨識/);
  await h.context.handleShoppingFallbackFile({ closest: () => h.form, dataset: { shoppingFallback: id }, files: [{ type: "image/png", size: 100 }] });
  assert.equal(h.context.pendingShoppingImports.length, 1); assert.equal(h.context.pendingShoppingImports[0], entry);
  assert.equal(entry.id, id); assert.equal(entry.sourceReferenceUrl, reference); assert.equal(entry.needsScreenshot, false);
  assert.equal(h.calls[1].action, undefined); assert.match(h.calls[1].imageDataUrl, /^data:image/);
  await save(h); assert.equal(h.saved[0].items[0].sourceReferenceUrl, reference); assert.equal(Object.keys(h.saved[0].photos).length, 1);
});

test("product URL uses S1 without Vision and saves through the same editor", async () => {
  const h = harness("https://example.com/product");
  h.context.fetch = async (_url, options) => { h.calls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ draft: { name: "商品頁品名", price: 0, currency: "", readStatus: "partial" } }) }; };
  await h.context.readShoppingLink(h.button);
  assert.equal(h.calls[0].action, "url-draft"); assert.equal(h.calls[0].recognize, false); assert.equal(h.calls.length, 1);
  assert.match(h.resultHost.innerHTML, /data-import-name/); await save(h);
  assert.equal(h.saved[0].items[0].sourceType, "product_url"); assert.equal(h.saved[0].items[0].name, "商品頁品名");
  assert.equal(h.saved[0].items[0].photoId, "");
});

for (const change of ["trip", "member", "entry", "closed"]) test(`late link response cannot affect ${change} replacement`, async () => {
  const h = harness(); let release;
  h.context.fetch = () => new Promise((resolve) => { release = resolve; });
  const pending = h.context.readShoppingLink(h.button), original = h.context.pendingShoppingImports[0];
  if (change === "trip") { h.context.state.tripId = "trip-two"; h.context.tripContextVersion++; }
  if (change === "member") h.context.memberId = "other";
  if (change === "entry") h.context.pendingShoppingImports = [{ id: "new", details: { name: "other" } }];
  if (change === "closed") h.form.isConnected = false;
  release({ ok: true, json: async () => structuredClone(recognized) }); await pending;
  assert.equal(original.recognized, undefined); assert.equal(h.saved.length, 0);
  if (change === "entry") assert.equal(h.context.pendingShoppingImports[0].details.name, "other");
});

test("late fallback cannot attach its screenshot or recognition to another trip", async () => {
  const h = harness(); h.context.fetch = async () => ({ ok: true, json: async () => ({ requiresScreenshot: true }) });
  await h.context.readShoppingLink(h.button); const entry = h.context.pendingShoppingImports[0]; let release;
  h.context.compressShoppingScreenshot = () => new Promise((resolve) => { release = resolve; });
  const pending = h.context.handleShoppingFallbackFile({ closest: () => h.form, dataset: { shoppingFallback: entry.id }, files: [{ type: "image/png", size: 100 }] });
  h.context.state.tripId = "trip-two"; release("data:image/jpeg;base64,QUJDRA=="); await pending;
  assert.equal(entry.dataUrl, ""); assert.equal(entry.recognized, undefined);
});

test("save compression cannot mutate a switched trip; double submit saves once", async () => {
  const h = harness(); await h.context.readShoppingLink(h.button); let release;
  h.context.compressAiProductImage = () => new Promise((resolve) => { release = resolve; });
  const pending = save(h); await save(h);
  h.context.state.tripId = "trip-two"; h.context.state.shopping = { items: [], photos: {} }; release(null); await pending;
  assert.equal(h.saved.length, 0); assert.equal(h.context.state.shopping.items.length, 0); assert.equal(Object.keys(h.context.state.shopping.photos).length, 0);
});

test("link entry points keep 12 functions, shared editor and mobile controls", () => {
  assert.equal(readdirSync(new URL("../api", import.meta.url)).filter((path) => path.endsWith(".mjs")).length, 12);
  assert.match(app, /data-import-shopping-link>貼連結辨識/); assert.match(app, /data-import-shopping-screenshot>截圖辨識/);
  assert.match(app, /data-add-shopping-item>手動新增/);
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.shopping-sticky-actions\s*\{[^}]*repeat\(3/);
  assert.match(css, /\.shopping-fallback-upload\s*\{[^}]*min-height: 44px/);
});
