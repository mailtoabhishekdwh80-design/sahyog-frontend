'use client';
import { useRef, useState, useEffect } from 'react';

interface WhiteboardProps {
  onClose: () => void;
  meetingId?: string;
}

const COLORS = ['#FFFFFF','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE'];
const TOOLS = [
  { id:'pen',    label:'Pen',     icon:'✏️' },
  { id:'eraser', label:'Eraser',  icon:'⬜' },
  { id:'line',   label:'Line',    icon:'╱' },
  { id:'rect',   label:'Rect',    icon:'▭' },
  { id:'circle', label:'Circle',  icon:'○' },
  { id:'text',   label:'Text',    icon:'T' },
];

export default function MeetingWhiteboard({ onClose, meetingId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool]         = useState('pen');
  const [color, setColor]       = useState('#FFFFFF');
  const [size, setSize]         = useState(3);
  const [drawing, setDrawing]   = useState(false);
  const [history, setHistory]   = useState<ImageData[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos]   = useState<{x:number,y:number}|null>(null);
  const startPos = useRef<{x:number,y:number}|null>(null);
  const snapshotRef = useRef<ImageData|null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function saveHistory() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    setHistory(prev => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getPos(e);
    if (tool === 'text') {
      setTextPos(pos);
      return;
    }
    saveHistory();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    startPos.current = pos;
    setDrawing(true);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 4;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (snapshotRef.current && startPos.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.globalCompositeOperation = 'source-over';
      const sx = startPos.current.x, sy = startPos.current.y;
      if (tool === 'line') {
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
      } else if (tool === 'rect') {
        ctx.beginPath(); ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath(); ctx.ellipse(sx + (pos.x - sx)/2, sy + (pos.y - sy)/2, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
      }
    }
  }

  function onMouseUp() {
    setDrawing(false);
    startPos.current = null;
  }

  function addText() {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(''); return; }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    saveHistory();
    ctx.font = `${size * 6}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextPos(null); setTextInput('');
  }

  function undo() {
    if (!history.length) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    saveHistory();
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function downloadCanvas() {
    const canvas = canvasRef.current!;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'whiteboard-' + (meetingId?.slice(0,8) || 'session') + '.png';
    a.click();
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',zIndex:600}}>
      <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>

        {/* Toolbar */}
        <div style={{height:56,background:'#0F172A',borderBottom:'1px solid #1E3A5F',display:'flex',alignItems:'center',gap:8,padding:'0 16px',flexShrink:0}}>
          <span style={{fontSize:16,fontWeight:700,color:'#F1F5F9',marginRight:8}}>🎨 Whiteboard</span>

          {/* Tools */}
          <div style={{display:'flex',gap:2,background:'#1E293B',borderRadius:8,padding:3,border:'1px solid #334155'}}>
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                style={{width:32,height:28,borderRadius:6,background:tool===t.id?'#1D4ED8':'none',border:'none',color:tool===t.id?'#fff':'#E2E8F0',fontSize:t.id==='text'?13:16,cursor:'pointer',fontWeight:700}}>
                {t.icon}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div style={{display:'flex',gap:4,marginLeft:8}}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{width:20,height:20,borderRadius:'50%',background:c,border:color===c?'2px solid #60A5FA':'2px solid transparent',cursor:'pointer',padding:0,flexShrink:0}} />
            ))}
          </div>

          {/* Size */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:8}}>
            <span style={{fontSize:11,color:'#E2E8F0'}}>Size</span>
            <input type="range" min={1} max={20} value={size} onChange={e => setSize(Number(e.target.value))}
              style={{width:80,accentColor:'#1D4ED8'}} />
            <span style={{fontSize:11,color:'#E2E8F0',width:20}}>{size}</span>
          </div>

          {/* Actions */}
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            <button onClick={undo} disabled={!history.length}
              style={{background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'4px 10px',color:'#E2E8F0',fontSize:12,cursor:'pointer',opacity:history.length?1:0.4}}>
              ↩ Undo
            </button>
            <button onClick={clearCanvas}
              style={{background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'4px 10px',color:'#E2E8F0',fontSize:12,cursor:'pointer'}}>
              Clear
            </button>
            <button onClick={downloadCanvas}
              style={{background:'#1D4ED8',border:'none',borderRadius:6,padding:'4px 10px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              ⬇ Save PNG
            </button>
            <button onClick={onClose}
              style={{background:'#7F1D1D',border:'none',borderRadius:6,padding:'4px 10px',color:'#FCA5A5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              Close
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          <canvas ref={canvasRef} style={{width:'100%',height:'100%',cursor:tool==='eraser'?'cell':tool==='text'?'text':'crosshair',display:'block'}}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />

          {/* Text input overlay */}
          {textPos && (
            <div style={{position:'absolute',top:textPos.y-20,left:textPos.x,zIndex:10,display:'flex',gap:4}}>
              <input autoFocus value={textInput} onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') { setTextPos(null); setTextInput(''); } }}
                style={{background:'rgba(15,23,42,0.9)',border:'1px solid #1D4ED8',borderRadius:4,padding:'2px 6px',color:color,fontSize:size*6,outline:'none',minWidth:100}}
                placeholder="Type here..." />
              <button onClick={addText} style={{background:'#1D4ED8',border:'none',borderRadius:4,padding:'2px 8px',color:'#fff',fontSize:11,cursor:'pointer'}}>Add</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
