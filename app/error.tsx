'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('App error:', error); }, [error]);
  return (
    <div style={{minHeight:'100vh',background:'#1a1d21',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:24,fontFamily:'-apple-system,sans-serif',color:'#f2f3f5',textAlign:'center',padding:40}}>
      <div style={{fontSize:80,lineHeight:1}}>500</div>
      <div style={{width:64,height:3,background:'#da373c',borderRadius:2}}/>
      <div>
        <h1 style={{fontSize:28,fontWeight:700,marginBottom:8}}>Something went wrong</h1>
        <p style={{fontSize:16,color:'#80848e',maxWidth:400}}>An unexpected error occurred. Our team has been notified.</p>
        {error?.message && <p style={{fontSize:12,color:'#4b5563',marginTop:8,fontFamily:'monospace',background:'rgba(255,255,255,0.04)',padding:'8px 16px',borderRadius:6}}>{error.message}</p>}
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={reset} style={{padding:'10px 24px',background:'#da373c',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600}}>Try again</button>
        <button onClick={() => window.location.href='/workspace'} style={{padding:'10px 24px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#f2f3f5',cursor:'pointer',fontSize:14}}>Go home</button>
      </div>
    </div>
  );
}
