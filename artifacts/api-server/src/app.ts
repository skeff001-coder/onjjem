import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import router from "./routes/index";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";

const app: Express = express();

app.get("/api/stripe/webhook", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Webhook error";
      res.status(400).json({ error: msg });
    }
  },
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use("/api", router);

app.get("/api/app-ping", (req: Request, res: Response) => {
  logger.info("APP_PING_RECEIVED - the iOS app's JavaScript successfully executed and reached the network layer");
  res.status(200).json({ ok: true, message: "pong" });
});
app.post("/api/app-ping", (req: Request, res: Response) => {
  logger.error({ crashReport: req.body }, "APP_CRASH_REPORT - fatal JS error captured from iOS app");
  res.status(200).json({ ok: true, message: "crash logged" });
});

export default app;
