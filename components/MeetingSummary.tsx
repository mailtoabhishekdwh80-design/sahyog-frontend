'use client';
import { useState } from 'react';

interface MeetingSummaryProps {
  onClose: () => void;
  meetingId: string;
  meetingTitle?: string;
  apiFetch: (path: string, opts?: any) => Promise<any>;
}

export default function MeetingSummary({ onClose, meetingId, meetingTitle, apiFetch }: MeetingSummaryProps) {
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  async function generateSummary() {
    setLoading(true); setError('');
    try {
      // Fetch transcript
      const tRes = await apiFetch('/meetings/' + meetingId + '/transcript');
      const transcriptContent = tRes?.data?.[0]?.content || transcript;
      if (!transcriptContent.trim()) {
        setError('No transcript found. Please add transcript content below or start transcription first.');
        setLoading(false); return;
      }

      // Call Claude API via Anthropic
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a professional meeting summarizer. Analyze this meeting transcript and provide a concise, structured summary.

Meeting: ${meetingTitle || 'Team Meeting'}
Transcript:
${transcriptContent}

Provide a summary with these sections:
1. **Key Discussion Points** (3-5 bullet points)
2. **Decisions Made** (bullet points, or "None" if none)
3. **Action Items** (bullet points with owner if mentioned, or "None" if none)
4. **Next Steps** (1-3 bullet points)

Keep it concise and professional. Format in clean markdown.`
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      if (text) {
        setSummary(text);
      } else {
        setError('Could not generate summary. Please check API configuration.');
      }
    } catch (e: any) {
      setError('Error generating summary: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadSummary() {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary-' + meetingId.slice(0,8) + '.txt';
    a.click();
  }

  // Render markdown-like text
  function renderSummary(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{fontWeight:700,color:'#60A5FA',fontSize:13,marginTop:12,marginBottom:4}}>{line.replace(/\*\*/g,'')}</div>;
      }
      if (line.startsWith('# ')) {
        return <div key={i} style={{fontWeight:800,color:'#F1F5F9',fontSize:15,marginBottom:8}}>{line.slice(2)}</div>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <div key={i} style={{display:'flex',gap:8,padding:'3px 0'}}>
          <span style={{color:'#1D4ED8',flexShrink:0}}>•</span>
          <span style={{color:'#CBD5E1',fontSize:13,lineHeight:1.5}}>{line.slice(2).replace(/\*\*/g,'').replace(/\*/g,'')}</span>
        </div>;
      }
      if (line.match(/^\d+\. /)) {
        return <div key={i} style={{display:'flex',gap:8,padding:'3px 0'}}>
          <span style={{color:'#1D4ED8',flexShrink:0,minWidth:16}}>{line.match(/^\d+/)?.[0]}.</span>
          <span style={{color:'#CBD5E1',fontSize:13,lineHeight:1.5}}>{line.replace(/^\d+\. /,'').replace(/\*\*/g,'').replace(/\*/g,'')}</span>
        </div>;
      }
      if (!line.trim()) return <div key={i} style={{height:4}} />;
      return <div key={i} style={{color:'#94A3B8',fontSize:13,lineHeight:1.5,padding:'2px 0'}}>{line.replace(/\*\*/g,'').replace(/\*/g,'')}</div>;
    });
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',zIndex:1000}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{margin:'auto',background:'#0F172A',border:'1px solid #1E40AF',borderRadius:16,width:'100%',maxWidth:600,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(0,0,0,0.6)'}}>

        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #1E3A5F',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>🤖</span>
            <div>
              <div style={{color:'#F1F5F9',fontWeight:700,fontSize:15}}>AI Meeting Summary</div>
              <div style={{fontSize:11,color:'#475569'}}>{meetingTitle || 'Meeting'} · Powered by Claude</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:16}}>
          {!summary && (
            <>
              <div style={{background:'rgba(29,78,216,0.1)',border:'1px solid rgba(29,78,216,0.2)',borderRadius:10,padding:14,fontSize:13,color:'#93C5FD'}}>
                🎙️ This feature generates an AI summary from your meeting transcript. Start transcription during a meeting, then use this after it ends.
              </div>

              <div>
                <label style={{fontSize:12,color:'#94A3B8',fontWeight:600,display:'block',marginBottom:8}}>Or paste transcript manually:</label>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={6}
                  placeholder="Paste meeting transcript here if not auto-captured..."
                  style={{width:'100%',background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'10px 12px',color:'#F1F5F9',fontSize:13,outline:'none',resize:'vertical'}} />
              </div>

              {error && (
                <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:12,fontSize:13,color:'#FCA5A5'}}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={generateSummary} disabled={loading}
                style={{background:loading?'#334155':'linear-gradient(135deg,#1D4ED8,#7C3AED)',border:'none',borderRadius:10,padding:'12px 24px',color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {loading ? (
                  <>
                    <div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                    Generating summary...
                  </>
                ) : '🤖 Generate AI Summary'}
              </button>
            </>
          )}

          {summary && (
            <>
              <div style={{background:'#1E293B',border:'1px solid #1E3A5F',borderRadius:12,padding:20}}>
                <div style={{fontSize:15,fontWeight:800,color:'#F1F5F9',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                  <span>📋</span> Meeting Summary
                </div>
                {renderSummary(summary)}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={copyToClipboard}
                  style={{flex:1,background:copied?'#059669':'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'8px 16px',color:copied?'#6EE7B7':'#94A3B8',fontSize:13,cursor:'pointer',fontWeight:copied?600:400}}>
                  {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                </button>
                <button onClick={downloadSummary}
                  style={{flex:1,background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'8px 16px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>
                  ⬇ Download .txt
                </button>
                <button onClick={() => setSummary('')}
                  style={{background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'8px 14px',color:'#94A3B8',fontSize:13,cursor:'pointer'}}>
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
