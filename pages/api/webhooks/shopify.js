// pages/api/webhooks/shopify.js
import crypto from 'crypto';
import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: false, // we need raw body for HMAC verification
  },
};

// helper: read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  // Use timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

export default async function handler(req, res) {
  try {
    // Only POST for webhooks
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // Read raw body
    const raw = await getRawBody(req);

    const hmac = req.headers['x-shopify-hmac-sha256'];
    const shop = req.headers['x-shopify-shop-domain'] || req.headers['x-shopify-shop'];
    const topic = req.headers['x-shopify-topic'] || req.headers['x-shopify-event']; // robust
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    // verify HMAC
    const ok = verifyHmac(raw, hmac, secret);
    if (!ok) {
      console.warn('Webhook HMAC verification failed for shop', shop, 'topic', topic);
      return res.status(401).send('HMAC verification failed');
    }

    // parse JSON payload
    const payloadText = raw.toString('utf8');
    let payload = null;
    try { payload = JSON.parse(payloadText); } catch (e) { payload = payloadText; }

    // find tenant
    if (!shop) {
      console.warn('Webhook missing shop header');
      return res.status(400).send('Missing shop header');
    }
    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) {
      // If tenant doesn't exist, still respond 200 (avoid webhook retries) but log.
      console.warn('Webhook received for unknown shop', shop, 'topic', topic);
      return res.status(200).send('ignored');
    }

    // store event
    await prisma.event.create({
      data: {
        tenantId: tenant.id,
        shopifyId: payload && payload.id ? String(payload.id) : undefined,
        topic: topic || 'unknown',
        payload: payload,
      }
    });

    // You may also enqueue a background job here to process the event (e.g., update customers/orders)
    return res.status(200).send('OK');
  } catch (err) {
    console.error('webhook handler error', err);
    // still reply 200 or 500 depending on whether you want Shopify to retry.
    return res.status(500).send('server error');
  }
}
