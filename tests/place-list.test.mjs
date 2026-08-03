import assert from "node:assert/strict";
import test from "node:test";

import placeListHandler from "../api/place-list.mjs";

function responseMock() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function publicListPayload() {
  const firstDetail = [];
  firstDetail[4] = "80743高雄市三民區重慶街157號";
  firstDetail[5] = [null, null, 22.646195, 120.3021201];
  const secondDetail = [];
  secondDetail[4] = "801高雄市前金區成功一路528號";
  secondDetail[5] = [null, null, 22.6330171, 120.290417];
  const list = [];
  list[4] = "高雄合菜";
  list[8] = [
    [null, firstDetail, "添食埊粒"],
    [null, secondDetail, "永筵小館"],
  ];
  return `)]}'\n${JSON.stringify([list])}`;
}

test("public Google Maps shared lists expand into their individual places", async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (calls.length === 1) {
      return {
        ok: true,
        status: 200,
        url: "https://www.google.com/maps/@/data=!3m1!4b1!4m2!11m1!2spublic-list-id",
        async text() {
          return '<link href="/maps/preview/entitylist/getlist?pb=test&amp;hl=zh-TW" as="fetch" rel="preload">';
        },
      };
    }
    return {
      ok: true,
      status: 200,
      url: String(url),
      async text() {
        return publicListPayload();
      },
    };
  };

  const response = responseMock();
  await placeListHandler({
    method: "POST",
    body: { urls: ["https://maps.app.goo.gl/RbuDr1WSBJHoquGi8?g_st=i"] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.results[0].isList, true);
  assert.equal(response.payload.results[0].title, "高雄合菜");
  assert.deepEqual(response.payload.results[0].places.map((place) => place.name), ["添食埊粒", "永筵小館"]);
  assert.equal(response.payload.results[0].places[0].latitude, 22.646195);
  assert.match(response.payload.results[0].places[1].sourceUrl, /query=/);
  assert.match(calls[1], /\/maps\/preview\/entitylist\/getlist\?pb=test&hl=zh-TW/);
});

test("ordinary Google Maps place links are not treated as shared lists", async () => {
  globalThis.fetch = async (url) => ({
    ok: true,
    status: 200,
    url: "https://www.google.com/maps/place/Tokyo+Tower",
    async text() { return ""; },
  });
  const response = responseMock();
  await placeListHandler({
    method: "POST",
    body: { urls: ["https://maps.app.goo.gl/single-place"] },
  }, response);
  assert.equal(response.payload.results[0].isList, false);
  assert.match(response.payload.results[0].expandedUrl, /\/maps\/place\/Tokyo\+Tower/);
});
