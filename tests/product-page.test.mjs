import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import https from "node:https";
import dns from "node:dns/promises";
import { syncBuiltinESMExports } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isPublicAddress, validateProductUrl, parseProductPage, safeFetchProductResource, readProductDraft } from "../lib/product-page.mjs";
import handler from "../api/shopping-recognize.mjs";

const source = "https://shop.example/products/a";
const imageUrl = "https://cdn.example/a.jpg";
const fixture = (value, extra = "") => `<html><head>${extra}<script type="application/ld+json">${JSON.stringify(value)}</script></head><body></body></html>`;
const product = (extra = {}) => ({ "@type": "Product", "@id": `${source}#product`, url: source, name: "Shoe A", brand: { "@type": "Brand", name: "Brand A" }, image: imageUrl, sku: "A-SKU", offers: { "@type": "Offer", price: "1200", priceCurrency: "JPY", seller: { name: "Merchant A" } }, ...extra });
const parse = (value, extra = "", options = {}) => parseProductPage(fixture(value, extra), { originalReferenceUrl: source, ...options });
const lookup = async () => [{ address: "93.184.216.34", family: 4 }];
const jpeg = Buffer.from([255, 216, 255, 217]);

// Simulate the actual https.request interface, including pinned lookup and abort/stream events.
function transport(routes, calls = []) {
  return (url, options, callback) => {
    const req = new EventEmitter();
    req.end = () => queueMicrotask(() => {
      if (options.signal.aborted) { req.emit("error", new Error("aborted")); return; }
      calls.push({ url: url.href, options });
      options.lookup(url.hostname, { all: true }, (err, addresses) => {
        assert.ifError(err);
        assert.ok(addresses.every((entry) => isPublicAddress(entry.address)));
      });
      options.lookup(url.hostname, {}, (err, address, family) => {
        assert.ifError(err); assert.equal(family, 4); assert.equal(address, "93.184.216.34");
      });
      const route = routes[url.href];
      assert.ok(route, `Unexpected network request: ${url.href}`);
      if (route.error) { req.emit("error", new Error(route.error)); return; }
      const res = route.stall ? new Readable({ read() {} }) : Readable.from((route.chunks || [route.body ?? fixture(product())]).map((chunk) => Buffer.from(chunk)));
      res.statusCode = route.status || 200;
      res.headers = { "content-type": "text/html; charset=utf-8", ...route.headers };
      const abort = () => { res.destroy(); req.emit("error", new Error("aborted")); };
      options.signal.addEventListener("abort", abort, { once: true });
      res.on("close", () => options.signal.removeEventListener("abort", abort));
      callback(res);
    });
    return req;
  };
}
const dependencies = (routes, calls = []) => ({ lookup, request: transport(routes, calls) });

test("single JSON-LD Product owns every field, explicit IDs and merchant-scoped evidence", () => {
  const d = parse(product());
  assert.equal(d.readStatus, "success");
  assert.equal(d.name, "Shoe A"); assert.equal(d.brand, "Brand A");
  assert.equal(d.imageUrl, imageUrl); assert.equal(d.price, 1200); assert.equal(d.currency, "JPY");
  assert.equal(d.merchant, "Merchant A"); assert.equal(d.sourceProductId, "A-SKU");
  assert.equal(d.sourceProductIdType, "sku"); assert.equal(d.sourceProductIdScope.host, "shop.example");
  assert.match(d.fieldEvidence.price.path, /jsonld\[0\]\.offers/);
  const id = parse(product({ productID: "manufacturer:42" }));
  assert.equal(id.sourceProductIdType, "productID"); assert.equal(id.sourceProductId, "manufacturer:42");
  assert.equal(parse(product({ sku: null })).sourceProductId, null);
});

test("@graph resolves only the chosen Product's brand, image and Offer references", () => {
  const p = product({ brand: { "@id": "#brand" }, image: { "@id": "#image" }, offers: { "@id": "#offer" } });
  const d = parse({ "@graph": [p, { "@id": "#brand", "@type": "Brand", name: "Graph brand" },
    { "@id": "#image", "@type": "ImageObject", contentUrl: imageUrl },
    { "@id": "#offer", "@type": "Offer", price: 25, priceCurrency: "USD" }] });
  assert.equal(d.name, "Shoe A"); assert.equal(d.brand, "Graph brand");
  assert.equal(d.price, 25); assert.equal(d.imageUrl, imageUrl);
});

test("multi Product selects explicit mainEntity, excludes recommendations and never fills A from B", () => {
  const b = product({ "@id": "https://shop.example/products/b#product", url: "https://shop.example/products/b", name: "Shoe B", image: "https://cdn.example/b.jpg", offers: { price: 999, priceCurrency: "USD" } });
  const a = product({ image: null, offers: null });
  const d = parse({ "@graph": [b, a, { "@type": "WebPage", url: source, mainEntity: { "@id": a["@id"] } }] }, '<meta property="og:image" content="https://cdn.example/b.jpg">');
  assert.equal(d.name, "Shoe A"); assert.equal(d.imageUrl, null); assert.equal(d.price, null); assert.equal(d.readStatus, "partial");
  assert.equal(parse([b, product()]).price, 1200);
  const unanchored = parse([product({ "@id": null, url: null }), b]);
  assert.equal(unanchored.readStatus, "unsupported"); assert.equal(unanchored.name, null);
});

test("recommendation-only Product inside ItemList is not a page identity", () => {
  const d = parse({ "@type": "ItemList", itemListElement: [{ "@type": "ListItem", item: product() }] });
  assert.equal(d.readStatus, "unsupported"); assert.equal(d.name, null);
  assert.equal(parse(product({ url: null, "@id": "https://shop.example/products/b#product" })).readStatus, "unsupported");
});

test("nested WebPage mainEntity is usable, conflicting main entities remain ambiguous", () => {
  assert.equal(parse({ "@type": "WebPage", url: source, mainEntity: product() }).name, "Shoe A");
  const d = parse({ "@type": "WebPage", url: source, mainEntity: [product(), product({ name: "Other" })] });
  assert.equal(d.readStatus, "unsupported");
});

test("malformed JSON-LD, no metadata, real challenge, and partial remain distinct", () => {
  const options = { originalReferenceUrl: source };
  assert.equal(parseProductPage('<script type="application/ld+json">{oops</script>', options).readStatus, "unsupported");
  assert.equal(parseProductPage("<html><title>Ordinary store</title></html>", options).readReason, "no_product_metadata");
  assert.equal(parseProductPage("<title>Just a moment...</title>", options).readStatus, "blocked");
  assert.equal(parse(product({ image: null })).readStatus, "partial");
  assert.equal(parse(product(), '<script type="application/ld+json">{oops</script>').readStatus, "partial");
  assert.equal(parseProductPage('<div>Our robot check product is available</div>', options).readStatus, "unsupported");
});

test("OG fallback requires product type and page identity; price is unverified evidence", () => {
  const html = '<meta property="og:type" content="product"><meta property="og:title" content="Shoe &amp; bag"><meta property="og:image" content="/a.jpg"><meta property="product:price:amount" content="42"><meta property="product:price:currency" content="USD">';
  const d = parseProductPage(html, { originalReferenceUrl: source });
  assert.equal(d.name, "Shoe & bag"); assert.equal(d.price, null); assert.equal(d.readStatus, "partial");
  assert.equal(d.fieldEvidence.offer.reason, "offer_scope_unverified");
  assert.equal(parseProductPage(html.replace('content="product"', 'content="website"'), { originalReferenceUrl: source }).readStatus, "unsupported");
  assert.equal(parseProductPage(html + '<meta property="og:url" content="/b">', { originalReferenceUrl: source }).readStatus, "unsupported");
});

test("raw-text and comments cannot inject page-wide metadata; duplicate OG titles are ambiguous", () => {
  const fake = '<meta property="og:type" content="product"><meta property="og:title" content="Fake">';
  for (const html of [`<!--${fake}-->`, `<script>${fake}</script>`, `<style>${fake}</style>`, `<template>${fake}</template>`, `<template><template></template>${fake}</template>`, `<title>${fake}</title>`, `<script>${fake}`]) {
    assert.equal(parseProductPage(html, { originalReferenceUrl: source }).readStatus, "unsupported");
  }
  assert.equal(parseProductPage(fake + '<meta property="og:title" content="Other">', { originalReferenceUrl: source }).readStatus, "unsupported");
});

for (const [name, change, reason] of [
  ["multiple merchants", { offers: [{ price: 1, priceCurrency: "USD", seller: "A" }, { price: 2, priceCurrency: "USD", seller: "B" }] }, "multiple_offers"],
  ["range", { offers: { "@type": "AggregateOffer", lowPrice: 1, highPrice: 10, price: 1, priceCurrency: "USD" } }, "price_range"],
  ["unknown currency", { offers: { price: 12, priceCurrency: "XYZ" } }, "unknown_currency"],
  ["symbol currency", { offers: { price: 12, priceCurrency: "$" } }, "unknown_currency"],
  ["member-only", { offers: { price: 12, priceCurrency: "USD", validForMemberTier: "gold" } }, "restricted_price"],
  ["member price specification", { offers: { price: 12, priceCurrency: "USD", priceSpecification: { price: 12, validForMemberTier: "gold" } } }, "restricted_price"],
  ["variant sizes", { size: ["S", "L"] }, "variant_ambiguous"],
  ["variant group", { "@type": "ProductGroup", hasVariant: [product({ "@id": "https://shop.example/small#product", url: "https://shop.example/small", name: "Small", size: "S" }), product({ "@id": "https://shop.example/large#product", url: "https://shop.example/large", name: "Large", size: "L", offers: { price: 2200, priceCurrency: "JPY" } })] }, "variant_ambiguous"],
  ["different itemOffered", { offers: { price: 1, priceCurrency: "USD", itemOffered: { "@id": "https://shop.example/b", "@type": "Product", name: "Other" } } }, "offer_identity_mismatch"],
  ["unresolved itemOffered", { offers: { price: 1, priceCurrency: "USD", itemOffered: { "@id": "#other" } } }, "offer_identity_mismatch"],
  ["conflicting specification", { offers: { price: 1, priceCurrency: "USD", priceSpecification: { price: 2, priceCurrency: "USD" } } }, "conflicting_price"],
  ["expired", { offers: { price: 1, priceCurrency: "USD", priceValidUntil: "2020-01-01" } }, "inactive_offer"],
  ["unresolved specification", { offers: { price: 1, priceCurrency: "USD", priceSpecification: { "@id": "#missing" } } }, "unresolved_price_specification"],
]) test(`price withheld: ${name}`, () => {
  const d = parse(product(change));
  assert.equal(d.name, "Shoe A"); assert.equal(d.imageUrl, imageUrl);
  assert.equal(d.price, null); assert.equal(d.readStatus, "partial"); assert.ok(d.readReason.includes(reason), d.readReason);
});

test("a selected variant has explicit group evidence; arbitrary query is never an ID", () => {
  const d = parse(product({ isVariantOf: { "@type": "ProductGroup", productGroupID: "family" }, size: "M", color: "Blue" }));
  assert.equal(d.variantId, "A-SKU"); assert.equal(d.price, 1200); assert.equal(d.size, "M"); assert.equal(d.color, "Blue");
  assert.equal(parse(product()).variantId, null);
  const url = `${source}?id=random&variant=guess`;
  const noId = parse(product({ sku: null, "@id": null, url }), "", { originalReferenceUrl: url });
  assert.equal(noId.sourceProductId, null); assert.equal(noId.variantId, null);
});

test("current variant URL selects its own identity, image and price from a ProductGroup", () => {
  const current = `${source}?variant=small`;
  const p = product({ "@id": `${source}#small`, url: current, sku: "SMALL", size: "S", isVariantOf: { "@id": `${source}#group` } });
  const group = { "@type": "ProductGroup", "@id": `${source}#group`, url: source, name: "Group", hasVariant: [p, product({ "@id": `${source}#large`, url: `${source}?variant=large`, sku: "LARGE", size: "L", image: "https://cdn.example/large.jpg", offers: { price: 2400, priceCurrency: "JPY" } })] };
  const d = parse(group, "", { originalReferenceUrl: current });
  assert.equal(d.name, "Shoe A"); assert.equal(d.price, 1200); assert.equal(d.variantId, "SMALL");
  assert.equal(d.imageUrl, imageUrl); assert.equal(d.size, "S");
});

test("original reference survives redirect; canonical needs explicit same-product evidence", async () => {
  const original = "https://short.example/go?tracking=original";
  const final = `${source}?utm_source=mail`;
  const canonical = `<link rel="canonical" href="${source}">`;
  const d = await readProductDraft(original, dependencies({ [original]: { status: 302, headers: { location: final } }, [final]: { body: fixture(product(), canonical) }, [imageUrl]: { body: jpeg, headers: { "content-type": "image/jpeg" } } }));
  assert.equal(d.originalReferenceUrl, original); assert.equal(d.sourceCanonicalUrl, source); assert.equal(d.sourceHost, "shop.example");
  assert.equal(d.readStatus, "success");
  assert.equal(parse(product()).sourceCanonicalUrl, null);
  assert.equal(parse(product(), '<link rel="canonical" href="/products/b">').sourceCanonicalUrl, null);
  assert.equal(parse(product(), '<link rel="canonical" href="https://other.example/products/a">').sourceCanonicalUrl, null);
  assert.equal(parse(product(), canonical + canonical).sourceCanonicalUrl, null);
  const variantUrl = `${source}?variant=small`;
  assert.equal(parse(product({ url: variantUrl, "@id": null }), canonical, { originalReferenceUrl: variantUrl }).sourceCanonicalUrl, null);
});

test("image failure loses only image and retains name, price and failure evidence", async () => {
  for (const route of [{ status: 403 }, { error: "network" }, { headers: { "content-type": "image/jpeg" }, body: "not an image" }]) {
    const d = await readProductDraft(source, dependencies({ [source]: {}, [imageUrl]: route }));
    assert.equal(d.readStatus, "partial"); assert.equal(d.name, "Shoe A"); assert.equal(d.price, 1200);
    assert.equal(d.imageUrl, null); assert.match(d.readReason, /image_unavailable/);
    assert.ok(d.fieldEvidence.imageUrl.readReason);
  }
});

for (const value of ["http://example.com/", "https://localhost/", "https://localhost./", "https://a.localhost/", "https://127.0.0.1/", "https://2130706433/", "https://0x7f000001/", "https://10.0.0.1/", "https://172.16.1.1/", "https://192.168.1.1/", "https://169.254.169.254/latest/meta-data/", "https://100.100.100.200/", "https://metadata.google.internal/", "https://[::1]/", "https://[::ffff:127.0.0.1]/", "https://[fe80::1]/", "https://[fc00::1]/", "https://[2002:7f00:1::]/", "https://[64:ff9b::7f00:1]/", "https://[2001:db8::1]/", "https://u:p@example.com/", "https://example.com:8443/"]) {
  test(`URL guard rejects ${value}`, async () => {
    let requested = false;
    await assert.rejects(safeFetchProductResource(value, { request: () => { requested = true; }, lookup }), /https_required|non_public_host|unsafe_url/);
    assert.equal(requested, false);
  });
}

test("public IPv4/IPv6 accepted, all DNS answers checked, rebinding pinned at socket lookup", async () => {
  assert.equal(isPublicAddress("8.8.8.8"), true); assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  validateProductUrl("https://[2606:4700:4700::1111]/");
  for (const address of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
    let requested = false;
    const resolver = async () => [...await lookup(), { address, family: address.includes(":") ? 6 : 4 }];
    await assert.rejects(safeFetchProductResource(source, { lookup: resolver, request: () => { requested = true; } }), /non_public_dns/);
    assert.equal(requested, false);
  }
  let lookups = 0;
  const calls = [];
  const opts = dependencies({ [source]: {} }, calls);
  opts.lookup = async () => ++lookups === 1 ? lookup() : [{ address: "127.0.0.1", family: 4 }];
  await safeFetchProductResource(source, opts);
  assert.equal(lookups, 1); assert.equal(calls.length, 1);
  assert.equal(calls[0].options.agent, false); assert.equal(calls[0].options.rejectUnauthorized, true);
  assert.equal(calls[0].url, source);
  assert.equal(calls[0].options.headers.Cookie, undefined); assert.equal(calls[0].options.headers.Authorization, undefined);
});

test("every redirect revalidates protocol, literal IP and DNS, including same-host rebinding", async () => {
  for (const destination of ["http://shop.example/a", "https://10.0.0.1/", "https://[::1]/"]) {
    const calls = [];
    await assert.rejects(safeFetchProductResource(source, dependencies({ [source]: { status: 302, headers: { location: destination } } }, calls)));
    assert.equal(calls.length, 1);
  }
  let lookups = 0;
  const calls = [];
  const options = dependencies({ [source]: { status: 307, headers: { location: "/second" } } }, calls);
  options.lookup = async () => ++lookups === 1 ? lookup() : [{ address: "192.168.1.1", family: 4 }];
  await assert.rejects(safeFetchProductResource(source, options), /non_public_dns/);
  assert.equal(lookups, 2); assert.equal(calls.length, 1);
});

test("redirect loops stop at four hops", async () => {
  const calls = [];
  await assert.rejects(safeFetchProductResource(source, dependencies({ [source]: { status: 302, headers: { location: source } } }, calls)), /redirect_limit/);
  assert.equal(calls.length, 5);
});

test("timeouts bound stalled DNS and slow streaming; oversize length and streamed chunks rejected", async () => {
  const start = Date.now();
  await assert.rejects(safeFetchProductResource(source, { lookup: () => new Promise(() => {}), timeoutMs: 20 }), /timeout/);
  await assert.rejects(safeFetchProductResource(source, { ...dependencies({ [source]: { stall: true } }), timeoutMs: 20 }), /timeout/);
  assert.ok(Date.now() - start < 1000);
  for (const route of [{ headers: { "content-length": "100" } }, { chunks: [Buffer.alloc(30), Buffer.alloc(30)] }]) {
    await assert.rejects(safeFetchProductResource(source, { ...dependencies({ [source]: route }), maxBytes: 50 }), /response_too_large/);
  }
});

test("HTTP blocking, unsupported content type, compression, DNS failure and normal HTML are distinct", async () => {
  for (const [route, status, reason] of [
    [{ status: 403 }, "blocked", "http_403"], [{ status: 429 }, "blocked", "http_429"],
    [{ status: 404 }, "unsupported", "http_404"],
    [{ headers: { "content-type": "application/json" } }, "unsupported", "invalid_content_type"],
    [{ headers: { "content-encoding": "gzip" } }, "unsupported", "unsupported_content_encoding"],
    [{ body: "<html>ordinary page</html>" }, "unsupported", "no_product_metadata"],
    [{ body: "<title>Access denied</title>" }, "blocked", "source_challenge"],
  ]) {
    const d = await readProductDraft(source, dependencies({ [source]: route }));
    assert.equal(d.readStatus, status); assert.equal(d.readReason, reason);
  }
  const d = await readProductDraft(source, { lookup: async () => { throw new Error("ENOTFOUND secret"); } });
  assert.equal(d.readReason, "fetch_failed");
});

test("image redirects use the same SSRF guard and do not discard product text", async () => {
  const calls = [];
  const d = await readProductDraft(source, dependencies({ [source]: {}, [imageUrl]: { status: 302, headers: { location: "https://169.254.169.254/" } } }, calls));
  assert.equal(d.price, 1200); assert.equal(d.name, "Shoe A"); assert.equal(d.imageUrl, null);
  assert.equal(d.fieldEvidence.imageUrl.readReason, "non_public_host"); assert.equal(calls.length, 2);
});

function responseMock() {
  return { code: 0, headers: {}, payload: null, status(n) { this.code = n; return this; }, setHeader(k, v) { this.headers[k] = v; return this; }, json(v) { this.payload = v; } };
}

test("handler url-draft shares auth/trip isolation, needs no AI key, performs no search or persistence", async (t) => {
  const token = "s1-session";
  const digest = createHash("sha256").update(token).digest("hex");
  const store = new Map([
    [`tokyo-family-trip:session:${digest}`, JSON.stringify({ id: "owner" })],
    ["tokyo-family-trip:trip:own", JSON.stringify({ members: { owner: true } })],
    ["tokyo-family-trip:trip:other", JSON.stringify({ members: { someoneElse: true } })],
  ]);
  const previous = { key: process.env.OPENAI_API_KEY, url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN };
  delete process.env.OPENAI_API_KEY;
  process.env.KV_REST_API_URL = "https://redis.test"; process.env.KV_REST_API_TOKEN = "test";
  const network = [], commands = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(String(url), "https://redis.test", "URL branch must never call OpenAI or image search fetch");
    const command = JSON.parse(options.body); commands.push(command);
    assert.equal(command[0], "GET", "URL draft must not save or change counters");
    return new Response(JSON.stringify({ result: store.get(command[1]) ?? null }));
  });
  t.mock.method(https, "request", transport({ [source]: {}, [imageUrl]: { body: jpeg, headers: { "content-type": "image/jpeg" } } }, network));
  t.mock.method(dns, "lookup", lookup);
  syncBuiltinESMExports();
  try {
    const run = async (cookie, body) => { const res = responseMock(); await handler({ method: "POST", headers: { cookie }, body: { action: "url-draft", sourceUrl: source, ...body } }, res); return res; };
    assert.equal((await run("", { tripId: "own" })).code, 401);
    assert.equal((await run(`tokyo_trip_session=${token}`, {})).code, 400);
    assert.equal((await run(`tokyo_trip_session=${token}`, { tripId: "other", memberId: "someoneElse" })).code, 403);
    assert.equal(network.length, 0);
    const res = await run(`tokyo_trip_session=${token}`, { tripId: "own" });
    assert.equal(res.code, 200); assert.equal(res.payload.draft.readStatus, "success");
    assert.equal(res.payload.draft.name, "Shoe A"); assert.equal(res.headers["Cache-Control"], "no-store");
    assert.deepEqual(network.map((n) => n.url), [source, imageUrl]);
    const blocked = await run(`tokyo_trip_session=${token}`, { tripId: "own", sourceUrl: "https://127.0.0.1/" });
    assert.equal(blocked.payload.draft.readStatus, "blocked"); assert.equal(network.length, 2);
    assert.ok(commands.every(([verb]) => verb === "GET"));
    // Guard the early return before all legacy AI/search branches as well as runtime network assertions.
    const code = readFileSync(new URL("../api/shopping-recognize.mjs", import.meta.url), "utf8");
    const branch = code.slice(code.indexOf('if (body.action === "url-draft")'), code.indexOf('const imageDataUrl = String(body.imageDataUrl'));
    assert.doesNotMatch(branch, /findProductImages|searchProductImageCandidates|callOpenAi|openAiCredential/);
  } finally {
    t.mock.restoreAll(); syncBuiltinESMExports();
    for (const [key, value] of [["OPENAI_API_KEY", previous.key], ["KV_REST_API_URL", previous.url], ["KV_REST_API_TOKEN", previous.token]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
