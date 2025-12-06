// pages/api/tenants/[shop]/products.js
import prisma from '../../../../lib/prisma';
import axios from 'axios';

export default async function handler(req, res) {
  const { shop } = req.query;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const tenant = await prisma.tenant.findUnique({ where: { shop } });
  if (!tenant) return res.status(404).json({ error: 'Shop not installed' });

  try {
    const r = await axios.get(`https://${shop}/admin/api/2025-07/products.json?limit=250`, {
      headers: { 'X-Shopify-Access-Token': tenant.accessToken }
    });
    return res.json({ products: r.data.products || [] });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
}
