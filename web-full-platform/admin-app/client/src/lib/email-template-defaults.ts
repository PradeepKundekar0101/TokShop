import { DollarSign, Package, Truck, KeyRound, BarChart3, UserCheck, Smartphone, Megaphone, Banknote } from "lucide-react";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  recipients: string[];
  icon: any;
  variables: { name: string; description: string }[];
}

export const defaultTemplates: EmailTemplate[] = [
  {
    id: "payment_available",
    name: "Payment Available",
    description: "Sent to seller when payment is available for withdrawal",
    subject: "💰 Your payment is ready for withdrawal - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">💰</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Payment Ready for Withdrawal!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, great news! Your earnings are now available for withdrawal.
              </p>
            </td>
          </tr>
          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #166534; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Available for Withdrawal</p>
                    <p style="color: #15803d; font-size: 36px; font-weight: 700; margin: 0;">{{amount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{dashboard_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Withdraw Now</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for selling with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: DollarSign,
    variables: [
      { name: "name", description: "Seller's name" },
      { name: "amount", description: "Withdrawal amount" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "dashboard_url", description: "Seller dashboard URL" },
    ],
  },
  {
    id: "order_received",
    name: "Order Received",
    description: "Sent to both seller and customer when an order is placed",
    subject: "📦 Order Confirmed - {{order_id}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto;">
                <span style="font-size: 40px; line-height: 80px;">📦</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Order Confirmed!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{recipient_name}}, {{message}}
              </p>
            </td>
          </tr>
          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
                    <!-- Product Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="width: 60px; vertical-align: top;">
                          <div style="width: 50px; height: 50px; background-color: #e4e4e7; border-radius: 8px;"></div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="color: #18181b; font-size: 14px; font-weight: 500; margin: 0 0 4px;">{{product_name}}</p>
                          <p style="color: #71717a; font-size: 13px; margin: 0;">Qty: {{quantity}}</p>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                          <p style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">{{total_amount}}</p>
                        </td>
                      </tr>
                    </table>
                    <!-- Divider -->
                    <div style="height: 1px; background-color: #e4e4e7; margin: 16px 0;"></div>
                    <!-- Order ID -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px;">Order ID</td>
                        <td style="color: #18181b; font-size: 14px; text-align: right; font-weight: 500;">{{order_id}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">📍 Shipping Address</p>
                    <p style="color: #18181b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">{{shipping_address}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{order_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Order Details</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Questions? We're here to help!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller", "Customer"],
    icon: Package,
    variables: [
      { name: "recipient_name", description: "Recipient's name" },
      { name: "message", description: "Custom message based on recipient type" },
      { name: "order_id", description: "Order ID" },
      { name: "product_name", description: "Product name" },
      { name: "quantity", description: "Quantity ordered" },
      { name: "total_amount", description: "Total order amount" },
      { name: "shipping_address", description: "Shipping address" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "order_url", description: "Order details URL" },
    ],
  },
  {
    id: "order_shipped",
    name: "Order Shipped",
    description: "Sent to customer when order is shipped",
    subject: "🚚 Your order is on its way! - {{order_id}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #8b5cf6; border-radius: 50%; margin: 0 auto;">
                <span style="font-size: 40px; line-height: 80px;">🚚</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Your Order Has Shipped!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{customer_name}}, great news! Your package is on its way.
              </p>
            </td>
          </tr>
          <!-- Tracking Info -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 2px solid #8b5cf6; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #6b21a8; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">{{carrier}}</p>
                    <p style="color: #581c87; font-size: 18px; font-weight: 600; margin: 0 0 16px; font-family: monospace; letter-spacing: 2px;">{{tracking_number}}</p>
                    <a href="{{tracking_url}}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">Track Package</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Delivery Estimate -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">📅 Estimated Delivery</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 600;">{{estimated_delivery}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">📦 Product</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500;">{{product_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0;">🏷️ Order ID</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">{{order_id}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">📍 Delivering To</p>
                    <p style="color: #18181b; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">{{shipping_address}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for shopping with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Customer"],
    icon: Truck,
    variables: [
      { name: "customer_name", description: "Customer's name" },
      { name: "order_id", description: "Order ID" },
      { name: "product_name", description: "Product name" },
      { name: "carrier", description: "Shipping carrier name" },
      { name: "tracking_number", description: "Tracking number" },
      { name: "tracking_url", description: "Tracking URL" },
      { name: "estimated_delivery", description: "Estimated delivery date" },
      { name: "shipping_address", description: "Shipping address" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "Sent to user when they request a password reset",
    subject: "Reset Your Password - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#128274;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Password Reset Request</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, we received a request to reset your password. Click the button below to create a new password.
              </p>
            </td>
          </tr>
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #92400e; font-size: 14px; margin: 0 0 8px;">This link will expire in</p>
                    <p style="color: #78350f; font-size: 24px; font-weight: 700; margin: 0;">{{expiry_time}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="{{reset_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
            </td>
          </tr>
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: {{primary_color}}; font-size: 12px; line-height: 1.6; margin: 8px 0 0; text-align: center; word-break: break-all;">
                {{reset_url}}
              </p>
            </td>
          </tr>
          <!-- Security Warning -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Need help? We're here for you!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["User"],
    icon: KeyRound,
    variables: [
      { name: "name", description: "User's name" },
      { name: "reset_url", description: "Password reset link URL" },
      { name: "expiry_time", description: "Time until link expires (e.g., '1 hour')" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "show_analytics",
    name: "Live Show Stats",
    description: "Sent to seller after a live show ends with performance analytics",
    subject: "Your Show Analytics - {{show_title}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #667eea; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#128202;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Your Show Analytics</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 8px; text-align: center; font-weight: 600;">
                {{show_title}}
              </p>
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                {{show_time}}
              </p>
            </td>
          </tr>
          <!-- Metrics Grid -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Show Analytics</p>
                    <!-- Items Sold -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Items Sold</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{items_sold}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Giveaways -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Giveaways</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{giveaways}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Shipments -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Shipments</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{shipments}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Total Sales -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Total Sales</td>
                              <td style="color: #10b981; font-size: 22px; font-weight: 700; text-align: right;">{{total_sales}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Tips Received -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Tips Received</td>
                              <td style="color: #8b5cf6; font-size: 22px; font-weight: 700; text-align: right;">{{tips_received}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Viewers -->
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">Viewers</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{viewers}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- New Followers -->
                      <tr>
                        <td style="padding: 12px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px;">New Followers</td>
                              <td style="color: #18181b; font-size: 18px; font-weight: 600; text-align: right;">{{new_followers}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{show_analytics_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Shipping</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for hosting on {{app_name}}!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: BarChart3,
    variables: [
      { name: "show_title", description: "Live show title" },
      { name: "show_time", description: "Show date and time" },
      { name: "items_sold", description: "Number of items sold" },
      { name: "giveaways", description: "Number of giveaways" },
      { name: "shipments", description: "Number of shipments" },
      { name: "total_sales", description: "Total sales amount (e.g., $245.00)" },
      { name: "tips_received", description: "Tips received amount (e.g., $25.00)" },
      { name: "viewers", description: "Number of viewers" },
      { name: "new_followers", description: "Number of new followers" },
      { name: "show_analytics_url", description: "Link to shipping/analytics page" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "seller_approval",
    name: "Seller Approval",
    description: "Sent to user when their seller application is approved",
    subject: "Congratulations! You're Approved to Sell on {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#10004;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">You're Approved!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, congratulations! Your seller application has been approved. You now have access to the Seller Hub where you can list products, host live shows, and start selling!
              </p>
            </td>
          </tr>
          <!-- What's Next Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #166534; font-size: 14px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">What's Next?</p>
                    <ul style="color: #15803d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Set up your seller profile</li>
                      <li>Add your first products</li>
                      <li>Configure shipping options</li>
                      <li>Schedule your first live show</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{seller_hub_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Go to Seller Hub</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Welcome to the {{app_name}} seller community!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["User"],
    icon: UserCheck,
    variables: [
      { name: "name", description: "User's name" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "seller_hub_url", description: "Link to seller hub/dashboard" },
    ],
  },
  {
    id: "app_update",
    name: "App Update",
    description: "Notify users about a new app version available",
    subject: "New Update Available - {{app_name}} v{{version}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; line-height: 80px;">&#128241;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">New Version Available!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, a new version of {{app_name}} is now available! Update to version {{version}} to enjoy the latest features and improvements.
              </p>
            </td>
          </tr>
          <!-- What's New -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">What's New</p>
                    <div style="color: #18181b; font-size: 14px; line-height: 1.8; margin: 0;">{{whats_new}}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Download Buttons -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px; text-align: center;">
                    <a href="{{android_link}}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 4px;">Update on Android</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; text-align: center;">
                    <a href="{{ios_link}}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 4px;">Update on iOS</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for using {{app_name}}!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["All Users"],
    icon: Smartphone,
    variables: [
      { name: "name", description: "User's name" },
      { name: "version", description: "New app version number" },
      { name: "whats_new", description: "List of new features/changes" },
      { name: "android_link", description: "Google Play Store link" },
      { name: "ios_link", description: "Apple App Store link" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
    ],
  },
  {
    id: "promotion",
    name: "Promotion",
    description: "Promote Tokshop live shopping platform features to potential clients",
    subject: "Launch Your Live Shopping Business with Tokshop",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launch Your Live Shopping Business with Tokshop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 50px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">TOKSHOP</h1>
              <p style="color: #00d4ff; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">Build Your Own Live Shopping Empire</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px 20px 30px; text-align: center;">
              <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 26px; line-height: 1.3;">Your Platform. Your Brand. Your Rules.</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.7; margin: 0;">
                Hi {{name}},<br><br>
                Live shopping is a <strong>$68 billion industry</strong> and growing fast. Tokshop gives you everything you need to launch your own marketplace like Whatnot - with iOS, Android, and Web apps ready to go.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
                <tr>
                  <td width="33%" style="padding: 25px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">$68B</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">Market by 2026</p>
                  </td>
                  <td width="33%" style="padding: 25px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">10x</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">Higher Conversions</p>
                  </td>
                  <td width="33%" style="padding: 25px 10px; text-align: center;">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">48hrs</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 5px 0 0 0;">To Launch</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 30px 15px 30px;">
              <h3 style="color: #1a1a2e; margin: 0; font-size: 20px; text-align: center;">Sell Live, Sell More</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3C7; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #F59E0B; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#127909;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Live Streaming</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Sellers tap one button to go live. Viewers watch in HD, chat in real-time, and buy products right from the stream.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF4; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #10B981; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128296;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Live Auctions</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Sellers auction products during live shows. Buyers place bids, compete in real-time, highest bidder wins.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCE7F3; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #EC4899; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128176;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Buy Now & Offers</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Fixed price purchases and buyer offers with negotiation support.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFEFF; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #06B6D4; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#127873;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Giveaways & Engagement</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Run giveaways during shows with automatic winner selection.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 15px 30px;">
              <h3 style="color: #1a1a2e; margin: 0; font-size: 20px; text-align: center;">Payments & Operations Built-In</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #E0F2FE; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #0EA5E9; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128179;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Stripe Payments + Commissions</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Secure payments via Stripe. Set commission rates and earn on every sale.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF5F4; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #EF4444; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128230;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Shipping & Order Tracking</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Shipping costs calculate automatically at checkout via USPS. Sellers print shipping labels right from the app - no copy-pasting addresses. Buyers track their orders in real-time.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDE9FE; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #8B5CF6; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#9878;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Disputes & Refunds</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">If something goes wrong, buyers open a dispute. You review the case and decide the outcome. Process refunds with one click. Everything is tracked in one place.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF9C3; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #EAB308; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#127916;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Video Proof & Receipts</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Every auction ending is automatically recorded as a short video clip. Buyers get video proof showing exactly what they won and the final price.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 15px 30px;">
              <h3 style="color: #1a1a2e; margin: 0; font-size: 20px; text-align: center;">Powerful Dashboards for Everyone</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0F9FF; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #0369A1; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128187;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Admin Dashboard</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Your command center to run the entire platform. Approve new sellers, manage categories, set commission rates, handle disputes, view analytics.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF4; border-radius: 10px; padding: 18px;">
                <tr>
                  <td width="55" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #15803D; border-radius: 10px; text-align: center; line-height: 45px;"><span style="font-size: 22px; color: #ffffff;">&#128188;</span></div>
                  </td>
                  <td style="padding-left: 12px;">
                    <h3 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">Seller Hub (Desktop)</h3>
                    <p style="color: #666666; margin: 0; font-size: 13px; line-height: 1.5;">Sellers get their own web dashboard - view orders, print shipping labels in bulk, track payouts, see sales analytics, manage inventory.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px;">&#128241; Try It Yourself</h3>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0;">Download the apps and explore the full platform - no commitment required</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 6px; text-align: center;">
                          <a href="https://apps.apple.com/in/app/tokshop-live/id1630634917" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; min-width: 120px;">&#63743; iOS App</a>
                        </td>
                        <td width="50%" style="padding: 6px; text-align: center;">
                          <a href="https://play.google.com/store/apps/details?id=com.tokshop.live&hl=en_US" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; min-width: 120px;">&#9654; Android App</a>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px; text-align: center;">
                          <a href="https://tokshoplive.com" style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; min-width: 120px; border: 1px solid rgba(255,255,255,0.3);">&#127760; Web App</a>
                        </td>
                        <td width="50%" style="padding: 6px; text-align: center;">
                          <a href="https://admin.tokshoplive.com" style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; min-width: 120px; border: 1px solid rgba(255,255,255,0.3);">&#128187; Admin Demo</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px;">Complete Platform Control</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 8px; text-align: left; vertical-align: top;">
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; iOS + Android + Web Apps</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Admin Dashboard</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Seller Center</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Seller Approval System</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0;">&#10003; Multi-Category Management</p>
                        </td>
                        <td width="50%" style="padding: 8px; text-align: left; vertical-align: top;">
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Your Brand & Colors</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Full Source Code</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; No Monthly Fees</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0 0 6px 0;">&#10003; Multi-Language Ready</p>
                          <p style="color: #00d4ff; font-size: 13px; margin: 0;">&#10003; Light & Dark Themes</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 15px 30px;">
              <h3 style="color: #1a1a2e; margin: 0; font-size: 20px; text-align: center;">And Much More</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 6px 10px 6px 0; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#9889; <strong>Auto-Bid</strong> - Set max price, system bids for you</p>
                        </td>
                        <td width="50%" style="padding: 6px 0 6px 10px; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128172; <strong>Live Chat</strong> - Real-time viewer interaction</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px 10px 6px 0; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128176; <strong>Tipping</strong> - Viewers support sellers</p>
                        </td>
                        <td width="50%" style="padding: 6px 0 6px 10px; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128226; <strong>Raid Shows</strong> - Send viewers to other shows</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px 10px 6px 0; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#11088; <strong>Favorites</strong> - Save shows to watch later</p>
                        </td>
                        <td width="50%" style="padding: 6px 0 6px 10px; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128276; <strong>Notifications</strong> - Alerts when sellers go live</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px 10px 6px 0; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128200; <strong>Analytics</strong> - Sales and viewer reports</p>
                        </td>
                        <td width="50%" style="padding: 6px 0 6px 10px; vertical-align: top;">
                          <p style="color: #333333; font-size: 13px; margin: 0;">&#128274; <strong>Moderation</strong> - Block users, manage content</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 35px 30px; text-align: center;">
              <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">Ready to launch your live shopping business?</p>
              <a href="https://wa.me/254791334234?text=Hi%2C%20I%27m%20interested%20in%20Tokshop%20for%20my%20live%20shopping%20business" style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);">Chat With Us on WhatsApp</a>
              <p style="color: #999999; font-size: 13px; margin: 15px 0 0 0;">or reply to this email</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #666666; font-size: 15px; font-style: italic; margin: 0 0 12px 0; line-height: 1.5;">"Launched in 3 days. First month: 200+ sellers, $50K+ in sales. The platform just works."</p>
                    <p style="color: #1a1a2e; font-size: 14px; font-weight: bold; margin: 0;">- Platform Owner</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a1a2e; padding: 25px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 10px 0;">Tokshop - White-Label Live Shopping Platform</p>
              <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0; line-height: 1.5;">
                You received this because you showed interest in live commerce.<br>
                <a href="https://tokshoplive.com/unsubscribe?email={{email}}" style="color: #00d4ff; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Prospects", "Users"],
    icon: Megaphone,
    variables: [
      { name: "name", description: "Recipient's name" },
      { name: "email", description: "Recipient's email" },
    ],
  },
  {
    id: "payout_initiated",
    name: "Payout Initiated",
    description: "Sent to seller when they initiate a payout request",
    subject: "Payout of {{amount}} initiated - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#128690;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Payout Initiated</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, your payout request has been submitted and is being processed.
              </p>
            </td>
          </tr>
          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #1d4ed8; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Payout Amount</p>
                    <p style="color: #1e40af; font-size: 36px; font-weight: 700; margin: 0;">{{amount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Transfer Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Transfer Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">Bank</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500;">{{bank_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">Remaining Balance</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500;">{{balance_after_payout}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Status</td>
                        <td style="color: #f59e0b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">Processing</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Info Note -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #92400e; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                      Your payout is being processed. You will receive another email once the funds have been deposited to your bank account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{dashboard_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Transaction History</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for selling with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: Banknote,
    variables: [
      { name: "name", description: "Seller's name" },
      { name: "amount", description: "Payout amount" },
      { name: "bank_name", description: "Bank name where funds will be deposited" },
      { name: "balance_after_payout", description: "Remaining wallet balance after payout" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "dashboard_url", description: "Seller dashboard URL" },
    ],
  },
  {
    id: "payout_completed",
    name: "Payout Completed",
    description: "Sent to seller when funds have been successfully transferred to their bank account",
    subject: "Your payout of {{amount}} has been sent - {{app_name}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #059669; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#128184;</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">Payout Completed!</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Hi {{name}}, great news! Your funds have been successfully transferred to your bank account.
              </p>
            </td>
          </tr>
          <!-- Amount Box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border: 2px solid #059669; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #047857; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Amount Transferred</p>
                    <p style="color: #065f46; font-size: 36px; font-weight: 700; margin: 0;">{{amount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Transfer Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Transfer Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">Bank</td>
                        <td style="color: #18181b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500;">{{bank_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Status</td>
                        <td style="color: #059669; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">Paid</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Info Note -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #0369a1; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                      This payment has been deposited to your bank account. You can view your transaction history in your seller dashboard.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="{{dashboard_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Transaction History</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Thank you for selling with us!</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">{{app_name}} Team</p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    recipients: ["Seller"],
    icon: Banknote,
    variables: [
      { name: "name", description: "Seller's name" },
      { name: "amount", description: "Payout amount" },
      { name: "bank_name", description: "Bank name where funds were deposited" },
      { name: "app_name", description: "Application name" },
      { name: "support_email", description: "Support email address" },
      { name: "primary_color", description: "Brand primary color" },
      { name: "secondary_color", description: "Brand secondary color" },
      { name: "dashboard_url", description: "Seller dashboard URL" },
    ],
  },
];
