'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { api, apiFetch, isLoggedIn } from '../lib/api';
import KanbanView from './KanbanView';

// ── Types ─────────────────────────────────────────────────────
type Workspace = { id: string; name: string; type: string };
type Channel   = { id: string; name: string; type: string; description?: string; unread_count?: number };
type Board     = { id: string; name: string };
type Message = { id: string; content: string; sender_name: string; sender_id: string; sent_at: string; is_edited?: boolean; is_pinned?: boolean; reply_count?: number; reactions?: Record<string, number>; channel_id?: string; };

// ── Helpers ───────────────────────────────────────────────────
function parseMentions(content: string) {
  return content.replace(/@(\w+)/g, '<span style="color:#34D399;font-weight:600">@$1</span>');
}
function formatContent(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#1F2937;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#1F2937;padding:8px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:12px;white-space:pre-wrap">$1</pre>');
}
function renderMessage(content: string) {
  const fileMatch = content.match(/^\[(image|file):(.+?)\]\((.+?)\)$/);
  if (fileMatch) {
    const [, type, name, url] = fileMatch;
    if (type === 'image') return { isFile: true, isImage: true, name, url };
    return { isFile: true, isImage: false, name, url };
  }
  return { isFile: false, html: formatContent(parseMentions(content)) };
}

// ── Main Component ────────────────────────────────────────────
export default function WorkspaceShell() {
  const [user,           setUser]           = useState<any>(null);
  const [workspaces,     setWorkspaces]     = useState<Workspace[]>([]);
  const [activeWs,       setActiveWs]       = useState<Workspace | null>(null);
  const [channels,       setChannels]       = useState<Channel[]>([]);
  const [boards,         setBoards]         = useState<Board[]>([]);
  const [activeChannel,  setActiveChannel]  = useState<Channel | null>(null);
  const [activeBoard,    setActiveBoard]    = useState<Board | null>(null);
  const [activeView,     setActiveView]     = useState<'home'|'meetings'|'admin'>('home');
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [newMessage,     setNewMessage]     = useState('');
  const [sending,        setSending]        = useState(false);
  const [typingUsers,    setTypingUsers]    = useState<string[]>([]);
  const [onlineUsers,    setOnlineUsers]    = useState<Set<string>>(new Set());

  // Notifications
  const [notifications,  setNotifications]  = useState<any[]>([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [showNotifs,     setShowNotifs]     = useState(false);

  // Search
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState<any>(null);
  const [searching,      setSearching]      = useState(false);

  // Threads
  const [threadMsg,      setThreadMsg]      = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [threadReply,    setThreadReply]    = useState('');

  // Message actions
  const [msgMenuId,      setMsgMenuId]      = useState<string | null>(null);
  const [editingMsg,     setEditingMsg]     = useState<string | null>(null);
  const [editContent,    setEditContent]    = useState('');

  // Pins
  const [showPins,       setShowPins]       = useState(false);
  const [pins,           setPins]           = useState<any[]>([]);

  // New channel
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChName,      setNewChName]      = useState('');
  const [newChDesc,      setNewChDesc]      = useState('');
  const [newChPrivate,   setNewChPrivate]   = useState(false);

  // DMs
  const [dmList,         setDmList]         = useState<any[]>([]);
  const [activeDM,       setActiveDM]       = useState<any>(null);
  const [dmMessages,     setDmMessages]     = useState<any[]>([]);
  const [dmNewMsg,       setDmNewMsg]       = useState('');
  const [showNewDM,      setShowNewDM]      = useState(false);
  const [dmSearch,       setDmSearch]       = useState('');
  const [dmOrgMembers,   setDmOrgMembers]   = useState<any[]>([]);

  // File upload
  const [uploading,      setUploading]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bookmarks
  const [bookmarks,      setBookmarks]      = useState<any[]>([]);
  const [showBookmarks,  setShowBookmarks]  = useState(false);

  // Channel browser
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [allChannels,    setAllChannels]    = useState<any[]>([]);
  const [channelSearch,  setChannelSearch]  = useState('');

  // Status
  const [showStatus,     setShowStatus]     = useState(false);
  const [statusEmoji,    setStatusEmoji]    = useState('');
  const [statusText,     setStatusText]     = useState('');

  // Channel message search
  const [showMsgSearch,  setShowMsgSearch]  = useState(false);
  const [showAI,         setShowAI]         = useState(false);
  const [aiMessages,     setAiMessages]     = useState<{role:string;content:string}[]>([]);
  const [aiInput,        setAiInput]        = useState('');
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiSummary,      setAiSummary]      = useState('');
  const [showAISummary,  setShowAISummary]  = useState(false);
  const [showSchedule,   setShowSchedule]   = useState(false);
  const [scheduleDate,   setScheduleDate]   = useState('');
  const [scheduleTime,   setScheduleTime]   = useState('');
  const [scheduledMsgs,  setScheduledMsgs]  = useState<any[]>([]);
  const [showScheduled,  setShowScheduled]  = useState(false);
  const [showAnalytics,  setShowAnalytics]  = useState(false);
  const [analytics,      setAnalytics]      = useState<any>(null);
  const [customEmojis,   setCustomEmojis]   = useState<any[]>([]);
  const [showEmojiMgr,   setShowEmojiMgr]   = useState(false);
  const [newEmojiName,   setNewEmojiName]   = useState('');
  const [showConnect,    setShowConnect]     = useState(false);
  const [connectEmail,   setConnectEmail]   = useState('');
  const [connectOrg,     setConnectOrg]     = useState('');
  const [recording,      setRecording]      = useState(false);
  const [audioChunks,    setAudioChunks]    = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [msgSearch,      setMsgSearch]      = useState('');

  // Org members (for meetings, tasks etc)
  const [orgMembers,     setOrgMembers]     = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const activeChRef    = useRef<Channel | null>(null);
  const activeDMRef    = useRef<any>(null);
  useEffect(() => { activeChRef.current = activeChannel; }, [activeChannel]);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    // Register push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      Notification.requestPermission().then(async (permission) => {
        if (permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZJgFRfYBZqjGiTwQR1fC9DGa3LA'
            });
            await api.savePushSub(sub);
          } catch {}
        }
      });
    }
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    api.me().then(res => { setUser(res?.data); setStatusEmoji(res?.data?.status_emoji || ''); setStatusText(res?.data?.status_text || ''); });
    api.workspaces().then(res => {
      const wsList = res?.data || [];
      setWorkspaces(wsList);
      if (wsList.length > 0) openWorkspace(wsList[0]);
    });
    api.notifications().then(res => {
      setNotifications(res?.data?.notifications || []);
      setUnreadCount(res?.data?.unread || 0);
    });
    connectWS();
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); } };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); wsRef.current?.close(); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, dmMessages]);

  // ── WebSocket ───────────────────────────────────────────────
  function connectWS() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sahyog_token') : null;
    if (!token) return;
    const ws = new WebSocket(`wss://sahyog-api-ajbr.onrender.com/ws?token=${token}`);
    ws.onopen = () => { wsRef.current = ws; };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'message.new') {
          const payload = msg.payload as Message;
          if (activeChRef.current && payload.channel_id === activeChRef.current.id) {
            setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload]);
          }
          if (activeDMRef.current && payload.channel_id === activeDMRef.current.id) {
            setDmMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload]);
          }
        }
        if (msg.type === 'typing.start') {
          const name = msg.payload?.senderName;
          if (name) { setTypingUsers(p => p.includes(name) ? p : [...p, name]); setTimeout(() => setTypingUsers(p => p.filter(n => n !== name)), 3000); }
        }
        if (msg.type === 'presence.update') {
          const { userId, status } = msg.payload || {};
          if (userId) setOnlineUsers(prev => { const n = new Set(prev); status === 'online' ? n.add(userId) : n.delete(userId); return n; });
        }
        if (msg.type === 'message.edit') setMessages(prev => prev.map(m => m.id === msg.payload.id ? { ...m, content: msg.payload.content, is_edited: true } : m));
        if (msg.type === 'message.delete') setMessages(prev => prev.filter(m => m.id !== msg.payload.id));
        if (msg.type === 'message.reaction') setMessages(prev => prev.map(m => m.id === msg.payload.message_id ? { ...m, reactions: msg.payload.reactions } : m));
        if (msg.type === 'notification.new') { setNotifications(p => [msg.payload, ...p]); setUnreadCount(c => c + 1); }
      } catch {}
    };
    ws.onclose = () => setTimeout(connectWS, 3000);
  }

  function subscribe(channelId: string) {
    wsRef.current?.send(JSON.stringify({ type: 'channel.join', payload: { channelId } }));
  }

  // ── Workspace ───────────────────────────────────────────────
  async function openWorkspace(ws: Workspace) {
    setActiveWs(ws);
    setActiveChannel(null); setActiveBoard(null); setActiveDM(null);
    const [chRes, bRes, dmRes, membersRes] = await Promise.all([
      api.channels(ws.id), api.boards(ws.id), api.dmList(), api.adminMembers(),
    ]);
    setChannels(Array.isArray(chRes?.data) ? chRes.data : []);
    setBoards(Array.isArray(bRes?.data) ? bRes.data : []);
    setDmList(dmRes?.data || []);
    const members = Array.isArray(membersRes?.data) ? membersRes.data : [];
    setOrgMembers(members); setDmOrgMembers(members);
  }

  // ── Channels ────────────────────────────────────────────────
  async function openChannel(ch: Channel) {
    setActiveChannel(ch); setActiveBoard(null); setActiveDM(null); setActiveView('home');
    setMessages([]); setShowMsgSearch(false); setMsgSearch('');
    const res = await api.messages(ch.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    subscribe(ch.id);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChannel) return;
    setSending(true);
    await api.sendMessage(activeChannel.id, newMessage.trim());
    setNewMessage(''); setSending(false);
  }

  async function createChannel() {
    if (!newChName.trim() || !activeWs) return;
    const res = await api.createChannel(activeWs.id, newChName.trim(), newChDesc.trim(), newChPrivate);
    if (res?.data?.id) {
      setShowNewChannel(false); setNewChName(''); setNewChDesc(''); setNewChPrivate(false);
      const r = await api.channels(activeWs.id);
      setChannels(Array.isArray(r?.data) ? r.data : []);
    }
  }

  // ── DMs ─────────────────────────────────────────────────────
  async function openDM(dm: any) {
    setActiveDM(dm); setActiveChannel(null); setActiveBoard(null); setActiveView('home');
    const res = await api.messages(dm.id);
    setDmMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    subscribe(dm.id);
  }

  async function sendDMMessage() {
    if (!dmNewMsg.trim() || !activeDM) return;
    await api.sendMessage(activeDM.id, dmNewMsg.trim());
    setDmNewMsg('');
  }

  async function startDM(userId: string) {
    const res = await api.createDM(userId);
    if (res?.data?.id) {
      setShowNewDM(false); setDmSearch('');
      await api.dmList().then(r => setDmList(r?.data || []));
      openDM(res.data);
    }
  }

  // ── Messages actions ─────────────────────────────────────────
  async function addReaction(msg: Message, emoji: string) {
    if (!activeChannel) return;
    await api.addReaction(activeChannel.id, msg.id, emoji);
    const res = await api.messages(activeChannel.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    setMsgMenuId(null);
  }

  async function openThread(msg: Message) {
    setThreadMsg(msg);
    const res = await api.threadMessages(msg.channel_id || activeChannel!.id, msg.id);
    setThreadMessages(Array.isArray(res?.data) ? res.data : []);
  }

  async function sendThreadReply() {
    if (!threadReply.trim() || !threadMsg) return;
    await api.sendThreadReply(threadMsg.channel_id || activeChannel!.id, threadMsg.id, threadReply.trim());
    setThreadReply('');
    const res = await api.threadMessages(threadMsg.channel_id || activeChannel!.id, threadMsg.id);
    setThreadMessages(Array.isArray(res?.data) ? res.data : []);
  }

  async function pinMessage(msgId: string) {
    if (!activeChannel) return;
    await api.pinMessage(activeChannel.id, msgId);
    setMsgMenuId(null);
  }

  async function loadPins() {
    if (!activeChannel) return;
    const res = await api.getPins(activeChannel.id);
    setPins(res?.data || []); setShowPins(true);
  }

  async function startEditMessage(msg: Message) {
    setEditingMsg(msg.id); setEditContent(msg.content); setMsgMenuId(null);
  }

  async function saveEditMessage(msgId: string) {
    if (!activeChannel || !editContent.trim()) return;
    await api.editMessage(activeChannel.id, msgId, editContent.trim());
    setEditingMsg(null); setEditContent('');
    const res = await api.messages(activeChannel.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
  }

  async function deleteMessage(msgId: string) {
    if (!activeChannel || !confirm('Delete this message?')) return;
    await api.deleteMessage(activeChannel.id, msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setMsgMenuId(null);
  }

  async function bookmarkMessage(msgId: string) {
    await api.addBookmark(msgId); setMsgMenuId(null);
    alert('Message saved!');
  }

  // ── AI Assistant ─────────────────────────────────────────────
  async function sendAIMessage() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    const res = await api.aiChat(userMsg, activeChannel?.id, activeBoard?.id);
    setAiLoading(false);
    if (res?.data?.reply) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    }
  }

  async function summarizeChannel() {
    if (!activeChannel) return;
    setShowAISummary(true);
    setAiSummary('Summarizing...');
    const res = await api.aiSummarize(activeChannel.id);
    setAiSummary(res?.data?.summary || 'Could not summarize.');
  }

  // ── Voice messages ──────────────────────────────────────────
  async function startRecordingVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await uploadFile(file);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setAudioChunks([]);
      setRecording(true);
    } catch { alert('Microphone access denied'); }
  }

  function stopRecordingVoice() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  // ── Schedule message ─────────────────────────────────────
  async function scheduleMessage() {
    if (!newMessage.trim() || !activeChannel || !scheduleDate || !scheduleTime) return;
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    await api.scheduleMessage(activeChannel.id, newMessage.trim(), scheduledAt);
    setNewMessage(''); setShowSchedule(false); setScheduleDate(''); setScheduleTime('');
    alert('Message scheduled!');
  }

  async function loadScheduled() {
    if (!activeChannel) return;
    const res = await api.getScheduled(activeChannel.id);
    setScheduledMsgs(res?.data || []);
    setShowScheduled(true);
  }

  // ── Channel analytics ────────────────────────────────────
  async function loadAnalytics() {
    if (!activeChannel) return;
    const res = await api.channelAnalytics(activeChannel.id);
    setAnalytics(res?.data);
    setShowAnalytics(true);
  }

  // ── Custom emoji ─────────────────────────────────────────
  async function loadCustomEmojis() {
    const res = await api.getCustomEmojis();
    setCustomEmojis(res?.data || []);
    setShowEmojiMgr(true);
  }

  async function addCustomEmoji() {
    if (!newEmojiName.trim()) return;
    const url = prompt('Paste image URL for the emoji:');
    if (!url) return;
    await api.addCustomEmoji(newEmojiName.trim(), url);
    setNewEmojiName('');
    const res = await api.getCustomEmojis();
    setCustomEmojis(res?.data || []);
  }

  // ── Sahyog Connect ───────────────────────────────────────
  async function sendConnectInvite() {
    if (!connectEmail.trim() || !activeChannel) return;
    await api.connectInvite(connectEmail.trim(), activeChannel.id, connectOrg.trim());
    alert('Connect invite sent to ' + connectEmail);
    setConnectEmail(''); setConnectOrg(''); setShowConnect(false);
  }

  // ── File upload ──────────────────────────────────────────────
  async function uploadFile(file: File) {
    const channelId = activeChannel?.id || activeDM?.id;
    if (!channelId) return;
    setUploading(true);
    try {
      const wsRes = await api.workspaces();
      const workspaceId = wsRes?.data?.[0]?.id;
      const urlRes = await api.getUploadUrl(file.name, file.type, file.size, workspaceId);
      if (!urlRes?.data?.uploadUrl) throw new Error('No upload URL');
      await fetch(urlRes.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const fileUrl = urlRes.data.fileUrl || urlRes.data.uploadUrl.split('?')[0];
      const isImage = file.type.startsWith('image/');
      await api.sendMessage(channelId, `[${isImage ? 'image' : 'file'}:${file.name}](${fileUrl})`);
      const res = await api.messages(channelId);
      if (activeChannel) setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
      else setDmMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    } catch { alert('Upload failed. Please try again.'); }
    setUploading(false);
  }

  // ── Bookmarks ────────────────────────────────────────────────
  async function loadBookmarks() {
    const res = await api.getBookmarks();
    setBookmarks(res?.data || []); setShowBookmarks(true);
  }

  // ── Channel browser ───────────────────────────────────────────
  async function loadChannelBrowser() {
    if (activeWs) {
      const res = await api.channels(activeWs.id);
      setAllChannels(res?.data || []);
    }
    setShowChannelBrowser(true);
  }

  // ── Status ───────────────────────────────────────────────────
  async function saveStatus() {
    await api.setStatus(statusEmoji, statusText);
    setShowStatus(false);
    setUser((u: any) => u ? { ...u, status_emoji: statusEmoji, status_text: statusText } : u);
  }

  // ── Search ───────────────────────────────────────────────────
  async function runSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    const res = await api.search(q);
    setSearchResults(res?.data || null);
    setSearching(false);
  }

  const msgSearchResults = msgSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(msgSearch.toLowerCase()))
    : [];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Workspace header */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
              {activeWs?.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{activeWs?.name || 'Sahyog'}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              {(user?.status_emoji || user?.status_text) && (
                <div className="text-xs text-gray-400 truncate">{user?.status_emoji} {user?.status_text}</div>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {/* Home */}
          <button onClick={() => { setActiveView('home'); setActiveChannel(null); setActiveBoard(null); setActiveDM(null); }}
            className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${activeView === 'home' && !activeChannel && !activeBoard && !activeDM ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            🏠 <span>Home</span>
          </button>

          {/* Notifications */}
          <button onClick={() => setShowNotifs(s => !s)}
            className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800">
            🔔 <span>Notifications</span>
            {unreadCount > 0 && <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
          </button>

          {/* DMs */}
          <div className="pt-2">
            <div className="text-xs text-gray-500 px-2 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Direct Messages</span>
              <button onClick={() => { setShowNewDM(true); api.orgMembers().then(r => setDmOrgMembers(Array.isArray(r?.data) ? r.data : [])); }}
                className="text-gray-600 hover:text-gray-300 text-base leading-none" title="New DM">+</button>
            </div>
            {dmList.map((dm: any) => (
              <button key={dm.id} onClick={() => openDM(dm)}
                className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 ${activeDM?.id === dm.id ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <div className="w-4 h-4 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {dm.other_name?.charAt(0) || '?'}
                </div>
                <span className="truncate">{dm.other_name || dm.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ml-auto shrink-0 ${onlineUsers.has(dm.other_id) ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              </button>
            ))}
          </div>

          {/* Channels */}
          <div className="pt-2">
            <div className="text-xs text-gray-500 px-2 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Channels</span>
              <button onClick={() => setShowNewChannel(true)} className="text-gray-600 hover:text-gray-300 text-base leading-none" title="New channel">+</button>
            </div>
            {channels.filter(c => c.type !== 'direct').slice(0, 10).map(ch => (
              <button key={ch.id} onClick={() => openChannel(ch)}
                className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 ${activeChannel?.id === ch.id ? 'bg-emerald-900/50 text-emerald-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <span className="text-gray-500">#</span>
                <span className="truncate">{ch.name}</span>
                {(ch.unread_count ?? 0) > 0 && (
                  <span className="ml-auto bg-emerald-600 text-white text-xs rounded-full px-1.5">{(ch.unread_count ?? 0) > 99 ? '99+' : ch.unread_count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Boards */}
          <div className="pt-2">
            <div className="text-xs text-gray-500 px-2 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Boards</span>
              <button onClick={async () => {
                const name = prompt('Board name?');
                if (!name) return;
                const wsRes = await api.workspaces();
                const wsId = wsRes?.data?.[0]?.id;
                if (wsId) { await api.createBoard(name, wsId); const r = await api.boards(wsId); setBoards(Array.isArray(r?.data) ? r.data : []); }
              }} className="text-gray-600 hover:text-gray-300 text-base leading-none" title="New board">+</button>
            </div>
            {boards.map(b => (
              <div key={b.id} className="flex items-center group">
                <button onClick={() => { setActiveBoard(b); setActiveChannel(null); setActiveDM(null); }}
                  className={`flex-1 text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 ${activeBoard?.id === b.id ? 'bg-blue-900/50 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span className="text-xs">B</span><span className="truncate">{b.name}</span>
                </button>
                <button onClick={async () => {
                  if (!confirm('Delete board "' + b.name + '"?')) return;
                  await apiFetch('/boards/' + b.id, { method: 'DELETE' });
                  if (activeBoard?.id === b.id) setActiveBoard(null);
                  const wsRes = await api.workspaces();
                  const wsId = wsRes?.data?.[0]?.id;
                  if (wsId) { const r = await api.boards(wsId); setBoards(Array.isArray(r?.data) ? r.data : []); }
                }} className="hidden group-hover:block text-gray-600 hover:text-red-400 text-xs px-1.5 py-1 rounded">x</button>
              </div>
            ))}
          </div>

          {/* System links */}
          <div className="pt-2">
            <button onClick={() => setActiveView('meetings')}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${activeView === 'meetings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              📹 <span>Meetings</span>
            </button>
            <a href="/admin" className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 block mt-0.5">
              🛡️ <span>Admin</span>
            </a>
            <a href="/settings" className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 block mt-0.5">
              ⚙️ <span>Settings</span>
            </a>
            <button onClick={() => setShowStatus(true)}
              className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 mt-0.5">
              <span>{user?.status_emoji || '😊'}</span><span className="truncate">{user?.status_text || 'Set status'}</span>
            </button>
            <button onClick={loadBookmarks}
              className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 mt-0.5">
              🔖 <span>Saved messages</span>
            </button>
            <button onClick={loadChannelBrowser}
              className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 mt-0.5">
              🔭 <span>Browse channels</span>
            </button>
          </div>
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-800 space-y-2">
          {/* User info + status */}
          <button onClick={() => setShowStatus(true)}
            className="w-full flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors text-left">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                {user?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              {/* Availability dot based on status */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                user?.status_text?.toLowerCase().includes('meeting') ? 'bg-red-500' :
                user?.status_text?.toLowerCase().includes('vacation') ? 'bg-yellow-500' :
                user?.status_text?.toLowerCase().includes('focus') || user?.status_text?.toLowerCase().includes('disturb') ? 'bg-yellow-500' :
                user?.status_text?.toLowerCase().includes('sick') ? 'bg-gray-500' :
                'bg-emerald-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {user?.display_name || user?.email?.split('@')[0]}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.status_text ? `${user?.status_emoji || ''} ${user?.status_text}` : 'Set a status...'}
              </div>
            </div>
          </button>
          {/* Quick actions row */}
          <div className="flex items-center gap-1">
            <button onClick={loadBookmarks} title="Saved messages"
              className="flex-1 text-xs text-gray-500 hover:text-white hover:bg-gray-800 px-2 py-1.5 rounded transition-colors text-center">
              Saved
            </button>
            <button onClick={loadChannelBrowser} title="Browse channels"
              className="flex-1 text-xs text-gray-500 hover:text-white hover:bg-gray-800 px-2 py-1.5 rounded transition-colors text-center">
              Browse
            </button>
            <button onClick={() => api.logout()} title="Sign out"
              className="flex-1 text-xs text-gray-500 hover:text-red-400 hover:bg-gray-800 px-2 py-1.5 rounded transition-colors text-center">
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* DM View */}
        {activeDM && !activeChannel && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
                {activeDM.other_name?.charAt(0) || '?'}
              </div>
              <span className="font-semibold text-white">{activeDM.other_name || activeDM.name}</span>
              {onlineUsers.has(activeDM.other_id) && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Active now
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {dmMessages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-purple-800 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                    {activeDM.other_name?.charAt(0) || '?'}
                  </div>
                  <p className="text-white font-semibold">{activeDM.other_name}</p>
                  <p className="text-gray-500 text-sm mt-1">Start a conversation</p>
                </div>
              )}
              {dmMessages.map((msg: any) => {
                const rendered = renderMessage(msg.content);
                return (
                  <div key={msg.id} className="flex gap-3 hover:bg-gray-800/40 px-2 py-1 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {(msg.sender_name || msg.display_name)?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-white">{msg.sender_name || msg.display_name}</span>
                        <span className="text-xs text-gray-600">{new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {rendered.isFile ? (
                        rendered.isImage ? (
                          <img src={rendered.url} alt={rendered.name} className="mt-1 max-w-xs max-h-48 rounded-lg border border-gray-700 cursor-pointer" onClick={() => window.open(rendered.url, '_blank')} />
                        ) : (
                          <a href={rendered.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-sm text-emerald-400 max-w-xs">
                            📎 <span className="truncate">{rendered.name}</span>
                          </a>
                        )
                      ) : (
                        <p className="text-sm text-gray-300 mt-0.5 break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered.html || '' }} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <div className="flex gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-gray-300">{uploading ? '⏳' : '📎'}</button>
                <input value={dmNewMsg} onChange={e => setDmNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendDMMessage()}
                  placeholder={`Message ${activeDM.other_name || ''}...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
                <button onClick={sendDMMessage} disabled={!dmNewMsg.trim()} className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 font-bold text-lg">↑</button>
              </div>
            </div>
          </div>
        )}

        {/* Channel View */}
        {activeChannel && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Channel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
              <span className="text-gray-400">#</span>
              <span className="font-semibold text-white">{activeChannel.name}</span>
              {activeChannel.description && <span className="text-xs text-gray-500 hidden md:block">— {activeChannel.description}</span>}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={loadPins} className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-800" title="Pins">📌</button>
                <button onClick={() => setShowMsgSearch(s => !s)} className={`text-sm px-2 py-1 rounded hover:bg-gray-800 ${showMsgSearch ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`} title="Search in channel">🔍</button>
                <button onClick={async () => { if (activeChannel) { await api.notifyHere(activeChannel.id, `@here`); alert('All channel members notified!'); } }}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Notify all members">@here</button>
                <button onClick={loadAnalytics}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Channel analytics">Analytics</button>
                <button onClick={() => setShowAI(s => !s)}
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-800 font-medium ${showAI ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`} title="AI Assistant">AI</button>
                <button onClick={summarizeChannel}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Summarize channel">Summarize</button>
                <button onClick={loadScheduled}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Scheduled messages">Scheduled</button>
                <button onClick={loadCustomEmojis}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Custom emoji">Emoji</button>
                <button onClick={() => setShowConnect(true)}
                  className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800" title="Sahyog Connect">Connect</button>
                <button onClick={() => setShowSearch(true)} className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800 hidden md:block">Ctrl+K</button>
              </div>
            </div>

            {/* Channel search */}
            {showMsgSearch && (
              <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/80">
                <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)}
                  placeholder={`Search in #${activeChannel.name}...`} autoFocus
                  className="w-full bg-gray-800 text-sm text-white placeholder-gray-500 rounded-lg px-3 py-1.5 focus:outline-none border border-gray-700 focus:border-emerald-500" />
                {msgSearch && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {msgSearchResults.length === 0 && <p className="text-xs text-gray-600 px-1">No results</p>}
                    {msgSearchResults.map(m => (
                      <div key={m.id} className="text-xs bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-gray-400 font-medium">{m.sender_name}</span>
                        <span className="text-gray-300 ml-2">{m.content?.substring(0, 80)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => {
                const rendered = renderMessage(msg.content);
                return (
                  <div key={msg.id} className="flex gap-3 hover:bg-gray-800/40 px-2 py-1.5 rounded-lg group relative">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 relative">
                      {msg.sender_name?.charAt(0) || '?'}
                      {onlineUsers.has(msg.sender_id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                        <span className="text-xs text-gray-600">{new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.is_edited && <span className="text-xs text-gray-600 italic">(edited)</span>}
                        {msg.is_pinned && <span className="text-xs text-yellow-500">📌</span>}
                      </div>

                      {editingMsg === msg.id ? (
                        <div className="flex gap-2 mt-1">
                          <input autoFocus value={editContent} onChange={e => setEditContent(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditMessage(msg.id); if (e.key === 'Escape') setEditingMsg(null); }}
                            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-emerald-500 focus:outline-none" />
                          <button onClick={() => saveEditMessage(msg.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                          <button onClick={() => setEditingMsg(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                        </div>
                      ) : rendered.isFile ? (
                        rendered.isImage ? (
                          <img src={rendered.url} alt={rendered.name} className="mt-1 max-w-xs max-h-48 rounded-lg border border-gray-700 cursor-pointer hover:opacity-90" onClick={() => window.open(rendered.url, '_blank')} />
                        ) : (
                          <a href={rendered.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 max-w-xs">
                            📎 <span className="truncate">{rendered.name}</span>
                          </a>
                        )
                      ) : (
                        <p className="text-sm text-gray-200 break-words leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: rendered.html || '' }} />
                      )}

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => addReaction(msg, emoji)}
                              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-700">
                              {emoji} <span className="text-gray-400">{count as number}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Thread replies */}
                      {(msg.reply_count ?? 0) > 0 && (
                        <button onClick={() => openThread(msg)} className="mt-1 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                          💬 {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg px-1 py-0.5 shadow-lg z-10">
                      {[...['👍','❤️','😂','🎉','🔥'], ...customEmojis.slice(0,3).map((e: any) => e.name)].map(emoji => (
                        <button key={emoji} onClick={() => addReaction(msg, emoji)} className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm">{emoji}</button>
                      ))}
                      <button onClick={() => openThread(msg)} className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm" title="Reply in thread">💬</button>
                      <div className="relative">
                        <button onClick={() => setMsgMenuId(msgMenuId === msg.id ? null : msg.id)} className="hover:bg-gray-800 px-1.5 py-0.5 rounded text-sm">⋯</button>
                        {msgMenuId === msg.id && (
                          <div className="absolute right-0 top-7 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 py-1 min-w-40">
                            <button onClick={() => pinMessage(msg.id)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">📌 Pin message</button>
                            <button onClick={() => bookmarkMessage(msg.id)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">🔖 Save message</button>
                            {msg.sender_id === user?.id && <>
                              <button onClick={() => startEditMessage(msg)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800">✏️ Edit</button>
                              <button onClick={() => deleteMessage(msg.id)} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-800">🗑️ Delete</button>
                            </>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUsers.length > 0 && (
                <div className="text-xs text-gray-500 px-2 animate-pulse">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Assistant Panel */}
            {showAI && (
              <div className="border-t border-gray-800 bg-gray-950 flex flex-col" style={{height:'320px'}}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">A</div>
                    <span className="text-sm font-semibold text-white">Sahyog AI</span>
                    <span className="text-xs text-gray-500">Ask anything about this channel or workspace</span>
                  </div>
                  <button onClick={() => setShowAI(false)} className="text-gray-500 hover:text-white text-xs">x</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {aiMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 text-center py-2">Ask me anything! Try:</p>
                      {['Summarize recent discussion', 'What are the action items?', 'Draft a reply to the last message', 'Translate last message to Hindi'].map(s => (
                        <button key={s} onClick={() => { setAiInput(s); }}
                          className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">A</div>
                      )}
                      <div className={`max-w-xs rounded-xl px-3 py-2 text-xs ${m.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">A</div>
                      <div className="bg-gray-800 rounded-xl px-3 py-2 text-xs text-gray-400 animate-pulse">Thinking...</div>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 border-t border-gray-800 flex gap-2 shrink-0">
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendAIMessage()}
                    placeholder="Ask Sahyog AI..."
                    className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-emerald-500" />
                  <button onClick={sendAIMessage} disabled={!aiInput.trim() || aiLoading}
                    className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg">Send</button>
                </div>
              </div>
            )}

            {/* Schedule panel */}
            {showSchedule && (
              <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/80 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Schedule:</span>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none" />
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none" />
                <button onClick={scheduleMessage} disabled={!scheduleDate || !scheduleTime || !newMessage.trim()}
                  className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg">Send</button>
                <button onClick={() => setShowSchedule(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
              </div>
            )}

            {/* Composer */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-900 shrink-0">
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <div className="flex items-end gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-gray-500">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 pb-0.5" title="Upload file">
                  {uploading ? '...' : 'File'}
                </button>
                <button onClick={recording ? stopRecordingVoice : startRecordingVoice}
                  className={`text-xs pb-0.5 px-1 rounded ${recording ? 'text-red-400 animate-pulse font-medium' : 'text-gray-500 hover:text-gray-300'}`}
                  title={recording ? 'Stop recording' : 'Voice message'}>
                  {recording ? 'Stop' : 'Voice'}
                </button>
                <button onClick={() => setShowSchedule(s => !s)}
                  className={`text-xs pb-0.5 px-1 rounded ${showSchedule ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Schedule message">
                  Later
                </button>
                <textarea value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message #${activeChannel.name}...`} rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-32" />
                <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 font-bold text-lg pb-0.5">↑</button>
              </div>
            </div>
          </div>
        )}

        {/* Board View */}
        {activeBoard && !activeChannel && !activeDM && (
          <KanbanView boardId={activeBoard.id} boardName={activeBoard.name} onBack={() => setActiveBoard(null)} />
        )}

        {/* Home / Meetings / Admin View */}
        {!activeChannel && !activeBoard && !activeDM && (
          <div className="flex-1 overflow-y-auto">
            {activeView === 'home' && <HomeView user={user} channels={channels} boards={boards} workspaces={workspaces} onChannel={openChannel} onBoard={(b: any) => { setActiveBoard(b); setActiveChannel(null); }} />}
            {activeView === 'meetings' && <MeetingsView />}
          </div>
        )}
      </div>

      {/* Thread panel */}
      {threadMsg && (
        <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-900 shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Thread</span>
            <button onClick={() => setThreadMsg(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{threadMsg.sender_name?.charAt(0)}</div>
              <div><span className="text-xs font-semibold text-white">{threadMsg.sender_name}</span><p className="text-xs text-gray-300 mt-0.5">{threadMsg.content}</p></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {threadMessages.map((m: any) => (
              <div key={m.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0">{m.sender_name?.charAt(0)}</div>
                <div><span className="text-xs font-semibold text-white">{m.sender_name}</span><p className="text-xs text-gray-300 mt-0.5">{m.content}</p></div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <input value={threadReply} onChange={e => setThreadReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendThreadReply()}
                placeholder="Reply in thread..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
              <button onClick={sendThreadReply} disabled={!threadReply.trim()} className="text-emerald-400 disabled:text-gray-600 text-sm">↑</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Notifications */}
      {showNotifs && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-end z-50 p-4 pt-16"
          onClick={e => { if (e.target === e.currentTarget) setShowNotifs(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-80 shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-white font-semibold">Notifications</span>
              <div className="flex gap-2">
                <button onClick={async () => { await api.markAllRead(); setUnreadCount(0); setNotifications(p => p.map(n => ({ ...n, is_read: true }))); }}
                  className="text-xs text-emerald-400 hover:text-emerald-300">Mark all read</button>
                <button onClick={() => setShowNotifs(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
              {notifications.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No notifications</p>}
              {notifications.map((n: any) => (
                <div key={n.id} className={`px-4 py-3 ${!n.is_read ? 'bg-emerald-950/20' : ''}`}>
                  <p className="text-sm text-white">{n.title || n.body}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pins modal */}
      {showPins && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowPins(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="text-white font-semibold">📌 Pinned messages</span>
              <button onClick={() => setShowPins(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

      {/* New channel modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowNewChannel(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Create channel</h3>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Channel name</label>
              <input value={newChName} onChange={e => setNewChName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. marketing, dev-team"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
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

      {/* Analytics modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowAnalytics(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">#{activeChannel?.name} Analytics</span>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-400">{analytics.totalMessages}</div>
                <div className="text-xs text-gray-500 mt-1">Total messages</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{analytics.activeUsers}</div>
                <div className="text-xs text-gray-500 mt-1">Active members (30d)</div>
              </div>
            </div>
            {analytics.topSenders?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Top contributors</div>
                <div className="space-y-2">
                  {analytics.topSenders.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">{s.display_name?.charAt(0)}</div>
                      <span className="text-sm text-white flex-1">{s.display_name}</span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{s.count} msgs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analytics.msgByDay?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Messages last 7 days</div>
                <div className="flex items-end gap-1 h-16">
                  {analytics.msgByDay.map((d: any, i: number) => {
                    const max = Math.max(...analytics.msgByDay.map((x: any) => parseInt(x.count)));
                    const h = max > 0 ? (parseInt(d.count) / max) * 100 : 10;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="bg-emerald-600 rounded-sm w-full" style={{ height: `${h}%` }} title={d.count + ' msgs'} />
                        <span className="text-xs text-gray-600">{new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled messages modal */}
      {showScheduled && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowScheduled(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="text-white font-semibold">Scheduled messages</span>
              <button onClick={() => setShowScheduled(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {scheduledMsgs.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No scheduled messages</p>}
              {scheduledMsgs.map((m: any) => (
                <div key={m.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white">{m.content}</p>
                    <p className="text-xs text-emerald-400 mt-1">Sends: {new Date(m.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <button onClick={async () => { if (activeChannel) { await api.cancelScheduled(activeChannel.id, m.id); loadScheduled(); } }}
                    className="text-xs text-red-500 hover:text-red-400">Cancel</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom emoji modal */}
      {showEmojiMgr && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowEmojiMgr(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Custom emoji</span>
              <button onClick={() => setShowEmojiMgr(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="flex gap-2">
              <input value={newEmojiName} onChange={e => setNewEmojiName(e.target.value)}
                placeholder=":emoji-name:" className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              <button onClick={addCustomEmoji} disabled={!newEmojiName.trim()}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Add</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {customEmojis.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No custom emoji yet. Add one above!</p>}
              <div className="grid grid-cols-4 gap-3">
                {customEmojis.map((e: any) => (
                  <div key={e.id} className="flex flex-col items-center gap-1 bg-gray-800 rounded-lg p-2">
                    <img src={e.url} alt={e.name} className="w-8 h-8 object-contain" />
                    <span className="text-xs text-gray-400 truncate w-full text-center">:{e.name}:</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sahyog Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowConnect(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">Sahyog Connect</span>
                <p className="text-xs text-gray-500 mt-0.5">Invite external teams to collaborate</p>
              </div>
              <button onClick={() => setShowConnect(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Contact email</label>
              <input value={connectEmail} onChange={e => setConnectEmail(e.target.value)}
                placeholder="contact@partner.com" type="email"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Organization name</label>
              <input value={connectOrg} onChange={e => setConnectOrg(e.target.value)}
                placeholder="Partner Company"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-500">
              They will receive an invite to join #{activeChannel?.name} as an external collaborator.
            </div>
            <button onClick={sendConnectInvite} disabled={!connectEmail.trim()}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
              Send Connect invite
            </button>
          </div>
        </div>
      )}

      {/* AI Summary modal */}
      {showAISummary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowAISummary(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">A</div>
              <div>
                <span className="text-white font-semibold">Channel Summary</span>
                <p className="text-xs text-gray-500">#{activeChannel?.name} — last 24 hours</p>
              </div>
              <button onClick={() => setShowAISummary(false)} className="ml-auto text-gray-500 hover:text-white">x</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
            </div>
            <button onClick={() => { setShowAISummary(false); setShowAI(true); setAiInput('What are the action items from today?'); }}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-sm py-2 rounded-xl">
              Ask AI a follow-up question
            </button>
          </div>
        </div>
      )}

      {/* Status modal */}
      {showStatus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowStatus(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-lg">Set your status</h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { emoji: '💼', text: 'In a meeting' },
                { emoji: '🎯', text: 'Focusing' },
                { emoji: '🏖️', text: 'On vacation' },
                { emoji: '🤒', text: 'Out sick' },
                { emoji: '🏠', text: 'Working from home' },
                { emoji: '🚗', text: 'Commuting' },
              ].map(s => (
                <button key={s.text} onClick={() => { setStatusEmoji(s.emoji); setStatusText(s.text); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${statusText === s.text ? 'border-emerald-500 bg-emerald-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {s.emoji} {s.text}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={statusEmoji} onChange={e => setStatusEmoji(e.target.value)} placeholder="😊"
                className="w-14 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 text-center" />
              <input value={statusText} onChange={e => setStatusText(e.target.value)} placeholder="What's your status?"
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveStatus} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2 rounded-xl text-sm">Save</button>
              <button onClick={async () => { setStatusEmoji(''); setStatusText(''); await api.setStatus('', ''); setShowStatus(false); }}
                className="text-gray-500 hover:text-gray-300 px-4 py-2 text-sm">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks modal */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowBookmarks(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <span className="text-white font-semibold">🔖 Saved messages ({bookmarks.length})</span>
              <button onClick={() => setShowBookmarks(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No saved messages yet.<br />Hover a message → ⋯ → Save message</p>}
              {bookmarks.map((b: any) => (
                <div key={b.id} className="bg-gray-800 rounded-xl p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{b.sender_name}</span>
                    <span className="text-xs text-gray-500">#{b.channel_name}</span>
                    <span className="text-xs text-gray-600 ml-auto">{new Date(b.sent_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-gray-300">{b.content}</p>
                  <button onClick={async () => { await api.removeBookmark(b.message_id); loadBookmarks(); }}
                    className="text-xs text-red-500 hover:text-red-400 mt-2">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Channel browser modal */}
      {showChannelBrowser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowChannelBrowser(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <span className="text-white font-semibold">🔭 Browse channels</span>
              <button onClick={() => setShowChannelBrowser(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="px-4 pt-3 shrink-0">
              <input value={channelSearch} onChange={e => setChannelSearch(e.target.value)} placeholder="Search channels..."
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allChannels.filter(c => c.type !== 'direct' && (!channelSearch || c.name?.toLowerCase().includes(channelSearch.toLowerCase()))).map((ch: any) => (
                <div key={ch.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <span className="text-gray-400 text-lg">#</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    {ch.description && <div className="text-xs text-gray-500 mt-0.5">{ch.description}</div>}
                  </div>
                  <button onClick={() => { openChannel(ch); setShowChannelBrowser(false); }}
                    className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Join</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New DM modal */}
      {showNewDM && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowNewDM(false); setDmSearch(''); } }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-lg">New direct message</h3>
            <input autoFocus value={dmSearch} onChange={e => setDmSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {dmOrgMembers.filter(m => m.id !== user?.id && (!dmSearch || m.display_name?.toLowerCase().includes(dmSearch.toLowerCase()) || m.email?.toLowerCase().includes(dmSearch.toLowerCase()))).map((m: any) => (
                <button key={m.id} onClick={() => startDM(m.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold shrink-0">{m.display_name?.charAt(0) || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{m.display_name}</div>
                    <div className="text-xs text-gray-500 truncate">{m.email}</div>
                  </div>
                  {onlineUsers.has(m.id) && <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />}
                </button>
              ))}
              {dmOrgMembers.filter(m => m.id !== user?.id).length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">No members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global search modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-20 px-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setSearchQuery(''); setSearchResults(null); } }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <span className="text-gray-500">🔍</span>
              <input autoFocus value={searchQuery} onChange={e => runSearch(e.target.value)}
                placeholder="Search messages, tasks, people..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none" />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults(null); }}
                className="text-gray-500 hover:text-white text-xs px-2 py-1 border border-gray-700 rounded">Esc</button>
            </div>
            <div className="max-h-96 overflow-y-auto p-3">
              {searching && <div className="text-gray-500 text-sm text-center py-4 animate-pulse">Searching...</div>}
              {!searching && searchResults && (
                <div className="space-y-4">
                  {searchResults.messages?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">Messages</div>
                      {searchResults.messages.map((m: any) => (
                        <div key={m.id} className="px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white">{m.sender_name}</span>
                            <span className="text-xs text-gray-600">#{m.channel_name}</span>
                          </div>
                          <p className="text-sm text-gray-300 truncate">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.tasks?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">Tasks</div>
                      {searchResults.tasks.map((t: any) => (
                        <div key={t.id} className="px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <p className="text-sm text-white">{t.title}</p>
                          <div className="text-xs text-gray-500 mt-0.5">{t.board_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.people?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 px-1">People</div>
                      {searchResults.people.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">{p.display_name?.charAt(0)}</div>
                          <div><p className="text-sm text-white">{p.display_name}</p><p className="text-xs text-gray-500">{p.email}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchResults.messages?.length && !searchResults.tasks?.length && !searchResults.people?.length && (
                    <p className="text-gray-600 text-sm text-center py-4">No results for "{searchQuery}"</p>
                  )}
                </div>
              )}
              {!searching && !searchResults && searchQuery && (
                <p className="text-gray-600 text-sm text-center py-4">Type to search...</p>
              )}
              {!searchQuery && (
                <div className="text-center py-6 space-y-2">
                  <p className="text-gray-500 text-sm">Search across messages, tasks and people</p>
                  <div className="flex justify-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-800 px-2 py-1 rounded">messages</span>
                    <span className="bg-gray-800 px-2 py-1 rounded">tasks</span>
                    <span className="bg-gray-800 px-2 py-1 rounded">people</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home View ─────────────────────────────────────────────────
function HomeView({ user, channels, boards, workspaces, onChannel, onBoard }: any) {
  const [dashStats,  setDashStats]  = useState<any>(null);
  const [myTasks,    setMyTasks]    = useState<any[]>([]);
  const [activity,   setActivity]   = useState<any[]>([]);

  useEffect(() => {
    api.myTasks().then(r => setMyTasks(Array.isArray(r?.data) ? r.data.slice(0, 6) : []));
    api.dashboardStats().then(r => setDashStats(r?.data));
    api.recentActivity().then(r => setActivity(Array.isArray(r?.data) ? r.data.slice(0, 5) : [])).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const overdueTasks = myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const todayTasks = myTasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting()}, {user?.display_name?.split(' ')[0] || 'there'}</h1>
          <p className="text-gray-500 text-sm mt-1">Here is what is happening in your workspace today</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My tasks', value: dashStats?.tasks?.total || myTasks.length, sub: dashStats?.tasks?.overdue > 0 ? `${dashStats.tasks.overdue} overdue` : 'all on track', color: 'from-emerald-600 to-teal-600' },
          { label: 'Due today', value: dashStats?.tasks?.due_today || 0, sub: 'tasks due today', color: 'from-amber-500 to-orange-500' },
          { label: 'Messages sent', value: dashStats?.messages?.sent || 0, sub: 'this week', color: 'from-blue-600 to-indigo-600' },
          { label: 'Meetings', value: dashStats?.meetings?.attended || 0, sub: 'attended (30d)', color: 'from-purple-600 to-pink-600' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4`}>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/70 mt-1">{s.label}</div>
            <div className="text-xs text-white/50 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(overdueTasks.length > 0 || todayTasks.length > 0) && (
        <div className="space-y-2">
          {overdueTasks.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-red-400 text-sm font-medium">Overdue:</span>
              <span className="text-red-300 text-sm">{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} past due date</span>
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-amber-400 text-sm font-medium">Due today:</span>
              <span className="text-amber-300 text-sm">{todayTasks.length} task{todayTasks.length > 1 ? 's' : ''} due today</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My tasks */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            My tasks
            {myTasks.length > 0 && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{myTasks.length}</span>}
          </h3>
          {myTasks.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No tasks assigned to you</p>}
          <div className="space-y-2">
            {myTasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  t.priority === 'critical' ? 'bg-red-500' :
                  t.priority === 'high' ? 'bg-orange-500' :
                  t.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <span className="text-sm text-white flex-1 truncate">{t.title}</span>
                {t.due_date && (
                  <span className={`text-xs shrink-0 ${new Date(t.due_date) < new Date() ? 'text-red-400' : 'text-gray-500'}`}>
                    {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + Recent activity */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Quick jump</h3>
            <div className="grid grid-cols-2 gap-2">
              {channels.slice(0, 2).map((ch: any) => (
                <button key={ch.id} onClick={() => onChannel(ch)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left transition-colors">
                  <div className="text-emerald-400 font-medium text-sm truncate">#{ch.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Channel</div>
                </button>
              ))}
              {boards.slice(0, 2).map((b: any) => (
                <button key={b.id} onClick={() => onBoard(b)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left transition-colors">
                  <div className="text-blue-400 font-medium text-sm truncate">{b.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Board</div>
                </button>
              ))}
            </div>
          </div>
          {activity.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Recent activity</h3>
              <div className="space-y-2">
                {activity.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.type === 'message' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{a.title}</p>
                      <p className="text-xs text-gray-600">{a.context} · {new Date(a.ts).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* India features */}
      <div className="bg-gradient-to-br from-orange-900/30 to-green-900/30 border border-orange-800/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">India features</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-gray-800/80 hover:bg-gray-700 rounded-xl p-3 text-center transition-colors"
            onClick={() => alert('GST Invoice feature coming soon! Will generate GST-compliant invoices from tasks.')}>
            <div className="text-2xl mb-1">GST</div>
            <div className="text-xs text-gray-400">GST Invoice</div>
          </button>
          <button className="bg-gray-800/80 hover:bg-gray-700 rounded-xl p-3 text-center transition-colors"
            onClick={() => alert('UPI Payment links coming soon! Will generate UPI QR codes for task payments.')}>
            <div className="text-2xl mb-1">UPI</div>
            <div className="text-xs text-gray-400">UPI Payment</div>
          </button>
          <button className="bg-gray-800/80 hover:bg-gray-700 rounded-xl p-3 text-center transition-colors"
            onClick={() => alert('Hindi/vernacular support coming soon! Will translate workspace to your language.')}>
            <div className="text-2xl mb-1">Hi</div>
            <div className="text-xs text-gray-400">Hindi mode</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingsView() {
  const [meetings,    setMeetings]    = useState<any[]>([]);
  const [creating,    setCreating]    = useState(false);
  const [newTitle,    setNewTitle]    = useState('');
  const [meetDate,    setMeetDate]    = useState('');
  const [meetTime,    setMeetTime]    = useState('');
  const [meetDur,     setMeetDur]     = useState(60);
  const [startNow,    setStartNow]    = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [invitedIds,  setInvitedIds]  = useState<string[]>([]);
  const [meetDesc,    setMeetDesc]    = useState('');
  const [memberSearch,setMemberSearch]= useState('');
  const [view,        setView]        = useState<'list'|'calendar'>('list');
  const [calMonth,    setCalMonth]    = useState(new Date());
  const [meetPolls,   setMeetPolls]   = useState<any[]>([]);
  const [showPoll,    setShowPoll]    = useState(false);
  const [pollMeetId,  setPollMeetId]  = useState<string|null>(null);
  const [pollQ,       setPollQ]       = useState('');
  const [showWB,      setShowWB]      = useState(false);

  useEffect(() => {
    api.meetings().then(res => setMeetings(res?.data || []));
    api.adminMembers().then(res => setOrgMembers(Array.isArray(res?.data) ? res.data : []));
    const d = new Date(Date.now() + 60 * 60 * 1000);
    setMeetDate(d.toISOString().split('T')[0]);
    setMeetTime(d.toTimeString().slice(0, 5));
  }, []);

  function toggleInvite(userId: string) {
    setInvitedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  }

  async function createMeeting() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const wsRes = await api.workspaces();
    const workspaceId = wsRes?.data?.[0]?.id;
    if (!workspaceId) { alert('No workspace found'); setSaving(false); return; }
    const startsAt = startNow ? new Date().toISOString() : new Date(`${meetDate}T${meetTime}`).toISOString();
    const res = await api.createMeeting({ title: newTitle.trim(), description: meetDesc.trim() || undefined, startsAt, durationMins: meetDur, type: 'meeting', workspaceId, waitingRoom: false, participantIds: invitedIds });
    setSaving(false);
    if (res?.data?.id) {
      setNewTitle(''); setCreating(false); setInvitedIds([]); setMeetDesc('');
      if (startNow) window.open(`/meet?id=${res.data.id}`, '_blank');
    } else if (res?.error) alert('Failed: ' + res.error.message);
    api.meetings().then(r => setMeetings(r?.data || []));
  }

  async function sendReminder(meetingId: string) {
    const res = await api.sendReminder(meetingId);
    alert(res?.data?.message || 'Reminder sent!');
  }

  async function makeRecurring(meetingId: string) {
    const freq = prompt('Repeat frequency? (daily/weekly/monthly)');
    if (!freq || !['daily','weekly','monthly'].includes(freq)) return;
    const endDate = prompt('End date? (YYYY-MM-DD) or leave blank for 30 days');
    const res = await api.makeRecurring(meetingId, freq, endDate || undefined);
    if (res?.data?.created) {
      alert(`Created ${res.data.created} recurring meetings!`);
      api.meetings().then(r => setMeetings(r?.data || []));
    }
  }

  async function openPoll(meetingId: string) {
    setPollMeetId(meetingId);
    const res = await api.getPolls(meetingId);
    setMeetPolls(res?.data || []);
    setShowPoll(true);
  }

  function getDaysInMonth() {
    const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }

  function getMeetingsOnDay(day: number) {
    return meetings.filter(m => {
      const d = new Date(m.starts_at);
      return d.getFullYear() === calMonth.getFullYear() && d.getMonth() === calMonth.getMonth() && d.getDate() === day;
    });
  }

  const { firstDay, daysInMonth } = getDaysInMonth();
  const STATUS_COLORS: Record<string, string> = { live: 'bg-red-900 text-red-300', scheduled: 'bg-blue-900 text-blue-300', ended: 'bg-gray-800 text-gray-400' };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'list' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-white'}`}>List</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-white'}`}>Calendar</button>
        </div>
        <button onClick={() => setCreating(true)} className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors">New meeting</button>
      </div>

      {/* New meeting form */}
      {creating && (
        <div className="bg-gray-900 border border-emerald-700 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">New meeting</h3>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Meeting title..."
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
          <input value={meetDesc} onChange={e => setMeetDesc(e.target.value)} placeholder="Description (optional)"
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
          <div className="flex gap-2">
            <button onClick={() => setStartNow(true)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${startNow ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Start now</button>
            <button onClick={() => setStartNow(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${!startNow ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Schedule</button>
          </div>
          {!startNow && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(d => (
                <button key={d} onClick={() => setMeetDur(d)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${meetDur === d ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {d < 60 ? `${d}m` : `${d/60}h`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Invite members {invitedIds.length > 0 && <span className="text-emerald-400">({invitedIds.length})</span>}</label>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-1.5 text-xs border border-gray-700 focus:outline-none focus:border-emerald-500 mb-2" />
            <div className="max-h-36 overflow-y-auto space-y-1 bg-gray-800 rounded-lg p-2">
              {orgMembers.filter(m => !memberSearch || m.display_name?.toLowerCase().includes(memberSearch.toLowerCase())).map((m: any) => (
                <div key={m.id} onClick={() => toggleInvite(m.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${invitedIds.includes(m.id) ? 'bg-emerald-900/50 border border-emerald-700' : 'hover:bg-gray-700'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${invitedIds.includes(m.id) ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                    {m.display_name?.charAt(0)}
                  </div>
                  <span className="text-xs text-white flex-1">{m.display_name}</span>
                  {invitedIds.includes(m.id) && <span className="text-emerald-400 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createMeeting} disabled={saving || !newTitle.trim()}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm">
              {saving ? 'Creating...' : startNow ? 'Start meeting' : 'Schedule'}
            </button>
            <button onClick={() => { setCreating(false); setInvitedIds([]); setMeetDesc(''); }} className="text-xs text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800">&#8592;</button>
            <span className="text-white font-semibold">{calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800">&#8594;</button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-800">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-xs text-gray-500 text-center py-2 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="min-h-16 border-b border-r border-gray-800" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsOnDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear();
              return (
                <div key={day} className={`min-h-16 border-b border-r border-gray-800 p-1 ${isToday ? 'bg-emerald-950/30' : ''}`}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>{day}</div>
                  {dayMeetings.map(m => (
                    <a key={m.id} href={`/meet?id=${m.id}`} target="_blank"
                      className="block text-xs bg-emerald-900/60 text-emerald-300 rounded px-1 py-0.5 mb-0.5 truncate hover:bg-emerald-900">
                      {new Date(m.starts_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} {m.title}
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-3">
          {meetings.length === 0 && !creating && <div className="text-gray-600 text-sm text-center py-8">No meetings scheduled</div>}
          {meetings.map(m => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{m.title}</div>
                  {m.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{m.description}</div>}
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                    <span>{new Date(m.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>{m.duration_mins || 60}m</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[m.status] || STATUS_COLORS.ended}`}>{m.status}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(m.status === 'live' || m.status === 'scheduled') && (
                      <a href={`/meet?id=${m.id}`} target="_blank" className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg">
                        {m.status === 'live' ? 'Join' : 'Join →'}
                      </a>
                    )}
                    {m.status === 'scheduled' && (
                      <>
                        <button onClick={() => sendReminder(m.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg" title="Send reminder">Bell</button>
                        <button onClick={() => makeRecurring(m.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Recur</button>
                      </>
                    )}
                    <button onClick={() => openPoll(m.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Poll</button>
                    <button onClick={() => { setPollMeetId(m.id); setShowWB(true); }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Board</button>
                    {m.metadata?.recording_url && (
                      <a href={m.metadata.recording_url} target="_blank" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Save</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Poll modal */}
      {showPoll && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowPoll(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Meeting Poll</span>
              <button onClick={() => setShowPoll(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="flex gap-2">
              <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Question..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              <button onClick={async () => {
                if (!pollQ.trim() || !pollMeetId) return;
                await api.createPoll(pollMeetId, pollQ.trim(), ['Yes', 'No', 'Maybe']);
                const res = await api.getPolls(pollMeetId);
                setMeetPolls(res?.data || []);
                setPollQ('');
              }} disabled={!pollQ.trim()} className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Launch</button>
            </div>
            {meetPolls.map((p: any) => {
              const opts = Array.isArray(p.options) ? p.options : JSON.parse(p.options || '[]');
              const votes = p.votes || {};
              const total = Object.keys(votes).length;
              return (
                <div key={p.id} className="bg-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-white">{p.question}</p>
                  {opts.map((opt: string, i: number) => {
                    const v = Object.values(votes).filter((x: any) => x === i).length;
                    const pct = total > 0 ? Math.round(v/total*100) : 0;
                    return (
                      <button key={i} onClick={async () => {
                        await api.votePoll(p.id, i);
                        const res = await api.getPolls(pollMeetId!);
                        setMeetPolls(res?.data || []);
                      }} className="w-full text-left">
                        <div className="flex justify-between text-xs mb-1"><span className="text-white">{opt}</span><span className="text-gray-400">{v} ({pct}%)</span></div>
                        <div className="bg-gray-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: pct+'%'}} /></div>
                      </button>
                    );
                  })}
                  <p className="text-xs text-gray-600">{total} votes</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Whiteboard */}
      {showWB && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowWB(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
              <span className="text-white font-semibold">Whiteboard</span>
              <div className="flex gap-2">
                <button onClick={() => { const c = document.getElementById('wb2') as HTMLCanvasElement; const ctx = c?.getContext('2d'); if(ctx) ctx.clearRect(0,0,c.width,c.height); }} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg">Clear</button>
                <button onClick={() => { const c = document.getElementById('wb2') as HTMLCanvasElement; const a = document.createElement('a'); a.download='whiteboard.png'; a.href=c.toDataURL(); a.click(); }} className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg">Save PNG</button>
                <button onClick={() => setShowWB(false)} className="text-gray-500 hover:text-white">x</button>
              </div>
            </div>
            <div className="flex-1 relative bg-white rounded-b-2xl overflow-hidden">
              <canvas id="wb2" className="w-full h-full cursor-crosshair"
                onMouseDown={e => {
                  const canvas = document.getElementById('wb2') as HTMLCanvasElement;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
                  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round';
                  let drawing = true;
                  const rect = canvas.getBoundingClientRect();
                  ctx.beginPath(); ctx.moveTo(e.clientX-rect.left, e.clientY-rect.top);
                  const move = (ev: MouseEvent) => { if(drawing) { ctx.lineTo(ev.clientX-rect.left, ev.clientY-rect.top); ctx.stroke(); } };
                  const up = () => { drawing = false; canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mouseup', up); };
                  canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', up);
                }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
