import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = process.env.EMAIL_ADMIN || "owen@onjjem.com";

// Helper to send HTML emails via Resend
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await resend.emails.send({
      from: "ONJJEM <noreply@onjjem.com>", // Update domain as needed (see below)
      to,
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error(`Email send error for ${to}:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error(`Email send failed for ${to}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// HTML email templates (preserved from original)
const templates = {
  orderConfirmation: (
    customerName: string,
    orderNumber: string,
    totalPrice: number,
    discountCode?: string
  ): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! We're excited to create something beautiful for you.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Total:</strong> £${totalPrice.toFixed(2)}</p>
              ${discountCode ? `<p><strong>Discount Applied:</strong> ${discountCode}</p>` : ""}
            </div>

            <p>Your order is now being processed. You'll receive an email with your finished cartoon within 2-3 business days.</p>
            
            <a href="https://onjjem.com/orders/${orderNumber}" class="button">View Order Status</a>

            <p>If you have any questions, reply to this email or contact us at support@onjjem.com.</p>
            <p>Thanks for choosing ONJJEM!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 ONJJEM Ltd. All rights reserved. <a href="https://onjjem.com" style="color: #667eea; text-decoration: none;">Visit our site</a></p>
          </div>
        </div>
      </body>
    </html>
  `,

  adminNotification: (
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    totalPrice: number
  ): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: monospace; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .order-box { background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔔 New Order Alert</h2>
          <div class="order-box">
            <p><strong>Order ID:</strong> ${orderNumber}</p>
            <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
            <p><strong>Amount:</strong> £${totalPrice.toFixed(2)}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p><a href="https://onjjem.com/admin/orders/${orderNumber}">View order in dashboard</a></p>
        </div>
      </body>
    </html>
  `,

  photoForFulfilment: (
    customerName: string,
    orderNumber: string,
    photoUrl: string
  ): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <h2>📸 Photo Received for Order ${orderNumber}</h2>
        <p>Hi Owen,</p>
        <p>Customer <strong>${customerName}</strong> has uploaded their photo for order <strong>${orderNumber}</strong>.</p>
        <p><img src="${photoUrl}" alt="Customer photo" style="max-width: 300px; border-radius: 6px;"></p>
        <p><a href="https://onjjem.com/admin/orders/${orderNumber}">Process this order</a></p>
      </body>
    </html>
  `,

  welcomeEmail: (
    customerName: string,
    discountCode: string,
    discountPercentage: number
  ): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .promo-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .code { font-size: 24px; font-weight: bold; color: #667eea; font-family: monospace; letter-spacing: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to ONJJEM! 🎨</h1>
          <p>Hi ${customerName},</p>
          <p>Thanks for joining us. We create personalized photo gifts and cartoons that bring joy.</p>
          
          <div class="promo-box">
            <p><strong>Exclusive Offer:</strong> Get ${discountPercentage}% off your first order!</p>
            <p>Use code: <span class="code">${discountCode}</span></p>
          </div>

          <p><a href="https://onjjem.com">Shop Now</a></p>
        </div>
      </body>
    </html>
  `,
};

// Public API functions
export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  totalPrice: number,
  discountCode?: string
) {
  const html = templates.orderConfirmation(
    customerName,
    orderNumber,
    totalPrice,
    discountCode
  );
  const result = await sendEmail(
    customerEmail,
    `Order Confirmation #${orderNumber}`,
    html
  );
  return result;
}

export async function sendAdminNotification(
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  totalPrice: number
) {
  const html = templates.adminNotification(
    orderNumber,
    customerEmail,
    customerName,
    totalPrice
  );
  const result = await sendEmail(
    adminEmail,
    `New Order: ${orderNumber}`,
    html
  );
  return result;
}

export async function sendPhotoForFulfilment(
  customerName: string,
  orderNumber: string,
  photoUrl: string
) {
  const html = templates.photoForFulfilment(
    customerName,
    orderNumber,
    photoUrl
  );
  const result = await sendEmail(adminEmail, `Photo: Order ${orderNumber}`, html);
  return result;
}

export async function sendWelcomeEmail(
  customerEmail: string,
  customerName: string,
  discountCode: string,
  discountPercentage: number = 10
) {
  const html = templates.welcomeEmail(
    customerName,
    discountCode,
    discountPercentage
  );
  const result = await sendEmail(customerEmail, "Welcome to ONJJEM!", html);
  return result;
}
