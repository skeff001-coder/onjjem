import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";

const BRAND_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#1C1A14;color:#FAF7F2;font-family:Georgia,"Times New Roman",serif;padding:40px 20px;max-width:740px;margin:0 auto;line-height:1.75}
  h1{color:#C9960C;font-size:2rem;margin-bottom:6px}
  .eyebrow{font-size:.75rem;letter-spacing:.18em;color:#C9960C;opacity:.7;text-transform:uppercase;margin-bottom:24px}
  h2{color:#C9960C;font-size:1.1rem;margin:32px 0 8px;letter-spacing:.05em;text-transform:uppercase}
  p,li{font-size:.97rem;color:#E8E2D6;margin-bottom:10px}
  ul{padding-left:20px;margin-bottom:10px}
  a{color:#C9960C;text-decoration:none}
  a:hover{text-decoration:underline}
  .divider{border:none;border-top:1px solid #C9960C44;margin:28px 0}
  .footer{font-size:.8rem;color:#888;margin-top:40px}
`;

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy — ONJJEM Photo Restoration</title>
<style>${BRAND_CSS}</style></head>
<body>
<p class="eyebrow">ONJJEM · London</p>
<h1>Privacy Policy</h1>
<p>Last updated: May 2026</p>
<hr class="divider">
<h2>Who We Are</h2>
<p>ONJJEM Photo Restoration ("we", "us", "our") is a London-based photo restoration and gift-printing studio. Our iOS application ("the App") allows you to restore and enhance your personal photographs, and to order personalised printed gifts.</p>

<h2>How Photo Processing Works — No Third-Party AI</h2>
<p><strong>Your photos are processed entirely on ONJJEM's own server (onjjem.com) using open-source image processing software (Sharp). We do not use any third-party AI service.</strong> Your photo is never sent to OpenAI, Replicate, Google, Apple, or any other external company. Processing happens entirely within ONJJEM's own infrastructure, which is operated by ONJJEM in the United Kingdom.</p>
<p>The enhancements applied (sharpening, colour restoration, denoising) are performed by algorithms running directly on ONJJEM's server. No machine-learning model hosted by a third party is involved at any stage.</p>

<h2>What Data We Collect</h2>
<ul>
  <li><strong>Photos you upload:</strong> The photo you select is transmitted over an encrypted HTTPS connection to ONJJEM's own server for the sole purpose of applying the enhancement you requested. It is processed and immediately deleted. It is never stored, shared, sold, or used for AI training.</li>
  <li><strong>Order information:</strong> When you place a print order, your name, delivery address, and payment details are collected by our fulfilment partner (Bags of Love Ltd, bagsoflove.co.uk) under their own privacy policy.</li>
  <li><strong>Support communications:</strong> If you contact us by email, we retain your message and email address to respond to your enquiry.</li>
  <li><strong>App analytics:</strong> We may collect anonymised, aggregated usage data (e.g. number of restorations performed) to improve the App. No personally identifiable information is included.</li>
</ul>

<h2>Third Parties — What We Share and With Whom</h2>
<ul>
  <li><strong>No third-party AI service receives your photo.</strong> Processing is done entirely on ONJJEM's own infrastructure.</li>
  <li><strong>Bags of Love Ltd</strong> (bagsoflove.co.uk) — receives your order details and the restored photo only when you choose to place a print order. They are subject to their own privacy policy.</li>
  <li><strong>Stripe</strong> — handles payment card processing. Card details are entered directly on Stripe's secure hosted page and are never transmitted to ONJJEM's servers.</li>
  <li>We do not sell, rent, or trade your personal data to any other third party.</li>
  <li>We do not use your photos for training any AI or machine-learning model.</li>
</ul>

<h2>Data Retention</h2>
<p>Photo data is held in memory during processing only and is not written to disk or retained after the result is returned to your device. Order records are retained by Bags of Love Ltd in accordance with their privacy policy. Support emails are retained for up to 2 years.</p>
<h2>Your Rights</h2>
<p>Under UK GDPR and the Data Protection Act 2018, you have the right to access, correct, or request deletion of any personal data we hold about you. To exercise these rights, please contact us at <a href="mailto:privacy@onjjem.co.uk">privacy@onjjem.co.uk</a>.</p>
<h2>Children</h2>
<p>Our App is not directed at children under the age of 13. We do not knowingly collect personal data from children.</p>
<h2>Changes to This Policy</h2>
<p>We may update this policy from time to time. The current version is always available at this URL. Continued use of the App after changes constitutes acceptance of the revised policy.</p>
<h2>Contact</h2>
<p>ONJJEM Photo Restoration<br>Email: <a href="mailto:privacy@onjjem.co.uk">privacy@onjjem.co.uk</a></p>
<hr class="divider">
<p class="footer">&copy; 2025 ONJJEM Photo Restoration. All rights reserved.</p>
</body></html>`;

const SUPPORT_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Support — ONJJEM Photo Restoration</title>
<style>${BRAND_CSS}
  .contact-card{background:#2A2620;border:1px solid #C9960C44;border-radius:12px;padding:28px;margin:24px 0}
  .contact-card h3{color:#C9960C;margin-bottom:8px;font-size:1rem;letter-spacing:.06em;text-transform:uppercase}
  .contact-card p{margin-bottom:6px}
  .badge{display:inline-block;background:#C9960C22;border:1px solid #C9960C55;color:#C9960C;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-bottom:16px}
</style></head>
<body>
<p class="eyebrow">ONJJEM · London</p>
<h1>Contact &amp; Support</h1>
<p class="badge">Respond within 24 hours</p>
<p>Our team of master restorers is here to help. Whether you have a question about your restoration, a print order, or the app itself — we will get back to you promptly.</p>
<hr class="divider">
<div class="contact-card">
  <h3>General &amp; App Support</h3>
  <p>Email: <a href="mailto:support@onjjem.co.uk">support@onjjem.co.uk</a></p>
  <p>We aim to respond to all enquiries within 24 hours, Monday to Friday.</p>
</div>
<div class="contact-card">
  <h3>Print Order Enquiries</h3>
  <p>For questions about a specific print or gift order, please include your order number in the subject line.</p>
  <p>Email: <a href="mailto:orders@onjjem.co.uk">orders@onjjem.co.uk</a></p>
</div>
<div class="contact-card">
  <h3>Privacy &amp; Data Requests</h3>
  <p>For any data access, correction, or deletion requests under UK GDPR:</p>
  <p>Email: <a href="mailto:privacy@onjjem.co.uk">privacy@onjjem.co.uk</a></p>
</div>
<hr class="divider">
<h2>Frequently Asked Questions</h2>
<h2 style="color:#FAF7F2;text-transform:none;font-size:.97rem;margin-top:20px">How long does restoration take?</h2>
<p>Most restorations complete in 5–15 seconds. If the process appears stuck for more than 2 minutes, please tap Cancel and try again with a smaller photo.</p>
<h2 style="color:#FAF7F2;text-transform:none;font-size:.97rem;margin-top:20px">What photo resolution is recommended?</h2>
<p>For print-quality results, we recommend photos of at least 1600×1200 pixels (approx. 5 MB or more from a modern smartphone camera).</p>
<h2 style="color:#FAF7F2;text-transform:none;font-size:.97rem;margin-top:20px">How are my photos used?</h2>
<p>Your photos are sent to our server for processing only and are not stored after the result is returned to your device. See our <a href="/privacy">Privacy Policy</a> for full details.</p>
<h2 style="color:#FAF7F2;text-transform:none;font-size:.97rem;margin-top:20px">Who prints the gifts?</h2>
<p>All personalised gifts are produced and dispatched by Bags of Love Ltd (bagsoflove.co.uk), a UK-based print studio, typically within 3–5 working days.</p>
<hr class="divider">
<p class="footer">&copy; 2025 ONJJEM Photo Restoration &middot; <a href="/privacy">Privacy Policy</a></p>
</body></html>`;

const app: Express = express();

// ── Stripe webhook — must be registered BEFORE express.json() ─────────────────
// Needs raw Buffer body, not parsed JSON.

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

// ─────────────────────────────────────────────────────────────────────────────

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

// Marketing website — served at root so onjjem.com points here
app.get(["/", "/home"], (_req: Request, res: Response) => {
  res.sendFile(
    path.resolve(__dirname, "../../../documents/onjjem-website.html")
  );
});

// Gift shop — separate page
app.get("/shop", (_req: Request, res: Response) => {
  res.sendFile(
    path.resolve(__dirname, "../../../documents/onjjem-shop.html")
  );
});

// Gallery images for the website
app.get("/api/gallery/:filename", (req: Request, res: Response) => {
  const safe = path.basename(String(req.params["filename"] ?? ""));
  res.sendFile(
    path.resolve(__dirname, "../../../artifacts/owens-photofix/assets/gallery", safe),
    (err) => {
      if (err) res.status(404).send("Not found");
    }
  );
});

app.get(["/partnership-letter", "/api/partnership-letter"], (_req: Request, res: Response) => {
  res.sendFile(
    path.resolve(__dirname, "../../../documents/onjjem-bags-of-love-partnership-letter.html")
  );
});

app.get(["/privacy", "/api/privacy"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(PRIVACY_HTML);
});

app.get(["/terms", "/api/terms"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terms of Use — ONJJEM Photo Restoration</title>
<style>${BRAND_CSS}</style></head>
<body>
<p class="eyebrow">ONJJEM · London</p>
<h1>Terms of Use</h1>
<p>Last updated: May 2025</p>
<hr class="divider">
<p>By downloading or using ONJJEM Photo Restoration ("the App"), you agree to these Terms of Use. Please read them carefully.</p>
<h2>Licence</h2>
<p>We grant you a personal, non-exclusive, non-transferable, revocable licence to use the App on Apple-branded devices you own or control, subject to these Terms and the App Store Terms of Service.</p>
<h2>Subscriptions &amp; In-App Purchases</h2>
<ul>
  <li><strong>ONJJEM Pro Monthly</strong> — auto-renewing monthly subscription. Billed monthly until cancelled.</li>
  <li><strong>ONJJEM Pro Annual</strong> — auto-renewing annual subscription. Billed once per year until cancelled.</li>
  <li><strong>Single Photo Enhancement</strong> — one-time purchase per photo; not a subscription.</li>
</ul>
<p>Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel your subscription at any time in <strong>iPhone Settings → [Your Name] → Subscriptions</strong>.</p>
<h2>User Content</h2>
<p>You retain all rights to photos you upload. You grant us a limited licence to process your photos solely to deliver the App's enhancement service. We do not store, sell, or use your photos for any other purpose. See our <a href="/privacy">Privacy Policy</a> for full details.</p>
<h2>Acceptable Use</h2>
<p>You may not use the App to upload content that is illegal, harmful, or infringes third-party rights. We reserve the right to suspend access for violations.</p>
<h2>Disclaimer &amp; Limitation of Liability</h2>
<p>The App is provided "as is". We make no warranties regarding the accuracy or quality of AI enhancements. To the maximum extent permitted by law, ONJJEM shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.</p>
<h2>Governing Law</h2>
<p>These Terms are governed by the laws of England and Wales.</p>
<h2>Apple Standard EULA</h2>
<p>This App is also subject to the <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Apple Standard End User Licence Agreement</a>.</p>
<h2>Contact</h2>
<p>Questions? <a href="/support">Contact us</a>.</p>
<p class="footer">&copy; 2025 ONJJEM Photo Restoration &middot; <a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Use</a></p>
</body>
</html>`);
});

app.get(["/support", "/api/support"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(SUPPORT_HTML);
});

app.use("/api", router);

export default app;
