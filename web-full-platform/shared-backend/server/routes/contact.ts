import type { Express } from "express";
import { sendEmail } from "../utils/email";
import { BASE_URL } from "../utils";

export function registerContactRoutes(app: Express): void {
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: "All fields are required: name, email, subject, message",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid email address",
        });
      }

      const settingsUrl = `${BASE_URL}/settings`;
      
      const settingsResponse = await fetch(settingsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!settingsResponse.ok) {
        console.error(`[Contact Form] Failed to fetch settings: ${settingsResponse.status}`);
        return res.status(500).json({
          success: false,
          error: "Email service is not configured. Please try again later.",
        });
      }

      const settingsData = await settingsResponse.json();
      // Handle various API response formats: array, { data: {...} }, or direct object
      let settings = settingsData;
      if (Array.isArray(settingsData)) {
        settings = settingsData[0];
      } else if (settingsData?.data) {
        settings = settingsData.data;
      }

      if (!settings?.email_from_address || !settings?.email_service_provider) {
        console.error("[Contact Form] Email service not configured in settings");
        return res.status(500).json({
          success: false,
          error: "Email service is not configured. Please try again later.",
        });
      }

      // Use support_email from settings if available, otherwise fall back to email_from_address
      const supportEmail = (settings.support_email && settings.support_email.trim() !== '') 
                           ? settings.support_email 
                           : settings.email_from_address;
      const appName = settings.app_name || "Our Platform";

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">New Contact Form Submission</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #666;">From:</strong>
                    <span style="color: #333; margin-left: 10px;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #666;">Email:</strong>
                    <a href="mailto:${email}" style="color: #0066cc; margin-left: 10px; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #666;">Subject:</strong>
                    <span style="color: #333; margin-left: 10px;">${subject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <strong style="color: #666; display: block; margin-bottom: 10px;">Message:</strong>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; color: #333; line-height: 1.6;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
                   style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                  Reply to ${name}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px;">
              This message was sent via the contact form on ${appName}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const textVersion = `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent via the contact form on ${appName}
`;

      console.log(`[Contact Form] Sending email to: ${supportEmail}`);

      await sendEmail(
        {
          email_service_provider: settings.email_service_provider,
          email_api_key: settings.email_api_key,
          email_from_address: settings.email_from_address,
          email_from_name: settings.email_from_name || appName,
          email_reply_to: email,
          email_mailgun_domain: settings.email_mailgun_domain,
          email_smtp_host: settings.email_smtp_host,
          email_smtp_port: settings.email_smtp_port,
          email_smtp_user: settings.email_smtp_user,
          email_smtp_pass: settings.email_smtp_pass,
        },
        {
          to: supportEmail,
          subject: `[Contact Form] ${subject}`,
          html: emailHtml,
          text: textVersion,
        }
      );

      console.log(`[Contact Form] Email sent successfully!`);

      res.json({
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
      });
    } catch (error: any) {
      console.error("[Contact Form] Error sending email:", error);
      
      let userMessage = "Failed to send your message. Please try again later.";
      
      if (error.message?.includes("API key")) {
        userMessage = "Email service configuration error. Please contact support.";
      } else if (error.message?.includes("provider")) {
        userMessage = "Email service is not configured. Please try again later.";
      }

      res.status(500).json({
        success: false,
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });
}
