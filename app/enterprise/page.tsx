'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('sahyog_token') || '' : '';
const apiFetch = (path: string, opts: any = {}) =>
  fetch(API + '/api/v1' + path, { ...opts, headers: { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json', ...opts.headers } }).then(r => r.json()).catch(() => ({}));

// ── Message Retention ─────────────────────────────────────────
const DEFAULT_POLICIES = [
  { id:'p1', name:'General channels', scope:'channels', scopeValue:'general,announcements,random', retentionDays:365, action:'delete', enabled:true },
  { id:'p2', name:'Engineering (extended)', scope:'channels', scopeValue:'engineering,product,design', retentionDays:730, action:'archive', enabled:true },
  { id:'p3', name:'Direct messages', scope:'type', scopeValue:'direct', retentionDays:180, action:'delete', enabled:false },
  { id:'p4', name:'Legal hold override', scope:'workspace', scopeValue:'all', retentionDays:2555, action:'archive', enabled:false },
];

// ── Information barriers ──────────────────────────────────────
const DEFAULT_BARRIERS = [
  { id:'b1', name:'Finance ↔ Trading wall', groupA:'Finance', groupB:'Trading', blocked:['message','channel_join','dm'], enabled:true, reason:'Regulatory requirement — prevent insider trading' },
  { id:'b2', name:'HR ↔ Engineering', groupA:'HR', groupB:'Engineering', blocked:['dm'], enabled:false, reason:'Salary information confidentiality' },
  { id:'b3', name:'Legal ↔ Sales', groupA:'Legal', groupB:'Sales', blocked:['message'], enabled:false, reason:'Privilege protection' },
];

// ── SCIM providers ────────────────────────────────────────────
const SCIM_PROVIDERS = [
  { name:'Okta', icon:'🔵', desc:'Industry-standard identity provider with full SCIM 2.0', status:'popular' },
  { name:'Microsoft Azure AD', icon:'🪟', desc:'Microsoft enterprise identity and access management', status:'popular' },
  { name:'Google Workspace', icon:'🟢', desc:'Google enterprise directory and SSO', status:'popular' },
  { name:'OneLogin', icon:'🔴', desc:'Cloud-based identity management', status:'supported' },
  { name:'Ping Identity', icon:'🟣', desc:'Enterprise identity security platform', status:'supported' },
  { name:'BambooHR', icon:'🌿', desc:'HR system with employee lifecycle management', status:'supported' },
  { name:'Workday', icon:'🔷', desc:'Enterprise cloud applications for HR and finance', status:'enterprise' },
  { name:'SAP SuccessFactors', icon:'🔶', desc:'SAP human experience management suite', status:'enterprise' },
];

export default function EnterprisePage() {
  const [tab, setTab] = useState<'retention'|'barriers'|'scim'|'webinar'>('retention');

  // Retention state
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name:'', scope:'channels', scopeValue:'', retentionDays:365, action:'delete' });

  // Barriers state
  const [barriers, setBarriers] = useState(DEFAULT_BARRIERS);
  const [showNewBarrier, setShowNewBarrier] = useState(false);
  const [newBarrier, setNewBarrier] = useState({ name:'', groupA:'', groupB:'', reason:'', blocked: ['message','dm'] });

  // SCIM state
  const [scimEnabled, setScimEnabled] = useState(false);
  const [scimToken, setScimToken] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [scimEndpoint] = useState('https://sahyog-api-ajbr.onrender.com/api/v1/scim/v2');
  const [scimLogs] = useState([
    { time:'2026-06-28 09:15', action:'User provisioned', user:'neha.sharma@company.com', status:'success' },
    { time:'2026-06-28 09:14', action:'User deprovisioned', user:'raj.kumar@company.com', status:'success' },
    { time:'2026-06-27 18:30', action:'Group sync', user:'Engineering group (12 members)', status:'success' },
    { time:'2026-06-27 08:00', action:'User update', user:'priya.mehta@company.com', status:'success' },
  ]);

  // Webinar state
  const [webinar, setWebinar] = useState({ title:'', date:'', time:'', capacity:1000, panelists:'', description:'', recording:true, qa:true, polls:true, chat:'moderated' });
  const [activeWebinar, setActiveWebinar] = useState<any>(null);
  const [webinarChat, setWebinarChat] = useState<any[]>([]);
  const [webinarMsg, setWebinarMsg] = useState('');
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [handRaises, setHandRaises] = useState<string[]>([]);

  function generateScimToken() {
    const t = 'sct_' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,'0')).join('');
    setScimToken(t);
    setScimEnabled(true);
  }

  async function saveRetentionPolicy() {
    if (!newPolicy.name || !newPolicy.scopeValue) { alert('Name and scope value are required'); return; }
    const policy = { ...newPolicy, id:'p'+Date.now(), enabled:true };
    setPolicies(p => [...p, policy]);
    setShowNewPolicy(false);
    setNewPolicy({ name:'', scope:'channels', scopeValue:'', retentionDays:365, action:'delete' });
    alert('Retention policy "'+policy.name+'" created. Messages older than '+policy.retentionDays+' days will be '+policy.action+'d automatically.');
  }

  function startWebinar() {
    if (!webinar.title) { alert('Please enter a webinar title'); return; }
    setActiveWebinar({ ...webinar, startedAt: new Date(), id: 'WBN' + Date.now() });
    setAttendeeCount(Math.floor(Math.random() * 200 + 50));
    setWebinarChat([{ sender:'System', text:'Webinar "'+webinar.title+'" has started. Welcome attendees!', time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), type:'system' }]);
    // Simulate attendees joining
    setTimeout(() => setAttendeeCount(c => c + Math.floor(Math.random()*50)), 3000);
    setTimeout(() => setAttendeeCount(c => c + Math.floor(Math.random()*100)), 8000);
  }

  const s = {
    card: { background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 } as React.CSSProperties,
    input: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'#f2f3f5', fontSize:14, outline:'none', boxSizing:'border-box' } as React.CSSProperties,
    label: { fontSize:12, color:'#80848e', display:'block', marginBottom:4 } as React.CSSProperties,
  };

  return (
    <div style={{minHeight:'100vh',background:'#0d1117',color:'#f2f3f5',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Header */}
      <div style={{background:'#161b22',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'16px 32px',display:'flex',alignItems:'center',gap:16}}>
        <a href="/workspace" style={{color:'#4ade80',textDecoration:'none',fontSize:13}}>← Workspace</a>
        <div style={{width:1,height:20,background:'rgba(255,255,255,0.1)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>🏢</span>
          <div>
            <h1 style={{fontSize:18,fontWeight:700,margin:0}}>Enterprise Features</h1>
            <p style={{fontSize:12,color:'#80848e',margin:0}}>Retention · Information barriers · SCIM provisioning · Webinars</p>
          </div>
        </div>
        <div style={{marginLeft:'auto',background:'linear-gradient(135deg,#248046,#1a5c33)',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,color:'#fff'}}>
          ENTERPRISE
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:32}}>
        {/* Tabs */}
        <div style={{display:'flex',gap:2,background:'#161b22',borderRadius:12,padding:4,marginBottom:28,width:'fit-content',border:'1px solid rgba(255,255,255,0.06)'}}>
          {[
            ['retention','🗂️ Message Retention'],['barriers','🚧 Information Barriers'],
            ['scim','👥 SCIM Provisioning'],['webinar','🎙️ Webinar Mode'],
          ].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:500,
                background:tab===t?'#248046':'transparent',color:tab===t?'#fff':'#9ca3af',transition:'all .15s'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── MESSAGE RETENTION ── */}
        {tab==='retention' && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:16,fontWeight:700,color:'#f2f3f5',margin:'0 0 4px'}}>Message retention policies</h2>
                <p style={{fontSize:13,color:'#80848e',margin:0}}>Automatically archive or delete messages after a defined period. Legal holds override retention policies.</p>
              </div>
              <button onClick={() => setShowNewPolicy(true)}
                style={{background:'#248046',border:'none',borderRadius:10,padding:'10px 20px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                + New policy
              </button>
            </div>

            {showNewPolicy && (
              <div style={{...s.card,marginBottom:16,border:'1px solid rgba(36,128,70,0.3)'}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:16}}>New retention policy</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div><label style={s.label}>Policy name *</label><input value={newPolicy.name} onChange={e=>setNewPolicy(p=>({...p,name:e.target.value}))} placeholder="e.g. Finance messages" style={s.input} /></div>
                  <div>
                    <label style={s.label}>Scope</label>
                    <select value={newPolicy.scope} onChange={e=>setNewPolicy(p=>({...p,scope:e.target.value}))} style={{...s.input}}>
                      <option value="channels">Specific channels</option>
                      <option value="type">Message type (DM/Channel)</option>
                      <option value="department">Department</option>
                      <option value="workspace">Entire workspace</option>
                    </select>
                  </div>
                  <div><label style={s.label}>{newPolicy.scope==='channels'?'Channel names (comma-separated)':newPolicy.scope==='type'?'Type (direct/channel)':'Scope value'}</label><input value={newPolicy.scopeValue} onChange={e=>setNewPolicy(p=>({...p,scopeValue:e.target.value}))} placeholder={newPolicy.scope==='channels'?'general, engineering, product':'direct'} style={s.input} /></div>
                  <div>
                    <label style={s.label}>Retention period</label>
                    <select value={newPolicy.retentionDays} onChange={e=>setNewPolicy(p=>({...p,retentionDays:parseInt(e.target.value)}))} style={{...s.input}}>
                      {[[30,'30 days'],[60,'60 days'],[90,'90 days'],[180,'6 months'],[365,'1 year'],[730,'2 years'],[1825,'5 years'],[2555,'7 years (legal minimum)']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Action after retention period</label>
                    <select value={newPolicy.action} onChange={e=>setNewPolicy(p=>({...p,action:e.target.value}))} style={{...s.input}}>
                      <option value="delete">Permanently delete</option>
                      <option value="archive">Archive (hidden but retrievable)</option>
                      <option value="export">Export to cold storage</option>
                    </select>
                  </div>
                </div>
                <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
                  <p style={{fontSize:12,color:'#93c5fd',margin:0}}>ℹ️ Legal holds always override retention policies. Messages under active holds are never deleted.</p>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={saveRetentionPolicy} style={{background:'#248046',border:'none',borderRadius:8,padding:'10px 20px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Save policy</button>
                  <button onClick={() => setShowNewPolicy(false)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 20px',color:'#9ca3af',fontSize:13,cursor:'pointer'}}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {policies.map((policy,i) => (
                <div key={policy.id} style={{display:'flex',alignItems:'center',gap:14,padding:16,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:600,color:'#f2f3f5'}}>{policy.name}</span>
                      <span style={{fontSize:10,color:'#80848e',background:'rgba(255,255,255,0.06)',padding:'1px 6px',borderRadius:20}}>{policy.scope}</span>
                    </div>
                    <div style={{fontSize:12,color:'#80848e'}}>
                      Scope: <span style={{color:'#d1d2d3'}}>{policy.scopeValue}</span> ·
                      Keep for: <span style={{color:'#d1d2d3'}}>{policy.retentionDays} days</span> ·
                      Then: <span style={{color: policy.action==='delete'?'#ed4245':'#f59e0b'}}>{policy.action}</span>
                    </div>
                  </div>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <div onClick={() => setPolicies(p => p.map((x,j) => j===i ? {...x,enabled:!x.enabled} : x))}
                      style={{width:40,height:22,borderRadius:11,background:policy.enabled?'#248046':'#374151',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:policy.enabled?21:3,transition:'left .2s'}}/>
                    </div>
                    <span style={{fontSize:12,color: policy.enabled?'#4ade80':'#80848e'}}>{policy.enabled?'Active':'Disabled'}</span>
                  </label>
                  <button onClick={() => { if(confirm('Delete policy "'+policy.name+'"?')) setPolicies(p=>p.filter((_,j)=>j!==i)); }}
                    style={{fontSize:11,color:'#ed4245',background:'rgba(237,66,69,0.1)',border:'1px solid rgba(237,66,69,0.2)',borderRadius:8,padding:'5px 12px',cursor:'pointer'}}>Delete</button>
                </div>
              ))}
            </div>

            <div style={{...s.card,marginTop:16}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:12}}>Retention schedule</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[
                  {label:'Daily scan', time:'2:00 AM IST', next:'Tonight'},
                  {label:'Messages evaluated', value:'All active policies'},
                  {label:'Legal hold check', value:'Before every deletion'},
                ].map(item => (
                  <div key={item.label} style={{padding:12,background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
                    <div style={{fontSize:12,color:'#80848e'}}>{item.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#f2f3f5',marginTop:4}}>{item.time||item.value||item.next}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INFORMATION BARRIERS ── */}
        {tab==='barriers' && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:16,fontWeight:700,color:'#f2f3f5',margin:'0 0 4px'}}>Information barriers</h2>
                <p style={{fontSize:13,color:'#80848e',margin:0}}>Prevent specific groups from communicating — essential for regulated industries, Chinese walls, and confidentiality.</p>
              </div>
              <button onClick={() => setShowNewBarrier(true)}
                style={{background:'#248046',border:'none',borderRadius:10,padding:'10px 20px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                + New barrier
              </button>
            </div>

            {showNewBarrier && (
              <div style={{...s.card,marginBottom:16,border:'1px solid rgba(237,66,69,0.3)'}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:16}}>New information barrier</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div><label style={s.label}>Barrier name *</label><input value={newBarrier.name} onChange={e=>setNewBarrier(b=>({...b,name:e.target.value}))} placeholder="e.g. Finance Chinese Wall" style={s.input} /></div>
                  <div><label style={s.label}>Legal reason</label><input value={newBarrier.reason} onChange={e=>setNewBarrier(b=>({...b,reason:e.target.value}))} placeholder="e.g. Regulatory / Confidentiality" style={s.input} /></div>
                  <div><label style={s.label}>Group A (department/role)</label><input value={newBarrier.groupA} onChange={e=>setNewBarrier(b=>({...b,groupA:e.target.value}))} placeholder="e.g. Finance" style={s.input} /></div>
                  <div><label style={s.label}>Group B (department/role)</label><input value={newBarrier.groupB} onChange={e=>setNewBarrier(b=>({...b,groupB:e.target.value}))} placeholder="e.g. Trading" style={s.input} /></div>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={s.label}>Block these interactions</label>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {['message','dm','channel_join','file_share','meeting_invite'].map(action => (
                      <label key={action} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 12px'}}>
                        <input type="checkbox" checked={newBarrier.blocked.includes(action)}
                          onChange={e => setNewBarrier(b => ({...b, blocked: e.target.checked ? [...b.blocked, action] : b.blocked.filter(x=>x!==action)}))} className="accent-emerald-500" />
                        <span style={{fontSize:12,color:'#d1d2d3'}}>{action.replace('_',' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={() => {
                    if (!newBarrier.name || !newBarrier.groupA || !newBarrier.groupB) { alert('Name and both groups required'); return; }
                    setBarriers(b => [...b, {...newBarrier, id:'b'+Date.now(), enabled:true}]);
                    setShowNewBarrier(false);
                    setNewBarrier({ name:'', groupA:'', groupB:'', reason:'', blocked:['message','dm'] });
                    alert('Information barrier created. '+newBarrier.groupA+' and '+newBarrier.groupB+' can no longer '+newBarrier.blocked.join(', ')+'.');
                  }} style={{background:'#248046',border:'none',borderRadius:8,padding:'10px 20px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Create barrier</button>
                  <button onClick={() => setShowNewBarrier(false)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 20px',color:'#9ca3af',fontSize:13,cursor:'pointer'}}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {barriers.map((barrier,i) => (
                <div key={barrier.id} style={{...s.card}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{barrier.name}</span>
                        <span style={{fontSize:10,color: barrier.enabled?'#ed4245':'#80848e',background: barrier.enabled?'rgba(237,66,69,0.1)':'rgba(255,255,255,0.06)',padding:'2px 8px',borderRadius:20,fontWeight:600}}>
                          {barrier.enabled ? '🚧 ACTIVE' : '○ Disabled'}
                        </span>
                      </div>
                      {barrier.reason && <div style={{fontSize:12,color:'#80848e',marginBottom:8}}>{barrier.reason}</div>}
                      <div style={{display:'flex',alignItems:'center',gap:12,fontSize:13}}>
                        <span style={{color:'#f59e0b',fontWeight:700,background:'rgba(245,158,11,0.1)',padding:'4px 12px',borderRadius:8}}>{barrier.groupA}</span>
                        <span style={{color:'#ed4245',fontSize:18}}>⟺</span>
                        <span style={{color:'#f59e0b',fontWeight:700,background:'rgba(245,158,11,0.1)',padding:'4px 12px',borderRadius:8}}>{barrier.groupB}</span>
                      </div>
                    </div>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0}}>
                      <div onClick={() => setBarriers(b => b.map((x,j) => j===i ? {...x,enabled:!x.enabled} : x))}
                        style={{width:40,height:22,borderRadius:11,background:barrier.enabled?'#ed4245':'#374151',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                        <div style={{width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:barrier.enabled?21:3,transition:'left .2s'}}/>
                      </div>
                    </label>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {barrier.blocked.map(action => (
                      <span key={action} style={{fontSize:11,color:'#ed4245',background:'rgba(237,66,69,0.1)',border:'1px solid rgba(237,66,69,0.2)',padding:'2px 8px',borderRadius:20}}>
                        🚫 {action.replace('_',' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCIM PROVISIONING ── */}
        {tab==='scim' && (
          <div>
            <div style={{...s.card,marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:16,fontWeight:700,color:'#f2f3f5',margin:'0 0 4px'}}>SCIM 2.0 provisioning</h2>
                  <p style={{fontSize:13,color:'#80848e',margin:0}}>Automatically sync users from your HR system or identity provider</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color: scimEnabled?'#4ade80':'#80848e'}}>{scimEnabled ? '● SCIM Active' : '○ SCIM Disabled'}</span>
                  {!scimEnabled && (
                    <button onClick={generateScimToken}
                      style={{background:'#248046',border:'none',borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Enable SCIM
                    </button>
                  )}
                </div>
              </div>

              {scimEnabled && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:10,padding:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#4ade80',marginBottom:10}}>SCIM configuration details</div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:'#80848e',marginBottom:4}}>SCIM Endpoint URL</div>
                      <div style={{display:'flex',gap:8}}>
                        <input readOnly value={scimEndpoint} style={{...s.input,fontSize:12,fontFamily:'monospace',color:'#d1d2d3'}} />
                        <button onClick={() => navigator.clipboard.writeText(scimEndpoint).then(() => alert('Copied!'))}
                          style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'0 14px',color:'#b5bac1',cursor:'pointer',fontSize:12,flexShrink:0}}>
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:12,color:'#80848e',marginBottom:4}}>Bearer Token (save this — shown once)</div>
                      <div style={{display:'flex',gap:8}}>
                        <input readOnly value={scimToken} style={{...s.input,fontSize:11,fontFamily:'monospace',color:'#4ade80'}} />
                        <button onClick={() => navigator.clipboard.writeText(scimToken).then(() => alert('Token copied! Store it securely.'))}
                          style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'0 14px',color:'#4ade80',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0}}>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{...s.card,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:16}}>Supported identity providers</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {SCIM_PROVIDERS.map(provider => (
                  <div key={provider.name}
                    onClick={() => setSelectedProvider(provider.name)}
                    style={{padding:16,background: selectedProvider===provider.name?'rgba(36,128,70,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${selectedProvider===provider.name?'rgba(36,128,70,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:12,cursor:'pointer',transition:'all .15s',textAlign:'center'}}>
                    <div style={{fontSize:28,marginBottom:8}}>{provider.icon}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#f2f3f5',marginBottom:4}}>{provider.name}</div>
                    <div style={{fontSize:11,color:'#80848e',marginBottom:8}}>{provider.desc}</div>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:600,
                      color: provider.status==='popular'?'#4ade80':provider.status==='enterprise'?'#f59e0b':'#3b82f6',
                      background: provider.status==='popular'?'rgba(74,222,128,0.1)':provider.status==='enterprise'?'rgba(245,158,11,0.1)':'rgba(59,130,246,0.1)'}}>
                      {provider.status==='popular'?'Popular':provider.status==='enterprise'?'Enterprise':'Supported'}
                    </span>
                  </div>
                ))}
              </div>
              {selectedProvider && (
                <div style={{marginTop:16,padding:16,background:'rgba(36,128,70,0.08)',border:'1px solid rgba(36,128,70,0.2)',borderRadius:10}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#f2f3f5',marginBottom:8}}>Setup guide: {selectedProvider}</div>
                  <div style={{fontSize:12,color:'#80848e',lineHeight:1.8}}>
                    1. In {selectedProvider}, navigate to Applications → Add Application → Enter custom SCIM app<br/>
                    2. Set SCIM connector base URL to: <span style={{color:'#4ade80',fontFamily:'monospace'}}>{scimEndpoint}</span><br/>
                    3. Set authentication to Bearer token and paste your SCIM token<br/>
                    4. Map attributes: userName→email, displayName→display_name, title→designation<br/>
                    5. Enable provisioning for: Create users, Update user attributes, Deactivate users<br/>
                    6. Test connection and save
                  </div>
                  <button onClick={() => alert('Setup guide for '+selectedProvider+' opened. Follow the 6 steps above to configure SCIM provisioning.')}
                    style={{marginTop:12,background:'#248046',border:'none',borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    View full setup guide →
                  </button>
                </div>
              )}
            </div>

            <div style={s.card}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:16}}>Provisioning log</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {scimLogs.map((log,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize:11,color:'#80848e',fontFamily:'monospace',flexShrink:0}}>{log.time}</span>
                    <span style={{flex:1,fontSize:13,color:'#d1d2d3'}}>{log.action}: <span style={{color:'#f2f3f5',fontWeight:500}}>{log.user}</span></span>
                    <span style={{fontSize:11,color:'#4ade80',background:'rgba(74,222,128,0.1)',padding:'2px 8px',borderRadius:20}}>✓ {log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WEBINAR MODE ── */}
        {tab==='webinar' && (
          <div>
            {!activeWebinar ? (
              <div>
                <div style={{...s.card,marginBottom:16}}>
                  <h2 style={{fontSize:16,fontWeight:700,color:'#f2f3f5',marginBottom:4}}>Create webinar</h2>
                  <p style={{fontSize:13,color:'#80848e',marginBottom:20}}>Host large-scale events for up to 10,000 attendees with Q&A, polls, and moderated chat.</p>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    <div style={{gridColumn:'span 2'}}><label style={s.label}>Webinar title *</label><input value={webinar.title} onChange={e=>setWebinar(w=>({...w,title:e.target.value}))} placeholder="e.g. Deemona Teams Product Launch 2026" style={s.input} /></div>
                    <div><label style={s.label}>Date</label><input type="date" value={webinar.date} onChange={e=>setWebinar(w=>({...w,date:e.target.value}))} style={s.input} /></div>
                    <div><label style={s.label}>Time (IST)</label><input type="time" value={webinar.time} onChange={e=>setWebinar(w=>({...w,time:e.target.value}))} style={s.input} /></div>
                    <div>
                      <label style={s.label}>Attendee capacity</label>
                      <select value={webinar.capacity} onChange={e=>setWebinar(w=>({...w,capacity:parseInt(e.target.value)}))} style={{...s.input}}>
                        {[[500,'500 attendees'],[1000,'1,000 attendees'],[2000,'2,000 attendees'],[5000,'5,000 attendees'],[10000,'10,000 attendees (Enterprise)']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div><label style={s.label}>Panelists (emails, comma-separated)</label><input value={webinar.panelists} onChange={e=>setWebinar(w=>({...w,panelists:e.target.value}))} placeholder="speaker@company.com, host@company.com" style={s.input} /></div>
                    <div style={{gridColumn:'span 2'}}><label style={s.label}>Description</label><textarea value={webinar.description} onChange={e=>setWebinar(w=>({...w,description:e.target.value}))} placeholder="What attendees can expect from this webinar..." rows={3} style={{...s.input,resize:'vertical'} as React.CSSProperties} /></div>
                  </div>

                  <div style={{marginBottom:20}}>
                    <label style={s.label}>Features</label>
                    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                      {[
                        {key:'recording', label:'🔴 Auto-record'},
                        {key:'qa', label:'❓ Q&A'},
                        {key:'polls', label:'🗳️ Live polls'},
                      ].map(f => (
                        <label key={f.key} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 14px'}}>
                          <input type="checkbox" checked={(webinar as any)[f.key]} onChange={e=>setWebinar(w=>({...w,[f.key]:e.target.checked}))} className="accent-emerald-500" />
                          <span style={{fontSize:13,color:'#d1d2d3'}}>{f.label}</span>
                        </label>
                      ))}
                      <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 14px'}}>
                        <span style={{fontSize:13,color:'#80848e'}}>Chat:</span>
                        <select value={webinar.chat} onChange={e=>setWebinar(w=>({...w,chat:e.target.value}))} style={{background:'none',border:'none',color:'#d1d2d3',fontSize:13,outline:'none',cursor:'pointer'}}>
                          <option value="off">Off</option>
                          <option value="moderated">Moderated</option>
                          <option value="open">Open</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button onClick={startWebinar}
                    style={{background:'linear-gradient(135deg,#248046,#1a5c33)',border:'none',borderRadius:12,padding:'14px 32px',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',width:'100%'}}>
                    🎙️ Start webinar now
                  </button>
                </div>

                <div style={s.card}>
                  <h3 style={{fontSize:14,fontWeight:700,color:'#f2f3f5',marginBottom:16}}>Webinar vs regular meeting</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {[
                      {feature:'Max attendees', meeting:'500', webinar:'10,000'},
                      {feature:'Video', meeting:'All participants', webinar:'Panelists only'},
                      {feature:'Audio', meeting:'All participants', webinar:'Host/panelists'},
                      {feature:'Chat', meeting:'Open', webinar:'Moderated'},
                      {feature:'Q&A', meeting:'✗', webinar:'✅ Moderated'},
                      {feature:'Live polls', meeting:'✅', webinar:'✅'},
                      {feature:'Recording', meeting:'✅', webinar:'✅ Auto'},
                      {feature:'Registration', meeting:'✗', webinar:'✅'},
                      {feature:'Analytics', meeting:'Basic', webinar:'Advanced'},
                      {feature:'Breakout rooms', meeting:'✅', webinar:'✗'},
                    ].map(row => (
                      <div key={row.feature} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
                        <span style={{fontSize:12,color:'#80848e'}}>{row.feature}</span>
                        <div style={{display:'flex',gap:24}}>
                          <span style={{fontSize:12,color:'#d1d2d3',textAlign:'right',minWidth:80}}>Meeting: {row.meeting}</span>
                          <span style={{fontSize:12,color:'#4ade80',textAlign:'right',minWidth:80}}>Webinar: {row.webinar}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Active webinar interface */
              <div style={{display:'flex',gap:16,height:'calc(100vh - 200px)'}}>
                {/* Main stage */}
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',padding:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#ed4245',animation:'pulse 1s infinite'}}/>
                      <span style={{fontSize:16,fontWeight:700,color:'#f2f3f5'}}>{activeWebinar.title}</span>
                      <span style={{fontSize:12,color:'#80848e',background:'rgba(255,255,255,0.06)',padding:'2px 10px',borderRadius:20}}>
                        👥 {attendeeCount.toLocaleString()} / {activeWebinar.capacity.toLocaleString()} attendees
                      </span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => { setAttendeeCount(c => Math.min(c+Math.floor(Math.random()*20+5), activeWebinar.capacity)); }}
                        style={{fontSize:11,color:'#4ade80',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'5px 12px',cursor:'pointer'}}>Simulate joins</button>
                      <button onClick={() => { if(confirm('End webinar for all '+attendeeCount+' attendees?')) { setActiveWebinar(null); setAttendeeCount(0); } }}
                        style={{fontSize:11,color:'#fff',background:'#ed4245',border:'none',borderRadius:8,padding:'5px 12px',cursor:'pointer',fontWeight:600}}>End webinar</button>
                    </div>
                  </div>

                  {/* Stage area */}
                  <div style={{flex:1,background:'#0d1117',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32}}>
                    <div style={{display:'flex',gap:16}}>
                      {(activeWebinar.panelists||'').split(',').slice(0,3).map((p:string,i:number) => (
                        <div key={i} style={{background:'#1f2937',borderRadius:12,width:200,height:130,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px solid rgba(36,128,70,0.3)'}}>
                          <div style={{width:44,height:44,borderRadius:'50%',background:['#248046','#5865f2','#7c3aed'][i%3],display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',marginBottom:8}}>
                            {p.trim().charAt(0).toUpperCase()||'H'}
                          </div>
                          <span style={{fontSize:12,color:'#b5bac1'}}>{p.trim().split('@')[0]||'Host'}</span>
                          <span style={{fontSize:10,color:'#4ade80',marginTop:2}}>🎙️ Panelist</span>
                        </div>
                      ))}
                      {!(activeWebinar.panelists) && (
                        <div style={{background:'#1f2937',borderRadius:12,width:240,height:150,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px solid rgba(36,128,70,0.4)'}}>
                          <div style={{width:52,height:52,borderRadius:'50%',background:'#248046',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff',marginBottom:8}}>H</div>
                          <span style={{fontSize:13,color:'#f2f3f5',fontWeight:600}}>Host</span>
                          <span style={{fontSize:11,color:'#4ade80',marginTop:2}}>🎙️ Speaking</span>
                        </div>
                      )}
                    </div>

                    {/* Host controls */}
                    <div style={{display:'flex',gap:10,background:'rgba(0,0,0,0.4)',borderRadius:40,padding:'10px 20px'}}>
                      {[
                        {icon:'🎙️',label:'Mic'},
                        {icon:'📷',label:'Camera'},
                        {icon:'🖥️',label:'Share'},
                        {icon:'❓',label:'Q&A',fn:()=>alert('Q&A: '+Math.floor(Math.random()*15+3)+' questions in queue')},
                        {icon:'🗳️',label:'Poll',fn:()=>{ const q=prompt('Poll question:'); if(q) { setWebinarChat(c=>[...c,{sender:'Host',text:'📊 POLL: '+q+' (Options: Yes / No / Maybe)',time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),type:'poll'}]); }}},
                        {icon:'🔴',label:'Record'},
                        {icon:'✋',label:'Hands ('+handRaises.length+')',fn:()=>alert(handRaises.length+' raised hands. Attendees: '+handRaises.join(', ')||'No hands raised')},
                      ].map(ctrl => (
                        <div key={ctrl.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          <button onClick={ctrl.fn||undefined} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50%',width:44,height:44,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{ctrl.icon}</button>
                          <span style={{fontSize:9,color:'#80848e'}}>{ctrl.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat/Q&A sidebar */}
                <div style={{width:300,background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column'}}>
                  <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{fontSize:14,fontWeight:600,color:'#f2f3f5'}}>Attendee messages</div>
                    <div style={{fontSize:11,color:'#80848e'}}>Chat mode: {activeWebinar.chat}</div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:10,display:'flex',flexDirection:'column',gap:6}}>
                    {webinarChat.map((msg:any,i:number) => (
                      <div key={i} style={{background: msg.type==='system'?'rgba(255,255,255,0.03)':msg.type==='poll'?'rgba(99,102,241,0.1)':'rgba(36,128,70,0.08)',borderRadius:8,padding:'7px 10px',border: msg.type==='poll'?'1px solid rgba(99,102,241,0.2)':'none'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:11,fontWeight:600,color: msg.type==='system'?'#80848e':msg.type==='poll'?'#818cf8':'#4ade80'}}>{msg.sender}</span>
                          <span style={{fontSize:10,color:'#80848e'}}>{msg.time}</span>
                        </div>
                        <p style={{fontSize:12,color:'#d1d2d3',margin:0}}>{msg.text}</p>
                        {activeWebinar.chat==='moderated' && msg.type!=='system' && msg.type!=='poll' && (
                          <button onClick={() => alert('Message approved and shown to all attendees')}
                            style={{fontSize:10,color:'#4ade80',background:'rgba(74,222,128,0.1)',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',marginTop:4}}>
                            ✓ Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{padding:10,borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:8}}>
                    <input value={webinarMsg} onChange={e=>setWebinarMsg(e.target.value)}
                      onKeyDown={e => {
                        if(e.key==='Enter'&&webinarMsg.trim()) {
                          setWebinarChat((c:any)=>[...c,{sender:'Host',text:webinarMsg,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),type:'host'}]);
                          setWebinarMsg('');
                        }
                      }}
                      placeholder="Broadcast to all attendees..."
                      style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 10px',color:'#f2f3f5',fontSize:12,outline:'none'}} />
                    <button onClick={() => {
                      if(!webinarMsg.trim()) return;
                      setWebinarChat((c:any)=>[...c,{sender:'Host',text:webinarMsg,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),type:'host'}]);
                      setWebinarMsg('');
                    }} style={{background:'#248046',border:'none',borderRadius:8,padding:'7px 12px',color:'#fff',cursor:'pointer',fontSize:12}}>→</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
