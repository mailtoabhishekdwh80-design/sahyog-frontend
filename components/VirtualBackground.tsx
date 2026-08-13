'use client';
import { useState, useEffect, useRef } from 'react';

const BACKGROUNDS = [
  { id: 'none',     label: 'None',         type: 'none',     value: '' },
  { id: 'blur',     label: 'Blur',         type: 'blur',     value: '10px' },
  { id: 'office',   label: 'Office',       type: 'image',    value: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80' },
  { id: 'nature',   label: 'Nature',       type: 'image',    value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&q=80' },
  { id: 'city',     label: 'City',         type: 'image',    value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=80' },
  { id: 'library',  label: 'Library',      type: 'image',    value: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1280&q=80' },
  { id: 'beach',    label: 'Beach',        type: 'image',    value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=80' },
  { id: 'space',    label: 'Space',        type: 'image',    value: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1280&q=80' },
  { id: 'gradient1',label: 'Indigo',       type: 'gradient', value: 'linear-gradient(135deg,#1D4ED8,#7C3AED)' },
  { id: 'gradient2',label: 'Sunset',       type: 'gradient', value: 'linear-gradient(135deg,#F59E0B,#EF4444)' },
  { id: 'gradient3',label: 'Ocean',        type: 'gradient', value: 'linear-gradient(135deg,#0EA5E9,#06B6D4)' },
  { id: 'deemona',  label: 'Deemona',      type: 'gradient', value: 'linear-gradient(135deg,#0F172A,#1D4ED8)' },
];

interface VirtualBgProps {
  onClose: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onApply: (bg: { type: string; value: string; id: string }) => void;
  currentBg?: string;
}

export default function VirtualBackground({ onClose, onApply, currentBg = 'none' }: VirtualBgProps) {
  const [selected, setSelected] = useState(currentBg);
  const [customUrl, setCustomUrl] = useState('');
  const [preview, setPreview] = useState(false);

  function apply(bg: typeof BACKGROUNDS[0]) {
    setSelected(bg.id);
    onApply({ type: bg.type, value: bg.value, id: bg.id });
  }

  function applyCustom() {
    if (!customUrl.trim()) return;
    const bg = { id: 'custom', type: 'image', value: customUrl.trim(), label: 'Custom' };
    setSelected('custom');
    onApply(bg);
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',zIndex:1000}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{margin:'auto',background:'#0F172A',border:'1px solid #1E40AF',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(0,0,0,0.6)'}}>

        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #1E3A5F',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>🎨</span>
            <div>
              <div style={{color:'#F1F5F9',fontWeight:700,fontSize:15}}>Virtual Background</div>
              <div style={{fontSize:11,color:'#475569'}}>Choose a background for your video</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {/* Background grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {BACKGROUNDS.map(bg => (
              <button key={bg.id} onClick={() => apply(bg)}
                style={{
                  position:'relative',
                  height:80,
                  borderRadius:10,
                  border:`2px solid ${selected===bg.id?'#1D4ED8':'#1E3A5F'}`,
                  overflow:'hidden',
                  cursor:'pointer',
                  background: bg.type==='gradient' ? bg.value :
                              bg.type==='none' ? '#1E293B' :
                              bg.type==='blur' ? '#1E293B' : '#1E293B',
                  transition:'border-color 0.15s',
                  padding:0,
                }}>
                {bg.type === 'image' && (
                  <img src={bg.value} alt={bg.label}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                )}
                {bg.type === 'blur' && (
                  <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#1E293B,#334155)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,filter:'blur(2px)'}}>
                    🌫️
                  </div>
                )}
                {bg.type === 'none' && (
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#475569',fontSize:11,fontWeight:600}}>
                    No background
                  </div>
                )}
                {/* Label overlay */}
                <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.6)',padding:'3px 6px',fontSize:10,color:'#F1F5F9',textAlign:'center',fontWeight:600}}>
                  {bg.label}
                </div>
                {/* Selected indicator */}
                {selected === bg.id && (
                  <div style={{position:'absolute',top:4,right:4,width:18,height:18,borderRadius:'50%',background:'#1D4ED8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:700}}>
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom image URL */}
          <div style={{borderTop:'1px solid #1E3A5F',paddingTop:16}}>
            <div style={{fontSize:12,color:'#94A3B8',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Custom image</div>
            <div style={{display:'flex',gap:8}}>
              <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                placeholder="Paste image URL..."
                style={{flex:1,background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'8px 12px',color:'#F1F5F9',fontSize:13,outline:'none'}} />
              <button onClick={applyCustom}
                style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                Apply
              </button>
            </div>
          </div>

          {/* Note about browser support */}
          <div style={{marginTop:14,padding:'10px 14px',background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.2)',borderRadius:8,fontSize:12,color:'#F5A623'}}>
            ℹ️ Virtual backgrounds apply a CSS overlay effect. For AI-powered background removal, Chrome with camera permissions required.
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'12px 20px',borderTop:'1px solid #1E3A5F',display:'flex',justifyContent:'flex-end',gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'8px 18px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>Cancel</button>
          <button onClick={onClose} style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'8px 18px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Done</button>
        </div>
      </div>
    </div>
  );
}
