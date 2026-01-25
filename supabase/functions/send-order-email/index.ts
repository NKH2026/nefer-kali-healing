// Send Order Email Edge Function
// Handles shipping notification and refund/cancellation emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Non-profit info
const NONPROFIT_INFO = {
  name: 'Nefer Kali Healing',
  ein: '99-3021724',
  address: 'PO Box 322, McCordsville, IN 46055',
  email: 'asasa@neferkalihealing.org',
};

// Email templates
function getShippingEmail(order: any, trackingNumber: string, trackingUrl: string | null) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #9C27B0, #6A1B9A); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: bold;">📦 Your Order Has Shipped!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Exciting News, ${order.customer_name}!</h2>
              <p style="color: #999; margin: 0;">Your order is on its way to you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
                    <p style="color: #D4AF37; margin: 0 0 20px; font-size: 18px; font-weight: bold;">${order.order_number}</p>
                    
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Tracking Number</p>
                    <p style="color: #fff; margin: 0; font-size: 16px; font-family: monospace;">${trackingNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${trackingUrl ? `
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <a href="${trackingUrl}" style="display: inline-block; background: #D4AF37; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; text-transform: uppercase;">Track Your Package</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #888; margin: 0; font-size: 14px; text-align: center;">
                Your package is being shipped via USPS. You can expect delivery within 5-7 business days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #fff; margin: 0 0 15px; font-size: 14px;">Shipping To:</h3>
                    <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.6;">
                      ${order.customer_name}<br>
                      ${order.shipping_address_line1}<br>
                      ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
                      ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                Questions? Contact us at <a href="mailto:${NONPROFIT_INFO.email}" style="color: #D4AF37;">${NONPROFIT_INFO.email}</a>
              </p>
              <p style="color: #444; margin: 10px 0 0; font-size: 11px;">${NONPROFIT_INFO.name} | ${NONPROFIT_INFO.address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getRefundEmail(order: any, refundAmount: number, isFullRefund: boolean, reason: string | null) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #607D8B, #455A64); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: bold;">💳 Refund Processed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Hello ${order.customer_name},</h2>
              <p style="color: #999; margin: 0;">We've processed ${isFullRefund ? 'a full' : 'a partial'} refund for your order.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
                    <p style="color: #D4AF37; margin: 0 0 20px; font-size: 18px; font-weight: bold;">${order.order_number}</p>
                    
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Refund Amount</p>
                    <p style="color: #4CAF50; margin: 0; font-size: 24px; font-weight: bold;">$${refundAmount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${reason ? `
          <tr>
            <td style="padding: 30px 40px 0;">
              <p style="color: #888; margin: 0; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #888; margin: 0; font-size: 14px;">
                The refund has been initiated and should appear in your account within 5-10 business days, depending on your bank or card issuer.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                Questions? Contact us at <a href="mailto:${NONPROFIT_INFO.email}" style="color: #D4AF37;">${NONPROFIT_INFO.email}</a>
              </p>
              <p style="color: #444; margin: 10px 0 0; font-size: 11px;">${NONPROFIT_INFO.name} | ${NONPROFIT_INFO.address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getCancellationEmail(order: any) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #F44336, #C62828); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: bold;">Order Cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Hello ${order.customer_name},</h2>
              <p style="color: #999; margin: 0;">Your order has been cancelled as requested.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
                    <p style="color: #D4AF37; margin: 0 0 20px; font-size: 18px; font-weight: bold;">${order.order_number}</p>
                    
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Original Total</p>
                    <p style="color: #888; margin: 0; font-size: 18px; text-decoration: line-through;">$${order.total.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #888; margin: 0; font-size: 14px;">
                If you paid for this order, you will receive a separate email once the refund has been processed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                Questions? Contact us at <a href="mailto:${NONPROFIT_INFO.email}" style="color: #D4AF37;">${NONPROFIT_INFO.email}</a>
              </p>
              <p style="color: #444; margin: 10px 0 0; font-size: 11px;">${NONPROFIT_INFO.name} | ${NONPROFIT_INFO.address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, emailType, trackingNumber, trackingUrl, refundAmount, isFullRefund, reason } = await req.json();

    if (!orderId || !emailType) {
      return new Response(
        JSON.stringify({ error: 'orderId and emailType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content based on type
    let emailHTML: string;
    let subject: string;

    switch (emailType) {
      case 'shipping':
        if (!trackingNumber) {
          return new Response(
            JSON.stringify({ error: 'trackingNumber is required for shipping emails' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        emailHTML = getShippingEmail(order, trackingNumber, trackingUrl);
        subject = `📦 Your Order Has Shipped! | ${order.order_number}`;
        break;

      case 'refund':
        emailHTML = getRefundEmail(order, refundAmount || order.total, isFullRefund !== false, reason);
        subject = `💳 Refund Processed | ${order.order_number}`;
        break;

      case 'cancellation':
        emailHTML = getCancellationEmail(order);
        subject = `Order Cancelled | ${order.order_number}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid emailType. Use: shipping, refund, or cancellation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nefer Kali Healing <onboarding@resend.dev>',
        to: order.customer_email,
        subject: subject,
        html: emailHTML,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
