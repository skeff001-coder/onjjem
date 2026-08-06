import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Free breed scans are limited per person, not per device/install, since
// device-local tracking is trivially reset by deleting and reinstalling the
// app. Sign in with Apple gives us a stable identifier tied to the actual
// Apple ID, which survives a reinstall — this table tracks usage against
// that identifier instead.
const FREE_SCAN_LIMIT = 2;

let tableReady: Promise<void> | null = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS free_scan_usage (
        apple_user_id TEXT PRIMARY KEY,
        scans_used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => db.execute(sql`
      ALTER TABLE free_scan_usage ENABLE ROW LEVEL SECURITY
    `)).then(() => undefined);
  }
  return tableReady;
}

router.get("/free-scan/status", async (req, res) => {
  const appleUserId = req.query.appleUserId as string | undefined;
  if (!appleUserId) {
    res.status(400).json({ error: "appleUserId is required" });
    return;
  }
  try {
    await ensureTable();
    const result = await db.execute(sql`
      SELECT scans_used FROM free_scan_usage WHERE apple_user_id = ${appleUserId}
    `);
    const scansUsed = (result.rows[0] as { scans_used: number } | undefined)?.scans_used ?? 0;
    res.json({
      scansUsed,
      remaining: Math.max(0, FREE_SCAN_LIMIT - scansUsed),
      limit: FREE_SCAN_LIMIT,
    });
  } catch (err) {
    req.log.error({ err }, "free-scan status failed");
    res.status(500).json({ error: "Could not check free scan status" });
  }
});

router.post("/free-scan/consume", async (req, res) => {
  const { appleUserId } = req.body as { appleUserId?: string };
  if (!appleUserId) {
    res.status(400).json({ error: "appleUserId is required" });
    return;
  }
  try {
    await ensureTable();
    const result = await db.execute(sql`
      INSERT INTO free_scan_usage (apple_user_id, scans_used, updated_at)
      VALUES (${appleUserId}, 1, now())
      ON CONFLICT (apple_user_id)
      DO UPDATE SET
        scans_used = free_scan_usage.scans_used + 1,
        updated_at = now()
      WHERE free_scan_usage.scans_used < ${FREE_SCAN_LIMIT}
      RETURNING scans_used
    `);

    if (result.rows.length === 0) {
      res.json({ allowed: false, remaining: 0, limit: FREE_SCAN_LIMIT });
      return;
    }

    const scansUsed = (result.rows[0] as { scans_used: number }).scans_used;
    res.json({
      allowed: true,
      remaining: Math.max(0, FREE_SCAN_LIMIT - scansUsed),
      limit: FREE_SCAN_LIMIT,
    });
  } catch (err) {
    req.log.error({ err }, "free-scan consume failed");
    res.status(500).json({ error: "Could not record free scan" });
  }
});

export default router;
