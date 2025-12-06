// pages/api/insights/top-customers.js
import prisma from '../../../lib/prisma';

function buildName(c) {
  if (!c) return null;
  const first = (c.firstName || '').trim();
  const last = (c.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (c.name) return c.name;      // in case you have a 'name' field
  if (c.email) return c.email;
  return null;
}

export default async function handler(req, res) {
  try {
    const { shop, limit = '5' } = req.query;
    if (!shop) return res.status(400).json({ error: 'shop required' });

    const tenant = await prisma.tenant.findUnique({ where: { shop } });
    if (!tenant) return res.status(404).json({ error: 'tenant not found' });

    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 5));

    // Fast path: use stored totalSpent on Customer
    // (Your schema includes totalSpent on Customer)
    const customersByStored = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      orderBy: { totalSpent: 'desc' },
      take: lim,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totalSpent: true
      }
    });

    // If we got any customers from stored totals, return them (it's simplest and fast)
    if (customersByStored && customersByStored.length > 0) {
      const out = customersByStored.map(c => ({
        id: c.id,
        name: buildName(c) || c.email || `(customer ${c.id})`,
        email: c.email || null,
        totalSpend: Number(c.totalSpent || 0)
      }));
      return res.json(out.slice(0, lim));
    }

    // Otherwise fallback: aggregate orders by customerId
    // (ignore orders with null customerId)
    const grouped = await prisma.order.groupBy({
      by: ['customerId'],
      where: { tenantId: tenant.id, customerId: { not: null } },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: lim
    });

    const result = [];
    for (const g of grouped) {
      const customer = await prisma.customer.findUnique({
        where: { id: g.customerId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      const name = buildName(customer) || customer?.email || `(customer ${g.customerId})`;
      result.push({
        id: customer?.id ?? g.customerId,
        name,
        email: customer?.email ?? null,
        totalSpend: Number(g._sum?.totalPrice ?? 0)
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('top-customers error', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
