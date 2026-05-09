import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls?: { get: string; cancel: string };
}

async function pollPrediction(
  predictionId: string,
  token: string,
  maxAttempts = 60,
): Promise<string> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const prediction: ReplicatePrediction = await res.json();

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      if (Array.isArray(output)) return output[0];
      if (typeof output === "string") return output;
      throw new Error("Unexpected output format from Replicate");
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error ?? "Processing failed");
    }

    attempts++;
  }
  throw new Error("Processing timed out after 150 seconds");
}

router.post("/process", async (req: Request, res: Response) => {
  const { imageBase64, mode } = req.body as {
    imageBase64: string;
    mode: "sharpen" | "colorize";
  };

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    res
      .status(500)
      .json({
        error:
          "REPLICATE_API_TOKEN is not configured. Please add it in Replit Secrets.",
      });
    return;
  }

  if (!imageBase64 || !mode) {
    res.status(400).json({ error: "imageBase64 and mode are required" });
    return;
  }

  try {
    const model =
      mode === "sharpen"
        ? "nightmareai/real-esrgan"
        : "piddnad/ddcolor";

    const imageDataUri = `data:image/jpeg;base64,${imageBase64}`;

    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=30",
      },
      body: JSON.stringify({
        model,
        input: { image: imageDataUri },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Replicate API error: ${err}`);
    }

    const prediction: ReplicatePrediction = await createRes.json();

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const resultUrl = Array.isArray(output) ? output[0] : output;
      res.json({ resultUrl });
      return;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error ?? "Processing failed immediately");
    }

    const resultUrl = await pollPrediction(prediction.id, token);
    res.json({ resultUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    req.log.error({ message }, "Process route error");
    res.status(500).json({ error: message });
  }
});

export default router;
