// pages/api/tenants/[shop].js  (example - adjust paths/imports to your project)
import prisma from '../../../../lib/prisma'; // adjust path according to where prisma client is

export default async function handler(req, res) {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'shop required' });

  if (req.method === 'DELETE') {
    try {
      // find tenant first
      const tenant = await prisma.tenant.findUnique({ where: { shop } });
      if (!tenant) return res.status(404).json({ error: 'tenant not found' });

      // Use a transaction that deletes children in order
      await prisma.$transaction([
        // delete order items (depends on orders)
        prisma.orderItem.deleteMany({
          where: { order: { tenantId: tenant.id } },
        }),
        // delete orders
        prisma.order.deleteMany({
          where: { tenantId: tenant.id },
        }),
        // delete products
        prisma.product.deleteMany({
          where: { tenantId: tenant.id },
        }),
        // delete events
        prisma.event.deleteMany({
          where: { tenantId: tenant.id },
        }),
        // delete customers
        prisma.customer.deleteMany({
          where: { tenantId: tenant.id },
        }),
        // finally delete the tenant
        prisma.tenant.delete({
          where: { id: tenant.id }
        })
      ], { isolationLevel: 'ReadCommitted' }); // optional option

      return res.json({ ok: true, shop });
    } catch (err) {
      console.error('DELETE /api/tenants/[shop] error', err);
      // Prisma P2003 would be caught here if still any FK violation
      return res.status(500).json({ error: err.message || 'delete failed' });
    }
  }

  res.setHeader('Allow', 'DELETE');
  return res.status(405).end();
}
