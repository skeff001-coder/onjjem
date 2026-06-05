import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { makeFreePreview } from "./process";
import type { EnhancementMode } from "./process";

const router = Router();

async function ensureSubscribersTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      email         TEXT PRIMARY KEY,
      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

router.post("/restoration/free", async (req: Request, res: Response) => {
  const body = req.body as {
    email?: string;
    imageBase64?: string;
    modes?: EnhancementMode[];
  };

  const email = (body.email ?? "").trim().toLowerCase();
  const { imageBase64, modes } = body;

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  if (!imageBase64 || !modes?.length) {
    res.status(400).json({ error: "imageBase64 and modes are required." });
    return;
  }

  try {
    await ensureSubscribersTable();

    const existing = await db.execute(sql`
      SELECT email FROM email_subscribers WHERE email = ${email}
    `);

    if (existing.rows.length > 0) {
      res.json({ alreadyUsed: true });
      return;
    }

    const validModes: EnhancementMode[] = ["sharpen", "brighten", "denoise", "restore", "vivid", "colorize"];
    const filtered = modes.filter((m) => validModes.includes(m)) as EnhancementMode[];
    if (!filtered.length) {
      res.status(400).json({ error: "No valid modes provided." });
      return;
    }

    const inputBuffer = Buffer.from(imageBase64, "base64");
    const outputBuffer = await makeFreePreview(inputBuffer, filtered);
    const resultBase64 = outputBuffer.toString("base64");

    await db.execute(sql`
      INSERT INTO email_subscribers (email) VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `);

    req.log.info({ email }, "Free restoration used");
    res.json({ alreadyUsed: false, resultBase64 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "restoration/free error");
    res.status(500).json({ error: msg });
  }
});

export default router;
