// Resend Email Service
// API Key is loaded from environment variables. In production, never expose this to the browser.

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

interface TicketEmailData {
    to: string;
    firstName?: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketCode: string;
    isFree: boolean;
}

export async function sendTicketEmail(data: TicketEmailData): Promise<{ success: boolean; error?: string }> {
    const { to, firstName, eventTitle, eventDate, eventTime, eventLocation, ticketCode, isFree } = data;

    if (!RESEND_API_KEY) {
        console.error('Missing VITE_RESEND_API_KEY environment variable');
        return { success: false, error: 'Resend API key is not configured' };
    }

    const greeting = firstName ? `Dear ${firstName}` : 'Dear Sacred Soul';

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
            padding: 30px 0;
        }
        .ticket-box {
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .ticket-code {
            text-align: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            margin-top: 20px;
        }
        .ticket-code-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 8px;
        }
        .ticket-code-value {
            font-size: 24px;
            font-family: monospace;
            color: #D4AF37;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.4);
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
            <p>${greeting},</p>
            <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
            <div class="ticket-box">
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Time:</strong> ${eventTime}</p>
                <p><strong>Location:</strong> ${eventLocation}</p>
                <p><strong>Admission:</strong> ${isFree ? 'Free' : 'Paid'}</p>
                <div class="ticket-code">
                    <div class="ticket-code-label">Your Ticket Code</div>
                    <div class="ticket-code-value">${ticketCode}</div>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>Nefer Kali Healing • 501(c)(3) Nonprofit</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'info@neferkalihealing.org',
                to,
                subject: `Your ticket for ${eventTitle}`,
                html: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to send email');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Resend email error:', error);
        return { success: false, error: error.message };
    }
}
