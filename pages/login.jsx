import { useState } from 'react';
import Router from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || 'Error');
        return;
      }
      if (mode === 'login') {
        Router.push('/dashboard');
      } else {
        setMsg('Signup successful — please log in.');
        setMode('login');
      }
    } catch (err) {
      setMsg('Network error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center', background: 'linear-gradient(180deg,#02111b,#041226)', padding:28 }}>
      <div style={{ width:'100%', maxWidth:520, borderRadius:18, padding:28, background:'linear-gradient(180deg,#07172b,#041226)', boxShadow:'0 20px 60px rgba(2,6,23,0.8)', border:'1px solid rgba(255,255,255,0.04)' }}>
        <h2 style={{ marginBottom: 14, color:'#e6eefb' }}>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding:14, borderRadius:12, border: '1px solid rgba(255,255,255,0.06)', background:'#061426', color:'#e6eefb' }}
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            style={{ padding:14, borderRadius:12, border: '1px solid rgba(255,255,255,0.06)', background:'#061426', color:'#e6eefb' }}
          />
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button type="submit" style={{ padding: '12px 16px', borderRadius:12, background: 'linear-gradient(90deg,#ff6b6b,#f97316)', color: '#041025', border: 'none', fontWeight:900, flex:1 }}>
              {mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ padding: '12px 16px', borderRadius:12, background:'#07172b', border:'1px solid rgba(255,255,255,0.04)', color:'#bcd6ee' }}>
              {mode === 'login' ? 'Create account' : 'Have an account? Log in'}
            </button>
          </div>
        </form>
        <div style={{ marginTop: 14, color: '#ffb4b4' }}>{msg}</div>
      </div>
    </div>
  );
}
