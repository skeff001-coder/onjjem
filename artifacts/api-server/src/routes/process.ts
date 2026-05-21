import { Router } from "express";
import type { Request, Response } from "express";
import sharp from "sharp";

const router = Router();

export type EnhancementMode = "sharpen" | "brighten" | "denoise" | "restore" | "vivid" | "colourize";

// ── Individual processors ─────────────────────────────────────────────────────

async function applySharpen(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .sharpen({ sigma: 1.6, m1: 2.0, m2: 3.0, x1: 2.0, y2: 10.0, y3: 20.0 })
    .toBuffer();
}

async function applyBrighten(buf: Buffer): Promise<Buffer> {
  // Auto-levels first then lift midtones
  return sharp(buf)
    .normalise({ lower: 1, upper: 99 })
    .modulate({ brightness: 1.18 })
    .gamma(0.82)
    .toBuffer();
}

async function applyDenoise(buf: Buffer): Promise<Buffer> {
  // Median filter kills salt-and-pepper + grain, then recover micro-detail
  return sharp(buf)
    .median(3)
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 1.5 })
    .toBuffer();
}

async function applyRestore(buf: Buffer): Promise<Buffer> {
  // Full old-photo pipeline: normalise contrast → denoise → gentle sharpen → warm tone balance
  const stage1 = await sharp(buf)
    .normalise({ lower: 2, upper: 98 })
    .median(3)
    .toBuffer();

  return sharp(stage1)
    .sharpen({ sigma: 1.0, m1: 1.0, m2: 2.0 })
    .modulate({ brightness: 1.05, saturation: 1.15 })
    .gamma(0.95)
    // Warm the shadows slightly
    .linear([1.04, 1.0, 0.96], [4, 0, -4])
    .toBuffer();
}

async function applyVivid(buf: Buffer): Promise<Buffer> {
  // Strong colour pop + contrast boost
  return sharp(buf)
    .normalise({ lower: 1, upper: 99 })
    .modulate({ saturation: 1.65, brightness: 1.05 })
    .gamma(0.88)
    // Boost reds/warmth, gentle cyan pull
    .linear([1.08, 1.0, 0.93], [6, 0, -6])
    .toBuffer();
}

async function applyColourize(buf: Buffer): Promise<Buffer> {
  const meta = await sharp(buf).metadata();
  const isGreyscale =
    meta.channels === 1 ||
    meta.space === "b-w" ||
    meta.space === "grey16";

  if (isGreyscale) {
    // B&W → natural warm sepia-to-colour using recomb matrix
    // Produces a believable historical colour look: warm midtones, bright highlights
    const stage1 = await sharp(buf)
      .toColourspace("srgb")
      .normalise({ lower: 1, upper: 99 })
      .toBuffer();

    return sharp(stage1)
      // Sepia-ish matrix that stays natural — not orange
      .recomb([
        [1.00, 0.12, 0.00],
        [0.00, 0.92, 0.06],
        [0.00, 0.05, 0.84],
      ])
      .modulate({ saturation: 1.3, brightness: 1.03 })
      .gamma(1.05)
      .toBuffer();
  }

  // Already colour — just revive faded/washed-out colours
  return sharp(buf)
    .normalise({ lower: 2, upper: 98 })
    .modulate({ saturation: 1.4, brightness: 1.03 })
    .gamma(0.97)
    .linear([1.04, 1.0, 0.97], [3, 0, -3])
    .toBuffer();
}

// ── Compose all selected modes in order ───────────────────────────────────────

export async function applyEnhancements(
  inputBuffer: Buffer,
  modes: EnhancementMode[],
): Promise<Buffer> {
  // Always correct EXIF orientation first
  let buf = await sharp(inputBuffer).rotate().toBuffer();

  for (const mode of modes) {
    switch (mode) {
      case "sharpen":   buf = await applySharpen(buf);   break;
      case "brighten":  buf = await applyBrighten(buf);  break;
      case "denoise":   buf = await applyDenoise(buf);   break;
      case "restore":   buf = await applyRestore(buf);   break;
      case "vivid":     buf = await applyVivid(buf);     break;
      case "colourize": buf = await applyColourize(buf); break;
    }
  }

  // Final JPEG output
  return sharp(buf).jpeg({ quality: 93 }).toBuffer();
}

// ── Free preview downgrade ────────────────────────────────────────────────────
// Free tier: scale to 50 % of original dimensions, apply weaker effects,
// then scale back up. This produces a noticeably softer result compared with
// the paid HD output so users can see a real difference.
async function makeFreePreview(inputBuffer: Buffer, modes: EnhancementMode[]): Promise<Buffer> {
  // EXIF-correct first
  const oriented = await sharp(inputBuffer).rotate().toBuffer();
  const meta = await sharp(oriented).metadata();

  const w = meta.width  ?? 800;
  const h = meta.height ?? 800;

  // Scale down to 50 %
  const smallBuf = await sharp(oriented)
    .resize(Math.round(w * 0.5), Math.round(h * 0.5))
    .toBuffer();

  // Apply reduced-strength versions of each mode
  let buf = smallBuf;
  for (const mode of modes) {
    switch (mode) {
      case "sharpen":
        buf = await sharp(buf).sharpen({ sigma: 0.7, m1: 0.8, m2: 1.0 }).toBuffer();
        break;
      case "brighten":
        buf = await sharp(buf).modulate({ brightness: 1.08 }).gamma(0.93).toBuffer();
        break;
      case "denoise":
        buf = await sharp(buf).median(3).toBuffer();
        break;
      case "restore":
        buf = await sharp(buf).normalise({ lower: 5, upper: 95 }).median(3).toBuffer();
        break;
      case "vivid":
        buf = await sharp(buf).modulate({ saturation: 1.2 }).toBuffer();
        break;
      case "colourize":
        buf = await applyColourize(buf);
        break;
    }
  }

  // Scale back up to original size (bilinear — creates visible softness)
  return sharp(buf)
    .resize(w, h, { kernel: sharp.kernel.linear })
    .jpeg({ quality: 72 }) // lower quality = visible compression vs HD
    .toBuffer();
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/process", async (req: Request, res: Response) => {
  const body = req.body as {
    imageBase64?: string;
    modes?: EnhancementMode[];
    freePreview?: boolean;
    // Legacy single-mode support
    mode?: string;
  };

  const { imageBase64 } = body;
  const freePreview = body.freePreview !== false; // default true (all public requests are free tier)

  // Accept both new `modes[]` and legacy `mode` string
  const modes: EnhancementMode[] =
    body.modes && body.modes.length > 0
      ? body.modes
      : body.mode === "colorize" || body.mode === "colourize"
        ? ["colourize"]
        : body.mode === "sharpen"
          ? ["sharpen"]
          : [];

  if (!imageBase64 || modes.length === 0) {
    res
      .status(400)
      .json({ error: "imageBase64 and at least one mode are required" });
    return;
  }

  if (modes.length > 3) {
    res.status(400).json({ error: "A maximum of 3 enhancements can be combined" });
    return;
  }

  try {
    const inputBuffer = Buffer.from(imageBase64, "base64");
    const outputBuffer = freePreview
      ? await makeFreePreview(inputBuffer, modes)
      : await applyEnhancements(inputBuffer, modes);
    const resultBase64 = outputBuffer.toString("base64");
    res.json({ resultBase64 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    req.log.error({ message }, "Process route error");
    res.status(500).json({ error: message });
  }
});

export default router;
