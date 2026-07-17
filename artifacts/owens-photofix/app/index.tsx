import convert from 'heic-convert';
import { Router } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import { sendPhotoForFulfilment } from "../email/mailer";
import { logger } from "../lib/logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/photo-upload
router.post("/photo-upload", upload.single("photo"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
   let imageBuffer = req.file.buffer;
    let mimeType = req.file.mimetype;

    if (mimeType === 'image/heic' || req.file.originalname.toLowerCase().endsWith('.heic')) {
        console.log('Converting HEIC to JPEG...');
        imageBuffer = await (convert as any)({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 1
        });
        mimeType = 'image/jpeg';
    } }

    const refId = "ONJ-" + randomBytes(4).toString("hex").toUpperCase();
    const productName = (req.body.productName as string) || "Unknown product";

    // Fire-and-forget — don't block the response on the email
    sendPhotoForFulfilment({
      refId,
      productName,
      originalFilename: req.file.originalname,
      contentType: mimeType,
      photoBuffer: imageBuffer,
    }).catch((err: unknown) => {
      logger.warn({ err, refId }, "Photo fulfilment email failed");
    });

    logger.info({ refId, productName }, "Customer photo received");
    res.json({ refId });
  } catch (err) {
    logger.error({ err }, "Photo upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
