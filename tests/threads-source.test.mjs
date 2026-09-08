import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import https from "node:https";
import dns from "node:dns/promises";
import { syncBuiltinESMExports } from "node:module";
import { createHash } from "node:crypto";
import { readThreadsSource, parseThreadsSource, SOCIAL_HTML_POLICY } from "../lib/threads-source.mjs";
import handler from "../api/shopping-recognize.mjs";

const A = { original: "https://www.threads.com/share/GhWXu9wLy/", final: "https://www.threads.com/@mio_1983/post/DRNBp0REvzg", html: readFileSync(new URL("./fixtures/threads-ghwx-source.html", import.meta.url), "utf8") };
const B = { original: "https://www.threads.com/share/E7ZmNknYI/", final: "https://www.threads.com/@yutong_0422/post/DRM43y2gch0", html: readFileSync(new URL("./fixtures/threads-e7zm-source.html", import.meta.url), "utf8") };
const img = "https://media.fbcdn.net/v/t51.82787-15/primary-a.jpg";
const jpeg = Buffer.from([255, 216, 255, 217]);
const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
function transport(routes, calls = []) {
  return (url, options, callback) => {
    const req = new EventEmitter();
    req.end = () => queueMicrotask(() => {
      calls.push({ url: url.href, options });
      const route = routes[url.href];
      if (!route) { req.emit("error", new Error(`unexpected_network:${url.href}`)); return; }
      if (route.error) { req.emit("error", new Error(route.error)); return; }
      const res = route.stall ? new Readable({ read() {} }) : Readable.from((route.chunks || [route.body ?? ""]).map((c) => Buffer.from(c)));
      res.statusCode = route.status || 200;
      res.headers = { "content-type": "text/html", ...route.headers };
      const abort = () => { res.destroy(); req.emit("error", new Error("aborted")); };
      options.signal.addEventListener("abort", abort, { once: true });
      res.on("close", () => options.signal.removeEventListener("abort", abort));
      callback(res);
    });
    return req;
  };
}
const deps = (routes, calls = []) => ({ lookup: publicLookup, request: transport(routes, calls) });
const imageRoute = { body: jpeg, headers: { "content-type": "image/jpeg" } };
const parse = (html = A.html, finalUrl = A.final) => parseThreadsSource(html, { originalReferenceUrl: A.original, finalUrl, fetchedAt: "2026-09-08T00:00:00Z" });
const script = (value, type = "application/json") => `<script type="${type}">${JSON.stringify(value)}</script>`;
const structured = (extra = {}) => ({ code: "DRNBp0REvzg", user: { username: "mio_1983" }, caption: { text: "Exact primary caption" }, image_versions2: { candidates: [{ url: img, width: 1200, height: 1200 }] }, ...extra });

test("social recognition reuses one Vision request with caption and verified carousel bytes; blocked/uncertain sources need screenshots", async (t) => {
  const token = "mvp-session", digest = createHash("sha256").update(token).digest("hex");
  const store = new Map([[`tokyo-family-trip:session:${digest}`, JSON.stringify({ id: "owner" })], ["tokyo-family-trip:trip:own", JSON.stringify({ members: { owner: true } })]]);
  const env = ["OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN"].map((key) => [key, process.env[key]]);
  process.env.OPENAI_API_KEY = "test"; process.env.KV_REST_API_URL = "https://redis.test"; process.env.KV_REST_API_TOKEN = "test";
  const second = img.replace("primary-a", "primary-a-2"), ai = [], calls = [];
  const routes = { [A.original]: { status: 302, headers: { location: A.final } }, [A.final]: { body: `<html><head>${script(structured({ carousel_media: [img, second].map((url) => ({ image_versions2: { candidates: [{ url, width: 1200, height: 1200 }] } })) }))}</head></html>` }, [img]: imageRoute, [second]: imageRoute };
  let confidence = 0.9;
  t.mock.method(https, "request", transport(routes, calls)); t.mock.method(dns, "lookup", publicLookup); syncBuiltinESMExports();
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    if (String(url) === "https://redis.test") {
      const [verb, key] = JSON.parse(options.body);
      return new Response(JSON.stringify({ result: verb === "GET" ? store.get(key) || null : 1 }));
    }
    assert.equal(String(url), "https://api.openai.com/v1/responses");
    const body = JSON.parse(options.body);
    if (body.text?.format?.name !== "shopping_product_recognition") return new Response("{}", { status: 503 });
    ai.push(body);
    return new Response(JSON.stringify({ output_text: JSON.stringify({ productNameZh: "測試餅乾", brandZh: "品牌", confidence, priceAmount: 0, priceCurrency: "", category: "souvenir" }) }));
  });
  const run = async (cookie = `tokyo_trip_session=${token}`, tripId = "own") => {
    const res = { status(c) { this.code = c; return this; }, setHeader() { return this; }, json(v) { this.payload = v; } };
    await handler({ method: "POST", headers: { cookie }, body: { action: "social-source", recognize: true, sourceUrl: A.original, tripId } }, res); return res;
  };
  try {
    assert.equal((await run("")).code, 401); assert.equal((await run(undefined, "other")).code, 403); assert.equal(calls.length, 0);
    const result = await run();
    assert.equal(result.code, 200); assert.equal(result.payload.details.name, "測試餅乾"); assert.equal(ai.length, 1);
    const content = ai[0].input[1].content;
    assert.match(content[0].text, /Exact primary caption/);
    assert.equal(content.filter((part) => part.type === "input_image").length, 2);
    for (const part of content.filter((part) => part.type === "input_image")) assert.equal(part.image_url, `data:image/jpeg;base64,${jpeg.toString("base64")}`);
    assert.equal(result.payload.socialDraft.originalReferenceUrl, A.original);
    assert.ok(result.payload.sourceImageDataUrl); assert.ok(result.payload.socialDraft.imageCandidates.every((image) => !image.dataUrl));
    confidence = 0.2;
    const uncertain = await run(); assert.equal(uncertain.code, 422); assert.equal(uncertain.payload.requiresScreenshot, true);
    routes[A.final] = { status: 403 };
    const before = ai.length, blocked = await run();
    assert.equal(blocked.code, 200); assert.equal(blocked.payload.requiresScreenshot, true); assert.equal(blocked.payload.socialDraft.readStatus, "blocked"); assert.equal(ai.length, before);
    routes[A.final] = { body: "<html><head></head></html>" };
    const missing = await run(); assert.equal(missing.payload.requiresScreenshot, true); assert.equal(ai.length, before);
  } finally {
    t.mock.restoreAll(); syncBuiltinESMExports();
    for (const [key, value] of env) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

for (const fixture of [A, B]) test(`offline share contract: ${fixture.original}`, async () => {
  const final = `${fixture.final}?xmt=fixture`;
  const image = fixture === A ? img : "https://media.fbcdn.net/v/t51.82787-15/primary-b.jpg";
  const calls = [];
  const d = await readThreadsSource(fixture.original, deps({ [fixture.original]: { status: 302, headers: { location: final } }, [final]: { body: fixture.html }, [image]: imageRoute }, calls));
  assert.equal(d.originalReferenceUrl, fixture.original); assert.equal(d.finalUrl, final);
  assert.equal(d.sourceCanonicalUrl, fixture.final); assert.equal(d.sourceHost, "www.threads.com");
  assert.equal(d.imageCandidates.length, 1); assert.equal(d.imageCandidates[0].readStatus, "success");
  assert.equal(d.outboundLinkEvidence.length, 0); assert.ok(d.fetchedAt);
  if (fixture === B) { assert.equal(d.caption, "去東京買的，這真的好好吃…🥹後悔只買一盒"); assert.equal(d.readStatus, "partial"); }
  else assert.equal(d.readStatus, "success");
  assert.deepEqual(calls.map((c) => c.url), [fixture.original, final, image]);
});

test("social policy reads >1 MiB, remains capped at 4 MiB, and S1 default is unchanged", async () => {
  assert.equal(SOCIAL_HTML_POLICY.maxBytes, 4 * 1024 * 1024);
  const html = A.html.replace("CONTRACT_PADDING", "x".repeat(1200000));
  const d = await readThreadsSource(A.final, deps({ [A.final]: { body: html }, [img]: imageRoute }));
  assert.equal(d.caption, "Synthetic source fixture"); assert.equal(d.readStatus, "success");
  const { safeFetchProductResource } = await import("../lib/product-page.mjs");
  await assert.rejects(safeFetchProductResource(A.final, deps({ [A.final]: { body: html } })), /response_too_large/);
});

for (const route of [{ headers: { "content-length": String(4 * 1024 * 1024 + 1) } }, { chunks: [Buffer.alloc(3 * 1024 * 1024), Buffer.alloc(2 * 1024 * 1024)] }]) {
  test("oversized HTML returns partial/too_large and does not parse truncated metadata", async () => {
    const calls = [];
    const d = await readThreadsSource(A.original, deps({ [A.original]: { status: 302, headers: { location: A.final } }, [A.final]: route }, calls));
    assert.equal(d.readStatus, "partial"); assert.equal(d.readReason, "too_large"); assert.equal(d.caption, null);
    assert.equal(d.finalUrl, A.final); assert.equal(d.originalReferenceUrl, A.original); assert.equal(calls.length, 2);
  });
}

test("explicit canonical requires the same post; unrelated OG cannot become caption/image", () => {
  const d = parse(A.html.replace('content="https://www.threads.com/@mio_1983/post/DRNBp0REvzg"', `content="${B.final}"`));
  assert.equal(d.caption, null); assert.deepEqual(d.imageCandidates, []); assert.equal(d.sourceCanonicalUrl, null);
  assert.match(d.readReason, /metadata_identity_mismatch/);
  const wrongCanonical = parse(A.html.replace('href="https://www.threads.com/@mio_1983/post/DRNBp0REvzg"', `href="${B.final}"`));
  assert.equal(wrongCanonical.sourceCanonicalUrl, null); assert.equal(wrongCanonical.caption, null);
  const absentCanonical = parse(A.html.replace(/<link[^>]*>/, ""));
  assert.equal(absentCanonical.sourceCanonicalUrl, null); assert.equal(absentCanonical.caption, "Synthetic source fixture");
});

test("body metadata, comments, scripts, avatars and recommended images do not enter OG evidence", () => {
  const fake = `<meta property="og:description" content="Recommended"><meta property="og:image" content="https://media.fbcdn.net/v/t51.82787-15/other.jpg">`;
  const d = parse(A.html.replace("</head>", `<!--${fake}--><template><template></template>${fake}</template><script>${fake}</script></head>`).replace("</body>", `${fake}</body>`));
  assert.equal(d.caption, "Synthetic source fixture"); assert.deepEqual(d.imageCandidates.map((i) => i.url), [img]);
  assert.equal(parse(A.html.replace(img, "https://media.fbcdn.net/v/t51.82787-19/avatar.jpg")).imageCandidates.length, 0);
});

test("carousel binds exact post code AND author; dedupes repeated signed URLs", () => {
  const second = "https://media.fbcdn.net/v/t51.82787-15/second.jpg";
  const media = (url) => ({ image_versions2: { candidates: [{ url, width: 1200, height: 1200 }] } });
  const root = { items: [structured({ code: "OTHER", caption: { text: "Recommendation" } }), structured({ user: { username: "wrong" }, caption: { text: "Wrong author" } }), structured({ carousel_media: [media(img), media(`${img}?signature=another`), media(second)] })] };
  const d = parse(`<html><head></head><body>${script(root)}</body></html>`);
  assert.equal(d.caption, "Exact primary caption"); assert.deepEqual(d.imageCandidates.map((i) => i.url), [img, second]);
  assert.equal(d.readStatus, "success");
});

test("JSON-LD SocialMediaPosting uses matching URL only, never unrelated graph entries", () => {
  const node = { "@type": "SocialMediaPosting", url: A.final, articleBody: "Primary text https://shop.example/product/a", image: [img, { contentUrl: `${img}?sig=2` }] };
  const d = parse(`<html><head>${script({ "@graph": [{ ...node, url: B.final, articleBody: "Other text" }, node] }, "application/ld+json")}</head></html>`);
  assert.equal(d.caption, node.articleBody); assert.equal(d.imageCandidates.length, 1);
  assert.deepEqual(d.outboundLinkEvidence, [{ url: "https://shop.example/product/a", source: "post-json", postId: "DRNBp0REvzg", fetched: false }]);
});

test("outbound evidence only from bound caption; never navigation/recommendations or S1 fetch", async () => {
  const html = A.html.replace("Synthetic source fixture", "See https://shop.example/product/a and https://127.0.0.1/private").replace("</body>", '<a href="https://other.example/ad">Ad</a></body>');
  const calls = [];
  const d = await readThreadsSource(A.final, deps({ [A.final]: { body: html }, [img]: imageRoute }, calls));
  assert.equal(d.outboundLinkEvidence.length, 1); assert.equal(d.outboundLinkEvidence[0].url, "https://shop.example/product/a");
  assert.ok(calls.every((c) => !c.url.includes("shop.example")));
});

test("conflicting captions do not guess; generic title is never caption", () => {
  const d = parse(`<html><head></head><body>${script([structured(), structured({ caption: { text: "Conflicting" } })])}</body></html>`);
  assert.equal(d.caption, null); assert.equal(d.readStatus, "partial"); assert.match(d.readReason, /caption_conflict/);
  const empty = parse("<html><head><title>Threads</title></head></html>");
  assert.equal(empty.readStatus, "unsupported"); assert.equal(empty.readReason, "missing_metadata");
});

test("malformed JSON, missing captions and unresolved share pages remain conservative", () => {
  assert.match(parse(A.html.replace("</body>", '<script type="application/json">{bad</script></body>')).readReason, /malformed_metadata/);
  const imageOnly = parse(A.html.replace(/<meta property="og:description"[^>]*>/, ""));
  assert.equal(imageOnly.readStatus, "partial"); assert.equal(imageOnly.caption, null); assert.equal(imageOnly.imageCandidates.length, 1);
  assert.equal(parse(A.html, A.original).readReason, "post_identity_unresolved");
});

for (const [route, status, reason] of [
  [{ status: 403 }, "blocked", "http_403"], [{ status: 429 }, "blocked", "http_429"],
  [{ body: "<html><head><title>Just a moment...</title></head></html>" }, "blocked", "source_challenge"],
  [{ body: "<html><head><title>Threads</title></head></html>" }, "unsupported", "missing_metadata"],
  [{ headers: { "content-type": "application/json" } }, "unsupported", "invalid_content_type"],
  [{ headers: { "content-encoding": "gzip" } }, "unsupported", "unsupported_content_encoding"],
]) test(`source status: ${reason}`, async () => {
  const d = await readThreadsSource(A.final, deps({ [A.final]: route }));
  assert.equal(d.readStatus, status); assert.equal(d.readReason, reason);
});

test("unsupported host/path never sends network traffic", async () => {
  for (const url of ["https://instagram.com/p/abc", "https://threads.com/search", "http://threads.com/share/a", "https://www.threads.com.evil.example/share/a"]) {
    const calls = []; const d = await readThreadsSource(url, deps({}, calls));
    assert.equal(d.readStatus, "unsupported"); assert.equal(calls.length, 0);
  }
});

for (const target of ["https://127.0.0.1/", "https://10.0.0.1/", "https://169.254.169.254/", "https://[::1]/", "https://[fd00::1]/", "https://[fe80::1]/"]) {
  test(`redirect SSRF blocked before socket: ${target}`, async () => {
    const calls = [];
    const d = await readThreadsSource(A.original, deps({ [A.original]: { status: 302, headers: { location: target } } }, calls));
    assert.equal(d.readStatus, "blocked"); assert.equal(calls.length, 1); assert.equal(d.caption, null);
  });
}

test("all DNS answers validated, checked IP pinned, same-host redirect resolves again", async () => {
  const calls = []; let lookups = 0;
  const options = deps({ [A.original]: { status: 302, headers: { location: A.final } } }, calls);
  options.lookup = async () => ++lookups === 1 ? publicLookup() : [...await publicLookup(), { address: "::1", family: 6 }];
  const d = await readThreadsSource(A.original, options);
  assert.equal(d.readReason, "non_public_dns"); assert.equal(lookups, 2); assert.equal(calls.length, 1);
  const checked = calls[0].options;
  checked.lookup("www.threads.com", { all: true }, (err, addresses) => { assert.ifError(err); assert.deepEqual(addresses, [{ address: "93.184.216.34", family: 4 }]); });
  assert.equal(checked.agent, false); assert.equal(checked.rejectUnauthorized, true);
  assert.equal(checked.headers.Cookie, undefined); assert.equal(checked.headers.Authorization, undefined);
});

test("redirect limit and post identity changes are stopped", async () => {
  const calls = [];
  const loop = await readThreadsSource(A.original, deps({ [A.original]: { status: 302, headers: { location: A.original } } }, calls));
  assert.equal(loop.readReason, "redirect_limit"); assert.equal(calls.length, 5);
  const changed = await readThreadsSource(A.final, deps({ [A.final]: { status: 302, headers: { location: B.final } } }));
  assert.equal(changed.readReason, "redirect_post_mismatch");
});

test("15-second deadline includes DNS and stalled body", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const options of [{ lookup: () => new Promise(() => {}) }, deps({ [A.final]: { stall: true } })]) {
    const promise = readThreadsSource(A.final, options);
    await new Promise((resolve) => setImmediate(resolve));
    t.mock.timers.tick(15001);
    const d = await promise; assert.equal(d.readReason, "timeout"); assert.equal(d.readStatus, "blocked");
  }
});

test("image SSRF DNS, redirects, MIME and byte limit cannot bypass shared policy", async () => {
  for (const route of [{ status: 302, headers: { location: "https://169.254.169.254/" } }, { status: 403 }, { body: "not-image", headers: { "content-type": "image/jpeg" } }, { body: "html", headers: { "content-type": "text/html" } }, { headers: { "content-type": "image/jpeg", "content-length": "3000000" } }]) {
    const calls = []; const d = await readThreadsSource(A.final, deps({ [A.final]: { body: A.html }, [img]: route }, calls));
    assert.equal(d.readStatus, "partial"); assert.equal(d.caption, "Synthetic source fixture");
    assert.notEqual(d.imageCandidates[0].readStatus, "success"); assert.equal(calls.length, 2);
  }
  const options = deps({ [A.final]: { body: A.html } });
  options.lookup = async (host) => host === "media.fbcdn.net" ? [{ address: "10.0.0.1", family: 4 }] : publicLookup();
  const d = await readThreadsSource(A.final, options);
  assert.equal(d.imageCandidates[0].readReason, "non_public_dns"); assert.equal(d.caption, "Synthetic source fixture");
});

test("image literal/private URL is rejected before candidate download", async () => {
  const calls = [];
  const d = await readThreadsSource(A.final, deps({ [A.final]: { body: A.html.replace(img, "https://127.0.0.1/a.jpg") } }, calls));
  assert.equal(d.imageCandidates.length, 0); assert.equal(d.readStatus, "partial"); assert.equal(calls.length, 1);
});

test("six-image cap dedupes first and downloads with at most two workers", async () => {
  const images = Array.from({ length: 9 }, (_, i) => `https://media.fbcdn.net/v/t51.82787-15/item-${i}.jpg`);
  const html = `<html><head>${script({ "@type": "SocialMediaPosting", url: A.final, articleBody: "Primary", image: images }, "application/ld+json")}</head></html>`;
  const routes = { [A.final]: { body: html }, ...Object.fromEntries(images.map((u) => [u, imageRoute])) };
  const calls = []; const baseRequest = transport(routes, calls);
  let active = 0, maxActive = 0;
  const d = await readThreadsSource(A.final, { lookup: publicLookup, request: (url, options, callback) => {
    const media = url.hostname === "media.fbcdn.net";
    if (media) { active++; maxActive = Math.max(maxActive, active); }
    return baseRequest(url, options, (response) => {
      if (media) response.once("end", () => active--);
      callback(response);
    });
  } });
  assert.equal(d.imageCandidates.length, 6); assert.equal(calls.length, 7); assert.equal(maxActive, 2);
  assert.equal(d.readStatus, "partial"); assert.match(d.readReason, /image_limit/);
});

test("image timeout keeps caption and marks only that candidate failed", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = readThreadsSource(A.final, deps({ [A.final]: { body: A.html }, [img]: { stall: true, headers: { "content-type": "image/jpeg" } } }));
  await new Promise((resolve) => setImmediate(resolve));
  t.mock.timers.tick(4001);
  const d = await p;
  assert.equal(d.caption, "Synthetic source fixture"); assert.equal(d.readStatus, "partial");
  assert.equal(d.imageCandidates[0].readReason, "timeout");
});

test("challenge and login pages are blocked, inert challenge markup is ignored", () => {
  assert.equal(parse('<html><head><title>登入 Threads</title></head></html>').readStatus, "blocked");
  assert.equal(parse('<html><body><div id="cf-chl-test"></div></body></html>').readStatus, "blocked");
  assert.equal(parse(A.html.replace("</body>", '<!-- <form id="challenge-form"> --> <script>const s = \'<form id="challenge-form">\';</script></body>')).readStatus, "success");
});

test("handler social-source has auth/trip isolation with no AI key, AI calls or writes", async (t) => {
  const token = "s2-session", digest = createHash("sha256").update(token).digest("hex");
  const store = new Map([[`tokyo-family-trip:session:${digest}`, JSON.stringify({ id: "owner" })], ["tokyo-family-trip:trip:own", JSON.stringify({ members: { owner: true } })], ["tokyo-family-trip:trip:other", JSON.stringify({ members: { other: true } })]]);
  const env = ["OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN"].map((key) => [key, process.env[key]]);
  delete process.env.OPENAI_API_KEY; process.env.KV_REST_API_URL = "https://redis.test"; process.env.KV_REST_API_TOKEN = "test";
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(String(url), "https://redis.test", "No AI/image search/network fetch beyond Redis");
    const [verb, key] = JSON.parse(options.body); assert.equal(verb, "GET");
    return new Response(JSON.stringify({ result: store.get(key) || null }));
  });
  t.mock.method(https, "request", transport({ [A.final]: { body: A.html }, [img]: imageRoute }, calls));
  t.mock.method(dns, "lookup", publicLookup); syncBuiltinESMExports();
  try {
    const run = async (cookie, tripId) => {
      const res = { code: 0, status(c) { this.code = c; return this; }, setHeader() { return this; }, json(v) { this.payload = v; } };
      await handler({ method: "POST", headers: { cookie }, body: { action: "social-source", sourceUrl: A.final, tripId, memberId: "other" } }, res); return res;
    };
    assert.equal((await run("", "own")).code, 401);
    assert.equal((await run(`tokyo_trip_session=${token}`, "other")).code, 403);
    assert.equal((await run(`tokyo_trip_session=${token}`, "")).code, 400);
    assert.equal(calls.length, 0);
    const res = await run(`tokyo_trip_session=${token}`, "own");
    assert.equal(res.code, 200); assert.equal(res.payload.socialDraft.caption, "Synthetic source fixture"); assert.equal(calls.length, 2);
  } finally {
    t.mock.restoreAll(); syncBuiltinESMExports();
    for (const [key, value] of env) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
