'use client';
import { useState, useEffect } from 'react';

interface Canvas {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  author?: string;
}

interface CanvasProps {
  onClose: () => void;
  user?: any;
}

export default function CanvasView({ onClose, user }: CanvasProps) {
  const [canvases, setCanvases]     = useState<Canvas[]>([]);
  const [selected, setSelected]     = useState<Canvas | null>(null);
  const [title, setTitle]           = useState('Untitled Canvas');
  const [content, setContent]       = useState('');
  const [editing, setEditing]       = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sahyog_canvases');
    if (saved) setCanvases(JSON.parse(saved));
  }, []);

  function saveCanvas() {
    const canvas: Canvas = {
      id: selected?.id || Date.now().toString(),
      title: title.trim() || 'Untitled Canvas',
      content,
      updatedAt: new Date().toISOString(),
      author: user?.display_name,
    };
    const updated = selected
      ? canvases.map(c => c.id === canvas.id ? canvas : c)
      : [canvas, ...canvases];
    setCanvases(updated);
    setSelected(canvas);
    localStorage.setItem('sahyog_canvases', JSON.stringify(updated));
  }

  function deleteCanvas(id: string) {
    if (!confirm('Delete this canvas?')) return;
    const updated = canvases.filter(c => c.id !== id);
    setCanvases(updated);
    localStorage.setItem('sahyog_canvases', JSON.stringify(updated));
    if (selected?.id === id) { setSelected(null); setEditing(false); }
  }

  function newCanvas() {
    setSelected(null);
    setTitle('Untitled Canvas');
    setContent('');
    setEditing(true);
  }

  function openCanvas(canvas: Canvas) {
    setSelected(canvas);
    setTitle(canvas.title);
    setContent(canvas.content);
    setEditing(true);
  }

  function applyFormat(format: string) {
    const ta = document.getElementById('canvas-ta') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const map: Record<string, [string, string]> = {
      bold: ['**', '**'], italic: ['_', '_'], strike: ['~~', '~~'],
      h1: ['# ', ''], h2: ['## ', ''], bullet: ['\n- ', ''], quote: ['\n> ', ''],
    };
    const [before, after] = map[format] || ['', ''];
    const newContent = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + sel.length); }, 0);
  }

  return (
    <div data-dlg="large" style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',zIndex:1000}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{margin:'auto',background:'#FFFFFF',border:'1px solid #93C5FD',borderRadius:16,width:'90vw',maxWidth:900,height:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(15,23,42,0.20)'}}>

        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <span style={{fontSize:20}}>📝</span>
          <span style={{color:'#0F172A',fontWeight:700,fontSize:16,flex:1}}>Canvas</span>
          <button onClick={newCanvas} style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'6px 14px',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>+ New</button>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>

        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          {/* Sidebar - canvas list */}
          <div style={{width:220,borderRight:'1px solid #E2E8F0',overflowY:'auto',flexShrink:0}}>
            {canvases.length === 0 && (
              <div style={{padding:20,textAlign:'center',color:'#475569',fontSize:14}}>
                <div style={{fontSize:32,marginBottom:8}}>📄</div>
                No canvases yet
              </div>
            )}
            {canvases.map(cv => (
              <div key={cv.id}
                onClick={() => openCanvas(cv)}
                style={{padding:'12px 16px',cursor:'pointer',borderBottom:'1px solid #0F1E35',background:selected?.id===cv.id?'#DBEAFE':'transparent',display:'flex',alignItems:'center',gap:8}}
                onMouseEnter={e => { if (selected?.id !== cv.id) (e.currentTarget as HTMLElement).style.background='rgba(30,58,95,0.3)'; }}
                onMouseLeave={e => { if (selected?.id !== cv.id) (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                <span style={{fontSize:16}}>📄</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cv.title}</div>
                  <div style={{fontSize:12,color:'#475569'}}>{new Date(cv.updatedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteCanvas(cv.id); }}
                  style={{background:'none',border:'none',color:'#DC2626',cursor:'pointer',fontSize:14,opacity:0.6,padding:2}}>🗑</button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {editing ? (
              <>
                {/* Toolbar */}
                <div style={{padding:'8px 16px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',flexShrink:0}}>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    style={{background:'none',border:'none',outline:'none',color:'#0F172A',fontSize:16,fontWeight:700,flex:1,minWidth:150,marginRight:8}}
                    placeholder="Canvas title..." />
                  {[
                    {label:'B',format:'bold',style:{fontWeight:800}},
                    {label:'I',format:'italic',style:{fontStyle:'italic'}},
                    {label:'S',format:'strike',style:{textDecoration:'line-through'}},
                    {label:'H1',format:'h1',style:{}},
                    {label:'H2',format:'h2',style:{}},
                    {label:'•',format:'bullet',style:{}},
                    {label:'❝',format:'quote',style:{}},
                  ].map(f => (
                    <button key={f.format} onClick={() => applyFormat(f.format)}
                      style={{background:'#1E293B',border:'1px solid #334155',borderRadius:4,padding:'3px 8px',color:'#94A3B8',fontSize:13,cursor:'pointer',...f.style}}>
                      {f.label}
                    </button>
                  ))}
                  <button onClick={saveCanvas}
                    style={{marginLeft:'auto',background:'#1D4ED8',border:'none',borderRadius:8,padding:'5px 14px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    Save
                  </button>
                </div>
                {/* Text area */}
                <textarea id="canvas-ta" value={content} onChange={e => setContent(e.target.value)}
                  placeholder={'Start writing...\n\nUse **bold**, _italic_, ~~strike~~\n# Heading 1\n## Heading 2\n- Bullet list\n> Quote'}
                  style={{flex:1,background:'none',border:'none',outline:'none',color:'#0F172A',fontSize:15,lineHeight:1.8,padding:24,resize:'none',fontFamily:'inherit'}} />
              </>
            ) : (
              <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'#475569'}}>
                <div style={{fontSize:48}}>📝</div>
                <div style={{fontSize:16,fontWeight:600,color:'#475569'}}>Select a canvas or create a new one</div>
                <button onClick={newCanvas} style={{background:'#1D4ED8',border:'none',borderRadius:10,padding:'10px 24px',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',marginTop:8}}>
                  Create Canvas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
