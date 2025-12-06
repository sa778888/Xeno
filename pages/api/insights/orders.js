// pages/api/insights/orders.js
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  const { shop, from, to } = req.query;
  if (!shop) return res.status(400).json({ error: 'shop required' });

  const fromDate = from ? new Date(from) : new Date('1970-01-01');
  const toDate = to ? new Date(to) : new Date();

  try {
    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    // group orders by date
    // Prisma doesn't support date_trunc aggregation directly cross-DB; do it with raw SQL for accurate grouping
    const rows = await prisma.$queryRawUnsafe(
      `SELECT date("createdAt") as date, COUNT(*) as orders, COALESCE(SUM("totalPrice"),0) as revenue
       FROM "Order"
       WHERE "tenantId" = $1 AND "createdAt" BETWEEN $2 AND $3
       GROUP BY date
       ORDER BY date`,
      tenant.id,
      fromDate.toISOString(),
      toDate.toISOString()
    );

    // normalize rows
    const series = rows.map(r => ({ date: r.date?.toISOString?.().slice(0,10) ?? String(r.date), orders: Number(r.orders), revenue: Number(r.revenue) }));
    return res.json(series);
  } catch (err) {
    console.error('orders series error', err);
    return res.status(500).json({ error: 'server error' });
  }
});
