'use client';
export default function LegalPage() {
  const docs = [
    { title:'Terms & Conditions', desc:'User agreement, liability disclaimers, financial loss waiver, and dispute resolution', href:'/legal/terms', icon:'📋', badge:'Required' },
    { title:'Privacy Policy', desc:'How we collect, use, and protect your personal data under DPDP Act 2023', href:'/legal/privacy', icon:'🔒', badge:'Required' },
    { title:'Acceptable Use Policy', desc:'Prohibited content, activities, and consequences of violations', href:'/legal/acceptable-use', icon:'✅', badge:'Required' },
    { title:'Copyright Policy', desc:'Intellectual property rights, DMCA-equivalent claims, and user content licence', href:'/legal/copyright', icon:'©️', badge:'Required' },
    { title:'Cookie Policy', desc:'How we use cookies and local storage on the Platform', href:'/legal/cookie', icon:'🍪', badge:'Informational' },
  ];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontSize:48,marginBottom:16}}>⚖️</div>
          <h1 style={{fontSize:36,fontWeight:700,color:'#111827',margin:'0 0 12px'}}>Legal Documents</h1>
          <p style={{fontSize:18,color:'#6b7280',margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd.</p>
          <p style={{fontSize:14,color:'#9ca3af',marginTop:8}}>Delhi, India | legal@deemona.com</p>
        </div>
        <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:12,padding:20,marginBottom:32}}>
          <p style={{color:'#92400e',fontSize:15,margin:0,fontWeight:600,lineHeight:1.6}}>
            ⚠️ By creating an account on Deemona Teams, you agree to all Required documents listed below. 
            Please read them carefully — particularly the Terms & Conditions which contain important disclaimers 
            regarding financial liability and limitations on legal action against the platform owner.
          </p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {docs.map((doc, i) => (
            <a key={i} href={doc.href}
              style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,textDecoration:'none',display:'flex',alignItems:'center',gap:20,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',transition:'all .2s'}}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#248046'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(36,128,70,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.06)'; }}>
              <div style={{fontSize:32,flexShrink:0}}>{doc.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <span style={{fontSize:18,fontWeight:700,color:'#111827'}}>{doc.title}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background: doc.badge==='Required'?'#dcfce7':'#f3f4f6',color: doc.badge==='Required'?'#166534':'#6b7280'}}>{doc.badge}</span>
                </div>
                <p style={{fontSize:14,color:'#6b7280',margin:0}}>{doc.desc}</p>
              </div>
              <div style={{color:'#248046',fontSize:20,flexShrink:0}}>→</div>
            </a>
          ))}
        </div>
        <div style={{marginTop:40,textAlign:'center',padding:24,background:'#fff',borderRadius:12,border:'1px solid #e5e7eb'}}>
          <p style={{color:'#6b7280',fontSize:14,margin:'0 0 16px'}}>Ready to create your account?</p>
          <a href="/signup" style={{display:'inline-block',background:'#248046',color:'#fff',padding:'12px 32px',borderRadius:10,textDecoration:'none',fontSize:15,fontWeight:600}}>Create account →</a>
          <p style={{color:'#9ca3af',fontSize:12,marginTop:12}}>Already have an account? <a href="/login" style={{color:'#248046'}}>Sign in</a></p>
        </div>
        <p style={{textAlign:'center',color:'#9ca3af',fontSize:13,marginTop:24}}>
          Questions about our legal documents? Contact us at <a href="mailto:legal@deemona.com" style={{color:'#248046'}}>legal@deemona.com</a>
        </p>
      </div>
    </div>
  );
}
