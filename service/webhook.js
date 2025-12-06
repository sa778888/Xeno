// services/webhooks.js
import axios from 'axios';

export async function registerWebhooks(tenant, appUrl) {
  // tenant: { shop, accessToken }
  const url = `https://${tenant.shop}/admin/api/2025-07/webhooks.json`;
  const webhooks = [
    { topic: 'orders/create', address: `${appUrl}/api/webhooks/shopify`, format: 'json' },
    { topic: 'orders/updated', address: `${appUrl}/api/webhooks/shopify`, format: 'json' },
    { topic: 'customers/create', address: `${appUrl}/api/webhooks/shopify`, format: 'json' },
    { topic: 'carts/update', address: `${appUrl}/api/webhooks/shopify`, format: 'json' }, // cart events
    { topic: 'checkouts/create', address: `${appUrl}/api/webhooks/shopify`, format: 'json' }, // checkout started
    { topic: 'app/uninstalled', address: `${appUrl}/api/webhooks/shopify`, format: 'json' } // mark tenant inactive
  ];

  for (const wh of webhooks) {
    try {
      await axios.post(url, { webhook: wh }, {
        headers: { 'X-Shopify-Access-Token': tenant.accessToken, Accept: 'application/json' }
      });
    } catch (err) {
      // duplicate registrations may fail — ignore or inspect
      console.warn('register webhook failed', wh.topic, err.response?.data || err.message);
    }
  }
}
