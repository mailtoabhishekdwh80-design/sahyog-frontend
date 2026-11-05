'use client';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{minHeight:'100vh',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:24,fontFamily:'-apple-system,sans-serif',color:'#0F172A',textAlign:'center',padding:40}}>
      <div style={{fontSize:80,lineHeight:1}}>404</div>
      <div style={{width:64,height:3,background:'#248046',borderRadius:2}}/>
      <div>
        <h1 style={{fontSize:28,fontWeight:700,marginBottom:8}}>Page not found</h1>
        <p style={{fontSize:16,color:'#64748B',maxWidth:400}}>The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
        <button onClick={() => router.back()} style={{padding:'10px 24px',background:'rgba(15,23,42,0.06)',border:'1px solid rgba(15,23,42,0.08)',borderRadius:8,color:'#0F172A',cursor:'pointer',fontSize:14}}>Go back</button>
        <button onClick={() => router.push('/workspace')} style={{padding:'10px 24px',background:'#248046',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600}}>Go to Deemona Teams</button>
      </div>
    </div>
  );
}
