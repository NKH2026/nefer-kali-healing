// EmailJS Email Service
// Replaces Resend for all email sending
// Uses EmailJS REST API — works with Gmail connected service
// NOTE: The private key is exposed to the browser. For better security, move email sending to a Supabase Edge Function.

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_PRIVATE_KEY = import.meta.env.VITE_EMAILJS_PRIVATE_KEY || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''; // Generic HTML passthrough template

interface EmailJSResponse {
    success: boolean;
    error?: string;
}

// Send an email via EmailJS REST API
async function sendEmailViaEmailJS(params: {
    to_email: string;
    subject: string;
    message_html: string;
}): Promise<EmailJSResponse> {
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.6/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                accessToken: EMAILJS_PRIVATE_KEY,
                template_params: {
                    to_email: params.to_email,
                    subject: params.subject,
                    message_html: params.message_html,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('EmailJS API error:', errorText);
            return { success: false, error: errorText || 'Failed to send email' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message || 'Network error sending email' };
    }
}

// ─── Event Ticket Email ───────────────────────────────────────────────

interface TicketEmailData {
    to: string;
    firstName?: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    locationType?: string;
    zoomLink?: string;
    ticketCode: string;
    isFree: boolean;
}

export async function sendTicketEmail(data: TicketEmailData): Promise<EmailJSResponse> {
    const { to, firstName, eventTitle, eventDate, eventTime, eventLocation, locationType, zoomLink, ticketCode, isFree } = data;

    const greeting = firstName ? `Alafia ${firstName}` : 'Alafia';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Georgia', serif; 
            background-color: #0d1a10; 
            color: #e8e8e8;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        .logo {
            font-size: 28px;
            color: #D4AF37;
            font-weight: bold;
            letter-spacing: 3px;
        }
        .content {
            padding: 40px 0;
        }
        h1 {
            color: #D4AF37;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .ticket-box {
            background: linear-gradient(135deg, rgba(27, 94, 32, 0.3), rgba(13, 26, 16, 0.8));
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
        }
        .ticket-code {
            text-align: center;
            padding: 20px;
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            margin-top: 20px;
        }
        .ticket-code-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: rgba(255,255,255,0.5);
            margin-bottom: 8px;
        }
        .ticket-code-value {
            font-size: 28px;
            font-family: monospace;
            color: #D4AF37;
            letter-spacing: 2px;
        }
        .event-detail {
            display: flex;
            margin-bottom: 15px;
        }
        .event-label {
            color: rgba(255,255,255,0.5);
            width: 100px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .event-value {
            color: #fff;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.4);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">NEFER KALI HEALING</div>
        </div>
        
        <div class="content">
            <h1>✨ You're Registered!</h1>
            
            <p>${greeting},</p>
            
            <p>Thank you for joining us. Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
            
            <div class="ticket-box">
                <div class="event-detail">
                    <span class="event-label">Event</span>
                    <span class="event-value">${eventTitle}</span>
                </div>
                <div class="event-detail">
                    <span class="event-label">Date</span>
                    <span class="event-value">${eventDate}</span>
                </div>
                <div class="event-detail">
                    <span class="event-label">Time</span>
                    <span class="event-value">${eventTime}</span>
                </div>
                <div class="event-detail">
                    <span class="event-label">Location</span>
                    <span class="event-value">${eventLocation}</span>
                </div>
                <div class="event-detail">
                    <span class="event-label">Admission</span>
                    <span class="event-value">${isFree ? 'Free' : 'Paid'}</span>
                </div>
                
                <div class="ticket-code">
                    <div class="ticket-code-label">Your Ticket Code</div>
                    <div class="ticket-code-value">${ticketCode}</div>
                </div>
            </div>
            
            ${locationType === 'virtual' && zoomLink ? `
            <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
                <p style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 10px;">Join Via Zoom</p>
                <a href="${zoomLink}" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Join Meeting</a>
                <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 12px 0 0; word-break: break-all;"><a href="${zoomLink}" style="color: #D4AF37;">${zoomLink}</a></p>
            </div>
            ` : ''}

            <p>Please save this email and present your ticket code at the event.</p>
            
            <p style="color: rgba(255,255,255,0.6); font-style: italic;">
                We look forward to sharing this sacred space with you.
            </p>
            
            <p>With love and light,<br><strong>Nefer Kali Healing</strong></p>
        </div>
        
        <div class="footer">
            <p>Nefer Kali Healing • 501(c)(3) Nonprofit</p>
            <p>Questions? Contact us at info@neferkalihealing.org</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmailViaEmailJS({
        to_email: to,
        subject: `🎫 Your Ticket for ${eventTitle}`,
        message_html: htmlContent,
    });
}

// ─── Digital Product Download Email ───────────────────────────────────

interface DigitalDownloadEmailData {
    to: string;
    customerName: string;
    productTitle: string;
    fillableUrl: string;
    printableUrl: string;
}

export async function sendDigitalDownloadEmail(data: DigitalDownloadEmailData): Promise<EmailJSResponse> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #9C27B0, #D4AF37); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: bold;">📖 Your Digital Download</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Peace and Blessings ${data.customerName}!</h2>
              <p style="color: #999; margin: 0;">Thank you for your purchase. Your digital files are ready for download:</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Product</p>
                    <p style="color: #fff; margin: 0; font-size: 18px; font-weight: bold;">${data.productTitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="color: #ccc; margin: 0 0 20px; font-size: 14px;">Two versions included:</p>
              <a href="${data.fillableUrl}" style="display: inline-block; background: #D4AF37; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 13px; text-transform: uppercase; margin: 5px;">📝 Fillable PDF</a>
              <br><br>
              <a href="${data.printableUrl}" style="display: inline-block; background: transparent; color: #D4AF37; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 13px; text-transform: uppercase; border: 2px solid #D4AF37; margin: 5px;">🖨️ Printable PDF</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #888; margin: 0; font-size: 13px; text-align: center;">
                <strong>Fillable version:</strong> Fill in digitally on your device<br>
                <strong>Printable version:</strong> Print and write by hand
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                Questions? Contact us at <a href="mailto:info@neferkalihealing.org" style="color: #D4AF37;">info@neferkalihealing.org</a>
              </p>
              <p style="color: #444; margin: 10px 0 0; font-size: 11px;">Nefer Kali Healing | PO Box 322, McCordsville, IN 46055</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return sendEmailViaEmailJS({
        to_email: data.to,
        subject: `📖 Your Digital Download: ${data.productTitle}`,
        message_html: htmlContent,
    });
}

// ─── Generic HTML Email (for Supabase Edge Functions to call) ────────

export async function sendHtmlEmail(params: {
    to: string;
    subject: string;
    html: string;
}): Promise<EmailJSResponse> {
    return sendEmailViaEmailJS({
        to_email: params.to,
        subject: params.subject,
        message_html: params.html,
    });
}

// Export config for use in edge functions
export const EMAILJS_CONFIG = {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY,
    privateKey: EMAILJS_PRIVATE_KEY,
};
