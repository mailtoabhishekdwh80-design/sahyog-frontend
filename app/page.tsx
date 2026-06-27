'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../lib/api';
import LandingPage from '../components/LandingPage';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/workspace');
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#030712'}}>
      <div style={{width:40,height:40,border:'3px solid #059669',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return <LandingPage />;
}
