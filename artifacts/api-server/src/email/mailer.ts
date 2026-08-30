/**
 * ONJJEM transactional email module.
 *
 * Required Railway variable:
 *   RESEND_API_KEY — API key from resend.com
 *
 * Optional:
 *   EMAIL_FROM    — the address emails are sent from, e.g. orders@onjjem.com
 *                    (must be on a domain verified with Resend, or use
 *                    onboarding@resend.dev for testing before verifying)
 *   EMAIL_ADMIN   — where admin order notifications are sent (your inbox)
 *
 * If RESEND_API_KEY is not set, emails are skipped and a warning is logged.
 * Nothing breaks — orders still process and get queued for Bags of Love.
 */

import { Resend } from "resend";
import { logger } from "../lib/logger";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = () => `ONJJEM <${process.env.EMAIL_FROM ?? "onboarding@resend.dev"}>`;
const ADMIN = () => process.env.EMAIL_ADMIN ?? "";

// ── Shared design tokens ──────────────────────────────────────────────────────
const GOLD = "#C9960C";
const BG = "#12100B";
const SURFACE = "#1C1A14";
const TEXT = "#E8E2D6";
const MUTED = "rgba(232,226,214,0.55)";

function baseTemplate(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ONJJEM</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  body{margin:0;padding:0;background:${BG};font-family:Georgia,"Times New Roman",serif;color:${TEXT}}
  a{color:${GOLD};text-decoration:none}
  a:hover{text-decoration:underline}
  .preheader{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BG};mso-hide:all}
  @media only screen and (max-width:600px){
    .wrapper{width:100%!important;padding:0!important}
    .card{border-radius:0!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG}">
<span class="preheader">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px">
  <tr><td align="center">
    <table class="wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr><td align="center" style="padding-bottom:28px">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-bottom:2px solid ${GOLD};padding-bottom:10px;text-align:center">
              <span style="font-size:11px;letter-spacing:.22em;color:${GOLD};opacity:.7;text-transform:uppercase;display:block;margin-bottom:6px">London · Est. 2026</span>
              <span style="font-size:28px;font-weight:700;letter-spacing:.12em;color:#FAF7F2;text-transform:uppercase">ONJJEM</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Card -->
      <tr><td>
        <table class="card" role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background:${SURFACE};border:1px solid rgba(201,150,12,0.2);border-radius:16px;overflow:hidden">
          ${body}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:32px">
        <p style="font-size:11px;color:${MUTED};margin:0 0 6px">
          ONJJEM · London, United Kingdom
        </p>
        <p style="font-size:11px;color:${MUTED};margin:0">
          <a href="https://onjjem.com/privacy" style="color:${MUTED}">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="https://onjjem.com/support" style="color:${MUTED}">Support</a>
          &nbsp;·&nbsp;
          <a href="mailto:orders@onjjem.co.uk" style="color:${MUTED}">orders@onjjem.co.uk</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Customer order confirmation ───────────────────────────────────────────────

export interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  productName: string;
  amountPaid: number;   // pence
  currency: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postal_code: string;
    country: string;
  };
  stripeSessionId: string;
  bonusCard?: boolean;
}

export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping customer order confirmation email");
    return;
  }

  const amount = `£${(data.amountPaid / 100).toFixed(2)}`;
  const addrLines = [
    data.shippingAddress.line1,
    data.shippingAddress.line2,
    data.shippingAddress.city,
    data.shippingAddress.postal_code,
    data.shippingAddress.country,
  ].filter(Boolean).join(", ");

  const body = `
    <!-- Gold accent bar -->
    <tr><td style="height:4px;background:linear-gradient(90deg,${GOLD},#F0C040,${GOLD})"></td></tr>

    <!-- Body -->
    <tr><td style="padding:40px 40px 32px">

      <!-- Icon -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr><td style="width:56px;height:56px;background:rgba(201,150,12,0.12);border:1px solid rgba(201,150,12,0.3);border-radius:50%;text-align:center;vertical-align:middle;font-size:26px">
          🖼
        </td></tr>
      </table>

      <h1 style="font-size:26px;color:#FAF7F2;margin:0 0 8px;font-weight:700">Order Confirmed</h1>
      <p style="font-size:15px;color:${MUTED};margin:0 0 32px;line-height:1.6">
        Thank you, ${data.customerName.split(" ")[0]}. Your photo is being prepared for printing.
      </p>

      <!-- Order summary box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(201,150,12,0.06);border:1px solid rgba(201,150,12,0.18);border-radius:10px;margin-bottom:28px">
        <tr><td style="padding:20px 24px">
          <p style="font-size:10px;letter-spacing:.18em;color:${GOLD};text-transform:uppercase;margin:0 0 14px">Order Summary</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:15px;color:${TEXT};font-weight:700;padding-bottom:6px">${data.productName}</td>
              <td align="right" style="font-size:15px;color:#FAF7F2;font-weight:700;padding-bottom:6px">${amount}</td>
            </tr>
            ${data.bonusCard ? `<tr>
              <td style="font-size:14px;color:#FAF7F2;padding-top:10px;padding-bottom:6px">🎁 <em>Bonus: Free Playing Cards</em></td>
              <td align="right" style="font-size:14px;color:#27AE60;font-weight:700;padding-top:10px;padding-bottom:6px">FREE</td>
            </tr>` : ""}
            <tr>
              <td colspan="2" style="border-top:1px solid rgba(201,150,12,0.15);padding-top:12px;font-size:12px;color:${MUTED}">
                Ref: ${data.stripeSessionId.slice(-12).toUpperCase()}
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Delivery address -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(250,247,242,0.03);border:1px solid rgba(250,247,242,0.08);border-radius:10px;margin-bottom:32px">
        <tr><td style="padding:20px 24px">
          <p style="font-size:10px;letter-spacing:.18em;color:${MUTED};text-transform:uppercase;margin:0 0 8px">Delivering to</p>
          <p style="font-size:14px;color:${TEXT};margin:0;line-height:1.7">${data.customerName}<br>${addrLines}</p>
        </td></tr>
      </table>

      <!-- What happens next -->
      <p style="font-size:10px;letter-spacing:.18em;color:${MUTED};text-transform:uppercase;margin:0 0 14px">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        ${[
          ["🎨", "Your photo is sent to our UK print studio today"],
          ["📦", "Printed and dispatched within 3–5 working days"],
          ["🏠", "Delivered directly to your door"],
        ].map(([icon, text], i) => `
          <tr>
            <td style="width:36px;vertical-align:top;padding-bottom:${i < 2 ? 16 : 0}px">
              <span style="font-size:18px">${icon}</span>
            </td>
            <td style="vertical-align:top;padding-bottom:${i < 2 ? 16 : 0}px;padding-left:12px;font-size:14px;color:${TEXT};line-height:1.5">${text}</td>
          </tr>
        `).join("")}
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="background:${GOLD};border-radius:8px;padding:14px 28px">
          <a href="mailto:orders@onjjem.co.uk?subject=Order%20${data.stripeSessionId.slice(-12).toUpperCase()}"
            style="color:#12100B;font-size:14px;font-weight:700;letter-spacing:.04em;text-decoration:none">
            Questions? Contact Us
          </a>
        </td></tr>
      </table>

    </td></tr>

    <!-- Bottom accent bar -->
    <tr><td style="height:1px;background:rgba(201,150,12,0.15)"></td></tr>
    <tr><td style="padding:20px 40px;text-align:center">
      <p style="font-size:12px;color:${MUTED};margin:0">
        Printed with care in the United Kingdom 🇬🇧
      </p>
    </td></tr>
  `;

  const { error } = await resend.emails.send({
    from: FROM(),
    to: data.customerEmail,
    subject: `Your ONJJEM order is confirmed ✓`,
    html: baseTemplate(
      `Your ${data.productName} is being printed — dispatched in 3–5 working days.`,
      body,
    ),
  });
  if (error) throw new Error(error.message);

  logger.info(
    { to: data.customerEmail, product: data.productName },
    "Customer order confirmation email sent",
  );
}

// ── Admin order notification ──────────────────────────────────────────────────

export interface AdminNotificationData {
  customerName: string;
  customerEmail: string;
  productName: string;
  amountPaid: number;
  currency: string;
  sku: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postal_code: string;
    country: string;
  };
  stripeSessionId: string;
  bolOrderId?: string | null;
  fulfilmentStatus: "auto" | "queued";
  bonusCard?: boolean;
}

export async function sendAdminNotification(data: AdminNotificationData): Promise<void> {
  const resend = getResend();
  const adminEmail = ADMIN();
  if (!resend || !adminEmail) {
    logger.warn("RESEND_API_KEY or EMAIL_ADMIN not set — skipping admin notification email");
    return;
  }

  const amount = `£${(data.amountPaid / 100).toFixed(2)}`;
  const addrLines = [
    data.shippingAddress.line1,
    data.shippingAddress.line2,
    data.shippingAddress.city,
    data.shippingAddress.postal_code,
    data.shippingAddress.country,
  ].filter(Boolean).join("\n");

  const fulfilBadgeColor = data.fulfilmentStatus === "auto"
    ? "rgba(39,174,96,0.15)" : "rgba(201,150,12,0.15)";
  const fulfilTextColor = data.fulfilmentStatus === "auto" ? "#5DE391" : GOLD;
  const fulfilLabel = data.fulfilmentStatus === "auto"
    ? `✅ Sent to Bags of Love automatically${data.bolOrderId ? ` · BOL #${data.bolOrderId}` : ""}`
    : "⚠️ Queued — add BAGS_OF_LOVE_API_KEY to Replit Secrets to auto-fulfil";

  const body = `
    <tr><td style="height:4px;background:linear-gradient(90deg,#27AE60,#5DE391,#27AE60)"></td></tr>
    <tr><td style="padding:36px 40px 32px">

      <p style="font-size:10px;letter-spacing:.18em;color:${GOLD};text-transform:uppercase;margin:0 0 8px">New Order</p>
      <h1 style="font-size:24px;color:#FAF7F2;margin:0 0 4px;font-weight:700">${amount} received</h1>
      <p style="font-size:14px;color:${MUTED};margin:0 0 28px">${data.productName}${data.bonusCard ? " + FREE Playing Cards" : ""}</p>

      <!-- Fulfilment status -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:${fulfilBadgeColor};border-radius:8px;margin-bottom:24px">
        <tr><td style="padding:12px 18px;font-size:13px;color:${fulfilTextColor}">${fulfilLabel}</td></tr>
      </table>

      <!-- Details grid -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(250,247,242,0.03);border:1px solid rgba(250,247,242,0.08);border-radius:10px;margin-bottom:24px">
        <tr><td style="padding:20px 24px">
          ${[
            ["Customer", `${data.customerName} &lt;${data.customerEmail}&gt;`],
            ["Product", `${data.productName} (${data.sku})`],
            ["Amount", amount],
            ["Stripe Session", data.stripeSessionId],
            ["Ship to", addrLines.replace(/\n/g, "<br>")],
          ].map(([label, value]) => `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
              <tr>
                <td style="width:110px;font-size:11px;letter-spacing:.1em;color:${MUTED};text-transform:uppercase;vertical-align:top;padding-top:2px">${label}</td>
                <td style="font-size:13px;color:${TEXT};line-height:1.6">${value}</td>
              </tr>
            </table>
          `).join("")}
        </td></tr>
      </table>

    </td></tr>
    <tr><td style="height:1px;background:rgba(201,150,12,0.15)"></td></tr>
    <tr><td style="padding:16px 40px;text-align:center">
      <p style="font-size:11px;color:${MUTED};margin:0">ONJJEM Admin · Sent automatically on order completion</p>
    </td></tr>
  `;

  const { error } = await resend.emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `🛍 New ONJJEM order — ${amount} · ${data.productName}`,
    html: baseTemplate(
      `New order: ${data.productName} for ${amount} from ${data.customerName}`,
      body,
    ),
  });
  if (error) throw new Error(error.message);

  logger.info(
    { to: adminEmail, amount, product: data.productName },
    "Admin order notification email sent",
  );
}

// ── Photo fulfilment forward ──────────────────────────────────────────────────

export interface PhotoFulfilmentData {
  refId: string;
  productName: string;
  originalFilename: string;
  contentType: string;
  photoBuffer: Buffer;
}

export async function sendPhotoForFulfilment(data: PhotoFulfilmentData): Promise<void> {
  const resend = getResend();
  const fulfilEmail = process.env.FULFILMENT_EMAIL || ADMIN();
  if (!resend || !fulfilEmail) {
    logger.warn("Email not configured — skipping photo fulfilment forward");
    return;
  }

  const ext = data.originalFilename.split(".").pop() || "jpg";
  const attachmentFilename = `${data.refId}.${ext}`;

  const body = `
    <tr><td style="height:4px;background:linear-gradient(90deg,${GOLD},#F0C040,${GOLD})"></td></tr>
    <tr><td style="padding:36px 40px 32px">

      <p style="font-size:10px;letter-spacing:.18em;color:${GOLD};text-transform:uppercase;margin:0 0 8px">New Customer Photo</p>
      <h1 style="font-size:24px;color:#FAF7F2;margin:0 0 4px;font-weight:700">Photo for Printing</h1>
      <p style="font-size:14px;color:${MUTED};margin:0 0 28px">A customer has uploaded their photo for the order below. The photo is attached to this email.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(250,247,242,0.03);border:1px solid rgba(250,247,242,0.08);border-radius:10px;margin-bottom:24px">
        <tr><td style="padding:20px 24px">
          ${[
            ["Reference", data.refId],
            ["Product", data.productName],
          ].map(([label, value]) => `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
              <tr>
                <td style="width:110px;font-size:11px;letter-spacing:.1em;color:${MUTED};text-transform:uppercase;vertical-align:top;padding-top:2px">${label}</td>
                <td style="font-size:13px;color:${TEXT};line-height:1.6;font-weight:700">${value}</td>
              </tr>
            </table>
          `).join("")}
        </td></tr>
      </table>

      <p style="font-size:13px;color:${MUTED};line-height:1.7;margin:0">
        This reference number appears on the <strong style="color:${TEXT}">Prodigi order</strong> for automatic printing and shipping.
      </p>

    </td></tr>
    <tr><td style="height:1px;background:rgba(201,150,12,0.15)"></td></tr>
    <tr><td style="padding:16px 40px;text-align:center">
      <p style="font-size:11px;color:${MUTED};margin:0">ONJJEM · Sent automatically on photo upload</p>
    </td></tr>
  `;

  const { error } = await resend.emails.send({
    from: FROM(),
    to: fulfilEmail,
    subject: `📷 New photo for printing — ${data.refId} · ${data.productName}`,
    html: baseTemplate(
      `Customer photo attached for ${data.productName} — ref ${data.refId}`,
      body,
    ),
    attachments: [
      {
        filename: attachmentFilename,
        content: data.photoBuffer.toString("base64"),
      },
    ],
  });
  if (error) throw new Error(error.message);

  logger.info(
    { to: fulfilEmail, refId: data.refId, product: data.productName },
    "Photo forwarded for fulfilment",
  );
}

// ── Welcome / discount email ───────────────────────────────────────────────────

export async function sendWelcomeEmail(toEmail: string, discountCode: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const body = `
    <tr><td style="padding:36px 40px 28px">
      <p style="font-size:12px;letter-spacing:.18em;color:${GOLD};text-transform:uppercase;margin:0 0 14px">Welcome to ONJJEM</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FAF7F2;margin:0 0 18px;line-height:1.25">
        Your 10% discount<br>is waiting for you ✦
      </h1>
      <p style="font-size:15px;color:${TEXT};line-height:1.7;margin:0 0 28px">
        Thank you for joining ONJJEM. As a welcome gift, here is your exclusive
        discount code — use it on any order on the website.
      </p>

      <!-- Discount code box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td align="center" style="background:rgba(201,150,12,0.1);border:2px dashed rgba(201,150,12,0.45);border-radius:12px;padding:22px">
            <p style="font-size:11px;letter-spacing:.18em;color:${GOLD};text-transform:uppercase;margin:0 0 8px">Your discount code</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:.15em;color:#FAF7F2;font-family:Georgia,serif;margin:0">${discountCode}</p>
            <p style="font-size:12px;color:${MUTED};margin:8px 0 0">10% off your first order &nbsp;·&nbsp; No expiry</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#8B6200,#C9960C,#F5D78E,#C9960C);border-radius:50px;padding:1px">
            <a href="https://onjjem.com"
              style="display:inline-block;background:#12100B;border-radius:50px;padding:14px 32px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#F5D78E;text-decoration:none;letter-spacing:.03em">
              ✦ &nbsp;Shop Now
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:${MUTED};line-height:1.7;margin:0">
        Upload any photo and turn it into a beautiful, personalised gift — canvas prints, magic mugs, jigsaws, photo frames and much more, delivered straight to your door.
      </p>
    </td></tr>
    <tr><td style="height:1px;background:rgba(201,150,12,0.15)"></td></tr>
    <tr><td style="padding:16px 40px;text-align:center">
      <p style="font-size:11px;color:${MUTED};margin:0">
        You're receiving this because you subscribed at onjjem.com.
        &nbsp;·&nbsp;
        <a href="mailto:hello@onjjem.com?subject=Unsubscribe&body=Please%20remove%20me%20from%20your%20list" style="color:${MUTED}">Unsubscribe</a>
      </p>
    </td></tr>
  `;

  const { error } = await resend.emails.send({
    from: FROM(),
    to: toEmail,
    subject: "Your 10% welcome discount — ONJJEM ✦",
    html: baseTemplate(
      "Welcome! Your exclusive 10% discount code is inside.",
      body,
    ),
  });
  if (error) throw new Error(error.message);

  logger.info({ to: toEmail }, "Welcome email sent");
}

// ── Bespoke Cartoon Artwork delivery ───────────────────────────────────────────

export interface CartoonImageData {
  customerName: string;
  customerEmail: string;
  productName: string;
  cartoonBase64: string;
  cartoonMimeType: string;
}

export async function sendCartoonImage(data: CartoonImageData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping cartoon image email");
    return;
  }

  const ext = data.cartoonMimeType.includes("png") ? "png" : "jpg";

  const body = `
    <tr><td style="height:4px;background:linear-gradient(90deg,${GOLD},#F0C040,${GOLD})"></td></tr>
    <tr><td style="padding:40px 40px 32px">

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr><td style="width:56px;height:56px;background:rgba(201,150,12,0.12);border:1px solid rgba(201,150,12,0.3);border-radius:50%;text-align:center;vertical-align:middle;font-size:26px">
          ✨
        </td></tr>
      </table>

      <h1 style="font-size:26px;color:#FAF7F2;margin:0 0 8px;font-weight:700">Your Bespoke Cartoon Artwork</h1>
      <p style="font-size:15px;color:${MUTED};margin:0 0 28px;line-height:1.6">
        Hi ${data.customerName.split(" ")[0]}, here's your one-of-a-kind cartoon illustration — created especially for your ${data.productName}. It's attached to this email for you to keep.
      </p>

      <p style="font-size:13px;color:${MUTED};line-height:1.7;margin:0">
        Your ${data.productName} featuring this artwork is already on its way to our print studio.
      </p>

    </td></tr>
    <tr><td style="height:1px;background:rgba(201,150,12,0.15)"></td></tr>
    <tr><td style="padding:20px 40px;text-align:center">
      <p style="font-size:12px;color:${MUTED};margin:0">
        Printed with care in the United Kingdom 🇬🇧
      </p>
    </td></tr>
  `;

  const { error } = await resend.emails.send({
    from: FROM(),
    to: data.customerEmail,
    subject: `✨ Your Bespoke Cartoon Artwork is here!`,
    html: baseTemplate(
      `Your one-of-a-kind cartoon illustration is attached.`,
      body,
    ),
    attachments: [
      {
        filename: `onjjem-cartoon.${ext}`,
        content: data.cartoonBase64,
      },
    ],
  });
  if (error) throw new Error(error.message);

  logger.info({ to: data.customerEmail }, "Cartoon image email sent");
}
