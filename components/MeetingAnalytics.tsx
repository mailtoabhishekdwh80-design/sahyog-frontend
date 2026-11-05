'use client';
import { useState, useEffect } from 'react';

interface AnalyticsData {
  summary: {
    total_meetings: number;
    completed: number;
    live_now: number;
    upcoming: number;
    avg_duration: number;
    total_minutes: number;
  };
  byDay: { date: string; count: number; avg_duration: number }[];
  topHosts: { display_name: string; email: string; meetings_hosted: number; avg_duration: number }[];
  byType: { type: string; count: number }[];
  recent: any[];
  period: { from: string; to: string };
}

interface MeetingAnalyticsProps {
  onClose: () => void;
  apiFetch: (path: string, opts?: any) => Promise<any>;
}

export default function MeetingAnalytics({ onClose, apiFetch }: MeetingAnalyticsProps) {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    const from = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString();
    const res = await apiFetch('/meetings/analytics?from=' + from);
    if (res?.data) setData(res.data);
    setLoading(false);
  }

  const maxCount = data?.byDay?.length ? Math.max(...data.byDay.map(d => d.count), 1) : 1;

  return (
    <div data-dlg="large" style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',zIndex:1000}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{margin:'auto',background:'#FFFFFF',border:'1px solid #93C5FD',borderRadius:16,width:'95vw',maxWidth:900,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(15,23,42,0.20)'}}>

        {/* Header */}
        <div style={{padding:'14px 24px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>📊</span>
            <div>
              <div style={{color:'#0F172A',fontWeight:700,fontSize:16}}>Meeting Analytics</div>
              <div style={{fontSize:12,color:'#0F172A'}}>Track your team's meeting activity</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',background:'#F1F5F9',borderRadius:8,border:'1px solid #CBD5E1',overflow:'hidden'}}>
              {[['7','7 days'],['30','30 days'],['90','90 days']].map(([val,label]) => (
                <button key={val} onClick={() => setPeriod(val)}
                  style={{padding:'5px 12px',background:period===val?'#1D4ED8':'none',border:'none',color:period===val?'#fff':'#E2E8F0',fontSize:13,cursor:'pointer',fontWeight:period===val?600:400}}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'#0F172A',cursor:'pointer',fontSize:22}}>×</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:24}}>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#0F172A',fontSize:14}}>Loading analytics...</div>
          ) : !data ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#0F172A',fontSize:14}}>No data available</div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
                {[
                  { label:'Total Meetings', value: data.summary.total_meetings, icon:'📹', color:'#1D4ED8' },
                  { label:'Completed', value: data.summary.completed, icon:'✅', color:'#059669' },
                  { label:'Live Now', value: data.summary.live_now, icon:'🔴', color:'#DC2626' },
                  { label:'Avg Duration', value: Math.round(data.summary.avg_duration) + 'm', icon:'⏱️', color:'#7C3AED' },
                ].map(card => (
                  <div key={card.label} style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:12,padding:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:18}}>{card.icon}</span>
                      <span style={{fontSize:12,color:'#0F172A',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{card.label}</span>
                    </div>
                    <div style={{fontSize:28,fontWeight:800,color:'#0F172A'}}>{card.value}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:20}}>
                {/* Activity chart */}
                <div style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:12,padding:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>Meeting Activity</div>
                  {data.byDay.length === 0 ? (
                    <div style={{textAlign:'center',color:'#0F172A',fontSize:14,padding:20}}>No meetings in this period</div>
                  ) : (
                    <div style={{display:'flex',alignItems:'flex-end',gap:3,height:100}}>
                      {data.byDay.map(day => (
                        <div key={day.date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <div style={{width:'100%',background:'#1D4ED8',borderRadius:'3px 3px 0 0',height: (day.count / maxCount * 80) + 'px',minHeight:2,transition:'height 0.3s'}}
                            title={`${day.date}: ${day.count} meetings`} />
                          <span style={{fontSize:8,color:'#0F172A',writingMode:'vertical-lr',transform:'rotate(180deg)',height:28,overflow:'hidden'}}>
                            {new Date(day.date).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* By type */}
                <div style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:12,padding:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>By Type</div>
                  {data.byType.length === 0 ? (
                    <div style={{textAlign:'center',color:'#0F172A',fontSize:14}}>No data</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {data.byType.map(t => {
                        const total = data.byType.reduce((s,x) => s + parseInt(String(x.count)), 0);
                        const pct = Math.round(parseInt(String(t.count)) / total * 100);
                        const colors: Record<string,string> = { meeting:'#1D4ED8', webinar:'#7C3AED', townhall:'#059669', one_on_one:'#F59E0B' };
                        return (
                          <div key={t.type}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                              <span style={{fontSize:13,color:'#0F172A',textTransform:'capitalize'}}>{t.type.replace('_',' ')}</span>
                              <span style={{fontSize:13,color:'#0F172A',fontWeight:600}}>{t.count}</span>
                            </div>
                            <div style={{height:6,background:'#64748B',borderRadius:3,overflow:'hidden'}}>
                              <div style={{height:'100%',background:colors[t.type]||'#1D4ED8',width:pct+'%',borderRadius:3}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Top hosts */}
              <div style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:12,padding:20,marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>Top Hosts</div>
                {data.topHosts.length === 0 ? (
                  <div style={{textAlign:'center',color:'#0F172A',fontSize:14,padding:10}}>No data</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {data.topHosts.map((host, i) => (
                      <div key={host.email} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:'#FFFFFF',borderRadius:8}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#1D4ED8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>
                          {host.display_name?.charAt(0)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#0F172A'}}>{host.display_name}</div>
                          <div style={{fontSize:12,color:'#0F172A'}}>{host.email}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:14,fontWeight:700,color:'#2563EB'}}>{host.meetings_hosted}</div>
                          <div style={{fontSize:12,color:'#0F172A'}}>meetings</div>
                        </div>
                        <div style={{textAlign:'right',minWidth:50}}>
                          <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{Math.round(host.avg_duration)}m</div>
                          <div style={{fontSize:12,color:'#0F172A'}}>avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent meetings */}
              <div style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:12,padding:20}}>
                <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>Recent Meetings</div>
                {data.recent.length === 0 ? (
                  <div style={{textAlign:'center',color:'#0F172A',fontSize:14,padding:10}}>No meetings found</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {data.recent.map(m => (
                      <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:'#FFFFFF',borderRadius:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title}</div>
                          <div style={{fontSize:12,color:'#0F172A'}}>{m.host_name} · {new Date(m.starts_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        <div style={{display:'flex',gap:8,flexShrink:0}}>
                          <span style={{fontSize:12,color:'#2563EB'}}>👥 {m.participant_count}</span>
                          <span style={{fontSize:12,color:'#0F172A'}}>⏱️ {m.duration_mins}m</span>
                          <span style={{fontSize:12,padding:'2px 6px',borderRadius:4,background:m.status==='ended'?'rgba(100,116,139,0.2)':m.status==='live'?'rgba(239,68,68,0.2)':'rgba(29,78,216,0.2)',color:m.status==='ended'?'#0F172A':m.status==='live'?'#DC2626':'#1D4ED8'}}>{m.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
