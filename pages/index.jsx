// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui, Arial'
    }}>
      <div>
        <h2 style={{margin:0}}>Redirecting…</h2>
        <p style={{color:'#666'}}>If not redirected, <a href="/home">click here</a>.</p>
      </div>
    </div>
  );
}
