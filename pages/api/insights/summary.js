// pages/api/insights/summary.js
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export default requireAuth(async (req, res) => {
  // expect ?shop=your-store.myshopify.com
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'shop required' });

  try {
    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    const totalCustomers = await prisma.customer.count({ where: { tenantId: tenant.id } });
    const totalOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
    const revenueAgg = await prisma.order.aggregate({ where: { tenantId: tenant.id }, _sum: { totalPrice: true } });
    const revenue = revenueAgg._sum.totalPrice || 0;

    return res.json({ totalCustomers, totalOrders, revenue });
  } catch (err) {
    console.error('summary error', err);
    return res.status(500).json({ error: 'server error' });
  }
});
