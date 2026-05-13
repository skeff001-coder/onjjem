import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const REPLICATE_API = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls?: { get: string };
}

async function createPrediction(imageBase64: string): Promise<string> {
  const res = await fetch(
    `${REPLICATE_API}/models/stability-ai/stable-video-diffusion/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          input_image: `data:image/jpeg;base64,${imageBase64}`,
          video_length: "25_frames_with_svd_xt",
          sizing_strategy: "maintain_aspect_ratio",
          frames_per_second: 3,
          motion_bucket_id: 40,
          cond_aug: 0.02,
          decoding_t: 14,
        },
      }),
    },
  );

  const data = (await res.json()) as ReplicatePrediction;
  if (!res.ok) {
    throw new Error(
      (data as unknown as { detail?: string }).detail ??
        "Failed to create animation",
    );
  }
  return data.id;
}

async function pollPrediction(
  id: string,
  maxWaitMs = 300_000,
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6_000));

    const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
    });
    const data = (await res.json()) as ReplicatePrediction;

    if (data.status === "succeeded") {
      const out = data.output;
      return Array.isArray(out) ? out[0] : (out ?? "");
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
    const predictionId = await createPrediction(imageBase64);
    req.log.info({ predictionId }, "Living memory prediction created");

    const videoUrl = await pollPrediction(predictionId);
    req.log.info({ predictionId }, "Living memory prediction succeeded");

    res.json({ videoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    req.log.error({ message }, "Living memories route error");
    res.status(500).json({ error: message });
  }
});

export default router;
