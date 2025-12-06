// pages/api/tenants/index.js
import prisma from '../../../lib/prisma';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tenants = await prisma.tenant.findMany({ orderBy: { installedAt: 'desc' } });
      return res.json(tenants);
    } catch (err) {
      console.error('GET /api/tenants error', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'POST') {
    const { shop, accessToken } = req.body;
    if (!shop || !accessToken) return res.status(400).json({ error: 'shop and accessToken required' });

    // Basic validation: try calling shop endpoint to verify token
    try {
      await axios.get(`https://${shop}/admin/api/2025-07/shop.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      });
    } catch (err) {
      return res.status(400).json({ error: 'Token validation failed: ' + (err.response?.data || err.message) });
    }

    try {
      const saved = await prisma.tenant.upsert({
        where: { shop },
        update: { accessToken, installedAt: new Date() },
        create: { shop, accessToken }
      });
      return res.status(201).json(saved);
    } catch (err) {
      console.error('POST /api/tenants error', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method not allowed');
}
