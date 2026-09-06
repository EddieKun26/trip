import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicMetadata, lodgingDraft } from "../api/social-place-import.mjs";

const original = "https://www.booking.com/Share-stay?app_hotel_id=123#photos";
const finalUrl = "https://www.booking.com/hotel/jp/stay.html";
const html = (canonical = "") => `<title>Real Stay | Booking.com</title>
  <meta property="og:image" content="https://cf.bstatic.com/photo.jpg">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}`;

async function withPage(initial, page, status, run) {
  const previous = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (String(url) === initial) return new Response("", { status: 302, headers: { location: finalUrl } });
    assert.equal(String(url), finalUrl);
    return new Response(page, { status, headers: { "Content-Type": "text/html" } });
  };
  try { await run(await fetchPublicMetadata(new URL(initial)), requests); }
  finally { globalThis.fetch = previous; }
}

test("redirect keeps the original URL and its listing ID even when final URL removes app_hotel_id", async () => {
  await withPage(original, html(), 200, (metadata, requests) => {
    const draft = lodgingDraft({ metadata, sourceUrl: original, platform: "Booking.com" });
    assert.equal(draft.originalReferenceUrl, original);
    assert.equal(draft.referenceUrl, original);
    assert.equal(draft.sourceListingId, "123");
    assert.equal(draft.sourceCanonicalUrl, "", "a redirect must not invent canonical evidence");
    assert.equal(draft.sourceLodgingName, "Real Stay");
    assert.equal(draft.sourceReadStatus, "available");
    assert.equal(requests.length, 2);
  });
});

test("canonical requires an explicit same-platform same-listing page link", async () => {
  const trusted = `${finalUrl}?app_hotel_id=123`;
  for (const [canonical, expected] of [
    [trusted, trusted],
    [`${finalUrl}?app_hotel_id=999`, ""],
    ["https://www.airbnb.com/rooms/123", ""],
    ["https://www.booking.com/hotel/jp/other.html", ""],
    ["https://example.com/hotel/123", ""],
  ]) {
    await withPage(original, html(canonical), 200, (metadata) => {
      const draft = lodgingDraft({ metadata, sourceUrl: original, platform: "Booking.com" });
      assert.equal(draft.sourceCanonicalUrl, expected);
      assert.equal(draft.originalReferenceUrl, original);
      assert.equal(draft.sourceListingId, "123");
    });
  }
});

test("HTTP 202 and HTML challenge cannot supply a lodging name, photo or canonical", async () => {
  for (const [status, page] of [[202, html(`${finalUrl}?app_hotel_id=123`)], [200, `<title>Just a moment...</title>${html()}`]]) {
    await withPage(original, page, status, (metadata) => {
      const draft = lodgingDraft({ metadata, sourceUrl: original, platform: "Booking.com",
        sharedText: "住宿名稱：我的新宿住宿", recognition: { places: [{ nameOriginal: "AI guessed stay" }] },
        sourceImageEntry: { url: "https://cf.bstatic.com/fake.jpg", dataUrl: "fake" } });
      assert.equal(draft.sourceReadStatus, "blocked");
      assert.equal(draft.sourceLodgingName, "");
      assert.equal(draft.userProvidedName, "我的新宿住宿");
      assert.equal(draft.sourceImageUrl, "");
      assert.equal(draft.sourceImageDataUrl, "");
      assert.equal(draft.sourceCanonicalUrl, "");
      assert.equal(draft.originalReferenceUrl, original);
      assert.equal(draft.sourceListingId, "123");
    });
  }
});

test("unavailable source separates user input and AI recognition from source-provided name", () => {
  const draft = lodgingDraft({ sourceUrl: original, metadata: { available: false },
    sharedText: "住宿名稱：我的新宿住宿\n地址：東京都新宿区西新宿2-2-1",
    recognition: { places: [{ nameOriginal: "Nearby Google hotel" }] } });
  assert.equal(draft.sourceReadStatus, "unavailable");
  assert.equal(draft.sourceLodgingName, "");
  assert.equal(draft.userProvidedName, "我的新宿住宿");
  assert.equal(draft.address, "東京都新宿区西新宿2-2-1");
});

test("an explicitly different listing in a redirect cannot become the original property's source metadata", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => String(url) === original
    ? new Response("", { status: 302, headers: { location: `${finalUrl}?app_hotel_id=999` } })
    : new Response(html(), { headers: { "Content-Type": "text/html" } });
  try {
    const metadata = await fetchPublicMetadata(new URL(original));
    const draft = lodgingDraft({ metadata, sourceUrl: original, platform: "Booking.com" });
    assert.equal(draft.sourceReadStatus, "unavailable");
    assert.equal(draft.sourceListingId, "123");
    assert.equal(draft.sourceLodgingName, ""); assert.equal(draft.sourceImageUrl, "");
  } finally { globalThis.fetch = previous; }
});
