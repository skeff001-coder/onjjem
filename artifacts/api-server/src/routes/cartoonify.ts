import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const router = Router();

// ── Free preview tracking ────────────────────────────────────────────────────
// One free watermarked preview per email address — trying a different result
// after that is a paid £1.99 attempt, not another free retry — capped
// further by a limit per IP address (so someone can't just type a new fake
// email each time).
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/tmp";
const DATA_FILE = join(DATA_DIR, "cartoonify_free_previews.json");
const MAX_PREVIEWS_PER_IP_PER_DAY = 6;
const MAX_PREVIEWS_PER_EMAIL = 1;

function readStore(): { emails: Record<string, number>; ipDaily: Record<string, { day: string; count: number }> } {
  try {
    if (!existsSync(DATA_FILE)) return { emails: {}, ipDaily: {} };
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    return { emails: parsed.emails ?? {}, ipDaily: parsed.ipDaily ?? {} };
  } catch {
    return { emails: {}, ipDaily: {} };
  }
}

function writeStore(store: ReturnType<typeof readStore>): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
  } catch (err) {
    console.error("cartoonify: failed to write preview tracking store", err);
  }
}

function recordEmailPreview(email: string): void {
  const store = readStore();
  const key = email.toLowerCase().trim();
  store.emails[key] = (store.emails[key] ?? 0) + 1;
  writeStore(store);
}

function emailPreviewsRemaining(email: string): number {
  const store = readStore();
  const used = store.emails[email.toLowerCase().trim()] ?? 0;
  return Math.max(0, MAX_PREVIEWS_PER_EMAIL - used);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function hasIpExceededDailyLimit(ip: string): boolean {
  const store = readStore();
  const entry = store.ipDaily[ip];
  if (!entry || entry.day !== todayKey()) return false;
  return entry.count >= MAX_PREVIEWS_PER_IP_PER_DAY;
}

function recordIpPreview(ip: string): void {
  const store = readStore();
  const today = todayKey();
  const entry = store.ipDaily[ip];
  if (!entry || entry.day !== today) {
    store.ipDaily[ip] = { day: today, count: 1 };
  } else {
    entry.count += 1;
  }
  writeStore(store);
}

function getAI() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini AI integration not configured");
  }
  return new GoogleGenAI({ apiKey });
}

// ── Seasonal styles ──────────────────────────────────────────────────────────
// Extra instructions added to the main prompt when the page asks for a theme.
const STYLE_EXTRAS: Record<string, string> = {
  halloween:
    " THEME: Halloween. Dress the subject in a cute, friendly Halloween " +
    "costume that suits them (for example a little witch hat, a pumpkin " +
    "outfit, a friendly vampire cape or cat ears). Replace the background " +
    "with a cosy Halloween night: glowing jack-o'-lanterns, autumn leaves, " +
    "a big orange full moon, a few friendly cartoon bats and warm orange and " +
    "purple lighting. Keep it cheerful and cute, never scary or gory, " +
    "suitable for young children.",
  christmas:
    " THEME: Christmas. Dress the subject in a cosy festive outfit (for " +
    "example a Santa hat, an elf hat or a Christmas jumper). Replace the " +
    "background with a warm Christmas scene: twinkling fairy lights, a " +
    "decorated tree, wrapped presents and gentle falling snow. Cheerful, " +
    "cosy and suitable for all ages.",
};

// ── Preview cache ────────────────────────────────────────────────────────────
// The free preview and the paid final version must be the SAME picture. We
// keep the clean (unwatermarked) version of each preview for 2 hours, so the
// final request returns exactly what the customer approved instead of
// generating a new, different-looking cartoon.
const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000;
const previewCache = new Map<string, { base64Image: string; mimeType: string; at: number }>();
function cachePreview(result: { base64Image: string; mimeType: string }): string {
  const now = Date.now();
  for (const [key, value] of previewCache) {
    if (now - value.at > PREVIEW_TTL_MS) previewCache.delete(key);
  }
  const id = Math.random().toString(36).slice(2) + now.toString(36);
  previewCache.set(id, { ...result, at: now });
  return id;
}

async function generateCartoon(base64Image: string, mimeType: string, style?: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      { inlineData: { mimeType, data: base64Image } },
      {
        text:
          "Completely redraw this photo from scratch as a professional 3D " +
          "animated character illustration, in the polished style of a " +
          "modern Pixar or DreamWorks film. This must NOT look like the " +
          "original photo with a filter or minor edits applied — it must " +
          "look like a genuine, hand-crafted animated character. " +
          "Specifically: smooth and simplify the skin/fur texture into " +
          "clean animated shading with soft gradients (no visible pores, " +
          "wrinkles, or photographic texture), simplify and stylise the " +
          "hair into clumped, sculpted animated strands, gently enlarge " +
          "and stylise the eyes with glossy animated highlights, soften " +
          "and round the nose and other facial features into a friendly " +
          "animated proportion, and apply rich, warm, saturated cartoon " +
          "colour grading throughout the whole image, not just the face. " +
          "Keep the subject's pose, clothing colours, and general " +
          "identity recognisable, but the final result must clearly and " +
          "unmistakably read as an animated character on first glance, " +
          "not a photo with eyes edited. Use a simple, softly blurred " +
          "background that doesn't distract from the character. Output " +
          "only the image, no text." +
          (style && STYLE_EXTRAS[style] ? STYLE_EXTRAS[style] : ""),
      },
    ],
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: any) => p.inlineData);

  if (!imagePart || !imagePart.inlineData) {
    throw new Error("The cartoon generator didn't return an image.");
  }

  return {
    base64Image: imagePart.inlineData.data as string,
    mimeType: (imagePart.inlineData.mimeType as string) ?? "image/png",
  };
}

// Overlays a diagonal repeating "ONJJEM PREVIEW" watermark across the image
// using Sharp — cheap, fast, and makes the free preview unusable for real
// printing while still clearly showing the customer what they'd get.
async function addWatermark(base64Image: string, mimeType: string): Promise<string> {
  const inputBuffer = Buffer.from(base64Image, "base64");
  const image = sharp(inputBuffer);
  const meta = await image.metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 800;

  const watermarkSvg = `
    <svg width="${width}" height="${height}">
      <style>
        .wm { fill: rgba(255,255,255,0.45); font-size: ${Math.round(width / 6)}px; font-family: sans-serif; font-weight: 800; }
      </style>
      ${Array.from({ length: 4 })
        .map((_, row) =>
          Array.from({ length: 2 })
            .map(
              (__, col) =>
                `<text class="wm" x="${col * width * 0.65 - width * 0.1}" y="${row * height * 0.3 + height * 0.12}" transform="rotate(-30 ${col * width * 0.65} ${row * height * 0.3})">ONJJEM PREVIEW</text>`
            )
            .join("")
        )
        .join("")}
    </svg>
  `;

  const watermarkedBuffer = await image
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return watermarkedBuffer.toString("base64");
}

router.post("/cartoonify", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg", email, watermark, style, previewId } = req.body as {
    base64Image?: string;
    mimeType?: string;
    email?: string;
    watermark?: boolean;
    style?: string;
    previewId?: string;
  };

  // Final (paid) version of a preview the customer already approved: return
  // that exact picture if we still have it.
  if (!watermark && previewId) {
    const cached = previewCache.get(previewId);
    if (cached) {
      res.json({ base64Image: cached.base64Image, mimeType: cached.mimeType });
      return;
    }
  }

  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required" });
    return;
  }

  // The frontend sends a full data URL (data:image/jpeg;base64,...) — Gemini
  // needs just the raw base64 data, or it rejects the request entirely.
  const rawBase64Image = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // If this is a free preview request, enforce up to 2 tries per email
  // (their first go, plus one retry) AND a per-IP daily cap, so someone
  // can't just type a new fake email each time for unlimited free previews.
  // Email is optional — if not given, IP limiting alone still applies.
  let remaining = MAX_PREVIEWS_PER_EMAIL;
  if (watermark) {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    if (hasIpExceededDailyLimit(ip)) {
      res.json({ alreadyUsed: true, limitReason: "too_many_from_this_device" });
      return;
    }
    if (email) {
      remaining = emailPreviewsRemaining(email);
      if (remaining <= 0) {
        res.json({ alreadyUsed: true });
        return;
      }
    }
  }

  try {
    const result = await generateCartoon(rawBase64Image, mimeType, style);

    if (watermark) {
      const watermarkedBase64 = await addWatermark(result.base64Image, result.mimeType);
      if (email) recordEmailPreview(email);
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      recordIpPreview(ip);
      res.json({
        base64Image: watermarkedBase64,
        mimeType: "image/png",
        previewId: cachePreview(result),
        retriesLeft: remaining - 1, // how many more tries after this one
      });
      return;
    }

    res.json(result);
  } catch (e: any) {
    req.log.error({ err: e }, "Cartoonify generation failed");
    res.status(500).json({
      error: "Could not generate the cartoon version. Please try again.",
      details: e?.message,
    });
  }
});

export default router;
