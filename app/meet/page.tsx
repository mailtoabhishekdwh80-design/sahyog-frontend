'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, isLoggedIn } from '../../lib/api';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

function MeetRoom() {
  const searchParams  = useSearchParams();
  const meetingId     = searchParams.get('id');
  const [status,      setStatus]      = useState<'joining'|'live'|'error'>('joining');
  const [token,       setToken]       = useState('');
  const [serverUrl,   setServerUrl]   = useState('');
  const [meeting,     setMeeting]     = useState<any>(null);
  const [error,       setError]       = useState('');
  const [elapsed,     setElapsed]     = useState(0);

  // Panels
  const [activePanel, setActivePanel] = useState<'chat'|'participants'|'notes'|'recordings'|null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput,    setChatInput]    = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Participants
  const [participants, setParticipants] = useState<any[]>([]);

  // Notes
  const [notes,     setNotes]     = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Recordings
  const [recordings, setRecordings] = useState<any[]>([]);

  // Recording
  const [recording,  setRecording]  = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  // Screen share
  const [sharing, setSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream|null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    if (!meetingId)    { setError('No meeting ID'); setStatus('error'); return; }
    joinMeeting();
  }, [meetingId]);

  // Timer
  useEffect(() => {
    if (status !== 'live') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Poll chat every 5 seconds
  useEffect(() => {
    if (status !== 'live' || !meetingId) return;
    loadChat();
    const t = setInterval(loadChat, 5000);
    return () => clearInterval(t);
  }, [status, meetingId]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  async function joinMeeting() {
    try {
      const res = await api.joinMeeting(meetingId!);
      if (res?.error) { setError(res.error.message); setStatus('error'); return; }
      setMeeting(res?.data);
      setToken(res?.data?.roomToken || '');
      setServerUrl(res?.data?.livekitUrl || 'wss://sahyog-j0f3bhnh.livekit.cloud');
      setStatus('live');
      // Load initial data
      loadParticipants();
      loadNotes();
      loadRecordings();
    } catch (e: any) {
      setError(e.message || 'Failed to join');
      setStatus('error');
    }
  }

  async function loadChat() {
    const res = await api.getMeetingChat(meetingId!);
    setChatMessages(res?.data || []);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function loadParticipants() {
    const res = await api.getParticipants(meetingId!);
    setParticipants(res?.data || []);
  }

  async function loadNotes() {
    const res = await api.getMeetingNotes(meetingId!);
    setNotes(res?.data?.content || '');
  }

  async function loadRecordings() {
    const res = await api.getRecordings(meetingId!);
    setRecordings(Array.isArray(res?.data) ? res.data : []);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    await api.sendMeetingChat(meetingId!, chatInput.trim());
    setChatInput('');
    loadChat();
  }

  async function saveNotes() {
    await api.saveMeetingNotes(meetingId!, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function startRecording() {
    setRecLoading(true);
    const res = await api.startRecording(meetingId!);
    if (res?.data?.egressId) setRecording(true);
    else alert(res?.error?.message || 'Failed to start recording');
    setRecLoading(false);
  }

  async function stopRecording() {
    setRecLoading(true);
    await api.stopRecording(meetingId!);
    setRecording(false);
    setTimeout(loadRecordings, 3000);
    setRecLoading(false);
  }

  async function toggleScreenShare() {
    if (sharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setSharing(false);
    } else {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        stream.getVideoTracks()[0].onended = () => { setSharing(false); screenStreamRef.current = null; };
        setSharing(true);
      } catch { alert('Screen sharing not available or denied'); }
    }
  }

  async function sendReminder() {
    const res = await api.sendReminder(meetingId!);
    alert(res?.data?.message || 'Reminder sent!');
  }

  async function leaveMeeting() {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    try { await api.leaveMeeting(meetingId!); } catch {}
    window.location.href = '/';
  }

  if (status === 'joining') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="text-4xl">📹</span>
        </div>
        <div className="text-white text-lg font-medium">Joining meeting...</div>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-5xl">⚠️</div>
        <div className="text-red-400 text-lg">{error}</div>
        <a href="/" className="inline-block text-emerald-400 hover:text-emerald-300 text-sm">← Back</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-semibold">{meeting?.title || 'Meeting'}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded font-mono">{formatTime(elapsed)}</span>
          {recording && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />REC
            </span>
          )}
          {sharing && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">📺 Sharing</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Panel toggles */}
          {[
            { id: 'participants', icon: '👥', label: `${participants.length}` },
            { id: 'chat',        icon: '💬', label: chatMessages.length > 0 ? `${chatMessages.length}` : '' },
            { id: 'notes',       icon: '📝', label: '' },
            { id: 'recordings',  icon: '⬇',  label: recordings.length > 0 ? `${recordings.length}` : '' },
          ].map(p => (
            <button key={p.id}
              onClick={() => setActivePanel(activePanel === p.id as any ? null : p.id as any)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activePanel === p.id ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}>
              {p.icon} {p.label}
            </button>
          ))}
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg">🔗</button>
          <button onClick={sendReminder}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg" title="Send reminder to participants">🔔</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 flex flex-col">
          {token ? (
            <LiveKitRoom token={token} serverUrl={serverUrl} connect={true} video={true} audio={true}
              onDisconnected={leaveMeeting} className="flex-1" style={{ height: 'calc(100vh - 120px)' }}>
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">No video token</div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 py-4 bg-gray-950 border-t border-gray-800 shrink-0 flex-wrap px-4">
            <button onClick={toggleScreenShare} title="Screen share"
              className={`flex flex-col items-center gap-0.5 w-14 h-14 rounded-full transition-colors ${sharing ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
              <span className="text-xl">📺</span>
              <span className="text-xs">{sharing ? 'Stop' : 'Share'}</span>
            </button>
            <button onClick={recording ? stopRecording : startRecording} disabled={recLoading}
              className={`flex flex-col items-center gap-0.5 w-14 h-14 rounded-full transition-colors disabled:opacity-50 ${recording ? 'bg-red-700 hover:bg-red-600 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
              <span className="text-xl">{recLoading ? '⏳' : recording ? '⏹' : '🔴'}</span>
              <span className="text-xs">{recording ? 'Stop' : 'Record'}</span>
            </button>
            <button onClick={leaveMeeting}
              className="flex flex-col items-center gap-0.5 w-16 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors">
              <span className="text-xl">📵</span>
              <span className="text-xs">Leave</span>
            </button>
          </div>
        </div>

        {/* Side panels */}
        {activePanel && (
          <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-950 shrink-0">
            {/* Participants panel */}
            {activePanel === 'participants' && (
              <>
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">👥 Participants ({participants.length})</span>
                  <button onClick={loadParticipants} className="text-xs text-gray-500 hover:text-gray-300">↻</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {participants.map((p: any) => (
                    <div key={p.user_id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                      <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-bold text-white">
                        {p.display_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{p.display_name}</div>
                        <div className="text-xs text-gray-500 capitalize">{p.role}</div>
                      </div>
                      {p.join_time && <span className="text-xs text-emerald-400">● Live</span>}
                    </div>
                  ))}
                  {participants.length === 0 && <p className="text-gray-600 text-sm text-center py-6">No participants yet</p>}
                </div>
              </>
            )}

            {/* Chat panel */}
            {activePanel === 'chat' && (
              <>
                <div className="px-4 py-3 border-b border-gray-800">
                  <span className="text-sm font-semibold text-white">💬 Meeting chat</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && <p className="text-gray-600 text-xs text-center py-6">No messages yet</p>}
                  {chatMessages.map((m: any, i: number) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white">{m.sender_name}</span>
                        <span className="text-xs text-gray-600">{new Date(m.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-300">{m.content}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-gray-800">
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Message everyone..."
                      className="flex-1 bg-gray-800 text-sm text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none border border-gray-700 focus:border-emerald-500" />
                    <button onClick={sendChat} className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg">↑</button>
                  </div>
                </div>
              </>
            )}

            {/* Notes panel */}
            {activePanel === 'notes' && (
              <>
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">📝 Meeting notes</span>
                  <button onClick={saveNotes} className={`text-xs px-3 py-1 rounded-lg transition-colors ${notesSaved ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                    {notesSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
                <div className="flex-1 p-3">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Take notes during the meeting... These are saved for all participants."
                    className="w-full h-full bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none leading-relaxed" />
                </div>
              </>
            )}

            {/* Recordings panel */}
            {activePanel === 'recordings' && (
              <>
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">⬇ Recordings</span>
                  <button onClick={loadRecordings} className="text-xs text-gray-500 hover:text-gray-300">↻</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {recordings.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-600 text-sm">No recordings yet</p>
                      <p className="text-gray-700 text-xs mt-1">Click 🔴 Record to start</p>
                    </div>
                  )}
                  {recordings.map((r: any, i: number) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎥</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">Recording {i + 1}</p>
                          {r.recorded_at && <p className="text-xs text-gray-500">{new Date(r.recorded_at).toLocaleString('en-IN')}</p>}
                        </div>
                      </div>
                      {r.recording_url && (
                        <a href={r.recording_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 text-xs px-3 py-2 rounded-lg transition-colors">
                          ⬇ Download MP4
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-emerald-400 animate-pulse">Loading...</div>
      </div>
    }>
      <MeetRoom />
    </Suspense>
  );
}
