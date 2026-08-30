import { Router, Request, Response } from "express";
import { sendOrderConfirmation } from "../email/mailer";

const router = Router();

// Temporary test route — visit /api/test-email?to=youremail@example.com
// to send a sample order confirmation email and confirm the Gmail setup
// is working correctly. Safe to delete once confirmed.
router.get("/test-email", async (req: Request, res: Response) => {
  const to = (req.query.to as string) || process.env.EMAIL_ADMIN || process.env.EMAIL_USER;
  if (!to) {
    res.status(400).json({ error: "No recipient email available — pass ?to=your@email.com" });
    return;
  }

  try {
    await sendOrderConfirmation({
      customerName: "Test Customer",
      customerEmail: to,
      productName: "Test Product (Magic Mug)",
      amountPaid: 1499,
      currency: "gbp",
      shippingAddress: {
        line1: "123 Test Street",
        city: "London",
        postal_code: "AB1 2CD",
        country: "GB",
      },
      stripeSessionId: "test_session_123456789",
      bonusCard: false,
    });
    res.json({ success: true, message: `Test email sent to ${to} — check your inbox (and spam folder).` });
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to send test email",
      details: e?.message,
    });
  }
});

export default router;