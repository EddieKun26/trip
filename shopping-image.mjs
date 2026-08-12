const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";

function cleanErrorToken(value, limit = 80) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, limit);
}

function imageDataUrlParts(imageDataUrl) {
  const match = String(imageDataUrl || "").match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error("OPENAI_IMAGE_INVALID_REFERENCE");
  const subtype = match[1].toLowerCase() === "jpeg" ? "jpeg" : match[1].toLowerCase();
  return {
    bytes: Buffer.from(match[2], "base64"),
    mimeType: `image/${subtype}`,
    extension: subtype === "jpeg" ? "jpg" : subtype,
  };
}

function openAiImageError(status, payload) {
  const code = cleanErrorToken(payload?.error?.code || payload?.error?.type);
  return new Error(`OPENAI_IMAGE_${status}${code ? `_${code}` : ""}`);
}

function generatedProductImage(payload) {
  const base64 = String(payload?.data?.[0]?.b64_json || "").trim();
  if (!base64) return null;
  return {
    url: `data:image/webp;base64,${base64}`,
    pageUrl: "",
    sourceTitle: "AI 依原始截圖重製",
    kind: "ai-generated",
  };
}

async function callOpenAiProductImage(apiKey, imageDataUrl) {
  const reference = imageDataUrlParts(imageDataUrl);
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("image[]", new Blob([reference.bytes], { type: reference.mimeType }), `product-reference.${reference.extension}`);
  form.append("prompt", [
    "Use the uploaded screenshot as the sole visual reference.",
    "Identify the single main purchasable product and create one photorealistic studio catalog image of that exact product.",
    "Pure white background, only the product, front-facing or its most recognizable packaging view, fully visible, centered, with generous white margin.",
    "Preserve the confirmed package shape, container, brand identity, model or variant, colors, and visible label design from the reference.",
    "Do not switch to another product or variant. Do not invent a package that is not supported by the screenshot.",
    "No people, hands, models, celebrities, lifestyle scene, advertising layout, price, benefit icons, decorative props, or additional products.",
  ].join(" "));
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  form.append("background", "opaque");
  form.append("output_format", "webp");
  form.append("output_compression", "55");
  form.append("n", "1");

  const response = await fetch(OPENAI_IMAGE_EDIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(150000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw openAiImageError(response.status, payload);
  const image = generatedProductImage(payload);
  if (!image) throw new Error("OPENAI_IMAGE_EMPTY_RESULT");
  return image;
}

export { callOpenAiProductImage, generatedProductImage, imageDataUrlParts, openAiImageError };
