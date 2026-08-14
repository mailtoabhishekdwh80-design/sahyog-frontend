'use client';
import { useState } from 'react';

interface WebinarRegistrationProps {
  onClose: () => void;
  onRegister: (data: any) => void;
  webinar: {
    id: string;
    title: string;
    description?: string;
    starts_at: string;
    duration_mins: number;
    host_name?: string;
    capacity?: number;
    registrants?: number;
  };
}

export function WebinarRegistration({ onClose, onRegister, webinar }: WebinarRegistrationProps) {
  const [step, setStep] = useState<'info'|'form'|'success'>('info');
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', question: '' });
  const [loading, setLoading] = useState(false);

  const spotsLeft = (webinar.capacity || 500) - (webinar.registrants || 0);
  const startDate = new Date(webinar.starts_at);

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) { alert('Name and email are required'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API call
    onRegister({ ...form, webinar_id: webinar.id });
    setStep('success');
    setLoading(false);
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',zIndex:1000,alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:'#0F172A',border:'1px solid #1E40AF',borderRadius:20,width:'100%',maxWidth:520,boxShadow:'0 30px 80px rgba(0,0,0,0.7)',overflow:'hidden'}}>

        {/* Hero banner */}
        <div style={{background:'linear-gradient(135deg,#1D4ED8 0%,#7C3AED 100%)',padding:'24px 28px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
            Live Webinar
          </div>
          <div style={{fontSize:20,fontWeight:800,color:'#FFFFFF',lineHeight:1.3,marginBottom:12}}>
            {webinar.title}
          </div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,color:'rgba(255,255,255,0.85)',fontSize:13}}>
              📅 {startDate.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,color:'rgba(255,255,255,0.85)',fontSize:13}}>
              🕐 {startDate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} IST
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,color:'rgba(255,255,255,0.85)',fontSize:13}}>
              ⏱ {webinar.duration_mins} minutes
            </div>
          </div>
        </div>

        {step === 'info' && (
          <div style={{padding:28}}>
            {webinar.description && (
              <p style={{fontSize:14,color:'#94A3B8',lineHeight:1.6,marginBottom:20}}>{webinar.description}</p>
            )}

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#1E293B',borderRadius:10,border:'1px solid #334155',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#1D4ED8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff'}}>
                  {webinar.host_name?.charAt(0)||'H'}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'#F1F5F9'}}>{webinar.host_name || 'Host'}</div>
                  <div style={{fontSize:11,color:'#475569'}}>Webinar Host</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:18,fontWeight:800,color:spotsLeft<50?'#EF4444':'#22C55E'}}>{spotsLeft}</div>
                <div style={{fontSize:11,color:'#475569'}}>spots left</div>
              </div>
            </div>

            {spotsLeft < 100 && (
              <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#FCA5A5',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                🔥 Only {spotsLeft} spots remaining — register now!
              </div>
            )}

            <button onClick={() => setStep('form')}
              style={{width:'100%',background:'linear-gradient(135deg,#1D4ED8,#7C3AED)',border:'none',borderRadius:12,padding:'14px 24px',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:12}}>
              Register for Free →
            </button>
            <button onClick={onClose}
              style={{width:'100%',background:'none',border:'1px solid #334155',borderRadius:12,padding:'10px 24px',color:'#64748B',fontSize:13,cursor:'pointer'}}>
              Not now
            </button>
          </div>
        )}

        {step === 'form' && (
          <div style={{padding:28}}>
            <div style={{fontSize:15,fontWeight:700,color:'#F1F5F9',marginBottom:20}}>Complete Registration</div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                    placeholder="Your name"
                    style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Email *</label>
                  <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} type="email"
                    placeholder="work@company.com"
                    style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Company</label>
                  <input value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))}
                    placeholder="Your company"
                    style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Role</label>
                  <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}
                    style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:form.role?'#F1F5F9':'#64748B',fontSize:13,outline:'none'}}>
                    <option value="">Select role...</option>
                    <option>Founder / CEO</option>
                    <option>Product Manager</option>
                    <option>Engineer</option>
                    <option>Designer</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>HR / Operations</option>
                    <option>Student</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Question for the host (optional)</label>
                <textarea value={form.question} onChange={e => setForm(f=>({...f,question:e.target.value}))} rows={2}
                  placeholder="What would you like to learn from this webinar?"
                  style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none',resize:'none'}} />
              </div>
            </div>

            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button onClick={() => setStep('info')}
                style={{background:'#1E293B',border:'1px solid #334155',borderRadius:10,padding:'10px 18px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading}
                style={{flex:1,background:loading?'#334155':'linear-gradient(135deg,#1D4ED8,#7C3AED)',border:'none',borderRadius:10,padding:'10px 24px',color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
                {loading ? 'Registering...' : 'Complete Registration →'}
              </button>
            </div>
            <p style={{fontSize:11,color:'#334155',textAlign:'center',marginTop:10}}>By registering you agree to receive event reminders</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{padding:40,textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>🎉</div>
            <div style={{fontSize:20,fontWeight:800,color:'#F1F5F9',marginBottom:8}}>You're registered!</div>
            <div style={{fontSize:14,color:'#64748B',marginBottom:24,lineHeight:1.6}}>
              A confirmation email will be sent to <strong style={{color:'#60A5FA'}}>{form.email}</strong>.<br />
              We'll send you a reminder 24 hours and 15 minutes before the webinar.
            </div>
            <div style={{background:'#1E293B',border:'1px solid #334155',borderRadius:12,padding:16,marginBottom:24,textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#F1F5F9',marginBottom:8}}>📅 Add to calendar</div>
              <div style={{display:'flex',gap:8}}>
                {['Google Calendar','Outlook','Apple Calendar'].map(cal => (
                  <button key={cal} style={{flex:1,background:'#0F172A',border:'1px solid #334155',borderRadius:6,padding:'6px 8px',color:'#94A3B8',fontSize:10,cursor:'pointer',fontWeight:600}}>
                    {cal}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onClose}
              style={{background:'#1D4ED8',border:'none',borderRadius:10,padding:'10px 32px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Webinar creation form for hosts
interface CreateWebinarProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

export function CreateWebinarModal({ onClose, onCreate }: CreateWebinarProps) {
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '10:00', duration: 60,
    capacity: 500, requireApproval: false, sendReminders: true,
  });

  function handleCreate() {
    if (!form.title.trim() || !form.date) { alert('Title and date are required'); return; }
    onCreate({
      ...form,
      type: 'webinar',
      starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
      duration_mins: form.duration,
    });
    onClose();
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',zIndex:1000,alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:'#0F172A',border:'1px solid #1E40AF',borderRadius:20,width:'100%',maxWidth:520,boxShadow:'0 30px 80px rgba(0,0,0,0.7)'}}>
        <div style={{padding:'16px 24px',borderBottom:'1px solid #1E3A5F',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:15,fontWeight:700,color:'#F1F5F9'}}>🎙️ Create Webinar</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22}}>×</button>
        </div>
        <div style={{padding:24,display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Webinar Title *</label>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              placeholder="e.g. How to scale your SaaS in India"
              style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
          </div>
          <div>
            <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3}
              placeholder="What will attendees learn?"
              style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none',resize:'none'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div>
              <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}
                min={new Date().toISOString().split('T')[0]}
                style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Time (IST)</label>
              <input type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}
                style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
            </div>
            <div>
              <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Duration (min)</label>
              <select value={form.duration} onChange={e => setForm(f=>({...f,duration:Number(e.target.value)}))}
                style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}}>
                {[30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:6}}>Max Capacity</label>
            <input type="number" value={form.capacity} onChange={e => setForm(f=>({...f,capacity:Number(e.target.value)}))}
              min={10} max={10000}
              style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'9px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {key:'requireApproval',label:'Require approval for registration'},
              {key:'sendReminders',label:'Send email reminders to registrants'},
            ].map(opt => (
              <label key={opt.key} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input type="checkbox" checked={(form as any)[opt.key]} onChange={e => setForm(f=>({...f,[opt.key]:e.target.checked}))}
                  style={{width:16,height:16,accentColor:'#1D4ED8'}} />
                <span style={{fontSize:13,color:'#94A3B8'}}>{opt.label}</span>
              </label>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={onClose}
              style={{background:'#1E293B',border:'1px solid #334155',borderRadius:10,padding:'10px 18px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>
              Cancel
            </button>
            <button onClick={handleCreate}
              style={{flex:1,background:'linear-gradient(135deg,#1D4ED8,#7C3AED)',border:'none',borderRadius:10,padding:'10px 24px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
              Create Webinar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
