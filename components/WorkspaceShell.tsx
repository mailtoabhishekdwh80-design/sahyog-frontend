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
type Message   = { id: string; content: string; sender_name: string; sender_id: string; sent_at: string; is_edited?: boolean; is_pinned?: boolean; reply_count?: number; reactions?: Record<string, number>; channel_id?: string; };

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
  const [onlineUsers,    setOnlineUsers]    = useState<Set<string>>(new Set());
  const [threadMsg,      setThreadMsg]      = useState<any>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [threadReply,    setThreadReply]    = useState('');
  const [showDMs,        setShowDMs]        = useState(false);
  const [dmChannels,     setDmChannels]     = useState<any[]>([]);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChName,      setNewChName]      = useState('');
  const [newChDesc,      setNewChDesc]      = useState('');
  const [newChPrivate,   setNewChPrivate]   = useState(false);
  const [showPins,       setShowPins]       = useState(false);
  const [pins,           setPins]           = useState<any[]>([]);
  const [editingMsg,     setEditingMsg]     = useState<string|null>(null);
  const [editContent,    setEditContent]    = useState('');
  const [msgMenuId,      setMsgMenuId]      = useState<string|null>(null);
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState<any>(null);
  const [searching,      setSearching]      = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);
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
      const { userId, status } = msg.payload || {};
      if (userId) {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          if (status === 'online') next.add(userId);
          else next.delete(userId);
          return next;
        });
      }
    }
    if (msg.type === 'message.edit') {
      setMessages(prev => prev.map(m => m.id === msg.payload.id ? { ...m, content: msg.payload.content, is_edited: true } : m));
    }
    if (msg.type === 'message.delete') {
      setMessages(prev => prev.filter(m => m.id !== msg.payload.id));
    }
    if (msg.type === 'message.reaction') {
      setMessages(prev => prev.map(m => m.id === msg.payload.message_id ? { ...m, reactions: msg.payload.reactions } : m));
    }
  }, []);

  const { subscribe, sendTyping } = useWebSocket(handleWSMessage);

  // ── Search ────────────────────────────────────────────────────
  async function doSearch(q: string) {
    if (!q.trim() || q.length < 2) { setSearchResults(null); return; }
    setSearching(true);
    const res = await api.search(q);
    setSearchResults(res?.data || null);
    setSearching(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── File upload ───────────────────────────────────────────────
  async function uploadFile(file: File) {
    if (!activeChannel) return;
    setUploading(true);
    try {
      // Get upload URL
      const urlRes = await api.getUploadUrl(file.name, file.type, file.size);
      if (!urlRes?.data) { alert('Failed to get upload URL'); setUploading(false); return; }

      const { uploadUrl, storageKey, r2 } = urlRes.data;

      // Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) { alert('Upload failed'); setUploading(false); return; }

      // Confirm upload
      await api.confirmUpload({
        fileName:   file.name,
        mimeType:   file.type,
        sizeBytes:  file.size,
        storageKey,
      });

      // Send file message in channel
      const emoji = file.type.startsWith('image/') ? '🖼️' :
                    file.type.startsWith('video/') ? '🎥' :
                    file.type.startsWith('audio/') ? '🎵' :
                    file.type.includes('pdf')      ? '📄' : '📎';
      await api.sendMessage(activeChannel.id,
        `${emoji} **${file.name}** (${(file.size/1024).toFixed(1)} KB)
[Download](${uploadUrl})`
      );
      const res = await api.messages(activeChannel.id);
      setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { alert('Upload error'); }
    setUploading(false);
  }

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

  async function openThread(msg: any) {
    setThreadMsg(msg);
    const res = await api.threadMessages(msg.channel_id, msg.id);
    setThreadMessages(Array.isArray(res?.data) ? res.data : []);
  }

  async function sendThreadReply() {
    if (!threadReply.trim() || !threadMsg) return;
    await api.sendThreadReply(threadMsg.channel_id, threadMsg.id, threadReply.trim());
    setThreadReply('');
    const res = await api.threadMessages(threadMsg.channel_id, threadMsg.id);
    setThreadMessages(Array.isArray(res?.data) ? res.data : []);
  }

  async function addReaction(msg: any, emoji: string) {
    if (!activeChannel) return;
    await api.addReaction(activeChannel.id, msg.id, emoji);
    const res = await api.messages(activeChannel.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    setMsgMenuId(null);
  }

  async function pinMessage(msgId: string) {
    if (!activeChannel) return;
    await api.pinMessage(activeChannel.id, msgId);
    setMsgMenuId(null);
  }

  async function startEditMessage(msg: any) {
    setEditingMsg(msg.id);
    setEditContent(msg.content);
    setMsgMenuId(null);
  }

  async function saveEditMessage(msgId: string) {
    if (!activeChannel || !editContent.trim()) return;
    await api.editMessage(activeChannel.id, msgId, editContent.trim());
    setEditingMsg(null);
    setEditContent('');
    const res = await api.messages(activeChannel.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
  }

  async function deleteMessage(msgId: string) {
    if (!activeChannel) return;
    if (!confirm('Delete this message?')) return;
    await api.deleteMessage(activeChannel.id, msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setMsgMenuId(null);
  }

  async function loadPins() {
    if (!activeChannel) return;
    const res = await api.getPins(activeChannel.id);
    setPins(res?.data || []);
    setShowPins(true);
  }

  async function createChannel() {
    if (!newChName.trim() || !activeWs) return;
    const res = await api.createChannel(activeWs.id, newChName.trim(), newChDesc.trim(), newChPrivate);
    if (res?.data?.id) {
      setShowNewChannel(false); setNewChName(''); setNewChDesc(''); setNewChPrivate(false);
      const chRes = await api.channels(activeWs.id);
      setChannels(Array.isArray(chRes?.data) ? chRes.data : []);
    }
  }

  function parseMentions(content: string) {
    return content.replace(/@(\w+)/g, '<span style="color:#34D399;font-weight:600">@$1</span>');
  }

  function formatContent(content: string) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#1F2937;padding:2px 6px;border-radius:4px;font-family:monospace">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background:#1F2937;padding:8px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:12px">$1</pre>');
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
              <div className="ml-auto flex items-center gap-2">
                <button onClick={loadPins} className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-800" title="Pinned messages">📌</button>
                <button onClick={() => setShowSearch(true)} className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-800" title="Search">🔍</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-sm pt-8">
                  No messages yet. Say hi! 👋
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="flex gap-3 hover:bg-gray-800/40 px-2 py-1 rounded-lg group relative">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 relative">
                    {msg.sender_name?.charAt(0) || '?'}
                    {onlineUsers.has(msg.sender_id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.is_edited && <span className="text-xs text-gray-600 italic">(edited)</span>}
                      {msg.is_pinned && <span className="text-xs text-yellow-500">📌</span>}
                    </div>

                    {/* Editable or display */}
                    {editingMsg === msg.id ? (
                      <div className="flex gap-2 mt-1">
                        <input autoFocus value={editContent} onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditMessage(msg.id); if (e.key === 'Escape') setEditingMsg(null); }}
                          className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-emerald-500 focus:outline-none" />
                        <button onClick={() => saveEditMessage(msg.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                        <button onClick={() => setEditingMsg(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 mt-0.5 break-words leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: formatContent(parseMentions(msg.content)) }} />
                    )}

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msg.reactions as Record<string, number>).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => addReaction(msg, emoji)}
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-700">
                            {emoji} <span className="text-gray-400">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread replies */}
                    {(msg.reply_count ?? 0) > 0 && (
                      <button onClick={() => openThread(msg)}
                        className="mt-1 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        💬 {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg px-1 py-0.5 shadow-lg z-10">
                    {['👍','❤️','😂','🎉','🔥'].map(emoji => (
                      <button key={emoji} onClick={() => addReaction(msg, emoji)}
                        className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm">{emoji}</button>
                    ))}
                    <button onClick={() => openThread(msg)} className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm" title="Reply in thread">💬</button>
                    <div className="relative">
                      <button onClick={() => setMsgMenuId(msgMenuId === msg.id ? null : msg.id)}
                        className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm">⋯</button>
                      {msgMenuId === msg.id && (
                        <div className="absolute right-0 top-7 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-40">
                          <button onClick={() => pinMessage(msg.id)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">📌 Pin message</button>
                          {msg.sender_id === user?.id && <>
                            <button onClick={() => startEditMessage(msg)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">✏️ Edit</button>
                            <button onClick={() => deleteMessage(msg.id)} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-800">🗑️ Delete</button>
                          </>}
                        </div>
                      )}
                    </div>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors text-lg"
                  title="Attach file"
                >
                  {uploading ? '⏳' : '📎'}
                </button>
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

        {/* ─── THREAD PANEL ─── */}
      {threadMsg && (
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-40 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Thread</span>
            <button onClick={() => setThreadMsg(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          {/* Original message */}
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                {threadMsg.sender_name?.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-semibold text-white">{threadMsg.sender_name}</span>
                <p className="text-xs text-gray-300 mt-0.5">{threadMsg.content}</p>
              </div>
            </div>
          </div>
          {/* Thread replies */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {threadMessages.map(m => (
              <div key={m.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {m.sender_name?.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">{m.sender_name}</span>
                  <p className="text-xs text-gray-300 mt-0.5">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Reply composer */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <input value={threadReply} onChange={e => setThreadReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendThreadReply()}
                placeholder="Reply in thread..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
              <button onClick={sendThreadReply} disabled={!threadReply.trim()} className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 text-sm">↑</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PINS PANEL ─── */}
      {showPins && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowPins(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="text-white font-semibold">📌 Pinned messages</span>
              <button onClick={() => setShowPins(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
              {pins.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No pinned messages</p>}
              {pins.map((p: any) => (
                <div key={p.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{p.sender_name}</span>
                    <span className="text-xs text-gray-500">pinned by {p.pinned_by_name}</span>
                  </div>
                  <p className="text-sm text-gray-300">{p.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW CHANNEL MODAL ─── */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowNewChannel(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Create channel</h3>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Channel name</label>
              <input value={newChName} onChange={e => setNewChName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. marketing, dev-team"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description <span className="text-gray-600">(optional)</span></label>
              <input value={newChDesc} onChange={e => setNewChDesc(e.target.value)}
                placeholder="What's this channel about?"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setNewChPrivate(!newChPrivate)}
                className={`w-10 h-5 rounded-full transition-colors ${newChPrivate ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full ml-0.5 transition-transform ${newChPrivate ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-300">Private channel</span>
            </div>
            <div className="flex gap-3">
              <button onClick={createChannel} disabled={!newChName.trim()}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
                Create channel
              </button>
              <button onClick={() => setShowNewChannel(false)} className="text-gray-500 hover:text-gray-300 px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SEARCH MODAL ─── */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-20 px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSearch(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <span className="text-gray-400 text-lg">🔍</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
                placeholder="Search messages, tasks, people..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              />
              {searching && <span className="text-gray-500 text-xs animate-pulse">Searching...</span>}
              <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {!searchResults && !searching && (
                <div className="text-center py-12 text-gray-600 text-sm">
                  Type to search messages, tasks, people...
                </div>
              )}

              {searchResults && (
                <div className="divide-y divide-gray-800">
                  {/* Messages */}
                  {searchResults.messages?.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">Messages</div>
                      {searchResults.messages.map((m: any) => (
                        <div key={m.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                          onClick={() => setShowSearch(false)}>
                          <span className="text-gray-500 text-sm">#</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500">{m.channel_name} · {m.sender_name}</div>
                            <div className="text-sm text-white truncate mt-0.5">{m.content}</div>
                          </div>
                          <div className="text-xs text-gray-600 shrink-0">
                            {new Date(m.sent_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks?.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">Tasks</div>
                      {searchResults.tasks.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                          onClick={() => setShowSearch(false)}>
                          <span className="text-gray-500">☑</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{t.title}</div>
                            <div className="text-xs text-gray-500">{t.board_name}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                            t.priority === 'critical' ? 'bg-red-900 text-red-300' :
                            'bg-gray-800 text-gray-400'
                          }`}>{t.priority}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* People */}
                  {searchResults.users?.length > 0 && (
                    <div className="p-3">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">People</div>
                      {searchResults.users.map((u: any) => (
                        <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                          onClick={() => setShowSearch(false)}>
                          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {u.display_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm text-white">{u.display_name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {searchResults && !searchResults.messages?.length && !searchResults.tasks?.length && !searchResults.users?.length && (
                    <div className="text-center py-8 text-gray-600 text-sm">No results for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
  const [creating,    setCreating]    = useState(false);
  const [newTitle,    setNewTitle]    = useState('');
  const [meetDate,    setMeetDate]    = useState('');
  const [meetTime,    setMeetTime]    = useState('');
  const [meetDur,     setMeetDur]     = useState(60);
  const [startNow,    setStartNow]    = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [orgMembers,  setOrgMembers]  = useState<any[]>([]);
  const [invitedIds,  setInvitedIds]  = useState<string[]>([]);
  const [meetDesc,    setMeetDesc]    = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    api.meetings().then(res => setMeetings(res?.data || []));
    // Load org members for invite
    api.adminMembers().then(res => setOrgMembers(Array.isArray(res?.data) ? res.data : []));
    const d = new Date(Date.now() + 60 * 60 * 1000);
    setMeetDate(d.toISOString().split('T')[0]);
    setMeetTime(d.toTimeString().slice(0, 5));
  }, []);

  function toggleInvite(userId: string) {
    setInvitedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  async function createMeeting() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const wsRes = await api.workspaces();
    const workspaceId = wsRes?.data?.[0]?.id;
    if (!workspaceId) { alert('No workspace found'); setSaving(false); return; }

    let startsAt: string;
    if (startNow) {
      startsAt = new Date().toISOString();
    } else {
      if (!meetDate || !meetTime) { alert('Please select date and time'); setSaving(false); return; }
      startsAt = new Date(`${meetDate}T${meetTime}`).toISOString();
    }

    const res = await api.createMeeting({
      title:          newTitle.trim(),
      description:    meetDesc.trim() || undefined,
      startsAt,
      durationMins:   meetDur,
      type:           'meeting',
      workspaceId,
      waitingRoom:    false,
      participantIds: invitedIds,
    });

    setSaving(false);
    if (res?.data?.id) {
      setNewTitle(''); setCreating(false); setInvitedIds([]); setMeetDesc('');
      if (startNow) window.open(`/meet?id=${res.data.id}`, '_blank');
    } else if (res?.error) {
      alert('Failed: ' + res.error.message);
    }
    api.meetings().then(r => setMeetings(r?.data || []));
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* New meeting form */}
      {creating ? (
        <div className="bg-gray-900 border border-emerald-700 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">New meeting</h3>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setCreating(false)}
              placeholder="e.g. Sprint planning, 1:1 with team..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Start now or schedule */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">When</label>
            <div className="flex gap-2">
              <button onClick={() => setStartNow(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${startNow ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                ▶ Start now
              </button>
              <button onClick={() => setStartNow(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${!startNow ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                📅 Schedule
              </button>
            </div>
          </div>

          {/* Date & time (only when scheduling) */}
          {!startNow && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(d => (
                <button key={d} onClick={() => setMeetDur(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${meetDur === d ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {d < 60 ? `${d}m` : `${d/60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description <span className="text-gray-600">(optional)</span></label>
            <input value={meetDesc} onChange={e => setMeetDesc(e.target.value)}
              placeholder="Agenda or notes..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Invite members */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">
              Invite team members
              {invitedIds.length > 0 && (
                <span className="ml-2 bg-emerald-900 text-emerald-300 text-xs px-1.5 py-0.5 rounded-full">
                  {invitedIds.length} invited
                </span>
              )}
            </label>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-1.5 text-xs border border-gray-700 focus:outline-none focus:border-emerald-500 mb-2"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 bg-gray-800 rounded-lg p-2">
              {orgMembers
                .filter(m => !memberSearch || m.display_name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.email?.toLowerCase().includes(memberSearch.toLowerCase()))
                .map((m: any) => (
                  <div key={m.id}
                    onClick={() => toggleInvite(m.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      invitedIds.includes(m.id) ? 'bg-emerald-900/50 border border-emerald-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      invitedIds.includes(m.id) ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-200'
                    }`}>
                      {m.display_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{m.display_name}</div>
                      <div className="text-xs text-gray-500 truncate">{m.email}</div>
                    </div>
                    {invitedIds.includes(m.id) && (
                      <span className="text-emerald-400 text-xs shrink-0">✓</span>
                    )}
                  </div>
                ))
              }
              {orgMembers.length === 0 && (
                <div className="text-xs text-gray-600 text-center py-3">No members found</div>
              )}
            </div>
          </div>

          {/* Invited summary */}
          {invitedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {invitedIds.map(id => {
                const m = orgMembers.find((x: any) => x.id === id);
                return m ? (
                  <span key={id} className="flex items-center gap-1 bg-emerald-900/40 border border-emerald-800 text-emerald-300 text-xs px-2 py-0.5 rounded-full">
                    {m.display_name?.split(' ')[0]}
                    <button onClick={() => toggleInvite(id)} className="hover:text-white ml-0.5">×</button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={createMeeting} disabled={saving || !newTitle.trim()}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
              {saving ? 'Creating...' : startNow ? '▶ Start meeting' : '📅 Schedule meeting'}
            </button>
            <button onClick={() => { setCreating(false); setInvitedIds([]); setMeetDesc(''); }}
              className="text-xs text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800">
              Cancel
            </button>
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
                  className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  {m.status === 'live' ? '▶ Join live' : 'Join →'}
                </a>
              )}
              {m.participant_count > 0 && (
                <span className="text-xs text-gray-500">
                  👥 {m.participant_count} invited
                </span>
              )}
              {m.metadata?.recording_url && (
                <a href={m.metadata.recording_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                  ⬇ Recording
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
