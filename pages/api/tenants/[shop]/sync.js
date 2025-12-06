// pages/api/tenants/[shop]/sync.js
import prisma from '../../../../lib/prisma';
import { syncAllForTenant } from '../../../../service/shopifySync';

export default async function handler(req, res) {
  const { shop } = req.query;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    // run a sync and return counts
    const result = await syncAllForTenant(tenant.id);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('sync error', err);
    return res.status(500).json({ error: err.message || 'sync failed' });
  }
}
