import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const router = Router();

// ── Free preview tracking ────────────────────────────────────────────────────
// One free watermarked preview per email address, stored in a simple JSON
// file on Railway's persistent filesystem — same pattern as free-scan.ts.
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/tmp";
const DATA_FILE = join(DATA_DIR, "cartoonify_free_previews.json");

function readUsedEmails(): Record<string, boolean> {
  try {
    if (!existsSync(DATA_FILE)) return {};
    return JSON.parse(readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function markEmailUsed(email: string): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const store = readUsedEmails();
    store[email.toLowerCase().trim()] = true;
    writeFileSync(DATA_FILE, JSON.stringify(store), "utf8");
  } catch (err) {
    console.error("cartoonify: failed to record used email", err);
  }
}

function hasEmailUsedFreePreview(email: string): boolean {
  const store = readUsedEmails();
  return !!store[email.toLowerCase().trim()];
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
        .wm { fill: rgba(255,255,255,0.35); font-size: ${Math.round(width / 10)}px; font-family: sans-serif; font-weight: 700; }
      </style>
      ${Array.from({ length: 6 })
        .map((_, row) =>
          Array.from({ length: 3 })
            .map(
              (__, col) =>
                `<text class="wm" x="${col * width * 0.45 - width * 0.1}" y="${row * height * 0.2 + height * 0.1}" transform="rotate(-30 ${col * width * 0.45} ${row * height * 0.2})">ONJJEM PREVIEW</text>`
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

  // If this is a free preview request, enforce the one-per-email limit.
  if (watermark) {
    if (!email) {
      res.status(400).json({ error: "Email is required for a free preview" });
      return;
    }
    if (hasEmailUsedFreePreview(email)) {
      res.json({ alreadyUsed: true });
      return;
    }
  }

  try {
    const result = await generateCartoon(base64Image, mimeType);

    if (watermark && email) {
      const watermarkedBase64 = await addWatermark(result.base64Image, result.mimeType);
      markEmailUsed(email);
      res.json({ base64Image: watermarkedBase64, mimeType: "image/png" });
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
