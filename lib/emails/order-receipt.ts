// Non-Profit Donation Receipt Email Template
// For use with Resend or any email provider
// This template is IRS-compliant for 501(c)(3) organizations

// Business Info
export const NONPROFIT_INFO = {
    name: 'Nefer Kali Healing',
    ein: '99-3021724',
    address: 'PO Box 322, McCordsville, IN 46055',
    email: 'asasa@neferkalihealing.org',
    website: 'https://neferkalihealing.org',
};

export interface OrderReceiptData {
    orderNumber: string;
    orderDate: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
    };
    isSubscription?: boolean;
}

// Generate plain text email
export function generateReceiptPlainText(data: OrderReceiptData): string {
    const itemsList = data.items
        .map(item => `  ${item.title} x${item.quantity} - $${item.price.toFixed(2)}`)
        .join('\n');

    return `
NEFER KALI HEALING
Order Confirmation & Tax Receipt
================================

Thank you for supporting our mission, ${data.customerName}!

ORDER DETAILS
-------------
Order Number: ${data.orderNumber}
Order Date: ${data.orderDate}

ITEMS
-----
${itemsList}

Subtotal: $${data.subtotal.toFixed(2)}
Shipping: $${data.shippingCost.toFixed(2)}
TOTAL: $${data.total.toFixed(2)}

SHIPPING TO
-----------
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}

---

TAX RECEIPT - PLEASE RETAIN FOR YOUR RECORDS

Organization: ${NONPROFIT_INFO.name}
EIN: ${NONPROFIT_INFO.ein}
Address: ${NONPROFIT_INFO.address}

Date of Contribution: ${data.orderDate}
Amount Paid: $${data.total.toFixed(2)}
Fair Market Value of Goods: $${data.subtotal.toFixed(2)}
Tax-Deductible Portion: $0.00*

*IMPORTANT: For purchases of goods, the tax-deductible portion is 
limited to the amount by which your payment exceeds the fair market 
value of the goods received. Since you received goods of equal or 
greater value, no portion of this transaction is tax-deductible.

For tax purposes, please consult with your tax advisor.

---

Questions? Contact us at ${NONPROFIT_INFO.email}
${NONPROFIT_INFO.website}

Thank you for supporting Nefer Kali Healing!
`;
}

// Generate HTML email
export function generateReceiptHTML(data: OrderReceiptData): string {
    const itemsHTML = data.items
        .map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `)
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37, #8B7322); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">NEFER KALI HEALING</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px; opacity: 0.8;">Order Confirmation & Tax Receipt</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Thank You, ${data.customerName}!</h2>
              <p style="color: #999; margin: 0; font-size: 14px;">Your order has been confirmed and is being prepared.</p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
                    <p style="color: #D4AF37; margin: 0; font-size: 18px; font-weight: bold;">${data.orderNumber}</p>
                  </td>
                  <td style="padding: 20px; text-align: right;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Date</p>
                    <p style="color: #fff; margin: 0; font-size: 14px;">${data.orderDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 30px 40px;">
              <h3 style="color: #fff; margin: 0 0 20px; font-size: 16px;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="color: #ccc;">
                <thead>
                  <tr style="color: #666; font-size: 12px; text-transform: uppercase;">
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Item</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #333;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 1px solid #333;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; color: #666;">Subtotal</td>
                    <td style="padding: 12px; text-align: right;">$${data.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; color: #666;">Shipping</td>
                    <td style="padding: 12px; text-align: right;">$${data.shippingCost.toFixed(2)}</td>
                  </tr>
                  <tr style="font-size: 18px; font-weight: bold;">
                    <td colspan="2" style="padding: 12px; text-align: right; color: #D4AF37;">Total</td>
                    <td style="padding: 12px; text-align: right; color: #D4AF37;">$${data.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="color: #fff; margin: 0 0 15px; font-size: 16px;">Shipping To</h3>
              <p style="color: #999; margin: 0; line-height: 1.6;">
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
              </p>
            </td>
          </tr>

          <!-- Tax Receipt Box -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background-color: #D4AF37; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #000; margin: 0 0 15px; font-size: 16px;">📋 Tax Receipt - Please Retain</h3>
                    <table width="100%" style="color: #000; font-size: 13px;">
                      <tr>
                        <td style="padding: 5px 0;"><strong>Organization:</strong></td>
                        <td style="padding: 5px 0;">${NONPROFIT_INFO.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>EIN:</strong></td>
                        <td style="padding: 5px 0;">${NONPROFIT_INFO.ein}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Date:</strong></td>
                        <td style="padding: 5px 0;">${data.orderDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Amount Paid:</strong></td>
                        <td style="padding: 5px 0;">$${data.total.toFixed(2)}</td>
                      </tr>
                    </table>
                    <p style="color: #000; margin: 15px 0 0; font-size: 11px; opacity: 0.8;">
                      <em>For purchases of goods, the tax-deductible portion is limited to the amount 
                      by which your payment exceeds the fair market value of goods received.</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0 0 10px; font-size: 12px;">
                Questions? Contact us at <a href="mailto:${NONPROFIT_INFO.email}" style="color: #D4AF37;">${NONPROFIT_INFO.email}</a>
              </p>
              <p style="color: #444; margin: 0; font-size: 11px;">
                ${NONPROFIT_INFO.name} | ${NONPROFIT_INFO.address}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Export for use with Resend
export async function sendOrderConfirmationEmail(
    data: OrderReceiptData,
    resendApiKey?: string
): Promise<{ success: boolean; error?: string }> {
    const apiKey = resendApiKey || process.env.RESEND_API_KEY;

    if (!apiKey) {
        return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${NONPROFIT_INFO.name} <orders@neferkalihealing.org>`,
                to: data.customerEmail,
                subject: `Order Confirmed: ${data.orderNumber} | Nefer Kali Healing`,
                html: generateReceiptHTML(data),
                text: generateReceiptPlainText(data),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
