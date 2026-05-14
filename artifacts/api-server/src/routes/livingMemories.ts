import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const REPLICATE_API = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string;
  urls?: { get: string };
}

// Portrait-animation prompt — works well across all ages / eras of photo
const ANIMATION_PROMPT =
  "A portrait photograph gently coming to life. " +
  "Subtle, natural eye blinks. Soft hair movement in a light breeze. " +
  "A gentle rise and fall of the chest as the person breathes. " +
  "Warm, realistic lighting. Cinematic quality. No exaggerated motion.";

async function createPrediction(imageBase64: string): Promise<string> {
  // minimax/video-01-live: reliable image-to-video model on Replicate
  const res = await fetch(
    `${REPLICATE_API}/models/minimax/video-01-live/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait=30",
      },
      body: JSON.stringify({
        input: {
          prompt: ANIMATION_PROMPT,
          first_frame_image: `data:image/jpeg;base64,${imageBase64}`,
          prompt_optimizer: true,
        },
      }),
    },
  );

  const data = (await res.json()) as ReplicatePrediction;

  if (!res.ok) {
    const detail =
      (data as unknown as { detail?: string }).detail ??
      (data as unknown as { error?: string }).error ??
      "Failed to create animation";
    throw new Error(detail);
  }

  // If Replicate already finished synchronously (Prefer: wait=30)
  if (data.status === "succeeded") {
    const out = data.output;
    return Array.isArray(out) ? (out[0] ?? "") : (out ?? "");
  }

  if (data.status === "failed" || data.status === "canceled") {
    throw new Error(data.error ?? "Animation generation failed");
  }

  return data.id;
}

async function pollPrediction(
  id: string,
  maxWaitMs = 360_000,
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8_000));

    const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
    });
    const data = (await res.json()) as ReplicatePrediction;

    if (data.status === "succeeded") {
      const out = data.output;
      return Array.isArray(out) ? (out[0] ?? "") : (out ?? "");
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error ?? "Animation generation failed");
    }
  }

  throw new Error("Timed out waiting for animation — please try again");
}

router.post("/living-memories", async (req: Request, res: Response) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    res.status(503).json({ error: "Animation service not yet configured" });
    return;
  }

  try {
    const predictionIdOrUrl = await createPrediction(imageBase64);
    req.log.info({ predictionIdOrUrl }, "Living memory prediction created");

    // If createPrediction already resolved to a URL (sync response), return it
    if (predictionIdOrUrl.startsWith("http")) {
      req.log.info("Living memory resolved synchronously");
      res.json({ videoUrl: predictionIdOrUrl });
      return;
    }

    const videoUrl = await pollPrediction(predictionIdOrUrl);
    req.log.info({ predictionIdOrUrl }, "Living memory prediction succeeded");

    res.json({ videoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    req.log.error({ message }, "Living memories route error");
    res.status(500).json({ error: message });
  }
});

export default router;
