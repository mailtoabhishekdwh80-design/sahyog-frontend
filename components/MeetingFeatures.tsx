'use client';
import { useState, useEffect, useRef } from 'react';

// ── Meeting Polls Component ────────────────────────────────────
export function MeetingPolls({ meetingId, isHost, apiFetch }: { meetingId: string; isHost: boolean; apiFetch: Function }) {
  const [polls, setPolls]         = useState<any[]>([]);
  const [creating, setCreating]   = useState(false);
  const [question, setQuestion]   = useState('');
  const [options, setOptions]     = useState(['', '']);

  useEffect(() => {
    loadPolls();
    const t = setInterval(loadPolls, 5000); // poll every 5s
    return () => clearInterval(t);
  }, [meetingId]);

  async function loadPolls() {
    const res = await apiFetch('/meetings/' + meetingId + '/polls');
    if (res?.data) setPolls(res.data);
  }

  async function createPoll() {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) { alert('Add a question and at least 2 options'); return; }
    await apiFetch('/meetings/' + meetingId + '/polls', {
      method: 'POST',
      body: JSON.stringify({ question: question.trim(), options: validOptions })
    });
    setQuestion(''); setOptions(['', '']); setCreating(false);
    loadPolls();
  }

  async function vote(pollId: string, option: string) {
    await apiFetch('/meetings/' + meetingId + '/polls/' + pollId + '/vote', {
      method: 'POST', body: JSON.stringify({ option })
    });
    loadPolls();
  }

  return (
    <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:14,fontWeight:700,color:'#F1F5F9'}}>📊 Polls</span>
        {isHost && (
          <button onClick={() => setCreating(!creating)}
            style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'4px 12px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            + Create Poll
          </button>
        )}
      </div>

      {creating && (
        <div style={{background:'#1E293B',borderRadius:10,padding:14,border:'1px solid #334155'}}>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Poll question..."
            style={{width:'100%',background:'#0F172A',border:'1px solid #334155',borderRadius:8,padding:'8px 10px',color:'#F1F5F9',fontSize:13,outline:'none',marginBottom:10}} />
          {options.map((opt, i) => (
            <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
              <input value={opt} onChange={e => { const o=[...options]; o[i]=e.target.value; setOptions(o); }}
                placeholder={`Option ${i+1}`}
                style={{flex:1,background:'#0F172A',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#F1F5F9',fontSize:12,outline:'none'}} />
              {options.length > 2 && (
                <button onClick={() => setOptions(options.filter((_,j)=>j!==i))}
                  style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:14}}>×</button>
              )}
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={() => setOptions([...options,''])}
              style={{background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'4px 10px',color:'#E2E8F0',fontSize:11,cursor:'pointer'}}>+ Option</button>
            <button onClick={createPoll}
              style={{background:'#1D4ED8',border:'none',borderRadius:6,padding:'4px 14px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>Launch</button>
            <button onClick={() => setCreating(false)}
              style={{background:'none',border:'none',color:'#E2E8F0',fontSize:12,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      {polls.length === 0 && !creating && (
        <div style={{textAlign:'center',color:'#E2E8F0',fontSize:13,padding:'20px 0'}}>No polls yet</div>
      )}

      {polls.map(poll => {
        const totalVotes = Object.keys(poll.votes || {}).length;
        const myVote = null; // would need userId prop
        return (
          <div key={poll.id} style={{background:'#1E293B',borderRadius:10,padding:14,border:'1px solid #334155'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#F1F5F9',marginBottom:10}}>{poll.question}</div>
            {(poll.options || []).map((opt: string) => {
              const voteCount = Object.values(poll.votes || {}).filter(v => v === opt).length;
              const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              return (
                <div key={opt} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <button onClick={() => vote(poll.id, opt)}
                      style={{background:'none',border:'none',color:'#E2E8F0',cursor:'pointer',fontSize:12,textAlign:'left',padding:0}}>
                      {opt}
                    </button>
                    <span style={{fontSize:11,color:'#E2E8F0'}}>{pct}% ({voteCount})</span>
                  </div>
                  <div style={{height:4,background:'#64748B',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',background:'#1D4ED8',width:pct+'%',transition:'width 0.3s'}} />
                  </div>
                </div>
              );
            })}
            <div style={{fontSize:11,color:'#E2E8F0',marginTop:8}}>{totalVotes} vote{totalVotes!==1?'s':''}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Breakout Rooms Component ───────────────────────────────────
export function BreakoutRooms({ meetingId, participants, isHost, apiFetch }: { meetingId: string; participants: any[]; isHost: boolean; apiFetch: Function }) {
  const [rooms, setRooms]           = useState<any[]>([]);
  const [numRooms, setNumRooms]     = useState(2);
  const [creating, setCreating]     = useState(false);
  const [assignment, setAssignment] = useState<Record<string,number>>({});

  async function loadRooms() {
    const res = await apiFetch('/meetings/' + meetingId + '/breakout-rooms');
    if (Array.isArray(res?.data)) setRooms(res.data);
  }

  useEffect(() => { loadRooms(); }, [meetingId]);

  function autoAssign() {
    const a: Record<string,number> = {};
    participants.forEach((p, i) => { a[p.id] = i % numRooms; });
    setAssignment(a);
  }

  async function launchRooms() {
    const roomList = Array.from({length: numRooms}, (_, i) => ({
      name: `Room ${i + 1}`,
      participants: participants.filter(p => assignment[p.id] === i).map(p => p.id)
    }));
    const res = await apiFetch('/meetings/' + meetingId + '/breakout-rooms', {
      method: 'POST', body: JSON.stringify({ rooms: roomList })
    });
    if (res?.data?.breakout_rooms) { setRooms(res.data.breakout_rooms); setCreating(false); }
  }

  async function closeRooms() {
    if (!confirm('Close all breakout rooms?')) return;
    await apiFetch('/meetings/' + meetingId + '/breakout-rooms', { method: 'DELETE' });
    setRooms([]);
  }

  return (
    <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:14,fontWeight:700,color:'#F1F5F9'}}>🚪 Breakout Rooms</span>
        {isHost && rooms.length === 0 && (
          <button onClick={() => { setCreating(!creating); autoAssign(); }}
            style={{background:'#1D4ED8',border:'none',borderRadius:8,padding:'4px 12px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            Create Rooms
          </button>
        )}
        {isHost && rooms.length > 0 && (
          <button onClick={closeRooms}
            style={{background:'#7F1D1D',border:'none',borderRadius:8,padding:'4px 12px',color:'#FCA5A5',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            Close All
          </button>
        )}
      </div>

      {creating && (
        <div style={{background:'#1E293B',borderRadius:10,padding:14,border:'1px solid #334155'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <span style={{fontSize:13,color:'#E2E8F0'}}>Number of rooms:</span>
            {[2,3,4,5].map(n => (
              <button key={n} onClick={() => { setNumRooms(n); autoAssign(); }}
                style={{width:32,height:32,borderRadius:8,background:numRooms===n?'#1D4ED8':'#64748B',border:'none',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:numRooms===n?700:400}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            {Array.from({length: numRooms}, (_, i) => (
              <div key={i} style={{marginBottom:8}}>
                <div style={{fontSize:12,color:'#60A5FA',fontWeight:600,marginBottom:4}}>Room {i+1}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {participants.filter(p => assignment[p.id] === i).map(p => (
                    <span key={p.id} style={{fontSize:11,background:'#1E3A5F',color:'#93C5FD',borderRadius:4,padding:'2px 6px'}}>{p.name || p.display_name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={autoAssign} style={{background:'#1E293B',border:'1px solid #334155',borderRadius:6,padding:'5px 12px',color:'#E2E8F0',fontSize:12,cursor:'pointer'}}>🔀 Shuffle</button>
            <button onClick={launchRooms} style={{background:'#1D4ED8',border:'none',borderRadius:6,padding:'5px 14px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>🚀 Launch</button>
          </div>
        </div>
      )}

      {rooms.length === 0 && !creating && (
        <div style={{textAlign:'center',color:'#E2E8F0',fontSize:13,padding:'20px 0'}}>No breakout rooms active</div>
      )}

      {rooms.map((room, i) => (
        <div key={room.id} style={{background:'#1E293B',borderRadius:10,padding:14,border:'1px solid #1E3A5F'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:'#F1F5F9'}}>🚪 {room.name}</span>
            <span style={{fontSize:11,color:'#22C55E',background:'rgba(34,197,94,0.1)',borderRadius:4,padding:'2px 6px'}}>Open</span>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {(room.participants || []).map((pid: string) => {
              const p = participants.find(p => p.id === pid);
              return (
                <span key={pid} style={{fontSize:11,background:'#0F172A',color:'#E2E8F0',borderRadius:4,padding:'2px 6px'}}>
                  {p?.name || p?.display_name || 'Participant'}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live Transcription Component ──────────────────────────────
export function LiveTranscription({ meetingId, isHost, apiFetch }: { meetingId: string; isHost: boolean; apiFetch: Function }) {
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load existing transcript
    apiFetch('/meetings/' + meetingId + '/transcript').then((res: any) => {
      if (res?.data?.[0]?.content) setTranscript(res.data[0].content);
    });
  }, [meetingId]);

  function startTranscription() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser. Use Chrome.'); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) setTranscript(prev => prev + final);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stopTranscription() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function saveTranscript() {
    await apiFetch('/meetings/' + meetingId + '/transcript', {
      method: 'POST', body: JSON.stringify({ content: transcript, language: 'en' })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function downloadTranscript() {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transcript-' + meetingId.slice(0,8) + '.txt'; a.click();
  }

  return (
    <div style={{padding:16,display:'flex',flexDirection:'column',gap:10,height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14,fontWeight:700,color:'#F1F5F9'}}>📝 Transcription</span>
          {recording && <span style={{fontSize:10,color:'#EF4444',background:'rgba(239,68,68,0.1)',borderRadius:4,padding:'2px 6px',display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#EF4444',display:'inline-block'}}/>LIVE
          </span>}
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={recording ? stopTranscription : startTranscription}
            style={{background:recording?'#7F1D1D':'#1D4ED8',border:'none',borderRadius:8,padding:'4px 10px',color:recording?'#FCA5A5':'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
            {recording ? '⏹ Stop' : '⏺ Start'}
          </button>
          {transcript && <>
            <button onClick={saveTranscript}
              style={{background:saved?'#065F46':'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'4px 10px',color:saved?'#6EE7B7':'#E2E8F0',fontSize:11,cursor:'pointer'}}>
              {saved ? '✓ Saved' : '💾 Save'}
            </button>
            <button onClick={downloadTranscript}
              style={{background:'#1E293B',border:'1px solid #334155',borderRadius:8,padding:'4px 10px',color:'#E2E8F0',fontSize:11,cursor:'pointer'}}>
              ⬇ Export
            </button>
          </>}
        </div>
      </div>

      {!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
        <div style={{background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.3)',borderRadius:8,padding:10,fontSize:12,color:'#F5A623'}}>
          ⚠️ Speech recognition requires Chrome browser
        </div>
      )}

      <div style={{flex:1,background:'#1E293B',borderRadius:10,padding:12,border:'1px solid #334155',overflowY:'auto',minHeight:120}}>
        {transcript ? (
          <p style={{fontSize:13,color:'#F1F5F9',lineHeight:1.7,margin:0,whiteSpace:'pre-wrap'}}>{transcript}</p>
        ) : (
          <p style={{fontSize:13,color:'#E2E8F0',textAlign:'center',marginTop:20}}>
            {recording ? 'Listening...' : 'Click Start to begin transcribing the meeting'}
          </p>
        )}
      </div>
    </div>
  );
}
