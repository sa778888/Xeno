import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#ff6b6b','#60a5fa','#f97316','#7c3aed','#06b6d4','#34d399','#f59e0b'];

export default function MultiStoreRevenueChart({ data = [] }) {
  const normalized = (data || []).map(d => ({ shop: d.shop, revenue: Number(d.revenue || 0) }));

  return (
    <div style={{
      width: '100%',
      height: 360,
      borderRadius: 16,
      background: 'linear-gradient(180deg,#071728,#041025)',
      padding: 16,
      border: '1px solid rgba(255,255,255,0.04)',
      boxShadow: '0 18px 48px rgba(2,6,23,0.75)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ fontWeight:700, color:'#e6eefb', marginBottom:4 }}>Revenue by Store</div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer>
          <BarChart data={normalized} margin={{ top: 8, right: 18, left: 0, bottom: 6 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="shop" tick={{ fontSize: 12, fill: '#bcd6ee' }} />
            <YAxis tick={{ fontSize: 12, fill: '#bcd6ee' }} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} contentStyle={{ background:'#061226', border:'1px solid rgba(255,255,255,0.04)', color:'#e6eefb' }} />
            <Legend wrapperStyle={{ color:'#9fb0c8' }} />
            {normalized.map((d, idx) => (
              <Bar key={d.shop} dataKey="revenue" name={d.shop} fill={COLORS[idx % COLORS.length]} barSize={44} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
