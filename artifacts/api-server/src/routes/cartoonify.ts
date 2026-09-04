import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const router = Router();

// ── Free preview tracking ────────────────────────────────────────────────────
// Up to 2 free watermarked previews per email address (their first go, plus
// one retry if they don't like the result) — capped further by a limit per
// IP address (so someone can't just type a new fake email each time).
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/tmp";
const DATA_FILE = join(DATA_DIR, "cartoonify_free_previews.json");
const MAX_PREVIEWS_PER_IP_PER_DAY = 6;
const MAX_PREVIEWS_PER_EMAIL = 2;

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

async function generateCartoon(base64Image: string, mimeType: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      { inlineData: { mimeType, data: base64Image } },
      {
        text:
          "Redraw this photo as a warm, high-quality Pixar/Disney-style " +
          "3D animated cartoon illustration. Keep the subject clearly " +
          "recognisable (same pose, same distinguishing features) but " +
          "reimagined with soft cartoon shading, big expressive eyes if " +
          "there's a face or animal in the photo, and a gentle, family-friendly " +
          "art style. Keep the background simple and complementary, not busy. " +
          "Output only the image, no text.",
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
  const { base64Image, mimeType = "image/jpeg", email, watermark } = req.body as {
    base64Image?: string;
    mimeType?: string;
    email?: string;
    watermark?: boolean;
  };

  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required" });
    return;
  }

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
    const result = await generateCartoon(base64Image, mimeType);

    if (watermark) {
      const watermarkedBase64 = await addWatermark(result.base64Image, result.mimeType);
      if (email) recordEmailPreview(email);
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      recordIpPreview(ip);
      res.json({
        base64Image: watermarkedBase64,
        mimeType: "image/png",
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
