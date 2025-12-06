import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function OrdersChartRecharts({ data = [] }) {
  const normalized = (data || []).map((d) => ({
    date: d.date,
    orders: d.orders != null ? Number(d.orders) : 0,
    revenue: d.revenue != null ? Number(d.revenue) : 0,
  }));

  return (
    <div style={{
      width: '100%',
      height: 420,
      borderRadius: 16,
      background: 'linear-gradient(180deg,#041226,#07172b)',
      padding: 18,
      border: '1px solid rgba(255,255,255,0.04)',
      boxShadow: '0 18px 48px rgba(2,6,23,0.75)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer>
          <LineChart data={normalized} margin={{ top: 12, right: 28, left: 0, bottom: 6 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#bcd6ee' }} />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12, fill: '#bcd6ee' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#bcd6ee' }} />
            <Tooltip formatter={(value, name) => {
              if (name === 'Revenue') return [`$${Number(value).toFixed(2)}`, name];
              return [value, name];
            }} contentStyle={{ background:'#061226', border:'1px solid rgba(255,255,255,0.04)', color:'#e6eefb' }} />
            <Legend wrapperStyle={{ color:'#9fb0c8' }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#34d399" strokeWidth={3} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
