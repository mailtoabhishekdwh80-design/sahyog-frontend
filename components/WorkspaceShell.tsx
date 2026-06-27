'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { api, apiFetch, isLoggedIn } from '../lib/api';
import KanbanView from './KanbanView';

// ── Types ─────────────────────────────────────────────────────
type Workspace = { id: string; name: string; type: string };
type Channel   = { id: string; name: string; type: string; description?: string; unread_count?: number };
type Board     = { id: string; name: string };
type Message   = {
  id: string; content: string; sender_name: string; sender_id: string;
  sent_at: string; is_edited?: boolean; is_pinned?: boolean;
  reply_count?: number; reactions?: Record<string, number>; channel_id?: string;
};

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
  const [polls,           setPolls]           = useState<any[]>([]);
  const [showPollCreate,  setShowPollCreate]  = useState(false);
  const [pollQuestion,    setPollQuestion]    = useState('');
  const [pollOptions,     setPollOptions]     = useState(['', '']);
  const [showWhiteboard,  setShowWhiteboard]  = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string|null>(null);
  const [showSchedule,   setShowSchedule]   = useState(false);
  const [scheduleDate,   setScheduleDate]   = useState('');
  const [scheduleTime,   setScheduleTime]   = useState('');
  // ── Messaging features ──
  const [showFormatBar,  setShowFormatBar]  = useState(false);
  const [editingMsgId,   setEditingMsgId]   = useState<string|null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editHistory,    setEditHistory]    = useState<any[]>([]);
  const [showEditHist,   setShowEditHist]   = useState<string|null>(null);
  const [reactionUsers,  setReactionUsers]  = useState<any>(null);
  const [msgDraft,       setMsgDraft]       = useState<Record<string,string>>({});
  const [showJumpDate,   setShowJumpDate]   = useState(false);
  const [jumpDate,       setJumpDate]       = useState('');
  const [slashCmd,       setSlashCmd]       = useState('');
  const [showSlashMenu,  setShowSlashMenu]  = useState(false);
  const [channelDescEdit,setChannelDescEdit]= useState(false);
  const [newChannelDesc, setNewChannelDesc] = useState('');
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('deemona-teams_token') : null;
    if (!token) return;
    const ws = new WebSocket(`wss://deemona-teams-api-ajbr.onrender.com/ws?token=${token}`);
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

  // ── Format helpers ──
  function applyFormat(tag: string) {
    const ta = document.getElementById('msg-composer') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const selected = newMessage.slice(start, end);
    const tags: Record<string, [string,string]> = {
      bold: ['**','**'], italic: ['*','*'], code: ['`','`'],
      strike: ['~~','~~'], bullet: ['\n• ','']
    };
    const [open, close] = tags[tag] || ['',''];
    const newVal = newMessage.slice(0,start) + open + selected + close + newMessage.slice(end);
    setNewMessage(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start+open.length, end+open.length); }, 0);
  }

  // ── Edit message ──

  // ── Slash commands ──
  function handleSlashCommand(cmd: string) {
    setShowSlashMenu(false);
    if (cmd === '/todo') { setNewMessage('TODO: '); }
    else if (cmd === '/poll') { setNewMessage('/poll Question | Option1 | Option2'); }
    else if (cmd === '/me') { setNewMessage('/me '); }
    else if (cmd === '/shrug') { setNewMessage('¯\\_(ツ)_/¯'); }
    else if (cmd === '/tableflip') { setNewMessage('(╯°□°）╯︵ ┻━┻'); }
    else if (cmd === '/clear') { setNewMessage(''); }
  }

  // ── Jump to date ──
  async function jumpToDate() {
    if (!jumpDate || !activeChannel) return;
    const res = await apiFetch('/channels/' + activeChannel.id + '/messages?before=' + new Date(jumpDate).toISOString() + '&limit=50');
    if (res?.data) { setMessages(res.data); setShowJumpDate(false); }
  }

  // ── Save draft ──
  function saveDraft(channelId: string, text: string) {
    setMsgDraft(prev => ({ ...prev, [channelId]: text }));
    localStorage.setItem('draft_' + channelId, text);
  }

  // ── Load draft ──
  function loadDraft(channelId: string) {
    return localStorage.getItem('draft_' + channelId) || '';
  }

  // ── Update channel description ──
  async function saveChannelDesc() {
    if (!activeChannel) return;
    await apiFetch('/channels/' + activeChannel.id, { method: 'PATCH', body: JSON.stringify({ description: newChannelDesc }) });
    setChannelDescEdit(false);
    const updated = { ...activeChannel, description: newChannelDesc };
    setActiveChannel(updated as any);
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

  // ── Deemona Connect ───────────────────────────────────────
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
    <div style={{display:'flex',height:'100vh',background:'#1a1d21',color:'#d1d2d3',overflow:'hidden',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>

      {/* ══ SIDEBAR ══ */}
      <div style={{width:240,background:'#1a1d21',borderRight:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',flexShrink:0}}>
        {/* Workspace name + search */}
        <div style={{padding:'16px 16px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:15,fontWeight:700,color:'#fff',letterSpacing:-0.3}}>{activeWs?.name || 'Deemona Teams'}</span>
            <button style={{width:24,height:24,borderRadius:6,background:'rgba(255,255,255,0.08)',border:'none',cursor:'pointer',color:'#9ea3a8',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          </div>
          {/* Search bar */}
          <button onClick={() => { setShowSearch(true); }} style={{width:'100%',background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,padding:'6px 10px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',color:'#9ea3a8',fontSize:13}}>
            🔍 <span>Search</span>
            <span style={{marginLeft:'auto',fontSize:11,opacity:.5}}>Ctrl+K</span>
          </button>
        </div>

        {/* Nav items */}
        <div style={{flex:1,overflowY:'auto',padding:'0 8px 8px'}}>

          {/* Direct Messages */}
          <div style={{marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px 4px'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#9ea3a8',letterSpacing:.5,textTransform:'uppercase'}}>Direct messages</span>
              <button onClick={() => { setShowNewDM(true); api.orgMembers().then(r => setDmOrgMembers(Array.isArray(r?.data) ? r.data : [])); }}
                style={{background:'none',border:'none',color:'#9ea3a8',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4,display:'flex',alignItems:'center'}}>+</button>
            </div>
            {dmList.map((dm: any) => (
              <button key={dm.id} onClick={() => openDM(dm)}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeDM?.id === dm.id ? 'rgba(255,255,255,0.1)' : 'transparent',color: activeDM?.id === dm.id ? '#fff' : '#9ea3a8',transition:'all .1s'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff'}}>
                    {dm.other_name?.charAt(0) || '?'}
                  </div>
                  <span style={{position:'absolute',bottom:-1,right:-1,width:8,height:8,borderRadius:'50%',border:'2px solid #1a1d21',background: onlineUsers.has(dm.other_id) ? '#2bac76' : '#616061'}}/>
                </div>
                <span style={{fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dm.other_name || dm.name}</span>
              </button>
            ))}
          </div>

          {/* Channels */}
          <div style={{marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px 4px'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#9ea3a8',letterSpacing:.5,textTransform:'uppercase'}}>Channels</span>
              <button onClick={() => setShowNewChannel(true)}
                style={{background:'none',border:'none',color:'#9ea3a8',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4}}>+</button>
            </div>
            {channels.filter(c => c.type !== 'direct').slice(0, 15).map(ch => (
              <button key={ch.id} onClick={() => openChannel(ch)}
                style={{width:'100%',display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeChannel?.id === ch.id ? 'rgba(74,222,128,0.12)' : 'transparent',color: activeChannel?.id === ch.id ? '#fff' : (ch.unread_count ?? 0) > 0 ? '#fff' : '#9ea3a8',fontWeight: (ch.unread_count ?? 0) > 0 ? 700 : 400,transition:'all .1s'}}>
                <span style={{fontSize:14,color: activeChannel?.id === ch.id ? '#4ade80' : '#9ea3a8',fontWeight:400}}>#</span>
                <span style={{fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</span>
                {(ch.unread_count ?? 0) > 0 && (
                  <span style={{background:'#e01e5a',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:10,marginLeft:'auto'}}>{(ch.unread_count ?? 0) > 99 ? '99+' : ch.unread_count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Boards */}
          <div style={{marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px 4px'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#9ea3a8',letterSpacing:.5,textTransform:'uppercase'}}>Boards</span>
              <button onClick={async () => {
                const name = prompt('Board name?');
                if (!name) return;
                const wsRes = await api.workspaces();
                const wsId = wsRes?.data?.[0]?.id;
                if (wsId) { await api.createBoard(name, wsId); const r = await api.boards(wsId); setBoards(Array.isArray(r?.data) ? r.data : []); }
              }} style={{background:'none',border:'none',color:'#9ea3a8',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4}}>+</button>
            </div>
            {boards.map(b => (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:2}}>
                <button onClick={() => { setActiveBoard(b); setActiveChannel(null); setActiveDM(null); }}
                  style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeBoard?.id === b.id ? 'rgba(255,255,255,0.1)' : 'transparent',color: activeBoard?.id === b.id ? '#fff' : '#9ea3a8',transition:'all .1s'}}>
                  <span style={{fontSize:12,width:18,height:18,borderRadius:4,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#9ea3a8'}}>B</span>
                  <span style={{fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span>
                </button>
              </div>
            ))}
          </div>

          {/* More links */}
          <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            {[
              { icon:'📹', label:'Meetings', action: () => { setActiveView('meetings'); setActiveChannel(null); setActiveBoard(null); setActiveDM(null); } },
              { icon:'🏠', label:'Home', action: () => { setActiveView('home'); setActiveChannel(null); setActiveBoard(null); setActiveDM(null); } },
              { icon:'🔖', label:'Saved messages', action: loadBookmarks },
              { icon:'🔭', label:'Browse channels', action: loadChannelBrowser },
              { icon:'🛡️', label:'Admin', action: () => window.location.href='/admin' },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background:'transparent',color:'#9ea3a8',transition:'all .1s',fontSize:14}}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User footer */}
        <div style={{padding:'8px 12px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => setShowStatus(true)} style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',flex:1,padding:'4px 0',textAlign:'left'}}>
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'#4a9a6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>
                {user?.display_name?.charAt(0) || '?'}
              </div>
              <span style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',border:'2px solid #1a1d21',background: user?.status_text?.toLowerCase().includes('meeting') ? '#e01e5a' : '#2bac76'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.display_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize:11,color:'#9ea3a8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.status_text || 'Set a status'}</div>
            </div>
          </button>
          <button onClick={() => api.logout()} title="Sign out"
            style={{background:'none',border:'none',cursor:'pointer',color:'#9ea3a8',fontSize:16,padding:4,borderRadius:6,flexShrink:0}}>↪</button>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#313338'}}>

        {/* ── CHANNEL VIEW ── */}
        {activeChannel && !activeBoard && !activeDM && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Channel header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:48,borderBottom:'1px solid rgba(255,255,255,0.08)',background:'#313338',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18,color:'#80848e',fontWeight:400}}>#</span>
                <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{activeChannel.name}</span>
                {channelDescEdit ? (
                  <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:8}}>
                    <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                      placeholder="Channel description..." autoFocus
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'3px 8px',color:'#f2f3f5',fontSize:13,width:220}}
                      onKeyDown={e => { if(e.key==='Enter') saveChannelDesc(); if(e.key==='Escape') setChannelDescEdit(false); }} />
                    <button onClick={saveChannelDesc} style={{background:'#248046',border:'none',borderRadius:5,padding:'3px 8px',color:'#fff',fontSize:12,cursor:'pointer'}}>Save</button>
                    <button onClick={() => setChannelDescEdit(false)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12}}>Cancel</button>
                  </div>
                ) : (
                  <span onClick={() => { setChannelDescEdit(true); setNewChannelDesc(activeChannel.description || ''); }}
                    style={{fontSize:13,color:'#80848e',marginLeft:4,cursor:'pointer'}} title="Click to edit description">
                    {activeChannel.description || <span style={{opacity:.5}}>Add description</span>}
                  </span>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <button onClick={loadPins} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:13,padding:'4px 8px',borderRadius:6}}>📌</button>
                <button onClick={() => setShowMsgSearch(s => !s)} style={{background:'none',border:'none',color: showMsgSearch ? '#4ade80' : '#80848e',cursor:'pointer',fontSize:13,padding:'4px 8px',borderRadius:6}}>🔍</button>
                <button onClick={async () => { if (activeChannel) { await api.notifyHere(activeChannel.id, '@here'); alert('All channel members notified!'); } }} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>@here</button>
                <button onClick={loadAnalytics} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Analytics</button>
                <button onClick={loadScheduled} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Scheduled</button>
                <button onClick={loadCustomEmojis} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Emoji</button>
                <button onClick={() => setShowConnect(true)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Connect</button>
                <button onClick={() => setShowAI(s => !s)} style={{background: showAI ? 'rgba(74,222,128,0.15)' : 'none',border:'none',color: showAI ? '#4ade80' : '#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>AI</button>
                <button onClick={summarizeChannel} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Summarize</button>
                <span style={{fontSize:12,color:'#80848e',padding:'4px 8px',borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}} onClick={() => setShowSearch(true)}>Ctrl+K</span>
              </div>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div style={{padding:'8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',background:'#2b2d31'}}>
                <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search messages..." autoFocus
                  style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'7px 12px',color:'#f2f3f5',fontSize:13,outline:'none'}} />
              </div>
            )}

            {/* AI Panel */}
            {showAI && (
              <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',background:'#1e2124',display:'flex',flexDirection:'column',height:300,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>AI</div>
                    <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>Deemona AI</span>
                    <span style={{fontSize:12,color:'#80848e'}}>Ask anything about this channel</span>
                  </div>
                  <button onClick={() => setShowAI(false)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:16}}>✕</button>
                </div>
                <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                  {aiMessages.length === 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {['Summarize recent discussion','What are the action items?','Draft a reply','Translate to Hindi'].map(s => (
                        <button key={s} onClick={() => setAiInput(s)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'6px 12px',color:'#b5bac1',fontSize:12,cursor:'pointer'}}>{s}</button>
                      ))}
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} style={{display:'flex',gap:8,justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
                      {m.role === 'assistant' && <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>AI</div>}
                      <div style={{maxWidth:'75%',padding:'8px 12px',borderRadius:8,fontSize:13,lineHeight:1.5,background: m.role === 'user' ? '#248046' : 'rgba(255,255,255,0.08)',color: m.role === 'user' ? '#fff' : '#d1d2d3'}}>{m.content}</div>
                    </div>
                  ))}
                  {aiLoading && <div style={{display:'flex',gap:8}}><div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',flexShrink:0}}/><div style={{background:'rgba(255,255,255,0.08)',padding:'8px 12px',borderRadius:8,fontSize:13,color:'#80848e',fontStyle:'italic'}}>Thinking...</div></div>}
                </div>
                <div style={{padding:'8px 16px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:8}}>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAIMessage()}
                    placeholder="Ask Deemona AI..." style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'7px 12px',color:'#f2f3f5',fontSize:13,outline:'none'}} />
                  <button onClick={sendAIMessage} disabled={!aiInput.trim() || aiLoading} style={{background:'#248046',border:'none',borderRadius:6,padding:'7px 14px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity: aiInput.trim() ? 1 : 0.5}}>Send</button>
                </div>
              </div>
            )}

            {/* Schedule panel */}
            {showSchedule && (
              <div style={{padding:'8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',background:'#2b2d31',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:12,color:'#80848e'}}>Schedule for:</span>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'5px 10px',color:'#f2f3f5',fontSize:12,outline:'none'}} />
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'5px 10px',color:'#f2f3f5',fontSize:12,outline:'none'}} />
                <button onClick={scheduleMessage} disabled={!scheduleDate || !scheduleTime || !newMessage.trim()} style={{background:'#248046',border:'none',borderRadius:6,padding:'5px 12px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',opacity: scheduleDate && scheduleTime && newMessage.trim() ? 1 : 0.5}}>Schedule</button>
                <button onClick={() => setShowSchedule(false)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12}}>Cancel</button>
              </div>
            )}

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'16px 16px 8px',display:'flex',flexDirection:'column',gap:0}}>
              {(showMsgSearch ? msgSearchResults : messages).map(msg => {
                const rendered = renderMessage(msg.content);
                return (
                  <div key={msg.id} className="group"
                    style={{display:'flex',alignItems:'flex-start',gap:12,padding:'4px 8px',borderRadius:6,borderLeft: msg.is_pinned ? '2px solid #f59e0b' : 'none',background: msg.is_pinned ? 'rgba(245,158,11,0.04)' : 'transparent',cursor:'default'}}
                    onMouseEnter={e => { if(!msg.is_pinned)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background= msg.is_pinned ? 'rgba(245,158,11,0.04)' : 'transparent'; }}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0,marginTop:2}}>
                      {msg.sender_name?.charAt(0) || '?'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{msg.sender_name}</span>
                        <span style={{fontSize:12,color:'#80848e'}}>{new Date(msg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                        {msg.is_edited && <span style={{fontSize:11,color:'#616061'}}>(edited)</span>}
                        {msg.is_pinned && <span style={{fontSize:11,color:'#f59e0b'}}>pinned</span>}
                      </div>
                      {editingMsgId === msg.id ? (
                        <div style={{marginTop:4}}>
                          <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)} rows={2} autoFocus
                            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveEditMessage(editingMsgId!);} if(e.key==='Escape'){setEditingMsgId(null);} }}
                            style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,padding:'8px 10px',color:'#f2f3f5',fontSize:14,resize:'none',fontFamily:'inherit'}} />
                          <div style={{display:'flex',gap:6,marginTop:4}}>
                            <button onClick={() => saveEditMessage(editingMsgId!)} style={{background:'#248046',border:'none',borderRadius:5,padding:'4px 10px',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>Save</button>
                            <button onClick={() => setEditingMsgId(null)} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:5,padding:'4px 10px',color:'#b5bac1',fontSize:12,cursor:'pointer'}}>Cancel</button>
                            <span style={{fontSize:11,color:'#80848e',alignSelf:'center'}}>Enter to save · Esc to cancel</span>
                          </div>
                        </div>
                      ) : rendered.isFile ? (
                        rendered.isImage
                          ? <img src={rendered.url} alt={rendered.name} style={{maxWidth:360,maxHeight:260,borderRadius:8,marginTop:4,objectFit:'cover'}} />
                          : <a href={rendered.url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'6px 12px',color:'#00aff4',fontSize:13,textDecoration:'none',marginTop:4}}>📎 {rendered.name}</a>
                      ) : (
                        <div style={{fontSize:15,color:'#d1d2d3',lineHeight:1.5,wordBreak:'break-word'}} dangerouslySetInnerHTML={{__html: rendered.html || ''}} />
                      )}
                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => api.addReaction(msg.id, activeChannel!.id, emoji).then(() => openChannel(activeChannel!))}
                              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'2px 8px',fontSize:13,cursor:'pointer',color:'#d1d2d3',display:'flex',alignItems:'center',gap:4}}>
                              {emoji} <span style={{fontSize:12,color:'#80848e'}}>{count as number}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Thread count */}
                      {(msg.reply_count ?? 0) > 0 && (
                        <button onClick={() => openThread(msg)} style={{background:'none',border:'none',color:'#00aff4',fontSize:12,cursor:'pointer',marginTop:2,padding:0}}>
                          {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>
                    {/* Message actions on hover */}
                    <div className="hidden group-hover:flex" style={{gap:2,flexShrink:0,marginTop:2}}>
                      {['👍','❤️','😂','🎉'].map(e => (
                        <button key={e} onClick={() => api.addReaction(msg.id, activeChannel!.id, e).then(() => openChannel(activeChannel!))}
                          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'3px 6px',fontSize:13,cursor:'pointer'}}>
                          {e}
                        </button>
                      ))}
                      <button onClick={() => openThread(msg)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'3px 8px',fontSize:11,cursor:'pointer',color:'#b5bac1'}}>Reply</button>
                      {msg.sender_id === user?.id && (
                        <button onClick={() => api.deleteMessage(activeChannel!.id, msg.id).then(() => openChannel(activeChannel!))} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'3px 8px',fontSize:11,cursor:'pointer',color:'#ed4245'}}>Del</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div style={{padding:'0 16px 16px',flexShrink:0}}>
              <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',overflow:'hidden'}}>
                {/* Format toolbar */}
                {showFormatBar && (
                  <div style={{display:'flex',alignItems:'center',gap:2,padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {[
                      {label:'B',tag:'bold',style:{fontWeight:800}},
                      {label:'I',tag:'italic',style:{fontStyle:'italic'}},
                      {label:'S',tag:'strike',style:{textDecoration:'line-through'}},
                      {label:'`',tag:'code',style:{fontFamily:'monospace'}},
                      {label:'•',tag:'bullet',style:{}},
                    ].map(f => (
                      <button key={f.tag} onClick={() => applyFormat(f.tag)}
                        style={{background:'none',border:'none',color:'#b5bac1',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:13,...f.style}}>
                        {f.label}
                      </button>
                    ))}
                    <div style={{width:1,height:16,background:'rgba(255,255,255,0.1)',margin:'0 4px'}}/>
                    <button onClick={() => setShowJumpDate(s => !s)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:11}}>Jump to date</button>
                    <button onClick={() => setChannelDescEdit(s => !s)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:11}}>Edit desc</button>
                  </div>
                )}
                {/* Jump to date */}
                {showJumpDate && (
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{fontSize:12,color:'#80848e'}}>Jump to:</span>
                    <input type="date" value={jumpDate} onChange={e => setJumpDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'4px 8px',color:'#f2f3f5',fontSize:12}} />
                    <button onClick={jumpToDate} disabled={!jumpDate} style={{background:'#248046',border:'none',borderRadius:6,padding:'4px 10px',color:'#fff',fontSize:12,cursor:'pointer'}}>Go</button>
                    <button onClick={() => setShowJumpDate(false)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:12}}>Cancel</button>
                  </div>
                )}
                {/* Slash command menu */}
                {showSlashMenu && (
                  <div style={{padding:'4px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {['/todo','/poll','/me','/shrug','/tableflip','/clear'].filter(c => c.startsWith(newMessage)).map(cmd => (
                      <button key={cmd} onClick={() => handleSlashCommand(cmd)}
                        style={{display:'block',width:'100%',textAlign:'left',padding:'6px 10px',background:'none',border:'none',color:'#b5bac1',cursor:'pointer',fontSize:13,borderRadius:4}}>
                        <span style={{fontWeight:700,color:'#4ade80'}}>{cmd}</span>
                        <span style={{color:'#80848e',marginLeft:8,fontSize:12}}>
                          {cmd==='/todo'?'Create a todo item':cmd==='/poll'?'Create a poll':cmd==='/me'?'Action message':cmd==='/shrug'?'¯\_(ツ)_/¯':cmd==='/tableflip'?'(╯°□°）╯':'Clear message'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div style={{display:'flex',alignItems:'flex-end',gap:8,padding:'10px 14px'}}>
                  <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    title="Attach file"
                    style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:18,padding:2,flexShrink:0}}>{uploading ? '⏳' : '+'}</button>
                  <button onClick={recording ? stopRecordingVoice : startRecordingVoice}
                    title="Voice message"
                    style={{background:'none',border:'none',color: recording ? '#ed4245' : '#80848e',cursor:'pointer',fontSize:14,padding:2,flexShrink:0}}>{recording ? '⏹' : '🎤'}</button>
                  <button onClick={() => setShowFormatBar(s => !s)}
                    title="Formatting"
                    style={{background: showFormatBar ? 'rgba(74,222,128,0.1)' : 'none',border:'none',color: showFormatBar ? '#4ade80' : '#80848e',cursor:'pointer',fontSize:13,padding:'2px 6px',borderRadius:4,flexShrink:0,fontWeight:700}}>Aa</button>
                  <textarea id="msg-composer" value={newMessage}
                    onChange={e => {
                      const val = e.target.value;
                      setNewMessage(val);
                      if (activeChannel) saveDraft(activeChannel.id, val);
                      setShowSlashMenu(val.startsWith('/') && val.length > 0 && !val.includes(' '));
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      if (e.key === 'Escape') { setShowSlashMenu(false); setShowFormatBar(false); }
                    }}
                    onFocus={() => { if (activeChannel) { const d = loadDraft(activeChannel.id); if (d && !newMessage) setNewMessage(d); } }}
                    placeholder={`Message #${activeChannel.name}  (/ for commands)`} rows={1}
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#f2f3f5',fontSize:15,resize:'none',maxHeight:128,lineHeight:1.5,fontFamily:'inherit'}} />
                  <button onClick={() => setShowSchedule(s => !s)} title="Schedule"
                    style={{background:'none',border:'none',color: showSchedule ? '#4ade80' : '#80848e',cursor:'pointer',fontSize:14,padding:2,flexShrink:0}}>🕒</button>
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                    style={{background:'#248046',border:'none',borderRadius:6,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,flexShrink:0,opacity: newMessage.trim() ? 1 : 0.4}}>↑</button>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:11,color:'#80848e'}}>Enter to send · Shift+Enter for new line · / for commands</span>
                {newMessage && <span style={{fontSize:11,color:'#80848e'}}>Draft saved</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── DM VIEW ── */}
        {activeDM && !activeChannel && !activeBoard && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:48,borderBottom:'1px solid rgba(255,255,255,0.08)',background:'#313338',flexShrink:0}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',marginRight:10}}>
                {activeDM.other_name?.charAt(0) || '?'}
              </div>
              <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{activeDM.other_name || activeDM.name}</span>
              <span style={{width:8,height:8,borderRadius:'50%',background: onlineUsers.has(activeDM.other_id) ? '#2bac76' : '#80848e',marginLeft:8}}/>
              <span style={{fontSize:12,color:'#80848e',marginLeft:4}}>{onlineUsers.has(activeDM.other_id) ? 'Active now' : 'Offline'}</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:0}}>
              {dmMessages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'4px 8px',borderRadius:6}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{width:36,height:36,borderRadius:'50%',background: isMe ? '#248046' : '#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0,marginTop:2}}>
                      {msg.sender_name?.charAt(0) || '?'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{msg.sender_name}</span>
                        <span style={{fontSize:12,color:'#80848e'}}>{new Date(msg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <div style={{fontSize:15,color:'#d1d2d3',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(msg.content).html || msg.content}} />
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{padding:'0 16px 16px',flexShrink:0}}>
              <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'flex-end',gap:8,padding:'10px 14px'}}>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); sendMessage();} }}
                  placeholder={`Message ${activeDM.other_name || ''}`} rows={1}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#f2f3f5',fontSize:15,resize:'none',maxHeight:128,lineHeight:1.5,fontFamily:'inherit'}} />
                <button onClick={sendMessage} disabled={!newMessage.trim()}
                  style={{background:'#248046',border:'none',borderRadius:6,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,opacity: newMessage.trim() ? 1 : 0.4}}>↑</button>
              </div>
            </div>
          </div>
        )}

        {/* ── BOARD VIEW ── */}
        {activeBoard && !activeChannel && !activeDM && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
            <KanbanView boardId={activeBoard.id} boardName={activeBoard.name} onBack={() => setActiveBoard(null)} />
          </div>
        )}

        {/* ── HOME / MEETINGS VIEW ── */}
        {!activeChannel && !activeBoard && !activeDM && (
          <div style={{flex:1,overflowY:'auto',minHeight:0}}>
            {activeView === 'home' && <HomeView user={user} channels={channels} boards={boards} workspaces={workspaces} onChannel={openChannel} onBoard={(b: any) => { setActiveBoard(b); setActiveChannel(null); }} />}
            {activeView === 'meetings' && <MeetingsView />}
          </div>
        )}

      {/* ── THREAD PANEL ── */}
      {threadMsg && (
        <div style={{width:360,borderLeft:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',background:'#313338',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>Thread</span>
            <button onClick={() => setThreadMsg(null)} style={{background:'none',border:'none',color:'#80848e',cursor:'pointer',fontSize:18}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
            <div style={{display:'flex',gap:12,marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                {threadMsg.sender_name?.charAt(0)}
              </div>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}>
                  <span style={{fontSize:15,fontWeight:700,color:'#f2f3f5'}}>{threadMsg.sender_name}</span>
                  <span style={{fontSize:12,color:'#80848e'}}>{new Date(threadMsg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{fontSize:15,color:'#d1d2d3',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(threadMsg.content).html || threadMsg.content}} />
              </div>
            </div>
            {threadMessages.map(r => (
              <div key={r.id} style={{display:'flex',gap:10,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {r.sender_name?.charAt(0)}
                </div>
                <div>
                  <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#f2f3f5'}}>{r.sender_name}</span>
                    <span style={{fontSize:11,color:'#80848e'}}>{new Date(r.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div style={{fontSize:14,color:'#d1d2d3',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(r.content).html || r.content}} />
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:'8px 16px 16px'}}>
            <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:8,padding:'10px 14px'}}>
              <textarea value={threadReply} onChange={e => setThreadReply(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendThreadReply();} }}
                placeholder="Reply in thread" rows={1} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#f2f3f5',fontSize:14,resize:'none',fontFamily:'inherit'}} />
              <button onClick={sendThreadReply} disabled={!threadReply.trim()} style={{background:'#248046',border:'none',borderRadius:6,padding:'5px 10px',color:'#fff',cursor:'pointer',fontSize:14,opacity: threadReply.trim() ? 1 : 0.4}}>↑</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── MODALS ── */}

      {/* Notifications */}
      {showNotifs && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-end z-50 p-4 pt-16"
          onClick={e => { if (e.target === e.currentTarget) setShowNotifs(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-80 shadow-2xl max-h-[70vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529"}}>
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

      {/* Meeting polls modal */}
      {showPollCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowPollCreate(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Meeting Polls</span>
              <button onClick={() => setShowPollCreate(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            {/* Create poll */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                placeholder="Ask a question..." className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-emerald-500" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                    placeholder={`Option ${i+1}`} className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:border-emerald-500" />
                  {i > 1 && <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 text-xs">x</button>}
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-gray-400 hover:text-white">+ Add option</button>
                <button onClick={async () => {
                  if (!pollQuestion.trim() || !activeMeetingId) return;
                  const validOpts = pollOptions.filter(o => o.trim());
                  if (validOpts.length < 2) { alert('Add at least 2 options'); return; }
                  await api.createPoll(activeMeetingId, pollQuestion.trim(), validOpts);
                  setPollQuestion(''); setPollOptions(['', '']);
                  const res = await api.getPolls(activeMeetingId);
                  setPolls(res?.data || []);
                }} disabled={!pollQuestion.trim()} className="ml-auto text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg">Launch poll</button>
              </div>
            </div>
            {/* Existing polls */}
            {polls.map((p: any) => {
              const voteCount = Object.keys(p.votes || {}).length;
              const opts = Array.isArray(p.options) ? p.options : JSON.parse(p.options || '[]');
              return (
                <div key={p.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">{p.question}</p>
                  <div className="space-y-2">
                    {opts.map((opt: string, i: number) => {
                      const votes = Object.values(p.votes || {}).filter((v: any) => v === i).length;
                      const pct = voteCount > 0 ? Math.round((votes/voteCount)*100) : 0;
                      return (
                        <button key={i} onClick={async () => {
                          await api.votePoll(p.id, i);
                          const res = await api.getPolls(activeMeetingId!);
                          setPolls(res?.data || []);
                        }} className="w-full text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-white flex-1">{opt}</span>
                            <span className="text-xs text-gray-400">{votes} votes ({pct}%)</span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-600">{voteCount} total votes</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Whiteboard modal */}
      {showWhiteboard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowWhiteboard(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
              <span className="text-white font-semibold">Whiteboard</span>
              <button onClick={() => setShowWhiteboard(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="flex-1 relative bg-white rounded-b-2xl overflow-hidden">
              <canvas id="whiteboard-canvas" className="w-full h-full cursor-crosshair"
                style={{ touchAction: 'none' }}
                onMouseDown={e => {
                  const canvas = document.getElementById('whiteboard-canvas') as HTMLCanvasElement;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = canvas.offsetWidth;
                  canvas.height = canvas.offsetHeight;
                  ctx.strokeStyle = '#1a1a1a';
                  ctx.lineWidth = 2;
                  ctx.lineCap = 'round';
                  let drawing = true;
                  const rect = canvas.getBoundingClientRect();
                  ctx.beginPath();
                  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                  const onMove = (ev: MouseEvent) => { if (drawing) { ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top); ctx.stroke(); } };
                  const onUp = () => { drawing = false; canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseup', onUp); };
                  canvas.addEventListener('mousemove', onMove);
                  canvas.addEventListener('mouseup', onUp);
                }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <button onClick={() => {
                  const canvas = document.getElementById('whiteboard-canvas') as HTMLCanvasElement;
                  const ctx = canvas.getContext('2d');
                  if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
                }} className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">Clear</button>
                <button onClick={() => {
                  const canvas = document.getElementById('whiteboard-canvas') as HTMLCanvasElement;
                  const link = document.createElement('a');
                  link.download = 'whiteboard.png';
                  link.href = canvas.toDataURL();
                  link.click();
                }} className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">Save PNG</button>
              </div>
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529"}}>
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

      {/* Deemona Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowConnect(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">Deemona Connect</span>
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
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
  const [orgMembers,  setOrgMembers]  = useState<any[]>([]);
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
  const [showAgenda,  setShowAgenda]  = useState<string|null>(null);
  const [agendaItems, setAgendaItems] = useState<string[]>(['']);
  const [handRaised,  setHandRaised]  = useState(false);
  const [showAttend,  setShowAttend]  = useState<string|null>(null);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [showBreakout,setShowBreakout]= useState(false);
  const [breakoutRooms,setBreakoutRooms]= useState<{name:string,members:string[]}[]>([{name:'Room 1',members:[]},{name:'Room 2',members:[]}]);
  const [captionsOn,  setCaptionsOn]  = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [showSummary, setShowSummary] = useState<string|null>(null);

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

  // ── Meeting agenda ──
  async function saveAgenda(meetingId: string) {
    const items = agendaItems.filter(i => i.trim());
    await apiFetch('/meetings/' + meetingId + '/agenda', { method: 'POST', body: JSON.stringify({ items }) });
    setShowAgenda(null);
    alert('Agenda saved!');
  }

  // ── Load attendance ──
  async function loadAttendance(meetingId: string) {
    const res = await apiFetch('/meetings/' + meetingId + '/participants');
    setAttendance(res?.data || []);
    setShowAttend(meetingId);
  }

  // ── Post meeting summary to channel ──
  async function postSummaryToChannel(meeting: any) {
    const summary = `**Meeting Summary: ${meeting.title}**\n📅 ${new Date(meeting.starts_at).toLocaleString('en-IN')}\n⏱ Duration: ${meeting.duration_mins} mins\n\nThis meeting has concluded. Please add your notes in the thread.`;
    const channels = await api.channels(meeting.workspace_id || '');
    const general = (channels?.data || []).find((c: any) => c.name === 'general');
    if (general) {
      await api.sendMessage(general.id, summary);
      alert('Summary posted to #general!');
    } else {
      alert('Could not find #general channel');
    }
  }

  // ── Live captions ──
  function toggleCaptions() {
    if (!captionsOn) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Live captions not supported in this browser. Try Chrome.'); return; }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
          setCaptionText(transcript);
        };
        recognition.start();
        (window as any)._recognition = recognition;
        setCaptionsOn(true);
      } catch(e) { alert('Could not start captions: ' + e); }
    } else {
      (window as any)._recognition?.stop();
      setCaptionsOn(false);
      setCaptionText('');
    }
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
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
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
                    <button onClick={() => { setShowAgenda(m.id); setAgendaItems(m.agenda || ['']); }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Agenda</button>
                    <button onClick={() => loadAttendance(m.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Attendance</button>
                    <button onClick={() => postSummaryToChannel(m)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Summary</button>
                    <button onClick={toggleCaptions} className={`text-xs px-2 py-1.5 rounded-lg ${captionsOn ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {captionsOn ? 'CC On' : 'CC'}
                    </button>
                    <button onClick={() => setHandRaised(h => !h)} className={`text-xs px-2 py-1.5 rounded-lg ${handRaised ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {handRaised ? '✋ Lowered' : '✋ Raise'}
                    </button>
                    <button onClick={() => setShowBreakout(true)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Breakout</button>
                    {m.metadata?.recording_url && (
                      <a href={m.metadata.recording_url} target="_blank" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Recording</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live captions display */}
      {captionsOn && captionText && (
        <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.85)',color:'#fff',padding:'8px 20px',borderRadius:8,fontSize:14,maxWidth:600,zIndex:200,textAlign:'center'}}>
          {captionText}
        </div>
      )}

      {/* Agenda modal */}
      {showAgenda && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowAgenda(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Meeting agenda</h3>
              <button onClick={() => setShowAgenda(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <p className="text-gray-500 text-xs mb-3">Add agenda items — will be shared with all participants</p>
            {agendaItems.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-gray-500 text-sm mt-2">{i+1}.</span>
                <input value={item} onChange={e => { const a=[...agendaItems]; a[i]=e.target.value; setAgendaItems(a); }}
                  placeholder={`Agenda item ${i+1}`}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                {agendaItems.length > 1 && (
                  <button onClick={() => setAgendaItems(a => a.filter((_,j) => j!==i))} className="text-gray-600 hover:text-red-400 text-lg">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setAgendaItems(a => [...a,''])} className="text-emerald-400 text-sm mt-1 mb-4">+ Add item</button>
            <button onClick={() => saveAgenda(showAgenda)} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">Save agenda</button>
          </div>
        </div>
      )}

      {/* Attendance modal */}
      {showAttend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowAttend(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Meeting attendance</h3>
              <button onClick={() => setShowAttend(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No participants found</p>
            ) : attendance.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">{p.display_name?.charAt(0)}</div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{p.display_name}</div>
                  <div className="text-xs text-gray-500">{p.email}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.joined_at ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                  {p.joined_at ? 'Attended' : 'Invited'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakout rooms modal */}
      {showBreakout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowBreakout(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Breakout rooms</h3>
              <button onClick={() => setShowBreakout(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <p className="text-gray-500 text-xs mb-4">Create smaller rooms for group discussions</p>
            {breakoutRooms.map((room, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-gray-800 rounded-xl">
                <input value={room.name} onChange={e => { const r=[...breakoutRooms]; r[i].name=e.target.value; setBreakoutRooms(r); }}
                  className="flex-1 bg-transparent text-white text-sm outline-none font-medium" />
                <a href={`/meet?room=${encodeURIComponent(room.name)}`} target="_blank"
                  className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Open room</a>
                {breakoutRooms.length > 1 && (
                  <button onClick={() => setBreakoutRooms(r => r.filter((_,j) => j!==i))} className="text-gray-600 hover:text-red-400">×</button>
                )}
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setBreakoutRooms(r => [...r, {name:`Room ${r.length+1}`,members:[]}])}
                className="flex-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 py-2 rounded-xl border border-gray-700">+ Add room</button>
              <button onClick={() => { alert('Breakout rooms opened! Share the room links with participants.'); setShowBreakout(false); }}
                className="flex-1 text-sm bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-xl font-medium">Start breakouts</button>
            </div>
          </div>
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"#222529",flexShrink:0}}>
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
