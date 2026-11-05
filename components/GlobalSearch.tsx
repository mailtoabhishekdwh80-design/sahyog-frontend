'use client';
import { useState, useEffect, useRef } from 'react';

interface GlobalSearchProps {
  onClose: () => void;
  onNavigate: (channelId: string, channelName: string) => void;
  apiFetch: (path: string, opts?: any) => Promise<any>;
}

export default function GlobalSearch({ onClose, onNavigate, apiFetch }: GlobalSearchProps) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await apiFetch('/channels/search?q=' + encodeURIComponent(query) + '&limit=20').catch(() => null);
      setResults(Array.isArray(res?.data) ? res.data : []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const recent = ['team standup', 'project deadline', 'budget approval'];

  return (
    <div data-dlg="1" style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:80,zIndex:1000}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{background:'#FFFFFF',border:'1px solid #93C5FD',borderRadius:16,width:'100%',maxWidth:640,boxShadow:'0 25px 60px rgba(15,23,42,0.20)',overflow:'hidden'}}>
        
        {/* Search input */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:18,color:'#2563EB'}}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search messages across all channels..."
            style={{flex:1,background:'none',border:'none',outline:'none',color:'#0F172A',fontSize:15,fontWeight:500}} />
          <kbd style={{fontSize:12,color:'#475569',background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:4,padding:'2px 6px',cursor:'pointer'}}
            onClick={onClose}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{maxHeight:420,overflowY:'auto'}}>
          {loading && (
            <div style={{padding:24,textAlign:'center',color:'#2563EB',fontSize:14}}>Searching...</div>
          )}
          {!loading && query && results.length === 0 && (
            <div style={{padding:32,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:8}}>🔍</div>
              <div style={{color:'#475569',fontSize:14}}>No results for "{query}"</div>
            </div>
          )}
          {!query && (
            <div style={{padding:20}}>
              <div style={{fontSize:12,color:'#475569',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12}}>Recent searches</div>
              {recent.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'8px 12px',background:'none',border:'none',color:'#475569',cursor:'pointer',borderRadius:8,fontSize:14,textAlign:'left'}}>
                  <span style={{color:'#475569'}}>🕐</span> {s}
                </button>
              ))}
              <div style={{marginTop:20,fontSize:12,color:'#334155',textAlign:'center'}}>
                Press <kbd style={{background:'#F1F5F9',border:'1px solid #CBD5E1',borderRadius:4,padding:'1px 5px',color:'#2563EB'}}>↵</kbd> to search
              </div>
            </div>
          )}
          {results.map((r: any) => (
            <button key={r.id}
              onClick={() => { onNavigate(r.channel_id, r.channel_name); onClose(); }}
              style={{display:'flex',alignItems:'flex-start',gap:12,width:'100%',padding:'12px 20px',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid #0F2040',textAlign:'left'}}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(30,58,95,0.4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}>
              <div style={{width:36,height:36,borderRadius:8,background:'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,color:'#2563EB',fontWeight:700}}>#</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontSize:14,color:'#2563EB',fontWeight:700}}>#{r.channel_name}</span>
                  <span style={{fontSize:13,color:'#475569'}}>{r.sender_name}</span>
                  <span style={{fontSize:12,color:'#334155',marginLeft:'auto'}}>
                    {new Date(r.sent_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                  </span>
                </div>
                <div style={{fontSize:14,color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.content}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
