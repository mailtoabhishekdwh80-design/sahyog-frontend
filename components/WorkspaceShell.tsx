'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import KanbanView from './KanbanView';
import { useWebSocket } from '../lib/useWebSocket';
import { api, isLoggedIn, logout } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────
type Workspace = { id: string; name: string; type: string };
type Channel   = { id: string; name: string; type: string; unread_count?: number };
type Board     = { id: string; name: string; workspace_id: string };
type List      = { id: string; name: string; position: number; board_id: string };
type Task      = { id: string; title: string; description?: string; list_id: string; priority: string; status: string };
type Message   = { id: string; content: string; sender_name: string; sent_at: string };

// ── Active view type ──────────────────────────────────────────
type View = 'channel' | 'board' | 'meetings' | 'home';

export default function WorkspaceShell() {
  // State
  const [workspaces, setWorkspaces]     = useState<Workspace[]>([]);
  const [activeWs, setActiveWs]         = useState<Workspace | null>(null);
  const [channels, setChannels]         = useState<Channel[]>([]);
  const [boards, setBoards]             = useState<Board[]>([]);
  const [activeView, setActiveView]     = useState<View>('home');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeBoard, setActiveBoard]   = useState<Board | null>(null);
  const [lists, setLists]               = useState<List[]>([]);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [newMsg, setNewMsg]             = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState<any>(null);
  const msgEndRef                       = useRef<HTMLDivElement>(null);
  const [typingUsers,    setTypingUsers]    = useState<string[]>([]);
  const [notifications,  setNotifications]  = useState<any[]>([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [showNotifs,     setShowNotifs]     = useState(false);
  const typingTimerRef                  = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── WebSocket real-time handler ──────────────────────────────
  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === 'message.new') {
      const newMsg = msg.payload;
      // Only append if we're viewing that channel
      setActiveChannel(current => {
        if (current?.id === newMsg.channel_id) {
          setMessages(prev => {
            // Deduplicate
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
        return current;
      });
    }
    if (msg.type === 'typing.indicator') {
      const { userId, displayName, channelId } = msg.payload;
      setActiveChannel(current => {
        if (current?.id !== channelId) return current;
        setTypingUsers(prev => prev.includes(displayName) ? prev : [...prev, displayName]);
        // Clear typing after 3s
        if (typingTimerRef.current[userId]) clearTimeout(typingTimerRef.current[userId]);
        typingTimerRef.current[userId] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(n => n !== displayName));
        }, 3000);
        return current;
      });
    }
    if (msg.type === 'presence.update') {
      // Could show online status — skip for now
    }
  }, []);

  const { subscribe, sendTyping } = useWebSocket(handleWSMessage);

  // ── Boot: check auth, load data ───────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    (async () => {
      const [meRes, wsRes, notifRes] = await Promise.all([api.me(), api.workspaces(), api.notifications()]);
      setNotifications(notifRes?.data?.notifications || []);
      setUnreadCount(notifRes?.data?.unread || 0);
      setUser(meRes?.data);
      const wsList: Workspace[] = wsRes?.data || [];
      setWorkspaces(wsList);
      if (wsList.length > 0) await switchWorkspace(wsList[0]);
      setLoading(false);
    })();
  }, []);

  async function switchWorkspace(ws: Workspace) {
    setActiveWs(ws);
    setActiveView('home');
    const [chRes, bdRes] = await Promise.all([
      api.channels(ws.id),
      api.boards(ws.id),
    ]);
    setChannels(chRes?.data || []);
    setBoards(bdRes?.data || []);
  }

  async function openChannel(ch: Channel) {
    setActiveChannel(ch);
    setActiveBoard(null);
    setActiveView('channel');
    setMessages([]);
    setTypingUsers([]);
    try {
      const res = await api.messages(ch.id);
      const msgs = Array.isArray(res?.data) ? res.data : [];
      setMessages(msgs.reverse());
    } catch(e) { setMessages([]); }
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    // Subscribe to WebSocket channel
    subscribe(ch.id);
  }

  async function openBoard(board: Board) {
    setActiveBoard(board);
    setActiveChannel(null);
    setActiveView('board');
    const [listRes, taskRes] = await Promise.all([
      api.lists(board.id),
      api.tasks(board.id),
    ]);
    setLists((listRes?.data || []).sort((a: List, b: List) => a.position - b.position));
    setTasks(taskRes?.data || []);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeChannel) return;
    const content = newMsg.trim();
    setNewMsg('');
    await api.sendMessage(activeChannel.id, content);
    const res = await api.messages(activeChannel.id);
    const msgs = Array.isArray(res?.data) ? res.data : [];
    setMessages(msgs.reverse());
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function addTask(listId: string) {
    if (!newTaskTitle.trim() || !activeBoard) return;
    await api.createTask(activeBoard.id, newTaskTitle.trim(), listId);
    setNewTaskTitle('');
    setAddingToList(null);
    const res = await api.tasks(activeBoard.id);
    setTasks(res?.data || []);
  }

  async function createDefaultBoard() {
    if (!activeWs) return;
    const res = await api.createBoard('Sprint Board', activeWs.id);
    if (res?.data?.id) {
      const board = res.data;
      setBoards(prev => [...prev, board]);
      await openBoard(board);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg animate-pulse">Loading Sahyog...</div>
      </div>
    );
  }

  // ── Priority badge ─────────────────────────────────────────
  const priorityColor: Record<string, string> = {
    low: 'bg-gray-700 text-gray-300',
    medium: 'bg-blue-900 text-blue-300',
    high: 'bg-orange-900 text-orange-300',
    critical: 'bg-red-900 text-red-300',
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── LEFT RAIL: Workspace switcher ── */}
      <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-2">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => switchWorkspace(ws)}
            title={ws.name}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              activeWs?.id === ws.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {ws.name.charAt(0).toUpperCase()}
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-2 pb-1">
          <button
            onClick={logout}
            title="Sign out"
            className="w-9 h-9 rounded-xl bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-300 text-sm transition-colors flex items-center justify-center"
          >
            ⏻
          </button>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Workspace name */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="font-semibold text-sm text-white truncate">{activeWs?.name}</div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-xs text-gray-500 truncate">{user?.display_name?.split(' ')[0]}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNotifs(s => !s)} className="relative text-gray-500 hover:text-white transition-colors">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={logout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Sign out</button>
            </div>
          </div>
        </div>

        {/* Notifications dropdown */}
        {showNotifs && (
          <div className="absolute left-0 right-0 top-16 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl mx-2 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-white">Notifications</span>
              <button onClick={async () => { await api.markAllRead(); setUnreadCount(0); setNotifications(prev => prev.map(n => ({...n, is_read: true}))); }}
                className="text-xs text-emerald-400 hover:text-emerald-300">Mark all read</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="text-center py-6 text-gray-600 text-xs">No notifications</div>
              )}
              {notifications.slice(0, 10).map((n: any) => (
                <div key={n.id} className={`px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800 cursor-pointer ${!n.is_read ? 'bg-gray-800/40' : ''}`}
                  onClick={async () => { if (!n.is_read) { await api.markRead(n.id); setUnreadCount(c => Math.max(0, c-1)); setNotifications(prev => prev.map(x => x.id === n.id ? {...x, is_read: true} : x)); } }}>
                  <div className="text-xs text-white">{n.title || n.body}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{new Date(n.sent_at).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
          {/* Home */}
          <button
            onClick={() => setActiveView('home')}
            className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
              activeView === 'home' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🏠 <span>Home</span>
          </button>

          {/* Channels */}
          <div className="pt-2">
            <div className="text-xs text-gray-500 px-2 mb-1 uppercase tracking-wider">Channels</div>
            {channels.filter(c => c.type === 'public' || c.type === 'announcement').slice(0, 8).map(ch => (
              <button
                key={ch.id}
                onClick={() => openChannel(ch)}
                className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 ${
                  activeChannel?.id === ch.id
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-gray-500">#</span>
                <span className="truncate">{ch.name}</span>
                {(ch.unread_count || 0) > 0 && (
                  <span className="ml-auto bg-emerald-600 text-white text-xs rounded-full px-1.5">{ch.unread_count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Boards */}
          <div className="pt-2">
            <div className="text-xs text-gray-500 px-2 mb-1 uppercase tracking-wider">Boards</div>
            {boards.map(b => (
              <button
                key={b.id}
                onClick={() => openBoard(b)}
                className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 ${
                  activeBoard?.id === b.id
                    ? 'bg-blue-900/50 text-blue-300'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>📋</span>
                <span className="truncate">{b.name}</span>
              </button>
            ))}
            <button
              onClick={createDefaultBoard}
              className="w-full text-left px-2 py-1 rounded text-sm text-gray-600 hover:text-gray-400 hover:bg-gray-800 flex items-center gap-1.5"
            >
              <span>+</span> <span>New board</span>
            </button>
          </div>

          {/* Admin */}
          <div className="pt-2">
            <a
              href="/admin"
              className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              ⚙️ <span>Admin</span>
            </a>
          </div>

          {/* Meetings */}
          <div className="pt-2">
            <button
              onClick={() => setActiveView('meetings')}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                activeView === 'meetings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              📹 <span>Meetings</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ─── HOME VIEW ─── */}
        {activeView === 'home' && (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-2xl font-bold text-white mb-1">
              Good day, {user?.display_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mb-8">Welcome to {activeWs?.name}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-emerald-400 text-2xl font-bold">{channels.length}</div>
                <div className="text-gray-400 text-sm mt-1">Channels</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-blue-400 text-2xl font-bold">{boards.length}</div>
                <div className="text-gray-400 text-sm mt-1">Boards</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-purple-400 text-2xl font-bold">{workspaces.length}</div>
                <div className="text-gray-400 text-sm mt-1">Workspaces</div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-white font-semibold mb-3">Quick actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {channels[0] && (
                  <button
                    onClick={() => openChannel(channels[0])}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-emerald-700 transition-colors"
                  >
                    <div className="text-emerald-400 font-medium"># {channels[0].name}</div>
                    <div className="text-gray-500 text-xs mt-1">Open channel</div>
                  </button>
                )}
                {boards[0] && (
                  <button
                    onClick={() => openBoard(boards[0])}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-700 transition-colors"
                  >
                    <div className="text-blue-400 font-medium">📋 {boards[0].name}</div>
                    <div className="text-gray-500 text-xs mt-1">Open board</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── CHANNEL / CHAT VIEW ─── */}
        {activeView === 'channel' && activeChannel && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
              <span className="text-gray-400">#</span>
              <span className="font-semibold text-white">{activeChannel.name}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-sm pt-8">
                  No messages yet. Say hi! 👋
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.sender_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 text-xs text-gray-500 italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Composer */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <input
                  value={newMsg}
                  onChange={e => {
                    setNewMsg(e.target.value);
                    if (e.target.value && activeChannel) sendTyping(activeChannel.id);
                  }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message #${activeChannel.name}`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim()}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── KANBAN BOARD VIEW ─── */}
        {activeView === 'board' && activeBoard && (
          <KanbanView
            boardId={activeBoard.id}
            boardName={activeBoard.name}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* ─── MEETINGS VIEW ─── */}
        {activeView === 'meetings' && (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-xl font-bold text-white mb-6">Meetings</h1>
            <MeetingsView />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meetings sub-view ─────────────────────────────────────────
function MeetingsView() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    api.meetings().then(res => setMeetings(res?.data || []));
  }, []);

  async function createMeeting() {
    if (!newTitle.trim()) return;
    const now = new Date();
    // Get workspaceId from parent scope via closure
    const wsRes = await api.workspaces();
    const workspaceId = wsRes?.data?.[0]?.id;
    if (!workspaceId) { alert('No workspace found'); return; }
    const res = await api.createMeeting({
      title:        newTitle.trim(),
      startsAt:     now.toISOString(),
      durationMins: 60,
      type:         'meeting',
      workspaceId,
      waitingRoom:  false,
    });
    if (res?.data?.id) {
      setNewTitle(''); setCreating(false);
      window.open(`/meet?id=${res.data.id}`, '_blank');
    } else if (res?.error) {
      alert('Failed to create meeting: ' + res.error.message);
    }
    api.meetings().then(r => setMeetings(r?.data || []));
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* New meeting button */}
      {creating ? (
        <div className="bg-gray-900 border border-emerald-700 rounded-xl p-4 space-y-3">
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createMeeting(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Meeting title..."
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
          <div className="flex gap-2">
            <button onClick={createMeeting} className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg">Start now</button>
            <button onClick={() => setCreating(false)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          📹 New meeting
        </button>
      )}

      {meetings.length === 0 && !creating && (
        <div className="text-gray-600 text-sm text-center py-8">No meetings scheduled</div>
      )}
      {meetings.map(m => (
        <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{m.title}</div>
              {m.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{m.description}</div>}
              <div className="text-xs text-gray-500 mt-2">
                📅 {new Date(m.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                m.status === 'live'      ? 'bg-red-900 text-red-300 animate-pulse' :
                m.status === 'scheduled' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-800 text-gray-400'
              }`}>
                {m.status}
              </span>
              {(m.status === 'live' || m.status === 'scheduled') && (
                <a href={`/meet?id=${m.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Join →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
