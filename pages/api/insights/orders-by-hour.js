// pages/api/insights/orders-by-hour.js
import prisma from '../../../lib/prisma';

function safeDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return isNaN(x) ? null : x;
}

export default async function handler(req, res) {
  try {
    const { shop, from, to } = req.query;
    if (!shop) return res.status(400).json({ error: 'shop required' });

    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    const fromDt = safeDate(from);
    const toDt = safeDate(to);

    const where = { tenantId: tenant.id };
    if (fromDt) where.createdAt = { ...where.createdAt, gte: fromDt };
    if (toDt) where.createdAt = { ...where.createdAt, lte: toDt };

    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true }
    });

    // build 24-hour buckets (use local hours to match UI expectation)
    const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2, '0'), orders: 0 }));

    for (const o of orders) {
      // use local hour (getHours) so charts reflect user's timezone; change to getUTCHours() if you prefer UTC
      const h = o.createdAt.getHours();
      if (h >= 0 && h < 24) buckets[h].orders += 1;
    }

    return res.json(buckets);
  } catch (err) {
    console.error('/api/insights/orders-by-hour error', err);
    return res.status(500).json({ error: 'server error' });
  }
}
