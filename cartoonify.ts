import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getAI() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini AI integration not configured");
  }
  return new GoogleGenAI({ apiKey });
}

// Turns a customer's uploaded photo into a warm, family-friendly Pixar/Disney-style
// cartoon illustration, using Gemini's native image generation ("Nano Banana").
// This is a genuine image-to-image transformation, not just a text description —
// the response contains actual generated image bytes.
router.post("/cartoonify", async (req: Request, res: Response) => {
  const { base64Image, mimeType = "image/jpeg" } = req.body;

  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required" });
    return;
  }

  try {
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
        responseModalities: ["image"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      res.status(502).json({
        error: "The cartoon generator didn't return an image. Please try again.",
      });
      return;
    }

    res.json({
      base64Image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
    });
  } catch (e: any) {
    req.log.error({ err: e }, "Cartoonify generation failed");
    res.status(500).json({
      error: "Could not generate the cartoon version. Please try again.",
      details: e?.message,
    });
  }
});

export default router;
