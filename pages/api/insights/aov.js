// pages/api/insights/aov.js
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

    // parse dates
    const fromDt = safeDate(from);
    const toDt = safeDate(to);

    // Fetch orders in range
    const where = { tenantId: tenant.id };
    if (fromDt) where.createdAt = { ...where.createdAt, gte: fromDt };
    if (toDt) where.createdAt = { ...where.createdAt, lte: toDt };

    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, totalPrice: true }
    });

    // bucket by day (YYYY-MM-DD)
    const buckets = {};
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      if (!buckets[day]) buckets[day] = { total: 0, count: 0 };
      buckets[day].total += Number(o.totalPrice || 0);
      buckets[day].count += 1;
    }

    const out = Object.keys(buckets).sort().map(date => ({
      date,
      aov: buckets[date].count ? Number((buckets[date].total / buckets[date].count).toFixed(2)) : 0
    }));

    return res.json(out);
  } catch (err) {
    console.error('/api/insights/aov error', err);
    return res.status(500).json({ error: 'server error' });
  }
}
