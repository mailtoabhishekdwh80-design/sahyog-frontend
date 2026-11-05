'use client';
import dynamic from 'next/dynamic';

const WorkspaceShell = dynamic(
  () => import('../../components/WorkspaceShell'),
  { ssr: false, loading: () => (
    <div style={{minHeight:'100vh',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:40,height:40,border:'3px solid rgba(79,110,247,0.3)',borderTop:'3px solid #4F6EF7',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'#475569',fontSize:14,fontFamily:'system-ui'}}>Loading workspace...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )}
);

export default function WorkspacePage() {
  return <WorkspaceShell />;
}
