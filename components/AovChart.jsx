import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

function fmtDateLabel(dStr) {
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function AovChart({ data = [] }) {
  const sorted = Array.isArray(data) ? [...data].sort((a,b) => (a.date > b.date ? 1 : -1)) : [];
  const sample = [
    { date: '2025-11-01', aov: 75.5 },
    { date: '2025-11-02', aov: 92.3 },
    { date: '2025-11-03', aov: 68.1 },
    { date: '2025-11-04', aov: 120.5 },
    { date: '2025-11-05', aov: 85.2 }
  ];
  const used = sorted.length ? sorted : sample;

  return (
    <div style={{
      width: '100%',
      height: 360,
      borderRadius: 16,
      padding: 18,
      background: 'linear-gradient(180deg,#041226, #07172b)',
      boxShadow: '0 18px 48px rgba(2,6,23,0.75)',
      border: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ fontWeight: 800, color: '#e6eefb', marginBottom: 4, fontSize: 16 }}>Average Order Value (AOV)</div>
      <div style={{ fontSize: 13, color: '#9fb0c8' }}>Shows average order value per day. Hover for exact values.</div>

      <div style={{ flex: 1, marginTop: 6 }}>
        <ResponsiveContainer>
          <LineChart data={used} margin={{ top: 6, right: 20, left: 6, bottom: 10 }}>
            <defs>
              <linearGradient id="gradAov" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.06}/>
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#bcd6ee', fontSize: 12 }}
              tickFormatter={fmtDateLabel}
              label={{ value: 'Date', position: 'insideBottom', offset: -6, fill: '#9fb0c8' }}
            />
            <YAxis
              tick={{ fill: '#bcd6ee', fontSize: 12 }}
              label={{ value: 'AOV ($)', angle: -90, position: 'insideLeft', fill: '#9fb0c8' }}
            />
            <Tooltip
              formatter={(v) => money(v)}
              labelFormatter={(label) => `Date: ${fmtDateLabel(label)}`}
              contentStyle={{ background: '#061226', border: '1px solid rgba(255,255,255,0.04)', color: '#e6eefb' }}
            />
            <Legend wrapperStyle={{ color: '#9fb0c8' }} />

            <Line
              type="monotone"
              dataKey="aov"
              stroke="#ff6b6b"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#ffffff', strokeWidth: 0.8 }}
              activeDot={{ r: 8 }}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease"
              fill="url(#gradAov)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
