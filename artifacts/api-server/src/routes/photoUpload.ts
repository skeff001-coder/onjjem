import { Router } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { objectStorageClient } from "../lib/objectStorage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
const REFS_FILE = path.join(process.cwd(), "photo-refs.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "onjjem-admin";

interface PhotoRef {
  refId: string;
  objectPath: string;
  productName: string;
  filename: string;
  contentType: string;
  timestamp: string;
}

function loadRefs(): Record<string, PhotoRef> {
  try {
    if (fs.existsSync(REFS_FILE)) {
      return JSON.parse(fs.readFileSync(REFS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveRefs(refs: Record<string, PhotoRef>) {
  fs.writeFileSync(REFS_FILE, JSON.stringify(refs, null, 2));
}

// POST /api/photo-upload
router.post("/photo-upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    if (!BUCKET_ID) {
      res.status(500).json({ error: "Storage not configured" });
      return;
    }

    const refId = "ONJ-" + randomBytes(4).toString("hex").toUpperCase();
    const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
    const objectPath = `customer-photos/${refId}.${ext}`;

    const bucket = objectStorageClient.bucket(BUCKET_ID);
    const file = bucket.file(objectPath);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    const refs = loadRefs();
    refs[refId] = {
      refId,
      objectPath,
      productName: req.body.productName || "Unknown product",
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      timestamp: new Date().toISOString(),
    };
    saveRefs(refs);

    res.json({ refId });
  } catch (err) {
    req.log.error(err, "Photo upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/admin/photos — list all uploads (password protected)
router.get("/admin/photos", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = Buffer.from(auth.replace("Basic ", ""), "base64").toString();
  if (!token.includes(ADMIN_PASSWORD)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="ONJJEM Admin"');
    res.status(401).json({ error: "Unauthorised" });
    return;
  }
  const refs = loadRefs();
  const list = Object.values(refs).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json({ photos: list });
});

// GET /api/admin/photos/:refId — download a photo (password protected)
router.get("/admin/photos/:refId", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = Buffer.from(auth.replace("Basic ", ""), "base64").toString();
  if (!token.includes(ADMIN_PASSWORD)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="ONJJEM Admin"');
    res.status(401).send("Unauthorised");
    return;
  }

  const refs = loadRefs();
  const photoRef = refs[req.params.refId];
  if (!photoRef) {
    res.status(404).send("Not found");
    return;
  }

  try {
    const bucket = objectStorageClient.bucket(BUCKET_ID);
    const file = bucket.file(photoRef.objectPath);
    res.setHeader("Content-Type", photoRef.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${photoRef.refId}-${photoRef.filename}"`
    );
    file.createReadStream().pipe(res);
  } catch (err) {
    req.log.error(err, "Photo download failed");
    res.status(500).send("Download failed");
  }
});

export default router;
