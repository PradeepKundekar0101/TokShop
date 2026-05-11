import fs from "fs";
import path from "path";

// File-based email logging for bulk sends (faster than DB updates)
const EMAIL_LOG_DIR = path.join(process.cwd(), "logs");
const EMAIL_SENT_LOG = path.join(EMAIL_LOG_DIR, "emails_sent.log");

// Ensure log directory exists
if (!fs.existsSync(EMAIL_LOG_DIR)) {
  fs.mkdirSync(EMAIL_LOG_DIR, { recursive: true });
}

// Fast file-based logging - appends to file without blocking
export function logSentEmail(email: string, messageId?: string, campaignId?: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}|${email}|${messageId || 'unknown'}|${campaignId || 'bulk'}\n`;
  
  // Append async - doesn't block the sending process
  fs.appendFile(EMAIL_SENT_LOG, logEntry, (err) => {
    if (err) console.error('[EmailLog] Failed to log:', err.message);
  });
}

// Check if an email was already sent (reads from log file)
export function wasEmailSent(email: string, campaignId?: string): boolean {
  try {
    if (!fs.existsSync(EMAIL_SENT_LOG)) return false;
    
    const content = fs.readFileSync(EMAIL_SENT_LOG, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const [, loggedEmail, , loggedCampaign] = line.split('|');
      if (loggedEmail === email) {
        if (!campaignId || loggedCampaign === campaignId) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

// Get all sent emails from log
export function getSentEmails(campaignId?: string): string[] {
  try {
    if (!fs.existsSync(EMAIL_SENT_LOG)) return [];
    
    const content = fs.readFileSync(EMAIL_SENT_LOG, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    
    return lines
      .map(line => {
        const [, email, , campaign] = line.split('|');
        return { email, campaign };
      })
      .filter(entry => !campaignId || entry.campaign === campaignId)
      .map(entry => entry.email);
  } catch {
    return [];
  }
}

// Clear log file (use after reconciling with database)
export function clearEmailLog(): void {
  try {
    if (fs.existsSync(EMAIL_SENT_LOG)) {
      fs.unlinkSync(EMAIL_SENT_LOG);
    }
  } catch (err) {
    console.error('[EmailLog] Failed to clear log:', err);
  }
}

// Convert ARGB hex (FFRRGGBB) or RGB hex to proper CSS hex color
function formatColor(color?: string): string {
  if (!color) return '#6366f1';
  // Remove # if present
  let hex = color.replace('#', '');
  // If 8 characters (ARGB format like FFFF5644), remove first 2 (alpha)
  if (hex.length === 8) {
    hex = hex.substring(2);
  }
  return `#${hex}`;
}

// Wrap custom email content with professional header/footer template (matching template style)
export function wrapEmailContent(content: string, settings: {
  app_name?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  logo_url?: string;
}): string {
  const appName = settings.app_name || 'App';
  const primaryColor = formatColor(settings.primary_color);
  const secondaryColor = formatColor(settings.secondary_color || settings.primary_color);
  const supportEmail = settings.support_email || '';
  const logoUrl = settings.logo_url || '';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 32px 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 60px; max-width: 200px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${appName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eee;">
              ${supportEmail ? `<p style="margin: 0 0 8px; color: #666666; font-size: 14px;">Questions? Contact us at <a href="mailto:${supportEmail}" style="color: ${primaryColor}; text-decoration: none; font-weight: 500;">${supportEmail}</a></p>` : ''}
              <p style="margin: 0; color: #999999; font-size: 12px;">&copy; ${year} ${appName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

interface EmailSettings {
  email_service_provider?: string;
  email_api_key?: string;
  email_from_address?: string;
  email_from_name?: string;
  email_reply_to?: string;
  email_mailgun_domain?: string;
  email_smtp_host?: string;
  email_smtp_port?: string;
  email_smtp_user?: string;
  email_smtp_pass?: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(settings: EmailSettings, emailData: EmailData): Promise<void> {
  const provider = settings.email_service_provider?.toLowerCase();

  console.log(`[Email] Attempting to send email using provider: ${provider}`);
  console.log(`[Email] From: ${settings.email_from_address}, To: ${emailData.to}`);

  if (!settings.email_from_address) {
    throw new Error("From email address not configured");
  }

  const fromEmail = settings.email_from_name 
    ? `${settings.email_from_name} <${settings.email_from_address}>`
    : settings.email_from_address;

  switch (provider) {
    case "mailgun":
      return sendWithMailgun(settings, emailData, fromEmail);
    
    case "brevo":
      return sendWithBrevo(settings, emailData, fromEmail);
    
    default:
      throw new Error(`Unsupported email provider: ${provider || 'not configured'}. Supported providers: mailgun, brevo`);
  }
}

async function sendWithMailgun(settings: EmailSettings, emailData: EmailData, fromEmail: string): Promise<void> {
  // For Mailgun, we'll use their REST API
  if (!settings.email_api_key) {
    throw new Error("Mailgun API key not configured");
  }

  if (!settings.email_mailgun_domain) {
    throw new Error("Mailgun domain not configured");
  }

  const domain = settings.email_mailgun_domain;
  const apiKey = settings.email_api_key;

  console.log(`[Mailgun] Sending email via domain: ${domain}`);
  console.log(`[Mailgun] API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);

  const formData = new URLSearchParams();
  formData.append('from', fromEmail);
  formData.append('to', emailData.to);
  formData.append('subject', emailData.subject);
  formData.append('html', emailData.html);
  if (emailData.text) {
    formData.append('text', emailData.text);
  }
  // Add Reply-To header if configured
  if (settings.email_reply_to) {
    formData.append('h:Reply-To', settings.email_reply_to);
  }

  const url = `https://api.mailgun.net/v3/${domain}/messages`;
  console.log(`[Mailgun] Endpoint: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  console.log(`[Mailgun] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Mailgun] Error response:`, errorText);
    
    // Handle rate limiting (429)
    if (response.status === 429) {
      throw new Error(`Mailgun Rate Limit: Too many requests. Please wait and try again.`);
    }
    // Provide helpful error messages
    if (response.status === 401) {
      throw new Error(`Mailgun Authentication Failed: Invalid API key. Please check your Mailgun API key in settings.`);
    }
    if (response.status === 403) {
      throw new Error(`Mailgun Forbidden: The API key doesn't have permission for domain "${domain}". Make sure the API key and domain are from the same Mailgun account.`);
    }
    if (response.status === 404) {
      throw new Error(`Mailgun Domain Not Found: Domain "${domain}" not found. Please verify the domain name in settings.`);
    }
    
    throw new Error(`Mailgun error (${response.status}): ${errorText}`);
  }

  // Parse response to get message ID
  const result = await response.json() as { id?: string; message?: string };
  const messageId = result.id || 'unknown';
  
  // Log to file (non-blocking, won't slow down bulk sends)
  logSentEmail(emailData.to, messageId);
  
  console.log(`[Mailgun] Email sent successfully! ID: ${messageId}`);
}

async function sendWithBrevo(settings: EmailSettings, emailData: EmailData, fromEmail: string): Promise<void> {
  if (!settings.email_api_key) {
    throw new Error("Brevo API key not configured");
  }

  console.log(`[Brevo] Sending email to: ${emailData.to}`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': settings.email_api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: settings.email_from_name || 'Support',
        email: settings.email_from_address,
      },
      to: [{ email: emailData.to }],
      subject: emailData.subject,
      htmlContent: emailData.html,
    }),
  });

  console.log(`[Brevo] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Brevo] Error response:`, errorText);
    throw new Error(`Brevo error (${response.status}): ${errorText}`);
  }

  const result = await response.json() as { messageId?: string };
  logSentEmail(emailData.to, result.messageId);
  console.log(`[Brevo] Email sent successfully! ID: ${result.messageId}`);
}

// Bulk send using Brevo's batch API (up to 50 recipients per call)
export async function sendBulkWithBrevo(
  settings: EmailSettings, 
  recipients: Array<{ email: string; params?: Record<string, string> }>,
  subject: string,
  htmlContent: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!settings.email_api_key) {
    throw new Error("Brevo API key not configured");
  }

  const BATCH_SIZE = 50; // Brevo's limit per request
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    console.log(`[Brevo Bulk] Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} recipients)`);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': settings.email_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: settings.email_from_name || 'Support',
            email: settings.email_from_address,
          },
          to: batch.map(r => ({ email: r.email })),
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Brevo Bulk] Batch error:`, errorText);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errorText}`);
      } else {
        success += batch.length;
        batch.forEach(r => logSentEmail(r.email));
        console.log(`[Brevo Bulk] Batch sent successfully (${batch.length} emails)`);
      }
    } catch (error: any) {
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, failed, errors };
}

async function sendWithResend(settings: EmailSettings, emailData: EmailData, fromEmail: string): Promise<void> {
  if (!settings.email_api_key) {
    throw new Error("Resend API key not configured");
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.email_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Resend error: ${error.message || response.statusText}`);
  }
}

async function sendWithSMTP(settings: EmailSettings, emailData: EmailData, fromEmail: string): Promise<void> {
  // For SMTP, use dedicated fields
  if (!settings.email_smtp_host || !settings.email_smtp_port || !settings.email_smtp_user || !settings.email_smtp_pass) {
    throw new Error("SMTP configuration incomplete. Please configure host, port, user, and password");
  }

  const host = settings.email_smtp_host;
  const port = settings.email_smtp_port;
  const user = settings.email_smtp_user;
  const pass = settings.email_smtp_pass;

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log(`[SMTP] Connecting to ${host}:${port} as ${user}`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      html: emailData.html,
    });
    console.log(`[SMTP] Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`[SMTP] Response:`, info.response);
  } catch (error: any) {
    // Provide helpful error messages for common SMTP issues
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('Username and Password not accepted') || errorMessage.includes('BadCredentials')) {
      throw new Error(
        'SMTP Authentication Failed: Invalid username or password. ' +
        'If using Gmail, you must use an App Password instead of your regular password. ' +
        'Visit https://myaccount.google.com/apppasswords to generate one.'
      );
    }
    
    if (errorMessage.includes('ECONNREFUSED')) {
      throw new Error(`SMTP Connection Failed: Unable to connect to ${host}:${port}. Please check your host and port settings.`);
    }
    
    if (errorMessage.includes('ETIMEDOUT')) {
      throw new Error(`SMTP Timeout: Connection to ${host}:${port} timed out. Please check your network and firewall settings.`);
    }
    
    // Handle temporary SMTP errors (421, 450, 451, 452)
    if (errorMessage.includes('421') || errorMessage.includes('Temporary System Problem')) {
      throw new Error(
        'SMTP Temporary Error: The email server is temporarily unavailable or rate limiting. ' +
        'This is usually due to sending too many emails in a short time. Please try again in a few minutes.'
      );
    }
    
    if (errorMessage.includes('450') || errorMessage.includes('451') || errorMessage.includes('452')) {
      throw new Error(
        'SMTP Temporary Error: The email server rejected the request temporarily. ' +
        'Please wait a few minutes and try again.'
      );
    }
    
    throw new Error(`SMTP Error: ${errorMessage}`);
  }
}
