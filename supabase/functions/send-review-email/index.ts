// Send Review Request Email Edge Function
// Queries orders that are due for review request emails (21 days after purchase)
// and sends them a branded email with a link to leave a review
// 
// Can be triggered by:
// 1. Supabase pg_cron scheduled job
// 2. Manual call from admin dashboard
//
// Deploy: supabase functions deploy send-review-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const emailjsServiceId = Deno.env.get('EMAILJS_SERVICE_ID')!;
const emailjsTemplateId = Deno.env.get('EMAILJS_TEMPLATE_ID')!;
const emailjsPublicKey = Deno.env.get('EMAILJS_PUBLIC_KEY')!;
const emailjsPrivateKey = Deno.env.get('EMAILJS_PRIVATE_KEY')!;

const SITE_URL = 'https://www.neferkalihealing.org';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getReviewRequestEmail(order: any, orderItems: any[]) {
  const productNames = orderItems.map((item: any) => item.product_title).join(', ');
  const reviewUrl = `${SITE_URL}/offerings`;

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
            <td style="background: linear-gradient(135deg, #D4AF37, #8B7322); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">NEFER KALI HEALING</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">We'd Love Your Feedback ✨</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 15px; font-size: 24px;">Peace and Blessings ${order.customer_name}!</h2>
              <p style="color: #ccc; margin: 0 0 20px; line-height: 1.6;">
                It's been a few weeks since your order arrived, and we hope you've been enjoying your purchase! 
                Your experience matters deeply to us and helps other seekers on their healing journey.
              </p>
              <p style="color: #ccc; margin: 0 0 20px; line-height: 1.6;">
                Would you take a moment to share your thoughts about <strong style="color: #D4AF37;">${productNames}</strong>?
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Your Order</p>
                    <p style="color: #D4AF37; margin: 0 0 10px; font-size: 16px; font-weight: bold;">${order.order_number}</p>
                    <p style="color: #999; margin: 0; font-size: 14px;">${productNames}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <a href="${reviewUrl}" style="display: inline-block; background: #D4AF37; color: #000; padding: 18px 50px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Leave a Review</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #777; margin: 0; font-size: 13px; text-align: center; font-style: italic;">
                Your review helps us grow and helps others discover the healing power of nature. 🌿
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background: linear-gradient(135deg, rgba(27, 94, 32, 0.2), rgba(212, 175, 55, 0.1)); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #D4AF37; margin: 0 0 5px; font-size: 16px;">⭐⭐⭐⭐⭐</p>
                    <p style="color: #999; margin: 0; font-size: 12px;">Share your star rating and experience</p>
                  </td>
                </tr>
              </table>
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find orders due for review emails
    const now = new Date().toISOString();
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('review_email_sent', false)
      .lte('review_email_send_at', now)
      .not('review_email_send_at', 'is', null)
      .eq('payment_status', 'paid')
      .limit(10); // Process in batches of 10

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders', details: ordersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No review emails to send', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Fetch order items
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (!orderItems || orderItems.length === 0) continue;

        // Skip orders with only digital items for review (or include them — up to you)
        const emailHTML = getReviewRequestEmail(order, orderItems);

        // Send via EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.6/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: emailjsServiceId,
            template_id: emailjsTemplateId,
            user_id: emailjsPublicKey,
            accessToken: emailjsPrivateKey,
            template_params: {
              to_email: order.customer_email,
              subject: `⭐ How was your experience? | Nefer Kali Healing`,
              message_html: emailHTML,
            },
          }),
        });

        if (response.ok) {
          // Mark as sent
          await supabase
            .from('orders')
            .update({ review_email_sent: true })
            .eq('id', order.id);

          sentCount++;
          console.log(`Review email sent to: ${order.customer_email} for order ${order.order_number}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to send review email for order ${order.order_number}:`, errorText);
          errors.push(`${order.order_number}: ${errorText}`);
        }
      } catch (emailError: any) {
        console.error(`Error processing order ${order.order_number}:`, emailError);
        errors.push(`${order.order_number}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Review emails processed`,
        sent: sentCount,
        total: orders.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Review email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
