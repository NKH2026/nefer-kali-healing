// Resend Email Service for Ticket Confirmations
// API Key is stored here - in production, use environment variables

const RESEND_API_KEY = 're_Xnug3PZW_JSq9ted9K4yiddKwD1WZCGXa';

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
        .cta-button {
            display: inline-block;
            background: #D4AF37;
            color: #000;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 20px;
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

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Nefer Kali Healing <onboarding@resend.dev>', // Change to your domain after verification
                to: [to],
                subject: `🎫 Your Ticket for ${eventTitle}`,
                html: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Resend API error:', errorData);
            return { success: false, error: errorData.message || 'Failed to send email' };
        }

        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: 'Network error sending email' };
    }
}
