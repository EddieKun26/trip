import assert from "node:assert/strict";
import test from "node:test";

import { searchProductImageCandidates } from "../product-image-search.mjs";

function searchPayload(sources) {
  return {
    output: [{
      type: "web_search_call",
      action: { sources: sources.map((source) => ({ url: source, title: "商品頁" })) },
    }],
  };
}

test("product image search automatically combines two fallback searches when the first round is empty", async () => {
  const originalFetch = globalThis.fetch;
  let openAiCalls = 0;
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes("api.openai.com/v1/responses")) {
      openAiCalls += 1;
      if (openAiCalls === 1) return new Response(JSON.stringify(searchPayload([])), { status: 200 });
      const suffix = openAiCalls === 2 ? "official" : "retail";
      return new Response(JSON.stringify(searchPayload([
        `https://${suffix}.example.com/product-a`,
        `https://${suffix}.example.com/product-b`,
      ])), { status: 200 });
    }
    if (value.includes(".example.com/product-")) {
      const slug = value.split("/").pop();
      const host = new URL(value).hostname.split(".")[0];
      return new Response(`<script type="application/ld+json">{"@type":"Product","image":"https://cdn.example.com/${host}-${slug}.jpg"}</script>`, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (value.startsWith("https://cdn.example.com/")) {
      return new Response(new Uint8Array([255, 216, 255, 217]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
      });
    }
    throw new Error(`Unexpected fetch: ${value}`);
  };

  try {
    const images = await searchProductImageCandidates("test-key", { brand: "品牌", name: "商品" });
    assert.equal(openAiCalls, 3);
    assert.equal(images.length, 3);
    assert.equal(images.every((image) => image.kind === "web-product"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("product image search skips fallback searches when the first round already has three images", async () => {
  const originalFetch = globalThis.fetch;
  let openAiCalls = 0;
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes("api.openai.com/v1/responses")) {
      openAiCalls += 1;
      return new Response(JSON.stringify(searchPayload(["https://official.example.com/product"])), { status: 200 });
    }
    if (value === "https://official.example.com/product") {
      return new Response('<script type="application/ld+json">{"@type":"Product","image":["https://cdn.example.com/1.jpg","https://cdn.example.com/2.jpg","https://cdn.example.com/3.jpg"]}</script>', {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (value.startsWith("https://cdn.example.com/")) {
      return new Response(new Uint8Array([255, 216, 255, 217]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg", "Content-Length": "4" },
      });
    }
    throw new Error(`Unexpected fetch: ${value}`);
  };

  try {
    const images = await searchProductImageCandidates("test-key", { brand: "品牌", name: "商品" });
    assert.equal(openAiCalls, 1);
    assert.equal(images.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
