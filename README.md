# Xeno
# Xeno Shopify Data Ingestion & Insights Platform

A multi-tenant Shopify analytics platform that ingests store data and provides actionable insights via a modern dashboard.

---

##  Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/xeno-shopify-analytics
cd xeno-shopify-analytics
```

2. Install dependencies
```bash
npm install
```
3. Environment Variables
Create .env:
```bash
DATABASE_URL=postgresql://...
```
4. Run Prisma
```bash
npx prisma generate
npx prisma migrate dev
```
6. Start the app
```bash
npm run dev
```
# High-Level Architecture
![flowchart](./image.png)

    
## API Endpoints
Endpoint	Description
/api/tenants	Add / list stores
/api/tenants/:shop/sync	Trigger ingestion
/api/insights/summary	Core KPIs
/api/insights/aov	AOV trend
/api/insights/orders-by-hour	Orders heatmap
/api/events	Webhook receiver
Architecture Diagram
Shopify Store → Ingestion APIs → PostgreSQL → Dashboard UI

## Known Limitations

Shopify OAuth not implemented (token-based auth only).

Scheduler uses in-process timers (not fault-tolerant).

No webhook retries or DLQ.

Dashboard is read-only (no config management).

 ## Future Improvements

OAuth installation flow

Distributed background workers

Advanced customer segmentation

Query caching and analytics warehouse integration

## Author

Built as part of the Xeno Forward Deployed Engineer Internship Assignment (2025).
Focused on clarity, scalability, and real-world engineering tradeoffs.
