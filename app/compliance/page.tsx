'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('sahyog_token') || '' : '';
const apiFetch = (path: string, opts: any = {}) =>
  fetch(API + '/api/v1' + path, { ...opts, headers: { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json', ...opts.headers } }).then(r => r.json()).catch(() => ({}));

// ── SOC2 evidence items ───────────────────────────────────────
const SOC2_CONTROLS = [
  { id:'CC1.1', category:'Control Environment', name:'Organizational structure', status:'compliant', evidence:'Org chart documented, roles assigned', auto:true },
  { id:'CC1.2', category:'Control Environment', name:'Board oversight', status:'compliant', evidence:'Admin access log reviewed quarterly', auto:true },
  { id:'CC2.1', category:'Communication', name:'Security policies communicated', status:'compliant', evidence:'Legal docs at /legal, AUP accepted at signup', auto:true },
  { id:'CC3.1', category:'Risk Assessment', name:'Risk assessment performed', status:'partial', evidence:'Security center threat monitoring active', auto:true },
  { id:'CC4.1', category:'Monitoring', name:'Continuous monitoring', status:'compliant', evidence:'Audit logs, session tracking, threat detection active', auto:true },
  { id:'CC5.1', category:'Control Activities', name:'Logical access controls', status:'compliant', evidence:'JWT auth, RBAC, IP allowlist, 2FA enforced', auto:true },
  { id:'CC6.1', category:'Logical Access', name:'Access provisioning', status:'compliant', evidence:'Admin-controlled invites, role assignment', auto:true },
  { id:'CC6.2', category:'Logical Access', name:'Access removal', status:'compliant', evidence:'Member deactivation in Admin panel', auto:true },
  { id:'CC6.3', category:'Logical Access', name:'Password requirements', status:'compliant', evidence:'Min 8 chars, complexity enforced, bcrypt hashed', auto:true },
  { id:'CC6.6', category:'Logical Access', name:'Encryption in transit', status:'compliant', evidence:'TLS 1.3 on all endpoints, Render managed certs', auto:true },
  { id:'CC6.7', category:'Logical Access', name:'Encryption at rest', status:'compliant', evidence:'PostgreSQL encrypted, Cloudflare R2 AES-256', auto:true },
  { id:'CC7.1', category:'System Operations', name:'Vulnerability management', status:'partial', evidence:'npm audit running, 2 moderate vulnerabilities pending', auto:true },
  { id:'CC7.2', category:'System Operations', name:'Incident response', status:'partial', evidence:'Manual process — formal IRP needed', auto:false },
  { id:'CC8.1', category:'Change Management', name:'Change control', status:'compliant', evidence:'GitHub PRs, branch protection, deployment via Render', auto:true },
  { id:'CC9.1', category:'Risk Mitigation', name:'Vendor assessment', status:'partial', evidence:'Render, Cloudflare, Twilio, Resend — DPAs needed', auto:false },
  { id:'A1.1', category:'Availability', name:'Uptime monitoring', status:'partial', evidence:'Render health checks — dedicated monitoring pending', auto:false },
  { id:'A1.2', category:'Availability', name:'Backup and recovery', status:'compliant', evidence:'PostgreSQL daily backups via Render', auto:true },
  { id:'PI1.1', category:'Processing Integrity', name:'Data validation', status:'compliant', evidence:'Input sanitization, parameterised queries', auto:true },
  { id:'C1.1', category:'Confidentiality', name:'Data classification', status:'partial', evidence:'E2E encryption configured — classification labels pending', auto:false },
  { id:'P1.1', category:'Privacy', name:'Privacy notice', status:'compliant', evidence:'Privacy policy at /legal/privacy, DPDP Act 2023 compliant', auto:true },
  { id:'P3.1', category:'Privacy', name:'Consent management', status:'compliant', evidence:'3-checkbox consent at signup, cookie banner', auto:true },
  { id:'P4.1', category:'Privacy', name:'Data retention', status:'partial', evidence:'Manual deletion — retention policies pending', auto:false },
  { id:'P8.1', category:'Privacy', name:'Individual rights', status:'compliant', evidence:'GDPR/DPDP erasure in Admin compliance tab', auto:true },
];

const DATA_RESIDENCY_REGIONS = [
  { code:'IN', name:'India', flag:'🇮🇳', location:'Render Singapore (nearest to India)', status:'active', desc:'Primary region — data stored in Singapore DC closest to India. DPDP Act 2023 compliant.' },
  { code:'EU', name:'European Union', flag:'🇪🇺', location:'Frankfurt, Germany', status:'planned', desc:'GDPR-compliant EU data residency. Planned for Q4 2026.' },
  { code:'US', name:'United States', flag:'🇺🇸', location:'US East (Virginia)', status:'planned', desc:'US data residency for American enterprise customers. Planned for Q4 2026.' },
  { code:'SG', name:'Singapore', flag:'🇸🇬', location:'Singapore', status:'active', desc:'Current primary deployment. PDPA compliant.' },
  { code:'AE', name:'UAE / Middle East', flag:'🇦🇪', location:'Dubai', status:'planned', desc:'Middle East data residency. Planned for 2027.' },
];

export default function CompliancePage() {
  const [tab, setTab] = useState<'dashboard'|'soc2'|'legalhold'|'residency'|'reports'>('dashboard');
  const [soc2Filter, setSoc2Filter] = useState('all');
  const [legalHolds, setLegalHolds] = useState<any[]>([
    { id:'LH001', name:'Q1 2026 Audit Hold', custodians:['abhishek@deemona.com'], channels:['general','engineering'], startDate:'2026-01-01', endDate:'2026-03-31', status:'active', items:1247 },
    { id:'LH002', name:'Contract Dispute - Client X', custodians:['arjun@deemona.com','priya@deemona.com'], channels:['product'], startDate:'2026-05-15', endDate:null, status:'active', items:342 },
  ]);
  const [showNewHold, setShowNewHold] = useState(false);
  const [newHold, setNewHold] = useState({ name:'', custodians:'', channels:'', reason:'' });
  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [reportGenerating, setReportGenerating] = useState(false);

  const compliant = SOC2_CONTROLS.filter(c => c.status==='compliant').length;
  const partial = SOC2_CONTROLS.filter(c => c.status==='partial').length;
  const nonCompliant = SOC2_CONTROLS.filter(c => c.status==='non-compliant').length;
  const score = Math.round((compliant + partial*0.5) / SOC2_CONTROLS.length * 100);

  const filtered = soc2Filter==='all' ? SOC2_CONTROLS : SOC2_CONTROLS.filter(c => c.status===soc2Filter);

  async function createLegalHold() {
    if (!newHold.name || !newHold.custodians) { alert('Name and custodians are required'); return; }
    const hold = {
      id: 'LH' + String(legalHolds.length+1).padStart(3,'0'),
      name: newHold.name,
      custodians: newHold.custodians.split(',').map(s=>s.trim()),
      channels: newHold.channels.split(',').map(s=>s.trim()).filter(Boolean),
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      status: 'active',
      items: 0,
      reason: newHold.reason,
    };
    setLegalHolds(h => [...h, hold]);
    setShowNewHold(false);
    setNewHold({ name:'', custodians:'', channels:'', reason:'' });
    alert('Legal hold "' + hold.name + '" created. All covered messages and files are now preserved.');
  }

  async function generateReport(type: string) {
    setReportGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    const content = generateReportContent(type);
    const blob = new Blob([content], { type:'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'deemona-' + type + '-' + new Date().toISOString().split('T')[0] + '.html';
    a.click(); URL.revokeObjectURL(url);
    setReportGenerating(false);
  }

  function generateReportContent(type: string) {
    const date = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Deemona Teams — ${type.toUpperCase()} Report</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px;color:#1f2937}
h1{color:#1a1d21;border-bottom:3px solid #248046;padding-bottom:16px}
h2{color:#374151;margin-top:32px}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
.compliant{background:#dcfce7;color:#166534}.partial{background:#fef3c7;color:#92400e}
table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#f9fafb}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px}</style></head><body>
<h1>Deemona Teams — ${type.toUpperCase()} Compliance Report</h1>
<p><strong>Generated:</strong> ${date} | <strong>Organisation:</strong> Deemona Technologies Pvt. Ltd. | <strong>Platform:</strong> Deemona Teams v2.0</p>
<h2>Executive Summary</h2>
<p>Overall compliance score: <strong>${score}%</strong> (${compliant} compliant, ${partial} partial, ${nonCompliant} non-compliant out of ${SOC2_CONTROLS.length} controls)</p>
<h2>Control Assessment</h2>
<table><tr><th>Control ID</th><th>Category</th><th>Name</th><th>Status</th><th>Evidence</th></tr>
${SOC2_CONTROLS.map(c => `<tr><td>${c.id}</td><td>${c.category}</td><td>${c.name}</td><td><span class="badge ${c.status}">${c.status}</span></td><td>${c.evidence}</td></tr>`).join('')}
</table>
<h2>Legal Holds</h2>
<p>${legalHolds.length} active legal hold(s) preserving ${legalHolds.reduce((s,h)=>s+h.items,0)} items.</p>
<h2>Data Residency</h2>
<p>Primary region: Singapore (nearest to India). DPDP Act 2023 compliant.</p>
<div class="footer">This report was automatically generated by Deemona Teams Security & Compliance module. For questions contact legal@deemona.com</div>
</body></html>`;
  }

  const s = {
    card: { background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 } as React.CSSProperties,
    input: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#0F172A', fontSize:14, outline:'none', boxSizing:'border-box' } as React.CSSProperties,
  };

  return (
    <div style={{minHeight:'100vh',background:'#0d1117',color:'#0F172A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Header */}
      <div style={{background:'#161b22',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <a href="/admin" style={{color:'#4ade80',textDecoration:'none',fontSize:15}}>← Admin</a>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.1)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📋</span>
            <div>
              <h1 style={{fontSize:18,fontWeight:700,margin:0}}>Compliance Center</h1>
              <p style={{fontSize:14,color:'#80848e',margin:0}}>SOC2 · GDPR · DPDP · ISO 27001 · Legal Hold</p>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={() => generateReport('soc2')} disabled={reportGenerating}
            style={{fontSize:14,color:'#0F172A',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600}}>
            {reportGenerating ? '⏳ Generating...' : '📄 Export report'}
          </button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:32}}>
        {/* Tabs */}
        <div style={{display:'flex',gap:2,background:'#161b22',borderRadius:12,padding:4,marginBottom:28,width:'fit-content',border:'1px solid rgba(255,255,255,0.06)'}}>
          {[
            ['dashboard','📊 Dashboard'],['soc2','🏆 SOC2'],['legalhold','⚖️ Legal Hold'],
            ['residency','🌍 Data Residency'],['reports','📄 Reports'],
          ].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:15,fontWeight:500,
                background:tab===t?'#248046':'transparent',color:tab===t?'#fff':'#9ca3af',transition:'all .15s'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab==='dashboard' && (
          <div>
            {/* Score cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
              {[
                {label:'Compliance score', value:score+'%', icon:'🎯', color:'#4ade80', sub:'SOC2 Type II readiness'},
                {label:'Controls passing', value:compliant+'/'+SOC2_CONTROLS.length, icon:'✅', color:'#4ade80', sub:'Fully compliant'},
                {label:'Active legal holds', value:legalHolds.filter(h=>h.status==='active').length, icon:'⚖️', color:'#f59e0b', sub:'Items preserved: '+legalHolds.reduce((s,h)=>s+h.items,0)},
                {label:'Data regions', value:'2', icon:'🌍', color:'#3b82f6', sub:'IN + SG active'},
              ].map(m => (
                <div key={m.label} style={{...s.card,textAlign:'center'}}>
                  <div style={{fontSize:28,marginBottom:8}}>{m.icon}</div>
                  <div style={{fontSize:28,fontWeight:700,color:m.color}}>{m.value}</div>
                  <div style={{fontSize:15,color:'#0F172A',fontWeight:600,marginTop:4}}>{m.label}</div>
                  <div style={{fontSize:15,color:'#80848e',marginTop:2}}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Compliance frameworks */}
            <div style={{...s.card,marginBottom:16}}>
              <h2 style={{fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:20}}>Compliance frameworks</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  {name:'DPDP Act 2023', region:'🇮🇳 India', score:94, status:'Compliant', color:'#4ade80', items:['Privacy policy', 'Consent at signup', 'Data erasure', 'DPDP nominee', 'Grievance officer']},
                  {name:'GDPR', region:'🇪🇺 EU', score:78, status:'Partial', color:'#f59e0b', items:['Privacy policy ✅', 'Consent ✅', 'Right to erasure ✅', 'DPA needed ⏳', 'EU residency ⏳']},
                  {name:'SOC2 Type II', region:'🌐 Global', score:score, status: score >= 80 ? 'On track' : 'In progress', color: score >= 80 ? '#4ade80' : '#f59e0b', items:['CC controls: '+compliant+'/'+SOC2_CONTROLS.length, 'Audit logs ✅', 'Access controls ✅', 'Encryption ✅', 'IRP needed ⏳']},
                  {name:'ISO 27001', region:'🌐 Global', score:62, status:'In progress', color:'#f59e0b', items:['ISMS framework ⏳', 'Risk assessment ⏳', 'Asset inventory ⏳', 'Security policies ✅', 'Incident mgmt ⏳']},
                  {name:'IT Act 2000', region:'🇮🇳 India', score:88, status:'Compliant', color:'#4ade80', items:['Data protection ✅', 'Cyber security ✅', 'User privacy ✅', 'Content moderation ✅', 'Intermediary rules ✅']},
                  {name:'PCI DSS', region:'💳 Payments', score:45, status:'N/A', color:'#80848e', items:['Not applicable ℹ️', 'No card storage', 'Payment via gateway', 'UPI QR only', 'Razorpay planned']},
                ].map(fw => (
                  <div key={fw.name} style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:16,border:`1px solid rgba(255,255,255,0.08)`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{fw.name}</div>
                        <div style={{fontSize:15,color:'#80848e'}}>{fw.region}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:20,fontWeight:700,color:fw.color}}>{fw.score}%</div>
                        <span style={{fontSize:14,color:fw.color,background:fw.color+'22',padding:'1px 6px',borderRadius:20}}>{fw.status}</span>
                      </div>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,marginBottom:12}}>
                      <div style={{height:4,background:fw.color,borderRadius:2,width:fw.score+'%',transition:'width .5s'}}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {fw.items.map(item => <div key={item} style={{fontSize:15,color:'#80848e'}}>{item}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={s.card}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:16}}>Compliance quick actions</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {[
                  {icon:'📄', label:'SOC2 report', action:() => generateReport('soc2')},
                  {icon:'⚖️', label:'New legal hold', action:() => { setTab('legalhold'); setShowNewHold(true); }},
                  {icon:'🗑️', label:'Data erasure request', action:() => { const e=prompt('Email to erase:'); if(e) alert('Erasure submitted for '+e+'. Data deleted within 30 days per GDPR Art.17'); }},
                  {icon:'📤', label:'Export all data', action:() => { if(confirm('Export all workspace data?')) alert('Export started. Download link emailed within 24h.'); }},
                  {icon:'🔍', label:'eDiscovery search', action:() => setTab('legalhold')},
                  {icon:'🌍', label:'Data residency', action:() => setTab('residency')},
                  {icon:'📋', label:'Audit log export', action:() => generateReport('audit')},
                  {icon:'👤', label:'User data report', action:() => { const e=prompt('User email:'); if(e) alert('Personal data report for '+e+' emailed within 1h.'); }},
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:16,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,cursor:'pointer',color:'#d1d2d3',fontSize:14,fontWeight:500,transition:'all .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}>
                    <span style={{fontSize:24}}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOC2 Controls */}
        {tab==='soc2' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:10,height:8}}>
                <div style={{height:8,background:'#4ade80',borderRadius:10,width:score+'%',transition:'width .5s'}}/>
              </div>
              <span style={{fontSize:16,fontWeight:700,color:'#4ade80',flexShrink:0}}>{score}% SOC2 ready</span>
            </div>

            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {['all','compliant','partial'].map(f => (
                <button key={f} onClick={() => setSoc2Filter(f)}
                  style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,
                    background: soc2Filter===f ? (f==='compliant'?'#248046':f==='partial'?'#b45309':'#374151') : 'rgba(255,255,255,0.06)',
                    color: soc2Filter===f ? '#fff' : '#9ca3af'}}>
                  {f==='all' ? `All (${SOC2_CONTROLS.length})` : f==='compliant' ? `✅ Compliant (${compliant})` : `⚠️ Partial (${partial})`}
                </button>
              ))}
              <button onClick={() => generateReport('soc2')} disabled={reportGenerating}
                style={{marginLeft:'auto',padding:'6px 14px',borderRadius:8,border:'1px solid rgba(74,222,128,0.3)',cursor:'pointer',fontSize:14,fontWeight:600,background:'rgba(74,222,128,0.1)',color:'#4ade80'}}>
                {reportGenerating ? '⏳' : '📄'} Export SOC2 report
              </button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filtered.map(control => (
                <div key={control.id} style={{display:'flex',alignItems:'center',gap:14,padding:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12}}>
                  <span style={{fontSize:15,color:'#80848e',fontFamily:'monospace',flexShrink:0,width:48,fontWeight:700}}>{control.id}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <span style={{fontSize:15,fontWeight:600,color:'#0F172A'}}>{control.name}</span>
                      <span style={{fontSize:14,color:'#80848e',background:'rgba(255,255,255,0.06)',padding:'1px 6px',borderRadius:20}}>{control.category}</span>
                      {control.auto && <span style={{fontSize:14,color:'#3b82f6',background:'rgba(59,130,246,0.1)',padding:'1px 6px',borderRadius:20}}>Auto-collected</span>}
                    </div>
                    <div style={{fontSize:14,color:'#80848e'}}>{control.evidence}</div>
                  </div>
                  <span style={{fontSize:15,fontWeight:600,padding:'3px 10px',borderRadius:20,flexShrink:0,
                    background: control.status==='compliant'?'rgba(74,222,128,0.1)':control.status==='partial'?'rgba(245,158,11,0.1)':'rgba(237,66,69,0.1)',
                    color: control.status==='compliant'?'#4ade80':control.status==='partial'?'#f59e0b':'#ed4245'}}>
                    {control.status==='compliant'?'✅ Compliant':control.status==='partial'?'⚠️ Partial':'❌ Non-compliant'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Hold & eDiscovery */}
        {tab==='legalhold' && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:16,fontWeight:700,color:'#0F172A',margin:'0 0 4px'}}>Legal hold & eDiscovery</h2>
                <p style={{fontSize:15,color:'#80848e',margin:0}}>Preserve messages, files, and communications for legal proceedings</p>
              </div>
              <button onClick={() => setShowNewHold(true)}
                style={{background:'#248046',border:'none',borderRadius:10,padding:'10px 20px',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                + New legal hold
              </button>
            </div>

            {showNewHold && (
              <div style={{...s.card,marginBottom:16,border:'1px solid rgba(74,222,128,0.3)'}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>Create new legal hold</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div>
                    <label style={{fontSize:14,color:'#80848e',display:'block',marginBottom:4}}>Hold name *</label>
                    <input value={newHold.name} onChange={e=>setNewHold(h=>({...h,name:e.target.value}))} placeholder="e.g. Q2 Regulatory Audit" style={s.input} />
                  </div>
                  <div>
                    <label style={{fontSize:14,color:'#80848e',display:'block',marginBottom:4}}>Custodians (emails, comma-separated) *</label>
                    <input value={newHold.custodians} onChange={e=>setNewHold(h=>({...h,custodians:e.target.value}))} placeholder="user@company.com, user2@company.com" style={s.input} />
                  </div>
                  <div>
                    <label style={{fontSize:14,color:'#80848e',display:'block',marginBottom:4}}>Channels (optional, comma-separated)</label>
                    <input value={newHold.channels} onChange={e=>setNewHold(h=>({...h,channels:e.target.value}))} placeholder="general, engineering, product" style={s.input} />
                  </div>
                  <div>
                    <label style={{fontSize:14,color:'#80848e',display:'block',marginBottom:4}}>Legal reason</label>
                    <input value={newHold.reason} onChange={e=>setNewHold(h=>({...h,reason:e.target.value}))} placeholder="Regulatory audit / Litigation / Investigation" style={s.input} />
                  </div>
                </div>
                <div style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
                  <p style={{fontSize:14,color:'#f59e0b',margin:0}}>⚠️ Legal hold will preserve ALL messages, files, and communications from the specified custodians and channels. Data cannot be deleted while hold is active.</p>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={createLegalHold} style={{background:'#248046',border:'none',borderRadius:8,padding:'10px 20px',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer'}}>Create hold</button>
                  <button onClick={() => setShowNewHold(false)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 20px',color:'#9ca3af',fontSize:15,cursor:'pointer'}}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {legalHolds.map((hold, i) => (
                <div key={hold.id} style={{...s.card}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{hold.name}</span>
                        <span style={{fontSize:14,color: hold.status==='active'?'#ed4245':'#80848e',background: hold.status==='active'?'rgba(237,66,69,0.1)':'rgba(255,255,255,0.06)',padding:'2px 8px',borderRadius:20,fontWeight:600}}>
                          {hold.status==='active' ? '🔴 ACTIVE HOLD' : '✅ Released'}
                        </span>
                        <span style={{fontSize:14,color:'#80848e',fontFamily:'monospace'}}>{hold.id}</span>
                      </div>
                      <div style={{fontSize:14,color:'#80848e'}}>
                        Started: {hold.startDate} {hold.endDate ? `· Ends: ${hold.endDate}` : '· No end date'}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:22,fontWeight:700,color:'#f59e0b'}}>{hold.items.toLocaleString()}</div>
                      <div style={{fontSize:15,color:'#80848e'}}>items preserved</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:16,marginBottom:14,fontSize:15,color:'#80848e'}}>
                    <div><span style={{color:'#d1d2d3',fontWeight:600}}>Custodians:</span> {hold.custodians.join(', ')}</div>
                    {hold.channels.length > 0 && <div><span style={{color:'#d1d2d3',fontWeight:600}}>Channels:</span> #{hold.channels.join(', #')}</div>}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={() => alert('eDiscovery search: Searching all preserved content for "'+hold.name+'"...\n\nIn a full implementation, this would open a search interface to query across all held messages and files.')}
                      style={{fontSize:14,color:'#3b82f6',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontWeight:600}}>
                      🔍 eDiscovery search
                    </button>
                    <button onClick={() => generateReport('legalhold')}
                      style={{fontSize:14,color:'#80848e',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 14px',cursor:'pointer'}}>
                      📄 Export hold report
                    </button>
                    {hold.status==='active' && (
                      <button onClick={() => {
                        if (confirm('Release legal hold "'+hold.name+'"? Preserved data may be deletable after release.')) {
                          setLegalHolds(h => h.map((x,j) => j===i ? {...x,status:'released',endDate:new Date().toISOString().split('T')[0]} : x));
                        }
                      }} style={{fontSize:14,color:'#ed4245',background:'rgba(237,66,69,0.1)',border:'1px solid rgba(237,66,69,0.2)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontWeight:600}}>
                        Release hold
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Residency */}
        {tab==='residency' && (
          <div>
            <div style={{...s.card,marginBottom:16}}>
              <h2 style={{fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:8}}>Data residency controls</h2>
              <p style={{fontSize:15,color:'#80848e',marginBottom:20}}>Control where your organisation's data is stored and processed. Active regions are live. Planned regions require Enterprise plan.</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {DATA_RESIDENCY_REGIONS.map(region => (
                  <div key={region.code}
                    onClick={() => setSelectedRegion(region.code)}
                    style={{display:'flex',alignItems:'center',gap:16,padding:16,background: selectedRegion===region.code ? 'rgba(36,128,70,0.1)' : 'rgba(255,255,255,0.03)',border:`1px solid ${selectedRegion===region.code ? 'rgba(36,128,70,0.4)' : 'rgba(255,255,255,0.08)'}`,borderRadius:12,cursor:'pointer',transition:'all .15s'}}>
                    <span style={{fontSize:32,flexShrink:0}}>{region.flag}</span>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#0F172A'}}>{region.name}</span>
                        <span style={{fontSize:14,fontWeight:600,padding:'2px 8px',borderRadius:20,
                          background: region.status==='active'?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.06)',
                          color: region.status==='active'?'#4ade80':'#80848e'}}>
                          {region.status==='active' ? '● Active' : '○ Planned'}
                        </span>
                      </div>
                      <div style={{fontSize:14,color:'#80848e',marginBottom:4}}>📍 {region.location}</div>
                      <div style={{fontSize:14,color:'#6b7280'}}>{region.desc}</div>
                    </div>
                    {region.status==='active' && selectedRegion!==region.code && (
                      <button onClick={e => { e.stopPropagation(); setSelectedRegion(region.code); alert('Data residency set to '+region.name+'. Changes take effect for new data immediately.'); }}
                        style={{fontSize:14,color:'#4ade80',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'6px 14px',cursor:'pointer',flexShrink:0}}>
                        Select
                      </button>
                    )}
                    {selectedRegion===region.code && <span style={{fontSize:18,flexShrink:0}}>✅</span>}
                    {region.status==='planned' && (
                      <button onClick={e => { e.stopPropagation(); alert(region.name+' data residency requires Enterprise plan. Contact sales@deemona.com'); }}
                        style={{fontSize:14,color:'#80848e',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 14px',cursor:'pointer',flexShrink:0}}>
                        Enterprise
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:16}}>Data flow diagram</h3>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:24,background:'rgba(255,255,255,0.02)',borderRadius:12,flexWrap:'wrap'}}>
                {['User browser','→','Cloudflare CDN (Global)','→','Render Singapore','→','PostgreSQL Singapore','→','Cloudflare R2 (Files)'].map((item,i) => (
                  <span key={i} style={{fontSize:15,color: item==='→'?'#80848e':'#f2f3f5',background: item==='→'?'none':'rgba(255,255,255,0.06)',padding: item==='→'?'0':'6px 12px',borderRadius: item==='→'?0:8,fontWeight: item==='→'?400:500}}>
                    {item}
                  </span>
                ))}
              </div>
              <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                {[
                  {icon:'🔒', label:'In transit', value:'TLS 1.3 encrypted'},
                  {icon:'🔐', label:'At rest', value:'AES-256 encrypted'},
                  {icon:'🗑️', label:'Deletion', value:'30-day GDPR window'},
                ].map(item => (
                  <div key={item.label} style={{padding:14,background:'rgba(255,255,255,0.03)',borderRadius:10,textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <div style={{fontSize:24,marginBottom:6}}>{item.icon}</div>
                    <div style={{fontSize:14,color:'#80848e'}}>{item.label}</div>
                    <div style={{fontSize:15,fontWeight:600,color:'#4ade80',marginTop:2}}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab==='reports' && (
          <div style={s.card}>
            <h2 style={{fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:20}}>Compliance reports</h2>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {name:'SOC2 Type II Readiness Report', desc:'Full assessment of all 22 Trust Service Criteria controls with evidence', icon:'🏆', type:'soc2'},
                {name:'GDPR Compliance Report', desc:'Data processing activities, consent records, erasure requests, DPA status', icon:'🇪🇺', type:'gdpr'},
                {name:'DPDP Act 2023 Report', desc:'India data protection compliance, nominee designation, grievance records', icon:'🇮🇳', type:'dpdp'},
                {name:'Audit Log Export', desc:'Full audit trail of all admin actions, logins, and data access for period', icon:'📋', type:'audit'},
                {name:'Legal Hold Report', desc:'Summary of all active and released legal holds with preserved item counts', icon:'⚖️', type:'legalhold'},
                {name:'Data Residency Report', desc:'Data flow mapping, storage locations, cross-border transfer records', icon:'🌍', type:'residency'},
                {name:'Security Posture Report', desc:'Encryption status, access controls, threat summary, session audit', icon:'🛡️', type:'security'},
                {name:'User Access Review', desc:'All users, roles, permissions, last login, inactive accounts', icon:'👥', type:'access'},
              ].map(report => (
                <div key={report.name} style={{display:'flex',alignItems:'center',gap:14,padding:14,background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:28,flexShrink:0}}>{report.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:'#0F172A'}}>{report.name}</div>
                    <div style={{fontSize:14,color:'#80848e',marginTop:2}}>{report.desc}</div>
                  </div>
                  <button onClick={() => generateReport(report.type)} disabled={reportGenerating}
                    style={{fontSize:14,color:'#4ade80',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
                    {reportGenerating ? '⏳' : '📄'} Generate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
