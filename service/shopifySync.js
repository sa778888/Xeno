// services/shopifySync.js
import axios from 'axios';
import prisma from '../lib/prisma';

/**
 * Fetch all pages from a Shopify REST endpoint by following Link header pagination.
 * `path` is the path after /admin/api/<version>/ e.g. 'products.json?limit=250'
 */
async function fetchAllFromShop(tenant, path) {
  const apiVersion = '2025-07';
  const base = `https://${tenant.shop}/admin/api/${apiVersion}/`;
  let url = base + path;
  const all = [];

  while (url) {
    const res = await axios.get(url, {
      headers: { 'X-Shopify-Access-Token': tenant.accessToken, Accept: 'application/json' },
      timeout: 20000
    });
    // results: res.data.products or .customers or .orders depending on endpoint
    // push values generically
    const keys = Object.keys(res.data);
    if (keys.length === 1 && Array.isArray(res.data[keys[0]])) {
      all.push(...res.data[keys[0]]);
    } else {
      // fallback: push whole body
      all.push(res.data);
    }

    // check Link header for next page (cursor-based)
    const link = res.headers.link;
    if (link) {
      // parse Link header looking for rel="next"
      // example: <https://shop.../products.json?page_info=xxx&limit=250>; rel="next"
      const parts = link.split(',');
      const nextPart = parts.find(p => p.includes('rel="next"'));
      if (nextPart) {
        const match = nextPart.match(/<([^>]+)>/);
        url = match ? match[1] : null;
        continue;
      }
    }
    // no link or no next found => finish
    url = null;
  }

  return all;
}

/* UPSERT helpers — adapt to your Prisma models */
export async function upsertProductsForTenant(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant not found');

  const products = await fetchAllFromShop(tenant, 'products.json?limit=250');

  let count = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { shopifyId: String(p.id) },
      update: {
        title: p.title,
        sku: p.variants?.[0]?.sku || null,
        price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
        updatedAt: p.updated_at ? new Date(p.updated_at) : undefined
      },
      create: {
        tenantId,
        shopifyId: String(p.id),
        title: p.title,
        sku: p.variants?.[0]?.sku || null,
        price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
        createdAt: p.created_at ? new Date(p.created_at) : undefined,
        updatedAt: p.updated_at ? new Date(p.updated_at) : undefined
      }
    });
    count++;
  }
  return { count };
}

export async function upsertCustomersForTenant(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant not found');

  const customers = await fetchAllFromShop(tenant, 'customers.json?limit=250');

  let count = 0;
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { shopifyId: String(c.id) },
      update: {
        email: c.email || null,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        totalSpent: c.total_spent ? parseFloat(c.total_spent) : undefined,
        updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
        tenantId
      },
      create: {
        tenantId,
        shopifyId: String(c.id),
        email: c.email || null,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        totalSpent: c.total_spent ? parseFloat(c.total_spent) : 0,
        createdAt: c.created_at ? new Date(c.created_at) : undefined,
        updatedAt: c.updated_at ? new Date(c.updated_at) : undefined
      }
    });
    count++;
  }
  return { count };
}

export async function upsertOrdersForTenant(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant not found');

  const orders = await fetchAllFromShop(tenant, 'orders.json?limit=250'); // include any filters if required

  let count = 0;
  for (const o of orders) {
    // ensure customer exists or null
    let customerId = null;
    if (o.customer && o.customer.id) {
      const c = await prisma.customer.upsert({
        where: { shopifyId: String(o.customer.id) },
        update: {
          email: o.customer.email || null,
          firstName: o.customer.first_name || null,
          lastName: o.customer.last_name || null,
          updatedAt: o.customer.updated_at ? new Date(o.customer.updated_at) : undefined
        },
        create: {
          tenantId,
          shopifyId: String(o.customer.id),
          email: o.customer.email || null,
          firstName: o.customer.first_name || null,
          lastName: o.customer.last_name || null,
          createdAt: o.customer.created_at ? new Date(o.customer.created_at) : undefined
        }
      });
      customerId = c.id;
    }

    const order = await prisma.order.upsert({
      where: { shopifyId: String(o.id) },
      update: {
        totalPrice: parseFloat(o.total_price || 0),
        currency: o.currency || (o.currency ?? 'USD'),
        createdAt: o.created_at ? new Date(o.created_at) : new Date(),
        customerId,
        status: o.financial_status || null
      },
      create: {
        tenantId,
        shopifyId: String(o.id),
        totalPrice: parseFloat(o.total_price || 0),
        currency: o.currency || (o.currency ?? 'USD'),
        createdAt: o.created_at ? new Date(o.created_at) : new Date(),
        customerId,
        status: o.financial_status || null
      }
    });

    // replace order items: delete old + insert
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    const items = o.line_items || [];
    for (const li of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          title: li.title || li.name || '',
          qty: li.quantity || 1,
          price: li.price ? parseFloat(li.price) : 0
        }
      });
    }

    count++;
  }
  return { count };
}

/**
 * Full sync: products, customers, orders
 */
export async function syncAllForTenant(tenantId) {
  const now = new Date();
  const [p, c, o] = await Promise.all([
    upsertProductsForTenant(tenantId),
    upsertCustomersForTenant(tenantId),
    upsertOrdersForTenant(tenantId)
  ]);

  // optionally update Tenant.lastSynced
  await prisma.tenant.update({ where: { id: tenantId }, data: { lastSynced: now } }).catch(()=>{});
  return { products: p.count, customers: c.count, orders: o.count };
}
