'use client';
import { useState } from 'react';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  channel: string;
  message: string;
  enabled: boolean;
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  { id:'1', name:'Welcome new members', trigger:'member_join', action:'send_message', channel:'general', message:'Welcome to the team! 🎉 Please introduce yourself.', enabled:true },
  { id:'2', name:'Daily standup reminder', trigger:'schedule_9am', action:'send_message', channel:'general', message:'Good morning! Time for standup — what did you do yesterday?', enabled:false },
  { id:'3', name:'Task overdue alert', trigger:'task_overdue', action:'send_message', channel:'general', message:'You have overdue tasks! Please update your Kanban board.', enabled:true },
  { id:'4', name:'Meeting starting soon', trigger:'meeting_15min', action:'send_message', channel:'general', message:'Reminder: A meeting starts in 15 minutes. Please join on time.', enabled:false },
];

const TRIGGERS: Record<string, string> = {
  member_join: '👤 Someone joins the workspace',
  schedule_9am: '🕘 Every day at 9 AM',
  schedule_monday: '📅 Every Monday morning',
  task_overdue: '⚠️ A task becomes overdue',
  meeting_15min: '📹 A meeting starts in 15 min',
  channel_message: '💬 A message is posted',
};

interface WorkflowBuilderProps {
  onClose: () => void;
}

export default function WorkflowBuilder({ onClose }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [creating, setCreating]   = useState(false);
  const [newWf, setNewWf]         = useState<Partial<Workflow>>({ trigger:'member_join', action:'send_message', channel:'general', message:'', enabled:true });

  function toggle(id: string) {
    setWorkflows(prev => prev.map(w => w.id===id ? {...w,enabled:!w.enabled} : w));
  }

  function deleteWf(id: string) {
    if (!confirm('Delete this workflow?')) return;
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }

  function addWorkflow() {
    if (!newWf.name?.trim() || !newWf.message?.trim()) { alert('Please fill in all fields'); return; }
    const wf: Workflow = { id:Date.now().toString(), name:newWf.name!, trigger:newWf.trigger!, action:'send_message', channel:newWf.channel||'general', message:newWf.message!, enabled:true };
    setWorkflows(prev => [...prev, wf]);
    setNewWf({ trigger:'member_join', action:'send_message', channel:'general', message:'', enabled:true });
    setCreating(false);
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',zIndex:1000}}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{margin:'auto',background:'#0F172A',border:'1px solid #1E40AF',borderRadius:16,width:'100%',maxWidth:640,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(0,0,0,0.6)'}}>

        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #1E3A5F',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <span style={{fontSize:20}}>⚡</span>
          <div style={{flex:1}}>
            <div style={{color:'#F1F5F9',fontWeight:700,fontSize:16}}>Workflow Builder</div>
            <div style={{fontSize:12,color:'#475569'}}>Automate repetitive tasks for your team</div>
          </div>
          <button onClick={() => setCreating(true)} style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'6px 14px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ New</button>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {/* Create form */}
          {creating && (
            <div style={{background:'#1E293B',border:'1px solid #1E40AF',borderRadius:12,padding:20,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:'#F1F5F9',marginBottom:16}}>New Workflow</div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>Workflow name</label>
                  <input value={newWf.name||''} onChange={e => setNewWf(p => ({...p,name:e.target.value}))}
                    placeholder="e.g. Welcome new members"
                    style={{width:'100%',background:'#0F172A',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>When this happens</label>
                  <select value={newWf.trigger} onChange={e => setNewWf(p => ({...p,trigger:e.target.value}))}
                    style={{width:'100%',background:'#0F172A',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}}>
                    {Object.entries(TRIGGERS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>Send message to channel</label>
                  <input value={newWf.channel||''} onChange={e => setNewWf(p => ({...p,channel:e.target.value}))}
                    placeholder="general"
                    style={{width:'100%',background:'#0F172A',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:11,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:4}}>Message content</label>
                  <textarea value={newWf.message||''} onChange={e => setNewWf(p => ({...p,message:e.target.value}))}
                    placeholder="Type the message to send..."
                    rows={3}
                    style={{width:'100%',background:'#0F172A',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#F1F5F9',fontSize:13,outline:'none',resize:'none',fontFamily:'inherit'}} />
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={() => setCreating(false)} style={{background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'7px 16px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>Cancel</button>
                  <button onClick={addWorkflow} style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'7px 16px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Create Workflow</button>
                </div>
              </div>
            </div>
          )}

          {/* Workflow list */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {workflows.map(wf => (
              <div key={wf.id} style={{background:'#1E293B',border:`1px solid ${wf.enabled?'#1E40AF':'#334155'}`,borderRadius:12,padding:16,transition:'border-color 0.2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:wf.enabled?'#1D4ED8':'#374151',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>⚡</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,color:'#F1F5F9',fontWeight:700}}>{wf.name}</div>
                    <div style={{fontSize:12,color:'#475569',marginTop:2}}>{TRIGGERS[wf.trigger] || wf.trigger}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {/* Toggle */}
                    <button onClick={() => toggle(wf.id)}
                      style={{width:44,height:24,borderRadius:12,background:wf.enabled?'#1D4ED8':'#374151',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:wf.enabled?22:2,transition:'left 0.2s'}} />
                    </button>
                    <button onClick={() => deleteWf(wf.id)} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:16,opacity:0.7}}>🗑</button>
                  </div>
                </div>
                <div style={{marginTop:10,padding:'8px 12px',background:'#0F172A',borderRadius:8,border:'1px solid #1E3A5F',fontSize:12,color:'#64748B'}}>
                  💬 "{wf.message}" → #{wf.channel}
                </div>
                {!wf.enabled && (
                  <div style={{marginTop:6,fontSize:11,color:'#475569',textAlign:'right'}}>Workflow is disabled</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
