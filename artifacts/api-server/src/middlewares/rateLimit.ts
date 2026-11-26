import type { Request, Response, NextFunction } from "express";

// Minimal in-memory, per-IP rate limiter with no extra dependencies.
// Used to stop anyone who finds the API address from running up the Gemini
// bill. Limits are deliberately generous so normal app use (including several
// people sharing one mobile-carrier IP) is never affected.
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired entries so the map can't grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, 60_000);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000).toString());
      res.status(429).json({
        error: "Too many requests",
        details: "You're going a bit fast — please wait a few minutes and try again.",
      });
      return;
    }
    next();
  };
}
