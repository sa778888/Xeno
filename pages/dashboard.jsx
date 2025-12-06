// pages/dashboard.js
import React, { useEffect, useState, useRef } from 'react';
import AovChart from '../components/AovChart';
import OrdersByHourChart from '../components/OrdersByHourChart';
import OrdersChartRecharts from '../components/OrdersChartRecharts';         // optional if present
import MultiStoreRevenueChart from '../components/MultiStoreRevenueChart'; // optional if present


function fmtCurrency(n){ return `$${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
function defaultDates() { const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 29); const isoDay = d => d.toISOString().slice(0,10); return { from: isoDay(from), to: isoDay(to) }; }
function toInclusiveIsoEnd(dateStr) { if (!dateStr) return undefined; const d = new Date(dateStr + 'T00:00:00'); d.setHours(23,59,59,999); return d.toISOString(); }
function toIsoStart(dateStr) { if (!dateStr) return undefined; return new Date(dateStr + 'T00:00:00').toISOString(); }

export default function DashboardPage(){
  const { from: defaultFrom, to: defaultTo } = defaultDates();
  const [tenants, setTenants] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [newShop, setNewShop] = useState('');
  const [newToken, setNewToken] = useState('');
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [ordersSeries, setOrdersSeries] = useState([]);
  const [aovData, setAovData] = useState([]);
  const [ordersByHour, setOrdersByHour] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [storesRevenue, setStoresRevenue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const autoRef = useRef(null);

  // UI-only state for responsiveness (presentation only)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 860 : false);
  useEffect(() => {
    function onResize(){ setIsMobile(window.innerWidth < 860); }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(()=>{ fetchTenants(); }, []);
  useEffect(()=>{ if (selectedShop) loadAllForShop(selectedShop); startAutoSync(); return ()=> stopAutoSync(); }, [selectedShop]);

  async function fetchTenants(){ 
    try{ 
      const r = await fetch('/api/tenants', { credentials: 'same-origin' });
      if (!r.ok) { setTenants([]); return; }
      const json = await r.json();
      setTenants(json || []);
      if (!selectedShop && json && json.length) setSelectedShop(json[0].shop);
      updateStoresRevenue(json);
    }catch(e){ console.error(e); setTenants([]); } 
  }

  async function addTenant(e){
    e?.preventDefault?.();
    if (!newShop || !newToken) return alert('shop and token required');
    try{
      const r = await fetch('/api/tenants', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ shop: newShop.trim(), accessToken: newToken.trim() }) });
      const j = await r.json();
      if (!r.ok) {
        return alert('Error adding tenant: '+(j.error||JSON.stringify(j)));
      }
      setNewShop('');
      setNewToken('');
      setShowAddModal(false);
      await fetchTenants();
      setSelectedShop(j.shop || newShop.trim());
    }catch(e){ console.error(e); alert('Add failed'); }
  }

  async function removeTenant(shop){
    if (!confirm(`Remove ${shop}?`)) return;
    try{
      const r = await fetch(`/api/tenants/${encodeURIComponent(shop)}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error || 'delete failed'); }
      await fetchTenants();
      if (selectedShop === shop) setSelectedShop('');
    }catch(e){ console.error(e); alert('Delete failed: '+e.message); }
  }

  async function loadAllForShop(shop){
    if (!shop) return;
    setLoading(true);
    try{
      setSyncing(true);
      // trigger sync (best-effort)
      await fetch(`/api/tenants/${encodeURIComponent(shop)}/sync`, { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
      await new Promise(r=>setTimeout(r, 400));
      const s = await fetchJson(`/api/insights/summary?shop=${encodeURIComponent(shop)}`);
      setSummary(s || null);

      const qOrders = new URLSearchParams();
      qOrders.set('shop', shop);
      qOrders.set('from', toIsoStart(from));
      qOrders.set('to', toInclusiveIsoEnd(to));
      const orders = await fetchJson(`/api/insights/orders?${qOrders.toString()}`);
      setOrdersSeries(Array.isArray(orders)?orders:[]);

      const qAov = new URLSearchParams();
      qAov.set('shop', shop);
      qAov.set('from', toIsoStart(from));
      qAov.set('to', toInclusiveIsoEnd(to));
      const aov = await fetchJson(`/api/insights/aov?${qAov.toString()}`);
      setAovData(Array.isArray(aov)?aov:[]);

      const qHour = new URLSearchParams();
      qHour.set('shop', shop);
      qHour.set('from', toIsoStart(from));
      qHour.set('to', toInclusiveIsoEnd(to));
      const hours = await fetchJson(`/api/insights/orders-by-hour?${qHour.toString()}`);
      setOrdersByHour(Array.isArray(hours)?hours:[]);

      const top = await fetchJson(`/api/insights/top-customers?shop=${encodeURIComponent(shop)}&limit=5`);
      setTopCustomers(Array.isArray(top)?top:[]);

      // update stores revenue list
      await fetchTenants();
    }catch(e){ console.error('loadAllForShop', e); } finally { setSyncing(false); setLoading(false); }
  }

  async function fetchJson(url){
    try{
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok) return null;
      return await r.json();
    }catch(e){ console.error('fetchJson', e); return null; }
  }

  function startAutoSync(){
    if (autoRef.current) return;
    autoRef.current = setInterval(async ()=>{
      if (!tenants.length) return;
      for (const t of tenants) {
        try {
          await fetch(`/api/tenants/${encodeURIComponent(t.shop)}/sync`, { method:'POST', credentials:'same-origin' });
          await new Promise(r=>setTimeout(r, 600));
        } catch(e){ console.warn('auto sync error', e); }
      }
      if (selectedShop) loadAllForShop(selectedShop);
    }, 30000);
  }

  function stopAutoSync(){ if (autoRef.current){ clearInterval(autoRef.current); autoRef.current = null; } }

  async function updateStoresRevenue(list){
    try{
      const arr = [];
      const tlist = list || tenants;
      for (const t of tlist) {
        const s = await fetchJson(`/api/insights/summary?shop=${encodeURIComponent(t.shop)}`);
        arr.push({ shop: t.shop, revenue: s?.revenue ?? 0 });
      }
      setStoresRevenue(arr);
    }catch(e){ console.warn(e); setStoresRevenue([]); }
  }
// add inside the component (above return)
async function handleLogout() {
  stopAutoSync(); // keep existing cleanup
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (err) {
    console.warn('Logout request failed', err);
  } finally {
    window.location.href = '/home'; // go to home/login
  }
}

  function handleApplyDates(){ if (!selectedShop) return alert('Select a store first'); loadAllForShop(selectedShop); }

  // brighter theme
  const theme = {
    bg: '#021426',
    headerBg: 'linear-gradient(90deg,#07172b,#092036)',
    panel: '#071728',
    card: '#061426',
    text: '#f3fbff',
    muted: '#bfe6ff',
    accent: '#ff7b7b',
    accent2: '#60a5fa',
    shadow: '0 20px 60px rgba(2,6,23,0.85)'
  };

  // helper for blur when modal open
  const contentFilter = showAddModal ? { filter: 'blur(6px) saturate(1.05)', pointerEvents: 'none' } : {};

  // Responsive button styles (presentation-only)
  const headerLogoutStyle = {
    padding: isMobile ? '10px 12px' : '9px 14px',
    borderRadius: 12,
    background: 'linear-gradient(90deg,#ff7b7b,#ffb86b)',
    border: 'none',
    color: '#041025',
    fontWeight: 800,
    cursor: 'pointer'
  };

  const sidebarActionBtn = {
    padding: isMobile ? '12px 10px' : '12px 14px',
    borderRadius: 12,
    background: 'linear-gradient(90deg,#34d399,#60a5fa)',
    color: '#041025',
    border: 'none',
    fontWeight: 800,
    cursor: 'pointer',
    flex: 1,
    minWidth: 0,
    transition: 'transform 160ms ease, box-shadow 160ms ease'
  };

  const simpleBtn = {
    padding: isMobile ? '10px 10px' : '9px 12px',
    borderRadius: 10,
    background: '#0b2b33',
    border: '1px solid rgba(255,255,255,0.02)',
    color: theme.muted,
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'transform 160ms ease, box-shadow 160ms ease'
  };

  const dangerBtn = {
    padding: isMobile ? '10px 10px' : '9px 12px',
    borderRadius: 10,
    background: 'linear-gradient(90deg,#f97373,#ff6b6b)',
    border: 'none',
    color: '#041025',
    cursor: 'pointer',
    fontWeight: 800,
    boxShadow: '0 6px 18px rgba(255,80,80,0.12)',
    transition: 'transform 160ms ease, box-shadow 160ms ease'
  };

  // NEW: plain "normal" button styles for Open and Remove (no gradients)
  const tenantOpenBtn = {
    flex: 1,
    padding: isMobile ? '10px 12px' : '10px 14px',
    borderRadius: 8,
    background: '#0b2b33',
    border: '1px solid rgba(255,255,255,0.06)',
    color: theme.muted,
    fontWeight: 700,
    cursor: 'pointer'
  };

  const tenantRemoveBtn = {
    padding: isMobile ? '10px 12px' : '10px 14px',
    borderRadius: 8,
    background: '#0b2b33',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#ffd6d6',
    fontWeight: 700,
    cursor: 'pointer'
  };

  // mobile stack helper for tenant item buttons
  const tenantButtonContainerStyle = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }
    : { display:'flex', gap:8, marginTop:12, justifyContent: 'flex-end', alignItems: 'center' };

  return (
    <div style={{ minHeight:'100vh', background: theme.bg, color: theme.text, fontFamily: 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto, Arial', paddingBottom: 48 }}>
      {/* HEADER */}
      <header style={{ padding: 16, display:'flex', justifyContent:'space-between', alignItems:'center', background: theme.headerBg, borderBottom: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 6px 18px rgba(2,6,23,0.5)' }}>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(90deg,#ff8a8a,#ffb86b)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color: '#041025', fontSize:18, boxShadow:'0 6px 18px rgba(255,120,120,0.12)' }}>
            XI
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color: theme.text }}>Xeno Insights</div>
            <div style={{ fontSize:13, color: theme.muted, marginTop:4 }}>Multi-store analytics — bright & responsive</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#082033', padding:isMobile ? '6px 8px' : '8px 10px', borderRadius:12, border:'1px solid rgba(255,255,255,0.04)' }}>
            <input placeholder="Search stores or metrics..." value={selectedShop} onChange={e=>setSelectedShop(e.target.value)}
              style={{ background:'transparent', border:'none', outline:'none', color:theme.text, width: isMobile ? 140 : 220, fontSize:13 }} />
            <button onClick={()=>selectedShop && loadAllForShop(selectedShop)} style={{ padding:isMobile ? '6px 8px' : '8px 10px', borderRadius:10, background: theme.accent2, color:'#041025', fontWeight:800, border:'none', cursor:'pointer' }}>Go</button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right', marginRight:6 }}>
              <div style={{ fontSize:13, fontWeight:800 }}>{/* placeholder for user name */}Admin</div>
              <div style={{ fontSize:11, color: theme.muted }}>Signed in</div>
            </div>
            <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(90deg,#60a5fa,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#041025', fontWeight:800, cursor:'pointer' }}>A</div>

            {/* logout uses bright gradient on desktop, full-width on mobile */}
            <button onClick={handleLogout}
 style={{ ...(isMobile ? { width:110 } : {}), ...headerLogoutStyle }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT - blurred when modal visible */}
      <div style={{ maxWidth:1280, margin:'28px auto', display:'flex', gap:28, padding:'0 18px', flexWrap:'wrap', alignItems:'flex-start', ...contentFilter }}>

        {/* SIDEBAR — increased width */}
        <aside style={{ flexBasis: isMobile ? '100%' : 460, minWidth: isMobile ? '100%' : 420 }}>
          <div style={{ padding:18, borderRadius:14, background:theme.panel, boxShadow:theme.shadow, border:'1px solid rgba(255,255,255,0.03)', marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:900, color: theme.text }}>Connected Stores</div>
                <div style={{ fontSize:13, color: theme.muted, marginTop:4 }}>Manage tenants</div>
              </div>
              <div style={{ color: theme.accent, fontWeight:900, fontSize:16 }}>{tenants.length}</div>
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:12, flexDirection: isMobile ? 'column' : 'row' }}>
              <button onClick={()=>setShowAddModal(true)} style={{ ...sidebarActionBtn, width: isMobile ? '100%' : 'auto' }}>Add Store</button>
              <button onClick={fetchTenants} style={{ ...simpleBtn, width: isMobile ? '100%' : 'auto' }}>Refresh</button>
            </div>

            <div style={{ marginTop:12, maxHeight: isMobile ? 380 : 520, overflowY:'auto' }}>
              {/* grid layout so items fit nicely */}
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:12, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                {tenants.length === 0 && <div style={{ color: theme.muted, gridColumn: '1/-1' }}>No stores connected yet.</div>}
                {tenants.map(t => (
                  <li key={t.shop} style={{
                    display:'flex', flexDirection:'column', justifyContent:'space-between', padding:14, borderRadius:12,
                    background: t.shop===selectedShop ? 'linear-gradient(90deg,#082a3f,#063045)' : '#061426',
                    border: t.shop===selectedShop ? `1px solid ${theme.accent}` : '1px solid rgba(255,255,255,0.02)',
                    minWidth:0, // allow text truncation
                    wordBreak: 'break-word'
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:900, fontSize:14, color: theme.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.shop}</div>
                        <div style={{ fontSize:12, color: theme.muted, marginTop:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.installedAt ? new Date(t.installedAt).toLocaleString() : '—'}</div>
                      </div>
                    </div>

                    {/* Buttons: only Open and Remove, now plain normal buttons */}
                    <div style={tenantButtonContainerStyle}>
                      <div style={{ display: isMobile ? 'block' : 'flex', gap:8 }}>
                        <button
                          onClick={()=>{ setSelectedShop(t.shop); loadAllForShop(t.shop); }}
                          style={{
                            ...tenantOpenBtn,
                            minWidth: 0,
                            ...(isMobile ? { width: '100%' } : { width: 'auto' })
                          }}
                        >
                          Open
                        </button>
                        <button
                          onClick={()=>removeTenant(t.shop)}
                          style={{
                            ...tenantRemoveBtn,
                            marginLeft: isMobile ? 0 : 6,
                            ...(isMobile ? { width: '100%', marginTop: 8 } : { width: 'auto' })
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ padding:18, borderRadius:14, background:theme.panel, boxShadow:theme.shadow, border:'1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontWeight:900, marginBottom:12, color: theme.text }}>Multi-store Revenue</div>
            <MultiStoreRevenueChart data={storesRevenue} />
          </div>
        </aside>

        {/* MAIN */}
        <section style={{ flex:1, minWidth: isMobile ? '100%' : 520 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18, gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', width: isMobile ? '100%' : 'auto' }}>
              <input value={selectedShop} onChange={e=>setSelectedShop(e.target.value)} placeholder="Select shop" style={{ padding:12, borderRadius:12, border:'1px solid rgba(255,255,255,0.04)', background:'#061426', color:theme.text, minWidth: isMobile ? '60%' : 220 }} />
              <button onClick={()=>selectedShop && loadAllForShop(selectedShop)} style={{ padding:'12px 14px', borderRadius:12, background:'#34d399', color:'#041025', fontWeight:900, cursor:'pointer' }}>Load</button>
              <div style={{ color:theme.muted, alignSelf:'center' }}>{syncing ? 'Syncing…' : ''}</div>
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <label style={{ color:theme.muted, fontSize:13 }}>From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.04)', background:'#061426', color:theme.text }} />
              <label style={{ color:theme.muted, fontSize:13 }}>To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.04)', background:'#061426', color:theme.text }} />
              <button onClick={handleApplyDates} style={{ padding:'10px 12px', borderRadius:10, background:'#061426', border:'1px solid rgba(255,255,255,0.04)', color: theme.muted }}>Apply</button>
            </div>
          </div>

          <div style={{ display:'flex', gap:18, marginBottom:22, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 220px', padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
              <div style={{ fontSize:13, color:theme.muted }}>Customers</div>
              <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>{summary ? summary.totalCustomers : '—'}</div>
            </div>
            <div style={{ flex:'1 1 220px', padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
              <div style={{ fontSize:13, color:theme.muted }}>Orders</div>
              <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>{summary ? summary.totalOrders : '—'}</div>
            </div>
            <div style={{ flex:'1 1 220px', padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
              <div style={{ fontSize:13, color:theme.muted }}>Revenue</div>
              <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>{summary ? fmtCurrency(summary.revenue) : '—'}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:20, marginBottom:22 }}>
            <div style={{ padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontWeight:900 }}>Orders & Revenue</div>
                <div style={{ color:theme.muted }}>{from} → {to}</div>
              </div>
              {ordersSeries && ordersSeries.length ? (
                <OrdersChartRecharts data={ordersSeries} />
              ) : <div style={{ color: theme.muted }}>No orders in range</div>}
            </div>

            <aside style={{ display:'grid', gap:14 }}>
              <div style={{ padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
                <div style={{ fontWeight:900 }}>Top customers</div>
                <div style={{ marginTop:12 }}>
                  {topCustomers && topCustomers.length ? (
                    <ol style={{ paddingLeft:18, margin:0, display:'grid', gap:12 }}>
                      {topCustomers.map(c => (
                        <li key={c.id} style={{ marginBottom:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ fontWeight:900 }}>{c.name || c.email || '(no name)'}</div>
                            <div style={{ fontSize:12, color:theme.muted, marginTop:6 }}>{c.email || ''}</div>
                          </div>
                          <div style={{ fontWeight:900 }}>{fmtCurrency(c.totalSpend)}</div>
                        </li>
                      ))}
                    </ol>
                  ) : <div style={{ color:theme.muted }}>No top customers</div>}
                </div>
              </div>
            </aside>
          </div>

          <div style={{ padding:18, borderRadius:14, background:theme.card, boxShadow:theme.shadow }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:18 }}>
              <div>
                <div style={{ color:theme.muted, fontWeight:900, marginBottom:10 }}>Average Order Value</div>
                <AovChart data={aovData} />
              </div>
              <div>
                <div style={{ color:theme.muted, fontWeight:900, marginBottom:10 }}>Orders by Hour</div>
                <OrdersByHourChart data={ordersByHour} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ADD STORE MODAL */}
      {showAddModal && (
        <div>
          {/* overlay with blur/backdrop */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(2,6,12,0.6)',
            backdropFilter: 'blur(6px) saturate(1.05)',
            WebkitBackdropFilter: 'blur(6px) saturate(1.05)'
          }} onClick={() => setShowAddModal(false)} />

          {/* centered modal */}
          <div style={{
            position:'fixed', left:0, right:0, top:0, bottom:0, zIndex:1300,
            display:'flex', alignItems:'center', justifyContent:'center', pointerEvents: 'none'
          }}>
            <div style={{
              pointerEvents: 'auto',
              width:'min(680px, 94%)',
              borderRadius:14,
              padding:20,
              background: 'linear-gradient(180deg,#07172b,#041426)',
              boxShadow: '0 28px 80px rgba(2,6,23,0.9)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'Center', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:900, color: theme.text }}>Add Store</div>
                  <div style={{ fontSize:13, color: theme.muted, marginTop:6 }}>Enter the store domain and Admin API token</div>
                </div>
                <button onClick={()=>setShowAddModal(false)} style={{ padding:'8px 10px', borderRadius:10, background:'#061426', border:'1px solid rgba(255,255,255,0.04)', color:theme.muted }}>Close</button>
              </div>

              <form onSubmit={addTenant} style={{ display:'grid', gap:12 }}>
                <input placeholder="your-store.myshopify.com" value={newShop} onChange={e=>setNewShop(e.target.value)}
                  style={{ padding:14, borderRadius:12, border:'1px solid rgba(255,255,255,0.04)', background:'#061426', color:theme.text, fontSize:14 }} />
                <input placeholder="Admin API token (shpat_...)" value={newToken} onChange={e=>setNewToken(e.target.value)}
                  style={{ padding:14, borderRadius:12, border:'1px solid rgba(255,255,255,0.04)', background:'#061426', color:theme.text, fontSize:14 }} />
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button type="button" onClick={()=>setShowAddModal(false)} style={{ padding:'10px 14px', borderRadius:12, background:'#061426', border:'1px solid rgba(255,255,255,0.04)', color:theme.muted, width: isMobile ? '100%' : 'auto' }}>Cancel</button>
                  <button type="submit" style={{ padding:'10px 14px', borderRadius:12, background:'linear-gradient(90deg,#ff7b7b,#ffb86b)', border:'none', color:'#041025', fontWeight:900, width: isMobile ? '100%' : 'auto' }}>Add store</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
