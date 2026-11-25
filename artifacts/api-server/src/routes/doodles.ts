import { Router, Request, Response } from "express";
import Replicate from "replicate";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const router = Router();

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const replicate = REPLICATE_TOKEN ? new Replicate({ auth: REPLICATE_TOKEN }) : null;

// ── Per-device credit tracking ──────────────────────────────────────────────────
// Each device gets a handful of free animations before they have to upgrade. We
// track these credits by deviceId and write them to a JSON file on the Railway volume.
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/tmp";
const DATA_FILE = join(DATA_DIR, "doodles_credits.json");
const MAX_FREE_ANIMATIONS = 5;

function readCredits(): Record<string, number> {
  try {
    if (!existsSync(DATA_FILE)) return {};
    return JSON.parse(readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCredits(credits: Record<string, number>): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(credits), "utf8");
  } catch (err) {
    console.error("doodles: failed to write credits store", err);
  }
}

function recordAnimation(deviceId: string): void {
  const credits = readCredits();
  credits[deviceId] = (credits[deviceId] ?? MAX_FREE_ANIMATIONS) - 1;
  writeCredits(credits);
}

function animationsRemaining(deviceId: string): number {
  const credits = readCredits();
  return Math.max(0, credits[deviceId] ?? MAX_FREE_ANIMATIONS);
}

export async function animate(base64Image: string, mimeType: string) {
  if (!replicate) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  const model = "andreasjansson/stable-diffusion-animation-2:1f4ad03dbac6fae2ccec6ab3cf2d820be2c71c470b41a3bf5366b5d3f85686ff";
  const prompt = "The hand-drawn crayon character in the image comes to life, waving and dancing, keep the child's drawing style and paper background";
  const negativePrompt = "realistic photo, photograph, detailed, expressive";
  const numInferenceSteps = 150;

  const dataUri = `data:${mimeType};base64,${base64Image}`;
  const inputPng = await sharp(Buffer.from(base64Image, "base64"))
    .resize({ width: 512, height: 512, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const inputDataUri = `data:image/png;base64,${inputPng.toString("base64")}`;

  const output = await replicate.run(model, {
    input: {
      animation_mode: "3D", // Match Replicate's example
      motion: "Yes there is motion", // Match Replicate's example
      sampler: "dpm2", // Fast sampler used in Replicate's example
      negative_prompt: negativePrompt,
      num_inference_steps: numInferenceSteps,
      prompt: prompt,
      image: inputDataUri,
      seed: -1,
      guidance_scale: 7.5,
    },
    wait: { mode: "poll", interval: 1000 },
  });

  console.log("Replicate output:", output);

  // Output is an array of MP4 URLs
  if (!Array.isArray(output) || output.length === 0 || typeof output[0] !== "string") {
    throw new Error("Unexpected output from Replicate");
  }

  const videoUrl = output[0];
  return videoUrl;
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/doodles/animate", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/png", deviceId } = req.body as {
    base64Image?: string;
    mimeType?: string;
    deviceId?: string;
  };

  if (!base64Image || !deviceId) {
    res.status(400).json({ error: "base64Image and deviceId are required" });
    return;
  }

  const remaining = animationsRemaining(deviceId);
  if (remaining <= 0) {
    res.json({ error: "No free animations remaining. Upgrade to Jemzi+ for unlimited animations." });
    return;
  }

  try {
    const drawingId = await saveToProdigi(base64Image);
    const jobId = await startReplicateJob(base64Image, mimeType);

    recordAnimation(deviceId);

    res.json({
      drawingId,
      jobId,
      creditsRemaining: remaining - 1,
    });
  } catch (e: any) {
    req.log.error({ err: e }, "Animation failed");
    res.status(500).json({
      error: "Could not process the drawing. Please try again.",
      details: e?.message,
    });
  }
});

router.get("/doodles/job/:id", async (req: Request, res: Response) => {
  const { id: jobId } = req.params;

  if (!replicate) {
    res.status(500).json({ error: "Replicate not configured" });
    return;
  }

  try {
    const status = await replicate.getJob(jobId);

    if (status.status === "succeeded") {
      res.json({
        status: status.status,
        outputUrl: status.output[0], // Assuming output is array of URLs
      });
    } else if (status.status === "failed") {
      res.status(500).json({
        status: status.status,
        error: "Animation job failed",
        details: status.error,
      });
    } else {
      res.json({ status: status.status });
    }
  } catch (e: any) {
    req.log.error({ err: e }, "Failed to get Replicate job");
    res.status(500).json({
      error: "Could not retrieve job status. Please try again.",
      details: e?.message,
    });
  }
});

router.get("/doodles/drawing/:id", async (req: Request, res: Response) => {
  const { id: drawingId } = req.params;

  try {
    const result = await readFromProdigi(drawingId);
    const img = Buffer.from(result.base64Image, "base64");

    res.writeHead(200, {
      "Content-Type": result.mimeType,
      "Content-Length": img.length,
    });
    res.end(img);
  } catch (e: any) {
    req.log.error({ err: e }, "Failed to read drawing");
    res.status(500).json({
      error: "Could not retrieve drawing",
      details: e?.message,
    });
  }
});

async function saveToProdigi(base64Image: string): Promise<string> {
  // TODO: Save base64Image to Prodigi photo table
  // Return the drawing ID
  return "example-drawing-id";
}

async function readFromProdigi(drawingId: string): Promise<{ base64Image: string; mimeType: string }> {
  // TODO: Read drawing from Prodigi photo table by ID
  // Return the base64 encoded image and MIME type
  return {
    base64Image: "example-base64-image",
    mimeType: "image/png",
  };
}

async function startReplicateJob(base64Image: string, mimeType: string): Promise<string> {
  const videoUrl = await animate(base64Image, mimeType);

  // TODO: Return the actual Replicate job ID
  return "example-job-id";
}

export default router;