import { Router } from "express";
import type { Request, Response } from "express";
import sharp from "sharp";

const router = Router();

async function sharpenImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate()
    .sharpen({
      sigma: 1.8,
      m1: 2.5,
      m2: 3.5,
      x1: 2.0,
      y2: 12.0,
      y3: 25.0,
    })
    .normalise()
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function colorizeImage(inputBuffer: Buffer): Promise<Buffer> {
  const oriented = sharp(inputBuffer).rotate();
  const rotatedBuffer = await oriented.toBuffer();
  const meta = await sharp(rotatedBuffer).metadata();
  const isGreyscale =
    meta.channels === 1 ||
    meta.space === "b-w" ||
    meta.space === "grey16";

  if (isGreyscale) {
    return sharp(rotatedBuffer)
      .toColourspace("srgb")
      .normalise()
      .modulate({ saturation: 1.0, brightness: 1.05 })
      .tint({ r: 210, g: 185, b: 150 })
      .modulate({ saturation: 2.2 })
      .gamma(1.1)
      .linear([1.08, 1.0, 0.88], [6, 2, -4])
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  return sharp(rotatedBuffer)
    .normalise()
    .modulate({ saturation: 1.9, brightness: 1.05 })
    .gamma(1.08)
    .linear([1.06, 1.0, 0.92], [4, 1, -3])
    .jpeg({ quality: 92 })
    .toBuffer();
}

router.post("/process", async (req: Request, res: Response) => {
  const { imageBase64, mode } = req.body as {
    imageBase64: string;
    mode: "sharpen" | "colorize";
  };

  if (!imageBase64 || !mode) {
    res.status(400).json({ error: "imageBase64 and mode are required" });
    return;
  }

  try {
    const inputBuffer = Buffer.from(imageBase64, "base64");

    const outputBuffer =
      mode === "sharpen"
        ? await sharpenImage(inputBuffer)
        : await colorizeImage(inputBuffer);

    const resultBase64 = outputBuffer.toString("base64");
    res.json({ resultBase64 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    req.log.error({ message }, "Process route error");
    res.status(500).json({ error: message });
  }
});

export default router;
