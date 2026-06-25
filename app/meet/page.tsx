'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, isLoggedIn } from '../../lib/api';

function MeetRoom() {
  const searchParams = useSearchParams();
  const meetingId    = searchParams.get('id');
  const [status,     setStatus]   = useState<'joining'|'live'|'error'>('joining');
  const [meeting,    setMeeting]  = useState<any>(null);
  const [error,      setError]    = useState('');
  const [mic,        setMic]      = useState(true);
  const [cam,        setCam]      = useState(true);
  const [showChat,   setShowChat] = useState(false);
  const [messages,   setMessages] = useState<{name:string;text:string;time:string}[]>([]);
  const [chatMsg,    setChatMsg]  = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const [elapsed,    setElapsed]  = useState(0);
  const [recording,  setRecording]  = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recUrl,     setRecUrl]     = useState('');
  const [userName,   setUserName] = useState('You');

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    if (!meetingId)    { setError('No meeting ID'); setStatus('error'); return; }
    // Get user name from localStorage
    try {
      const u = JSON.parse(localStorage.getItem('sahyog_user') || '{}');
      if (u.display_name) setUserName(u.display_name.split(' ')[0]);
    } catch {}
    joinMeeting();
  }, [meetingId]);

  // Timer
  useEffect(() => {
    if (status !== 'live') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  async function joinMeeting() {
    try {
      const res = await api.joinMeeting(meetingId!);
      if (res?.error) { setError(res.error.message); setStatus('error'); return; }
      setMeeting(res?.data);
      setStatus('live');
      startLocalMedia();
    } catch (e: any) {
      setError(e.message || 'Failed to join');
      setStatus('error');
    }
  }

  async function startLocalMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch { console.warn('Media access denied'); }
  }

  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !mic; });
    setMic(m => !m);
  }

  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !cam; });
    setCam(c => !c);
  }

  async function leaveMeeting() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { await api.leaveMeeting(meetingId!); } catch {}
    window.location.href = '/';
  }

  function sendChat() {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, {
      name: userName,
      text: chatMsg.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatMsg('');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Meeting link copied!'))
      .catch(() => {});
  }

  async function startRecording() {
    setRecLoading(true);
    try {
      const res = await api.startRecording(meetingId!);
      if (res?.data?.egressId) {
        setRecording(true);
      } else {
        alert(res?.error?.message || 'Failed to start recording');
      }
    } catch { alert('Recording failed to start'); }
    setRecLoading(false);
  }

  async function stopRecording() {
    setRecLoading(true);
    try {
      const res = await api.stopRecording(meetingId!);
      if (res?.data?.recordingUrl) {
        setRecording(false);
        setRecUrl(res.data.recordingUrl);
        alert('Recording saved! Check meetings page for download link.');
      }
    } catch { alert('Failed to stop recording'); }
    setRecLoading(false);
  }

  if (status === 'joining') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="text-4xl">📹</span>
        </div>
        <div className="text-white text-lg font-medium">Joining meeting...</div>
        <div className="text-gray-500 text-sm">Setting up camera and microphone</div>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-5xl">⚠️</div>
        <div className="text-red-400 text-lg">{error}</div>
        <a href="/" className="inline-block text-emerald-400 hover:text-emerald-300 text-sm">← Back to workspace</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-semibold">{meeting?.title || 'Meeting'}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded font-mono">{formatTime(elapsed)}</span>
          {recording && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            🔗 Invite
          </button>
          <button onClick={() => setShowChat(s => !s)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${showChat ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            💬 Chat {messages.length > 0 && <span className="bg-emerald-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{messages.length}</span>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Local video tile */}
              <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video ref={localVideoRef} autoPlay muted playsInline
                  className={`w-full h-full object-cover ${!cam ? 'invisible' : ''}`} />
                {!cam && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-24 h-24 rounded-full bg-emerald-700 flex items-center justify-center text-4xl font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs text-white bg-black/60 backdrop-blur px-2 py-1 rounded-lg">
                    {userName} (you)
                  </span>
                  {!mic && <span className="text-red-400 bg-black/60 backdrop-blur p-1 rounded-lg">🔇</span>}
                </div>
              </div>

              {/* Waiting tile */}
              <div className="bg-gray-800 rounded-2xl flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                <div className="text-center space-y-3">
                  <div className="text-5xl">👥</div>
                  <div className="text-gray-400 text-sm">Waiting for others...</div>
                  <button onClick={copyLink}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors">
                    📋 Copy invite link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-center gap-4 py-5 bg-gray-950 border-t border-gray-800 shrink-0">
            {/* Mic */}
            <button onClick={toggleMic} title={mic ? 'Mute' : 'Unmute'}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                mic ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-700 hover:bg-red-600 text-white'
              }`}>
              <span className="text-xl">{mic ? '🎤' : '🔇'}</span>
              <span className="text-xs">{mic ? 'Mute' : 'Unmute'}</span>
            </button>

            {/* Camera */}
            <button onClick={toggleCam} title={cam ? 'Stop camera' : 'Start camera'}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                cam ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-700 hover:bg-red-600 text-white'
              }`}>
              <span className="text-xl">{cam ? '📹' : '🚫'}</span>
              <span className="text-xs">{cam ? 'Stop' : 'Start'}</span>
            </button>

            {/* Leave */}
            <button onClick={leaveMeeting} title="Leave meeting"
              className="w-16 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-0.5 transition-colors">
              <span className="text-xl">📵</span>
              <span className="text-xs">Leave</span>
            </button>

            {/* Chat toggle */}
            <button onClick={() => setShowChat(s => !s)} title="Toggle chat"
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                showChat ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}>
              <span className="text-xl">💬</span>
              <span className="text-xs">Chat</span>
            </button>

            {/* Record */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={recLoading}
              title={recording ? 'Stop recording' : 'Start recording'}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-50 ${
                recording
                  ? 'bg-red-700 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}>
              <span className="text-xl">{recLoading ? '⏳' : recording ? '⏹' : '🔴'}</span>
              <span className="text-xs">{recording ? 'Stop' : 'Record'}</span>
            </button>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-950 shrink-0">
            <div className="px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-semibold text-white">In-meeting chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-xs pt-12">
                  No messages yet<br/>Say hi! 👋
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`${m.name === userName ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-white">{m.name}</span>
                    <span className="text-xs text-gray-600">{m.time}</span>
                  </div>
                  <div className={`text-sm px-3 py-1.5 rounded-xl max-w-[90%] ${
                    m.name === userName
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message..."
                  className="flex-1 bg-gray-800 text-sm text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none border border-gray-700 focus:border-emerald-500"
                />
                <button onClick={sendChat}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                  ↑
                </button>
              </div>
            </div>
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
        <div className="text-emerald-400 animate-pulse">Loading meeting...</div>
      </div>
    }>
      <MeetRoom />
    </Suspense>
  );
}
