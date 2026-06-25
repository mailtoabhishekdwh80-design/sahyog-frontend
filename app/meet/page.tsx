'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, isLoggedIn } from '../../lib/api';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

function VideoRoom({ token, serverUrl, onLeave, meetingId, meetingTitle }: {
  token: string;
  serverUrl: string;
  onLeave: () => void;
  meetingId: string;
  meetingTitle: string;
}) {
  const [recording,  setRecording]  = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  async function startRecording() {
    setRecLoading(true);
    try {
      const res = await api.startRecording(meetingId);
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
      await api.stopRecording(meetingId);
      setRecording(false);
      alert('Recording saved to Cloudflare R2!');
    } catch { alert('Failed to stop recording'); }
    setRecLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-semibold">{meetingTitle}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">LIVE</span>
          {recording && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block" />
              REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={recLoading}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 ${
              recording
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {recLoading ? '⏳' : recording ? '⏹ Stop Recording' : '🔴 Record'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            🔗 Invite
          </button>
        </div>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onLeave}
        className="flex-1"
        style={{ height: 'calc(100vh - 57px)' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function MeetRoom() {
  const searchParams  = useSearchParams();
  const meetingId     = searchParams.get('id');
  const [status,      setStatus]   = useState<'joining'|'live'|'error'>('joining');
  const [token,       setToken]    = useState('');
  const [serverUrl,   setServerUrl] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('Meeting');
  const [error,       setError]    = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    if (!meetingId)    { setError('No meeting ID'); setStatus('error'); return; }
    joinMeeting();
  }, [meetingId]);

  async function joinMeeting() {
    try {
      const res = await api.joinMeeting(meetingId!);
      if (res?.error) { setError(res.error.message); setStatus('error'); return; }
      const data = res?.data;
      setToken(data?.roomToken || data?.token || data?.livekit_token || '');
      setServerUrl(data?.livekitUrl || data?.livekit_url || 'wss://sahyog-j0f3bhnh.livekit.cloud');
      setMeetingTitle(data?.title || data?.meeting?.title || 'Meeting');
      setStatus('live');
    } catch (e: any) {
      setError(e.message || 'Failed to join');
      setStatus('error');
    }
  }

  function handleLeave() {
    api.leaveMeeting(meetingId!).catch(() => {});
    window.location.href = '/';
  }

  if (status === 'joining') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="text-4xl">📹</span>
        </div>
        <div className="text-white text-lg font-medium">Joining meeting...</div>
        <div className="text-gray-500 text-sm">Connecting to LiveKit room</div>
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

  if (!token) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-red-400">No token received from server</div>
    </div>
  );

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      onLeave={handleLeave}
      meetingId={meetingId!}
      meetingTitle={meetingTitle}
    />
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
