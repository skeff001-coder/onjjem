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
    "purple lighting, all drawn in the same cartoon style as the " +
    "characters. Keep it cheerful and cute, never scary or gory, " +
    "suitable for young children. The theme must not make anyone look " +
    "less cartoon-like: every face is still a fully animated character.",
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
          "Redraw this photo as a bold, fun, classic hand-drawn 2D cartoon, " +
          "like a frame from a cheerful Saturday-morning cartoon show. It must " +
          "look DRAWN, never like the original photo with a filter or edited " +
          "eyes. Use thick, clean black outlines, flat bright colours with " +
          "simple cel shading, and no photographic texture anywhere. " +
          "EXAGGERATE like a real cartoonist: make heads noticeably bigger, " +
          "eyes big, round and expressive with white highlights, smiles wide " +
          "and full of personality, noses and features simplified into fun " +
          "rounded shapes, and give everyone a lively, playful expression " +
          "and a slightly bouncy, animated pose. Ornaments, figurines, " +
          "statues and toys become living cartoon characters, not ceramic " +
          "or plastic. Keep it recognisable: the same number of people and " +
          "animals, their clothing colours, hair colour and key features " +
          "(for pets, keep the exact fur colours and markings: never change a " +
          "grey or white animal into a ginger one). Every face, including " +
          "adults and elderly people, must be fully cartoon: older people " +
          "become warm, smiley cartoon grandparents. Redraw the background " +
          "as a simple, colourful cartoon background in the same style, never " +
          "left as a photo. Remove any watermarks, logos or text from the " +
          "original. Family-friendly. Output only the image, no text." +
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

// "ONJJEM" drawn as a shape (letters from Poppins Medium converted to an SVG
// path, Medium weight). The server has no fonts installed, so <text> watermarks rendered as
// empty boxes; a path needs no font and always looks the same.
const ONJJEM_PATH = "M37 351Q37 249 84.5 168.0Q132 87 213.5 41.5Q295 -4 392 -4Q490 -4 571.5 41.5Q653 87 700.0 168.0Q747 249 747 351Q747 453 700.0 534.5Q653 616 571.5 661.5Q490 707 392 707Q295 707 213.5 661.5Q132 616 84.5 534.5Q37 453 37 351ZM630 351Q630 274 599.5 216.0Q569 158 515.0 127.0Q461 96 392 96Q323 96 269.0 127.0Q215 158 184.5 216.0Q154 274 154 351Q154 428 184.5 486.5Q215 545 269.0 576.5Q323 608 392 608Q461 608 515.0 576.5Q569 545 599.5 486.5Q630 428 630 351ZM1470 700H1356L1013 181V700H899V4H1013L1356 522V4H1470ZM2039 5V506Q2039 599 1982.5 653.0Q1926 707 1834 707Q1742 707 1685.5 653.0Q1629 599 1629 506H1744Q1745 552 1767.5 579.0Q1790 606 1834 606Q1878 606 1901.0 578.5Q1924 551 1924 506V5ZM2643 5V506Q2643 599 2586.5 653.0Q2530 707 2438 707Q2346 707 2289.5 653.0Q2233 599 2233 506H2348Q2349 552 2371.5 579.0Q2394 606 2438 606Q2482 606 2505.0 578.5Q2528 551 2528 506V5ZM2982 97V301H3222V394H2982V607H3252V700H2868V4H3252V97ZM4164 5V700H4050V224L3838 700H3759L3546 224V700H3432V5H3555L3799 550L4042 5Z";
const ONJJEM_PATH_W = 4279;
const ONJJEM_PATH_H = 720;

// One large, semi-transparent "ONJJEM" across the middle of the free preview,
// corner to corner. The customer can still clearly see their cartoon, but the
// preview can't be used for printing.
async function addWatermark(base64Image: string, mimeType: string): Promise<string> {
  const inputBuffer = Buffer.from(base64Image, "base64");
  const image = sharp(inputBuffer);
  const meta = await image.metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 800;

  const scale = (Math.hypot(width, height) * 0.72) / ONJJEM_PATH_W;
  const angle = (-Math.atan2(height, width) * 180) / Math.PI;
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g transform="translate(${width / 2} ${height / 2}) rotate(${angle}) scale(${scale}) translate(${-ONJJEM_PATH_W / 2} ${-ONJJEM_PATH_H / 2 - 20})">
        <path d="${ONJJEM_PATH}" fill="rgba(255,255,255,0.28)" stroke="rgba(0,0,0,0.15)" stroke-width="${2 / scale}"/>
      </g>
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
