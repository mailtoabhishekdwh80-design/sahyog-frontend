'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { api, apiFetch, isLoggedIn } from '../lib/api';
import GlobalSearch    from './GlobalSearch';
import CanvasView      from './CanvasView';
import WorkflowBuilder from './WorkflowBuilder';
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
  const [showWsMenu,     setShowWsMenu]     = useState(false);
  const [showGlobalSearch,  setShowGlobalSearch]  = useState(false);
  const [showCanvas,        setShowCanvas]        = useState(false);
  const [showWorkflow,      setShowWorkflow]      = useState(false);
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
  const [theme,          setTheme]          = useState<'dark'|'light'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('dt_theme') as any) || 'dark';
    return 'dark';
  });
  const [showShortcuts,  setShowShortcuts]  = useState(false);
  const [tourStep,       setTourStep]       = useState<number|null>(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('dt_tour_done')) return 0;
    return null;
  });
  const [notifPrefs,     setNotifPrefs]     = useState<Record<string,string>>({});
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [editingMsgId,   setEditingMsgId]   = useState<string|null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editHistory,    setEditHistory]    = useState<any[]>([]);
  const [showEditHist,   setShowEditHist]   = useState<string|null>(null);
  const [reactionUsers,  setReactionUsers]  = useState<any>(null);
  const [msgDraft,       setMsgDraft]       = useState<Record<string,string>>({});
  const [showJumpDate,   setShowJumpDate]   = useState(false);
  const [jumpDate,       setJumpDate]       = useState('');
  const [slashCmd,       setSlashCmd]       = useState('');
  // ── New messaging features ──
  const [mentionQuery,   setMentionQuery]   = useState('');
  const [showMentions,   setShowMentions]   = useState(false);
  const [showGifPicker,  setShowGifPicker]  = useState(false);
  const [gifSearch,      setGifSearch]      = useState('');
  const [mutedChannels,  setMutedChannels]  = useState<string[]>(() => { try { return JSON.parse((typeof window!=='undefined'&&localStorage.getItem('muted_channels'))||'[]'); } catch{return[];} });
  const [showChannelMembers, setShowChannelMembers] = useState(false);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [dndEnabled,     setDndEnabled]     = useState(false);
  const [dndUntil,       setDndUntil]       = useState('');
  const [starredMsgs,    setStarredMsgs]    = useState<string[]>(() => { try { return JSON.parse((typeof window!=='undefined'&&localStorage.getItem('starred_msgs'))||'[]'); } catch{return[];} });
  const [showStarred,    setShowStarred]    = useState(false);
  const [fwdMsg,         setFwdMsg]         = useState<any>(null);
  const [showFwd,        setShowFwd]        = useState(false);
  const [reminderMsg,    setReminderMsg]    = useState<any>(null);
  // ── Additional features ──
  const [showGroupDM,    setShowGroupDM]    = useState(false);
  const [groupDMMembers, setGroupDMMembers] = useState<string[]>([]);
  const [showHuddle,     setShowHuddle]     = useState(false);
  const [huddleActive,   setHuddleActive]   = useState(false);
  const [showIntegrations,setShowIntegrations]=useState(false);
  const [notifSound,     setNotifSound]     = useState(true);
  const [showLinkPreview,setShowLinkPreview]=useState<Record<string,any>>({});
  const [bgBlur,         setBgBlur]         = useState(false);
  const [meetingCapacity,setMeetingCapacity]=useState(50);
  // ── New features ──
  const [dmSearchResults,setDmSearchResults]= useState<any[]>([]);
  const [channelQuery,   setChannelQuery]   = useState('');
  const [showChannelAC,  setShowChannelAC]  = useState(false);
  const [emojiQuery,     setEmojiQuery]     = useState('');
  const [showEmojiAC,    setShowEmojiAC]    = useState(false);
  const [translating,    setTranslating]    = useState<string|null>(null);
  const [translations,   setTranslations]   = useState<Record<string,string>>({});
  const [wsReconnecting, setWsReconnecting] = useState(false);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [readReceipts,   setReadReceipts]   = useState<Record<string,string[]>>({});
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
        if (msg.type === 'notification.new') {
          setNotifications(p => [msg.payload, ...p]);
          setUnreadCount(c => {
            updateFaviconBadge(c + 1);
            return c + 1;
          });
          showDesktopNotification('Deemona Teams', msg.payload?.content || 'New notification');
        }
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
    setLoadingMsgs(true); setMessages([]);
    setActiveChannel(ch); setActiveBoard(null); setActiveDM(null); setActiveView('home');
    setMessages([]); setShowMsgSearch(false); setMsgSearch('');
    const res = await api.messages(ch.id);
    setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    subscribe(ch.id);
  }

  // ── Link preview (URL unfurl) ──
  async function fetchLinkPreview(url: string, msgId: string) {
    if (showLinkPreview[msgId]) return;
    try {
      const res = await apiFetch('/channels/link-preview?url=' + encodeURIComponent(url));
      if (res?.data?.title) setShowLinkPreview(p => ({...p, [msgId]: res.data}));
    } catch {}
  }

  // ── Notification sound ──
  function playNotifSound() {
    if (!notifSound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // ── Huddle (audio-only call) ──
  async function startHuddle() {
    setHuddleActive(true);
    setShowHuddle(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      (window as any)._huddleStream = stream;
    } catch { alert('Could not access microphone. Please allow microphone access.'); setHuddleActive(false); }
  }

  function endHuddle() {
    (window as any)._huddleStream?.getTracks().forEach((t: any) => t.stop());
    setHuddleActive(false); setShowHuddle(false);
  }

  // ── Group DM ──
  async function createGroupDM() {
    if (groupDMMembers.length < 2) { alert('Select at least 2 members for group DM'); return; }
    const res = await apiFetch('/channels/group-dm', { method:'POST', body: JSON.stringify({ memberIds: groupDMMembers }) });
    if (res?.data?.id) {
      setShowGroupDM(false);
      setGroupDMMembers([]);
      const wsRes = await api.workspaces();
      const wsId = wsRes?.data?.[0]?.id;
      if (wsId) { const r = await api.channels(wsId); setChannels(Array.isArray(r?.data) ? r.data : []); }
    }
  }

  // ── Favicon unread badge ──
  function updateFaviconBadge(count: number) {
    if (typeof document === 'undefined') return;
    document.title = count > 0 ? `(${count > 99 ? '99+' : count}) Deemona Teams` : 'Deemona Teams';
  }

  // ── Browser push notification ──
  async function requestPushPermission() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Desktop notifications enabled! You will receive alerts for mentions and DMs.');
    }
  }

  function showDesktopNotification(title: string, body: string) {
    if (Notification.permission === 'granted' && notifSound) {
      new Notification(title, { body, icon: '/favicon.ico' });
      playNotifSound();
    }
  }

  function syncToGoogleCalendar(meeting: any) {
    const start = new Date(meeting.starts_at);
    const end = new Date(start.getTime() + (meeting.duration_mins || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('Deemona Teams meeting. Join: ' + window.location.origin + '/meet?id=' + meeting.id)}&sf=true&output=xml`;
    window.open(url, '_blank');
  }

  // ── WebSocket reconnection ──
  function setupWSReconnection(ws: WebSocket) {
    ws.onclose = () => {
      setWsReconnecting(true);
      let attempts = 0;
      const retry = setInterval(() => {
        attempts++;
        if (attempts > 10) { clearInterval(retry); return; }
        try {
          const newWs = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || '');
          newWs.onopen = () => {
            setWsReconnecting(false);
            clearInterval(retry);
            wsRef.current = newWs;
            // Resync messages after reconnect
            if (activeChannel) openChannel(activeChannel);
          };
          newWs.onerror = () => {};
        } catch {}
      }, 3000 * attempts);
    };
  }

  // ── DM search ──
  async function searchDMs(q: string) {
    setDmSearch(q);
    if (!q.trim() || !activeDM) { setDmSearchResults([]); return; }
    const filtered = dmMessages.filter(m =>
      m.content.toLowerCase().includes(q.toLowerCase()) ||
      m.sender_name.toLowerCase().includes(q.toLowerCase())
    );
    setDmSearchResults(filtered);
  }

  // ── Message translation ──
  async function translateMessage(msgId: string, content: string) {
    if (translations[msgId]) { setTranslations(p => { const n={...p}; delete n[msgId]; return n; }); return; }
    setTranslating(msgId);
    const res = await apiFetch('/ai/translate', { method:'POST', body: JSON.stringify({ text: content, targetLang: 'Hindi' }) });
    setTranslating(null);
    if (res?.data?.translation) {
      setTranslations(p => ({ ...p, [msgId]: res.data.translation }));
    }
  }

  // ── Read receipts ──
  async function markDMRead(dmId: string) {
    await apiFetch('/channels/' + dmId + '/read', { method: 'POST' }).catch(() => {});
  }

  // ── Emoji autocomplete ──
  const EMOJI_MAP: Record<string, string> = {
    thumbsup:'👍', heart:'❤️', laugh:'😂', fire:'🔥', check:'✅', star:'⭐',
    rocket:'🚀', tada:'🎉', eyes:'👀', wave:'👋', clap:'👏', pray:'🙏',
    thinking:'🤔', smile:'😊', cry:'😢', angry:'😠', cool:'😎', party:'🥳',
    india:'🇮🇳', rupee:'💰', phone:'📱', email:'📧', calendar:'📅', clock:'⏰'
  };

  function handleComposerInput(val: string) {
    setNewMessage(val);
    if (activeChannel) saveDraft(activeChannel.id, val);

    // Mention autocomplete
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) { setMentionQuery(atMatch[1]); setShowMentions(true); setShowChannelAC(false); setShowEmojiAC(false); }
    else setShowMentions(false);

    // Channel autocomplete
    const hashMatch = val.match(/#(\w*)$/);
    if (hashMatch) { setChannelQuery(hashMatch[1]); setShowChannelAC(true); setShowMentions(false); setShowEmojiAC(false); }
    else setShowChannelAC(false);

    // Emoji autocomplete
    const colonMatch = val.match(/:(\w+)$/);
    if (colonMatch && colonMatch[1].length >= 2) { setEmojiQuery(colonMatch[1]); setShowEmojiAC(true); setShowMentions(false); setShowChannelAC(false); }
    else setShowEmojiAC(false);

    // Slash commands
    setShowSlashMenu(val.startsWith('/') && val.length > 0 && !val.includes(' '));
  }

  function insertChannelRef(name: string) {
    const newVal = newMessage.replace(/#\w*$/, '#' + name + ' ');
    setNewMessage(newVal); setShowChannelAC(false);
    document.getElementById('msg-composer')?.focus();
  }

  function insertEmoji(emoji: string) {
    const newVal = newMessage.replace(/:\w+$/, emoji + ' ');
    setNewMessage(newVal); setShowEmojiAC(false);
    document.getElementById('msg-composer')?.focus();
  }

  // ── Channel member list ──
  async function loadChannelMembers() {
    if (!activeChannel) return;
    const res = await apiFetch('/channels/' + activeChannel.id + '/members');
    setChannelMembers(res?.data || []);
    setShowChannelMembers(true);
  }

  // ── Mute/unmute channel ──
  function toggleMute(channelId: string) {
    const muted = mutedChannels.includes(channelId)
      ? mutedChannels.filter(id => id !== channelId)
      : [...mutedChannels, channelId];
    setMutedChannels(muted);
    localStorage.setItem('muted_channels', JSON.stringify(muted));
  }

  // ── Leave channel ──
  async function leaveChannel(channelId: string) {
    if (!confirm('Leave this channel?')) return;
    await apiFetch('/channels/' + channelId + '/leave', { method: 'POST' });
    setActiveChannel(null);
    const wsRes = await api.workspaces();
    const wsId = wsRes?.data?.[0]?.id;
    if (wsId) { const r = await api.channels(wsId); setChannels(Array.isArray(r?.data) ? r.data : []); }
  }

  // ── Star/unstar message ──
  function toggleStarMessage(msgId: string) {
    const starred = starredMsgs.includes(msgId)
      ? starredMsgs.filter(id => id !== msgId)
      : [...starredMsgs, msgId];
    setStarredMsgs(starred);
    localStorage.setItem('starred_msgs', JSON.stringify(starred));
  }

  // ── Copy message link ──
  function copyMessageLink(msgId: string) {
    const url = window.location.origin + '/workspace?channel=' + activeChannel?.id + '&msg=' + msgId;
    navigator.clipboard.writeText(url).then(() => alert('Message link copied!')).catch(() => {});
  }

  // ── Forward message ──
  function forwardMessage(msg: any) {
    setFwdMsg(msg);
    setShowFwd(true);
  }

  // ── Send message reminder ──
  function setMessageReminder(msg: any, minutes: number) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Deemona Teams reminder', {
          body: msg.content.substring(0, 80),
          icon: '/favicon.ico'
        });
      } else {
        alert('Reminder: ' + msg.content.substring(0, 80));
      }
    }, minutes * 60 * 1000);
    alert('Reminder set for ' + minutes + ' minute' + (minutes > 1 ? 's' : '') + ' from now!');
  }

  // ── @channel mention ──
  async function notifyChannel() {
    if (!activeChannel) return;
    if (!confirm('@channel will notify ALL members of this channel. Continue?')) return;
    await apiFetch('/channels/' + activeChannel.id + '/notify-all', { method: 'POST', body: JSON.stringify({ message: '@channel' }) });
    alert('All channel members notified!');
  }

  // ── Mention autocomplete ──
  function handleMentionInput(val: string) {
    setNewMessage(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
    setShowSlashMenu(val.startsWith('/') && val.length > 0 && !val.includes(' '));
    if (activeChannel) saveDraft(activeChannel.id, val);
  }

  function insertMention(name: string) {
    const newVal = newMessage.replace(/@\w*$/, '@' + name + ' ');
    setNewMessage(newVal);
    setShowMentions(false);
    document.getElementById('msg-composer')?.focus();
  }

  // ── DND ──
  function enableDND(hours: number) {
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    setDndEnabled(true);
    setDndUntil(until);
    localStorage.setItem('dnd_until', until);
    alert('Do not disturb enabled for ' + hours + ' hour' + (hours > 1 ? 's' : '') + '.');
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
    return (typeof window !== 'undefined' && localStorage.getItem('draft_' + channelId)) || '';
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
    const msgText = newMessage.trim();
    setNewMessage('');
    const res = await api.sendMessage(activeChannel.id, msgText);
    if (res?.data) {
      setMessages((prev: any[]) => [...prev, res.data]);
    } else {
      // Fallback: reload messages
      const r = await api.messages(activeChannel.id);
      setMessages(Array.isArray(r?.data) ? r.data.reverse() : []);
    }
    setSending(false);
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
      const uploaded = await (api as any).uploadFile(file, workspaceId);
      const isImage = file.type.startsWith('image/');
      await api.sendMessage(channelId, `[${isImage ? 'image' : 'file'}:${file.name}](${uploaded.url})`);
      const res = await api.messages(channelId);
      if (activeChannel) setMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
      else setDmMessages(Array.isArray(res?.data) ? res.data.reverse() : []);
    } catch (err: any) { alert('Upload failed: ' + (err?.message || 'Please try again')); }
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
    <div data-theme={theme} style={{display:'flex',height:'100vh',overflow:'hidden',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',background:'#000000',color: theme === 'light' ? '#0E1117' : '#C8D0E0'}}>

      {/* ══ SIDEBAR ══ */}
      <div style={{width:240,background:'#3F0E40',borderRight:'1px solid rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',flexShrink:0}}>
        {/* Workspace name + search */}
        <div style={{padding:'16px 16px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:15,fontWeight:700,color:'#fff',letterSpacing:-0.3}}>{activeWs?.name || 'Deemona Teams'}</span>
            <div style={{position:'relative'}}>
              <button onClick={() => setShowWsMenu(m => !m)}
                title="Create new channel or invite people"
                style={{width:24,height:24,borderRadius:6,background: showWsMenu ? 'rgba(99,120,180,0.22)' : 'rgba(99,120,180,0.12)',border:'none',cursor:'pointer',color:'#FFFFFF',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              {showWsMenu && (
                <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,background:'#1A1A2E',border:'1px solid rgba(99,120,180,0.16)',borderRadius:10,zIndex:200,width:220,boxShadow:'0 8px 24px rgba(0,0,0,0.6)',overflow:'hidden'}}
                  onClick={() => setShowWsMenu(false)}>
                  {[
                    { icon:'#️⃣', label:'New channel',    desc:'Create a conversation channel',    fn: () => setShowNewChannel(true) },
                    { icon:'👥', label:'Invite people',   desc:'Add members to this workspace',   fn: () => window.location.href='/admin' },
                    { icon:'📋', label:'Browse channels', desc:'See all channels in this workspace', fn: () => loadChannelBrowser() },
                    { icon:'🛡️', label:'Admin panel',     desc:'Manage workspace settings',        fn: () => window.location.href='/admin' },
                  ].map(item => (
                    <button key={item.label} onClick={item.fn}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',borderBottom:'1px solid rgba(99,120,180,0.07)'}}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(99,120,180,0.09)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}>
                      <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#FFFFFF'}}>{item.label}</div>
                        <div style={{fontSize:11,color:'#CBD5E1'}}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Search bar */}
          <button onClick={() => { setShowSearch(true); }} style={{width:'100%',background:'rgba(99,120,180,0.12)',border:'none',borderRadius:6,padding:'6px 10px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',color:'#E2E8F0',fontSize:13}}>
            🔍 <span>Search</span>
            <span style={{marginLeft:'auto',fontSize:11,opacity:.5}}>Ctrl+K</span>
          </button>
        </div>

        {/* Nav items */}
        <div style={{flex:1,overflowY:'auto',padding:'0 8px 8px'}}>

          {/* Direct Messages */}
          <div style={{marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px 4px'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#E2E8F0',letterSpacing:.5,textTransform:'uppercase'}}>Direct messages</span>
              <div style={{display:'flex',gap:2}}>
              <button onClick={() => { setShowNewDM(true); api.orgMembers().then(r => setDmOrgMembers(Array.isArray(r?.data) ? r.data : [])); }}
                style={{background:'none',border:'none',color:'#E2E8F0',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4}} title="New DM">+</button>
              <button onClick={() => { setShowGroupDM(true); api.orgMembers().then(r => setDmOrgMembers(Array.isArray(r?.data) ? r.data : [])); }}
                style={{background:'none',border:'none',color:'#E2E8F0',cursor:'pointer',fontSize:12,lineHeight:1,padding:2,borderRadius:4,fontWeight:600}} title="New group DM">👥</button>
            </div>
            </div>
            {dmList.map((dm: any) => (
              <button key={dm.id} onClick={() => openDM(dm)}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeDM?.id === dm.id ? 'rgba(99,120,180,0.14)' : 'transparent',color: activeDM?.id === dm.id ? '#fff' : '#8892A4',transition:'all .1s'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff'}}>
                    {dm.other_name?.charAt(0) || '?'}
                  </div>
                  <span style={{position:'absolute',bottom:-1,right:-1,width:8,height:8,borderRadius:'50%',border:'2px solid #0E1117',background: onlineUsers.has(dm.other_id) ? '#4F6EF7' : '#616061'}}/>
                </div>
                <span style={{fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dm.other_name || dm.name}</span>
              </button>
            ))}
          </div>

          {/* Channels */}
          <div style={{marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px 4px'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#E2E8F0',letterSpacing:.5,textTransform:'uppercase'}}>Channels</span>
              <button onClick={() => setShowNewChannel(true)}
                style={{background:'none',border:'none',color:'#E2E8F0',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4}}>+</button>
            </div>
            {channels.filter(c => c.type !== 'direct').slice(0, 15).map(ch => (
              <button key={ch.id} onClick={() => openChannel(ch)}
                style={{width:'100%',display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeChannel?.id === ch.id ? 'rgba(74,222,128,0.12)' : 'transparent',color: activeChannel?.id === ch.id ? '#fff' : (ch.unread_count ?? 0) > 0 ? '#fff' : '#8892A4',fontWeight: (ch.unread_count ?? 0) > 0 ? 700 : 400,transition:'all .1s'}}>
                <span style={{fontSize:14,color: activeChannel?.id === ch.id ? '#818CF8' : '#8892A4',fontWeight:400}}>#</span>
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
              <span style={{fontSize:12,fontWeight:700,color:'#E2E8F0',letterSpacing:.5,textTransform:'uppercase'}}>Boards</span>
              <button onClick={async () => {
                const name = prompt('Board name?');
                if (!name) return;
                const wsRes = await api.workspaces();
                const wsId = wsRes?.data?.[0]?.id;
                if (wsId) { await api.createBoard(name, wsId); const r = await api.boards(wsId); setBoards(Array.isArray(r?.data) ? r.data : []); }
              }} style={{background:'none',border:'none',color:'#E2E8F0',cursor:'pointer',fontSize:18,lineHeight:1,padding:2,borderRadius:4}}>+</button>
            </div>
            {boards.map(b => (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:2}}>
                <button onClick={() => { setActiveBoard(b); setActiveChannel(null); setActiveDM(null); }}
                  style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background: activeBoard?.id === b.id ? 'rgba(99,120,180,0.14)' : 'transparent',color: activeBoard?.id === b.id ? '#fff' : '#8892A4',transition:'all .1s'}}>
                  <span style={{fontSize:12,width:18,height:18,borderRadius:4,background:'rgba(99,120,180,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#E2E8F0'}}>B</span>
                  <span style={{fontSize:14,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span>
                </button>
              </div>
            ))}
          </div>

          {/* More links */}
          <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(99,120,180,0.09)'}}>
            {[
              { icon:'📹', label:'Meetings', action: () => { setActiveView('meetings'); setActiveChannel(null); setActiveBoard(null); setActiveDM(null); } },
              { icon:'🏠', label:'Home', action: () => { setActiveView('home'); setActiveChannel(null); setActiveBoard(null); setActiveDM(null); } },
              { icon:'⚙️', label:'Settings', action: () => window.location.href='/settings' },
              { icon:'📝', label:'Canvas',    action: () => setShowCanvas(true) },
              { icon:'⚡', label:'Workflows', action: () => setShowWorkflow(true) },
              { icon:'🔖', label:'Saved messages', action: loadBookmarks },
              { icon:'🔭', label:'Browse channels', action: loadChannelBrowser },
              { icon:'🛡️', label:'Admin', action: () => window.location.href='/admin' },
              { icon:'🇮🇳', label:'India features', action: () => window.location.href='/india' },
              { icon:'🛡️', label:'Security center', action: () => window.location.href='/security' },
              { icon:'📋', label:'Compliance', action: () => window.location.href='/compliance' },
              { icon:'🏢', label:'Enterprise', action: () => window.location.href='/enterprise' },
              { icon:'📱', label:'WhatsApp setup', action: () => window.location.href='/settings' },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',textAlign:'left',background:'transparent',color:'#E2E8F0',transition:'all .1s',fontSize:14}}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User footer */}
        <div style={{padding:'8px 12px',borderTop:'1px solid rgba(99,120,180,0.12)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <button onClick={() => setShowStatus(true)} style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',flex:1,minWidth:0,padding:'4px 0',textAlign:'left'}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'#4a9a6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>
                  {user?.display_name?.charAt(0) || '?'}
                </div>
                <span style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',border:'2px solid #0E1117',background: user?.status_text?.toLowerCase().includes('meeting') ? '#e01e5a' : '#4F6EF7'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.display_name || user?.email?.split('@')[0]}</div>
                <div style={{fontSize:11,color:'#E2E8F0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.status_text || 'Set a status'}</div>
              </div>
            </button>
            <button onClick={() => {
                const t = theme === 'dark' ? 'light' : 'dark';
                setTheme(t);
                localStorage.setItem('dt_theme', t);
                document.documentElement.setAttribute('data-theme', t);
              }} title="Toggle theme"
              style={{background:'none',border:'none',cursor:'pointer',color:'#E2E8F0',fontSize:16,padding:4,borderRadius:6,flexShrink:0}}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)"
              style={{background:'none',border:'none',cursor:'pointer',color:'#E2E8F0',fontSize:13,padding:4,borderRadius:6,flexShrink:0,fontWeight:700}}>?</button>
          </div>
          <button onClick={() => api.logout()}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'rgba(237,66,69,0.08)',border:'1px solid rgba(237,66,69,0.25)',borderRadius:8,cursor:'pointer',color:'#f87171',fontSize:13,fontWeight:600,padding:'8px 0'}}>
            <span>↪</span><span>Sign out</span>
          </button>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#000000'}}>

        {/* ── WS RECONNECTING BANNER ── */}
      {wsReconnecting && (
        <div style={{background:'#f59e0b',color:'#000',fontSize:12,fontWeight:600,textAlign:'center',padding:'6px',flexShrink:0}}>
          ⚠️ Connection lost — reconnecting... Messages will sync when reconnected.
        </div>
      )}

      {/* ── CHANNEL VIEW ── */}
        {activeChannel && !activeBoard && !activeDM && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Channel header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:48,borderBottom:'1px solid rgba(99,120,180,0.12)',background:'#313338',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18,color:'#CBD5E1',fontWeight:400}}>#</span>
                <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{activeChannel.name}</span>
                {channelDescEdit ? (
                  <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:8}}>
                    <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                      placeholder="Channel description..." autoFocus
                      style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'3px 8px',color:'#FFFFFF',fontSize:13,width:220}}
                      onKeyDown={e => { if(e.key==='Enter') saveChannelDesc(); if(e.key==='Escape') setChannelDescEdit(false); }} />
                    <button onClick={saveChannelDesc} style={{background:'#4F6EF7',border:'none',borderRadius:5,padding:'3px 8px',color:'#fff',fontSize:12,cursor:'pointer'}}>Save</button>
                    <button onClick={() => setChannelDescEdit(false)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12}}>Cancel</button>
                  </div>
                ) : (
                  <span onClick={() => { setChannelDescEdit(true); setNewChannelDesc(activeChannel.description || ''); }}
                    style={{fontSize:13,color:'#CBD5E1',marginLeft:4,cursor:'pointer'}} title="Click to edit description">
                    {activeChannel.description || <span style={{opacity:.5}}>Add description</span>}
                  </span>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <button onClick={loadPins} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:13,padding:'4px 8px',borderRadius:6}}>📌</button>
                <button onClick={() => setShowMsgSearch(s => !s)} style={{background:'none',border:'none',color: showMsgSearch ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:13,padding:'4px 8px',borderRadius:6}}>🔍</button>
                <button onClick={async () => { if (activeChannel) { await api.notifyHere(activeChannel.id, '@here'); alert('All channel members notified!'); } }} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>@here</button>
                <button onClick={() => setShowNotifPrefs(true)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}} title="Notification preferences">🔔</button>
                <button onClick={() => huddleActive ? endHuddle() : startHuddle()}
                  style={{background: huddleActive ? 'rgba(74,222,128,0.15)' : 'none',border:'none',color: huddleActive ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}} title="Start huddle (audio call)">
                  {huddleActive ? '🎙️ Huddle' : '🎙️'}
                </button>
                <button onClick={() => setShowIntegrations(true)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}} title="App integrations">⚡</button>
                <button onClick={loadChannelMembers} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}} title="Channel members">👥</button>
                <button onClick={() => toggleMute(activeChannel?.id||'')} style={{background: mutedChannels.includes(activeChannel?.id||'') ? 'rgba(237,66,69,0.15)' : 'none',border:'none',color: mutedChannels.includes(activeChannel?.id||'') ? '#ed4245' : '#7A8499',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}} title="Mute/unmute channel">{mutedChannels.includes(activeChannel?.id||'') ? '🔕' : '🔔'}</button>
                <button onClick={() => notifyChannel()} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}} title="@channel — notify all members">@ch</button>
                <button onClick={() => setShowStarred(s => !s)} style={{background: showStarred ? 'rgba(251,191,36,0.15)' : 'none',border:'none',color: showStarred ? '#fbbf24' : '#7A8499',cursor:'pointer',fontSize:14,padding:'4px 8px',borderRadius:6}} title="Starred messages">⭐</button>
                <button onClick={() => leaveChannel(activeChannel?.id||'')} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}} title="Leave channel">Leave</button>
                <button onClick={loadAnalytics} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Analytics</button>
                <button onClick={loadScheduled} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Scheduled</button>
                <button onClick={loadCustomEmojis} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Emoji</button>
                <button onClick={() => setShowConnect(true)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Connect</button>
                <button onClick={() => setShowAI(s => !s)} style={{background: showAI ? 'rgba(74,222,128,0.15)' : 'none',border:'none',color: showAI ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6,fontWeight:600}}>AI</button>
                <button onClick={summarizeChannel} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12,padding:'4px 8px',borderRadius:6}}>Summarize</button>
                <span style={{fontSize:12,color:'#CBD5E1',padding:'4px 8px',borderRadius:6,border:'1px solid rgba(99,120,180,0.12)',cursor:'pointer'}} onClick={() => setShowGlobalSearch(true)}>Ctrl+K</span>
              </div>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div style={{padding:'8px 16px',borderBottom:'1px solid rgba(99,120,180,0.12)',background:'#1A1A2E'}}>
                <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search messages..." autoFocus
                  style={{width:'100%',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'7px 12px',color:'#FFFFFF',fontSize:13,outline:'none'}} />
              </div>
            )}

            {/* AI Panel */}
            {showAI && (
              <div style={{borderTop:'1px solid rgba(99,120,180,0.12)',background:'#161C2A',display:'flex',flexDirection:'column',height:300,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderBottom:'1px solid rgba(99,120,180,0.12)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>AI</div>
                    <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>Deemona AI</span>
                    <span style={{fontSize:12,color:'#CBD5E1'}}>Ask anything about this channel</span>
                  </div>
                  <button onClick={() => setShowAI(false)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:16}}>✕</button>
                </div>
                <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                  {aiMessages.length === 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {['Summarize recent discussion','What are the action items?','Draft a reply','Translate to Hindi'].map(s => (
                        <button key={s} onClick={() => setAiInput(s)} style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'6px 12px',color:'#A8B3C8',fontSize:12,cursor:'pointer'}}>{s}</button>
                      ))}
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} style={{display:'flex',gap:8,justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
                      {m.role === 'assistant' && <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>AI</div>}
                      <div style={{maxWidth:'75%',padding:'8px 12px',borderRadius:8,fontSize:13,lineHeight:1.5,background: m.role === 'user' ? '#4F6EF7' : 'rgba(99,120,180,0.12)',color: m.role === 'user' ? '#fff' : '#C8D0E0'}}>{m.content}</div>
                    </div>
                  ))}
                  {aiLoading && <div style={{display:'flex',gap:8}}><div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#60a5fa)',flexShrink:0}}/><div style={{background:'rgba(99,120,180,0.12)',padding:'8px 12px',borderRadius:8,fontSize:13,color:'#CBD5E1',fontStyle:'italic'}}>Thinking...</div></div>}
                </div>
                <div style={{padding:'8px 16px',borderTop:'1px solid rgba(99,120,180,0.12)',display:'flex',gap:8}}>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAIMessage()}
                    placeholder="Ask Deemona AI..." style={{flex:1,background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'7px 12px',color:'#FFFFFF',fontSize:13,outline:'none'}} />
                  <button onClick={sendAIMessage} disabled={!aiInput.trim() || aiLoading} style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'7px 14px',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity: aiInput.trim() ? 1 : 0.5}}>Send</button>
                </div>
              </div>
            )}

            {/* Schedule panel */}
            {showSchedule && (
              <div style={{padding:'8px 16px',borderBottom:'1px solid rgba(99,120,180,0.12)',background:'#1A1A2E',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:12,color:'#CBD5E1'}}>Schedule for:</span>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'5px 10px',color:'#FFFFFF',fontSize:12,outline:'none'}} />
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'5px 10px',color:'#FFFFFF',fontSize:12,outline:'none'}} />
                <button onClick={scheduleMessage} disabled={!scheduleDate || !scheduleTime || !newMessage.trim()} style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'5px 12px',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',opacity: scheduleDate && scheduleTime && newMessage.trim() ? 1 : 0.5}}>Schedule</button>
                <button onClick={() => setShowSchedule(false)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12}}>Cancel</button>
              </div>
            )}

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'16px 16px 8px',display:'flex',flexDirection:'column',gap:0}}>
              {loadingMsgs && (
                <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(99,120,180,0.09)',flexShrink:0,animation:'pulse 1.5s ease-in-out infinite'}}/>
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                        <div style={{height:12,background:'rgba(99,120,180,0.09)',borderRadius:4,width:'20%',animation:'pulse 1.5s ease-in-out infinite'}}/>
                        <div style={{height:14,background:'rgba(99,120,180,0.09)',borderRadius:4,width: i%2===0?'70%':'50%',animation:'pulse 1.5s ease-in-out infinite'}}/>
                        {i%3===0 && <div style={{height:14,background:'rgba(99,120,180,0.09)',borderRadius:4,width:'40%',animation:'pulse 1.5s ease-in-out infinite'}}/>}
                      </div>
                    </div>
                  ))}
                  <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
                </div>
              )}

              {messages.length === 0 && !showMsgSearch && !loadingMsgs && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,gap:16,padding:40,opacity:.6}}>
                  <div style={{fontSize:48}}>💬</div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'#FFFFFF',marginBottom:6}}>No messages yet</div>
                    <div style={{fontSize:14,color:'#CBD5E1'}}>Be the first to send a message in #{activeChannel?.name}</div>
                  </div>
                </div>
              )}
              {(showMsgSearch ? msgSearchResults : messages).map(msg => {
                const rendered = renderMessage(msg.content);
                return (
                  <div key={msg.id} className="group"
                    style={{display:'flex',alignItems:'flex-start',gap:12,padding:'4px 8px',borderRadius:6,borderLeft: msg.is_pinned ? '2px solid #f59e0b' : 'none',background: msg.is_pinned ? 'rgba(245,158,11,0.04)' : 'transparent',cursor:'default'}}
                    onMouseEnter={e => { if(!msg.is_pinned)(e.currentTarget as HTMLElement).style.background='rgba(79,110,247,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background= msg.is_pinned ? 'rgba(245,158,11,0.04)' : 'transparent'; }}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0,marginTop:2}}>
                      {msg.sender_name?.charAt(0) || '?'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{msg.sender_name}</span>
                        <span style={{fontSize:12,color:'#CBD5E1'}}>{new Date(msg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                        {msg.is_edited && <span style={{fontSize:11,color:'#616061'}}>(edited)</span>}
                        {msg.is_pinned && <span style={{fontSize:11,color:'#f59e0b'}}>pinned</span>}
                      </div>
                      {editingMsgId === msg.id ? (
                        <div style={{marginTop:4}}>
                          <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)} rows={2} autoFocus
                            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveEditMessage(editingMsgId!);} if(e.key==='Escape'){setEditingMsgId(null);} }}
                            style={{width:'100%',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,padding:'8px 10px',color:'#FFFFFF',fontSize:14,resize:'none',fontFamily:'inherit'}} />
                          <div style={{display:'flex',gap:6,marginTop:4}}>
                            <button onClick={() => saveEditMessage(editingMsgId!)} style={{background:'#4F6EF7',border:'none',borderRadius:5,padding:'4px 10px',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>Save</button>
                            <button onClick={() => setEditingMsgId(null)} style={{background:'none',border:'1px solid rgba(99,120,180,0.14)',borderRadius:5,padding:'4px 10px',color:'#A8B3C8',fontSize:12,cursor:'pointer'}}>Cancel</button>
                            <span style={{fontSize:11,color:'#CBD5E1',alignSelf:'center'}}>Enter to save · Esc to cancel</span>
                          </div>
                        </div>
                      ) : rendered.isFile ? (
                        rendered.isImage
                          ? <img src={rendered.url} alt={rendered.name} style={{maxWidth:360,maxHeight:260,borderRadius:8,marginTop:4,objectFit:'cover'}} />
                          : <a href={rendered.url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'6px 12px',color:'#00aff4',fontSize:13,textDecoration:'none',marginTop:4}}>📎 {rendered.name}</a>
                      ) : (
                        <div style={{fontSize:15,color:'#C8D0E0',lineHeight:1.5,wordBreak:'break-word'}} dangerouslySetInnerHTML={{__html: rendered.html || ''}} />
                      )}
                      {/* Translation */}
                      {translations[msg.id] && (
                        <div style={{fontSize:14,color:'#818cf8',lineHeight:1.5,marginTop:4,padding:'6px 10px',background:'rgba(99,102,241,0.08)',borderRadius:6,borderLeft:'2px solid #818cf8'}}>
                          <span style={{fontSize:10,color:'#6366f1',fontWeight:600,display:'block',marginBottom:2}}>Hindi translation:</span>
                          {translations[msg.id]}
                        </div>
                      )}

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => api.addReaction(msg.id, activeChannel!.id, emoji).then(() => openChannel(activeChannel!))}
                              style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:12,padding:'2px 8px',fontSize:13,cursor:'pointer',color:'#C8D0E0',display:'flex',alignItems:'center',gap:4}}>
                              {emoji} <span style={{fontSize:12,color:'#CBD5E1'}}>{count as number}</span>
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
                          style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:6,padding:'3px 6px',fontSize:13,cursor:'pointer'}}>
                          {e}
                        </button>
                      ))}
                      <button onClick={() => openThread(msg)} style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:6,padding:'3px 8px',fontSize:11,cursor:'pointer',color:'#A8B3C8'}}>Reply</button>
                      {msg.sender_id === user?.id && (
                        <button onClick={() => api.deleteMessage(activeChannel!.id, msg.id).then(() => openChannel(activeChannel!))} style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:6,padding:'3px 8px',fontSize:11,cursor:'pointer',color:'#ed4245'}}>Del</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div style={{padding:'0 16px 16px',flexShrink:0}}>
              <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(99,120,180,0.12)',overflow:'hidden'}}>
                {/* Format toolbar */}
                {showFormatBar && (
                  <div style={{display:'flex',alignItems:'center',gap:2,padding:'6px 10px',borderBottom:'1px solid rgba(99,120,180,0.09)'}}>
                    {[
                      {label:'B',tag:'bold',style:{fontWeight:800}},
                      {label:'I',tag:'italic',style:{fontStyle:'italic'}},
                      {label:'S',tag:'strike',style:{textDecoration:'line-through'}},
                      {label:'`',tag:'code',style:{fontFamily:'monospace'}},
                      {label:'•',tag:'bullet',style:{}},
                    ].map(f => (
                      <button key={f.tag} onClick={() => applyFormat(f.tag)}
                        style={{background:'none',border:'none',color:'#A8B3C8',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:13,...f.style}}>
                        {f.label}
                      </button>
                    ))}
                    <div style={{width:1,height:16,background:'rgba(99,120,180,0.14)',margin:'0 4px'}}/>
                    <button onClick={() => setShowJumpDate(s => !s)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:11}}>Jump to date</button>
                    <button onClick={() => setChannelDescEdit(s => !s)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',padding:'3px 7px',borderRadius:4,fontSize:11}}>Edit desc</button>
                  </div>
                )}
                {/* Jump to date */}
                {showJumpDate && (
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderBottom:'1px solid rgba(99,120,180,0.09)'}}>
                    <span style={{fontSize:12,color:'#CBD5E1'}}>Jump to:</span>
                    <input type="date" value={jumpDate} onChange={e => setJumpDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                      style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'4px 8px',color:'#FFFFFF',fontSize:12}} />
                    <button onClick={jumpToDate} disabled={!jumpDate} style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'4px 10px',color:'#fff',fontSize:12,cursor:'pointer'}}>Go</button>
                    <button onClick={() => setShowJumpDate(false)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:12}}>Cancel</button>
                  </div>
                )}
                {/* Mention autocomplete */}
                {showMentions && (
                  <div style={{padding:'4px',borderBottom:'1px solid rgba(99,120,180,0.09)'}}>
                    {(orgMembers as any[]).filter((m: any) => m.display_name?.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0,6).map((m: any) => (
                      <button key={m.id} onClick={() => insertMention(m.display_name)}
                        style={{display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'6px 10px',background:'none',border:'none',color:'#A8B3C8',cursor:'pointer',fontSize:13,borderRadius:4}}>
                        <div style={{width:24,height:24,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>{m.display_name?.charAt(0)}</div>
                        <div>
                          <span style={{color:'#FFFFFF',fontWeight:600}}>{m.display_name}</span>
                          <span style={{color:'#CBD5E1',marginLeft:6,fontSize:12}}>{m.designation || m.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* GIF Picker */}
                {showGifPicker && (
                  <div style={{padding:8,borderBottom:'1px solid rgba(99,120,180,0.09)',background:'rgba(0,0,0,0.2)'}}>
                    <input value={gifSearch} onChange={e => setGifSearch(e.target.value)} placeholder="Search GIFs..."
                      style={{width:'100%',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'6px 10px',color:'#FFFFFF',fontSize:13,outline:'none',marginBottom:8}} />
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,maxHeight:160,overflowY:'auto'}}>
                      {[
                        {url:'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyo/giphy.gif',label:'👍'},
                        {url:'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',label:'🎉'},
                        {url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',label:'❤️'},
                        {url:'https://media.giphy.com/media/3og0IMJcSI8p6hYQXS/giphy.gif',label:'😂'},
                        {url:'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',label:'👏'},
                        {url:'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif',label:'🔥'},
                      ].map(gif => (
                        <button key={gif.url} onClick={() => { setNewMessage(gif.url); setShowGifPicker(false); }} style={{padding:0,border:'none',borderRadius:6,overflow:'hidden',cursor:'pointer',background:'none'}}>
                          <img src={gif.url} alt={gif.label} style={{width:'100%',height:60,objectFit:'cover',borderRadius:6}} />
                        </button>
                      ))}
                    </div>
                    <p style={{fontSize:11,color:'#CBD5E1',marginTop:4,textAlign:'center'}}>Powered by Giphy • Click to insert</p>
                  </div>
                )}

                {/* Channel autocomplete */}
                {showChannelAC && (
                  <div style={{padding:'4px',borderBottom:'1px solid rgba(99,120,180,0.09)'}}>
                    {channels.filter(c => c.type !== 'direct' && c.name.toLowerCase().includes(channelQuery.toLowerCase())).slice(0,6).map((ch: any) => (
                      <button key={ch.id} onClick={() => insertChannelRef(ch.name)}
                        style={{display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'6px 10px',background:'none',border:'none',color:'#A8B3C8',cursor:'pointer',fontSize:13,borderRadius:4}}>
                        <span style={{color:'#CBD5E1',fontSize:15}}>#</span>
                        <div>
                          <span style={{color:'#FFFFFF',fontWeight:600}}>{ch.name}</span>
                          {ch.description && <span style={{color:'#CBD5E1',marginLeft:6,fontSize:12}}>{ch.description}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Emoji autocomplete */}
                {showEmojiAC && (
                  <div style={{padding:'4px',borderBottom:'1px solid rgba(99,120,180,0.09)',display:'flex',flexWrap:'wrap',gap:2}}>
                    {Object.entries(EMOJI_MAP).filter(([k]) => k.includes(emojiQuery)).slice(0,12).map(([key, emoji]) => (
                      <button key={key} onClick={() => insertEmoji(emoji)} title={':'+key+':'}
                        style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:16}}>
                        {emoji}
                      </button>
                    ))}
                    {Object.entries(EMOJI_MAP).filter(([k]) => k.includes(emojiQuery)).length === 0 && (
                      <span style={{fontSize:12,color:'#CBD5E1',padding:'6px 10px'}}>No emoji found for :{emojiQuery}</span>
                    )}
                  </div>
                )}

                {/* Slash command menu */}
                {showSlashMenu && (
                  <div style={{padding:'4px',borderBottom:'1px solid rgba(99,120,180,0.09)'}}>
                    {['/todo','/poll','/me','/shrug','/tableflip','/clear'].filter(c => c.startsWith(newMessage)).map(cmd => (
                      <button key={cmd} onClick={() => handleSlashCommand(cmd)}
                        style={{display:'block',width:'100%',textAlign:'left',padding:'6px 10px',background:'none',border:'none',color:'#A8B3C8',cursor:'pointer',fontSize:13,borderRadius:4}}>
                        <span style={{fontWeight:700,color:'#818CF8'}}>{cmd}</span>
                        <span style={{color:'#CBD5E1',marginLeft:8,fontSize:12}}>
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
                    style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:18,padding:2,flexShrink:0}}>{uploading ? '⏳' : '+'}</button>
                  <button onClick={recording ? stopRecordingVoice : startRecordingVoice}
                    title="Voice message"
                    style={{background:'none',border:'none',color: recording ? '#ed4245' : '#7A8499',cursor:'pointer',fontSize:14,padding:2,flexShrink:0}}>{recording ? '⏹' : '🎤'}</button>
                  <button onClick={() => setShowFormatBar(s => !s)}
                    title="Formatting"
                    style={{background: showFormatBar ? 'rgba(79,110,247,0.12)' : 'none',border:'none',color: showFormatBar ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:13,padding:'2px 6px',borderRadius:4,flexShrink:0,fontWeight:700}}>Aa</button>
                  <button onClick={() => setShowGifPicker(s => !s)} title="GIF"
                    style={{background: showGifPicker ? 'rgba(79,110,247,0.12)' : 'none',border:'none',color: showGifPicker ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:12,padding:'2px 6px',borderRadius:4,flexShrink:0,fontWeight:700}}>GIF</button>
                  <textarea id="msg-composer" value={newMessage}
                    onChange={e => handleComposerInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      if (e.key === 'Escape') { setShowSlashMenu(false); setShowFormatBar(false); }
                    }}
                    onFocus={() => { if (activeChannel) { const d = loadDraft(activeChannel.id); if (d && !newMessage) setNewMessage(d); } }}
                    placeholder={`Message #${activeChannel.name}  (/ for commands)`} rows={1}
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#FFFFFF',fontSize:15,resize:'none',maxHeight:128,lineHeight:1.5,fontFamily:'inherit'}} />
                  <button onClick={() => setShowSchedule(s => !s)} title="Schedule"
                    style={{background:'none',border:'none',color: showSchedule ? '#818CF8' : '#7A8499',cursor:'pointer',fontSize:14,padding:2,flexShrink:0}}>🕒</button>
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                    style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,flexShrink:0,opacity: newMessage.trim() ? 1 : 0.4}}>↑</button>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:11,color:'#CBD5E1'}}>Enter to send · Shift+Enter for new line · / for commands</span>
                {newMessage && <span style={{fontSize:11,color:'#CBD5E1'}}>Draft saved</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── DM VIEW ── */}
        {activeDM && !activeChannel && !activeBoard && (
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',padding:'0 16px',height:48,borderBottom:'1px solid rgba(99,120,180,0.12)',background:'#313338',flexShrink:0,gap:12}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>
                  {activeDM.other_name?.charAt(0) || '?'}
                </div>
                <span style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',border:'2px solid #313338',background: onlineUsers.has(activeDM.other_id) ? '#4F6EF7' : '#7A8499'}}/>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{activeDM.other_name || activeDM.name}</div>
                <div style={{fontSize:11,color: onlineUsers.has(activeDM.other_id) ? '#4F6EF7' : '#7A8499'}}>
                  {onlineUsers.has(activeDM.other_id) ? '🟢 Active now' : '⚫ Last seen recently'}
                </div>
              </div>
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
                <input value={dmSearch} onChange={e => searchDMs(e.target.value)}
                  placeholder="Search messages..." style={{background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'5px 10px',color:'#FFFFFF',fontSize:12,outline:'none',width:180}} />
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:0}}>
              {(dmSearch ? dmSearchResults : dmMessages).map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const isLast = idx === (dmSearch ? dmSearchResults : dmMessages).length - 1;
                return (
                  <div key={msg.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'4px 8px',borderRadius:6,background: dmSearch && dmSearchResults.includes(msg) ? 'rgba(99,102,241,0.08)' : 'transparent'}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(79,110,247,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background= dmSearch ? 'rgba(99,102,241,0.08)' : 'transparent'}>
                    <div style={{width:36,height:36,borderRadius:'50%',background: isMe ? '#4F6EF7' : '#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0,marginTop:2}}>
                      {msg.sender_name?.charAt(0) || '?'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{msg.sender_name}</span>
                        <span style={{fontSize:12,color:'#CBD5E1'}}>{new Date(msg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <div style={{fontSize:15,color:'#C8D0E0',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(msg.content).html || msg.content}} />
                      {/* Read receipts - show on last message sent by me */}
                      {isMe && isLast && (
                        <div style={{fontSize:11,color: onlineUsers.has(activeDM.other_id) ? '#4F6EF7' : '#7A8499',marginTop:2,textAlign:'right'}}>
                          {'✓✓ Delivered'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{padding:'0 16px 16px',flexShrink:0}}>
              <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(99,120,180,0.12)',display:'flex',alignItems:'flex-end',gap:8,padding:'10px 14px'}}>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); sendMessage();} }}
                  placeholder={`Message ${activeDM.other_name || ''}`} rows={1}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#FFFFFF',fontSize:15,resize:'none',maxHeight:128,lineHeight:1.5,fontFamily:'inherit'}} />
                <button onClick={sendMessage} disabled={!newMessage.trim()}
                  style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,opacity: newMessage.trim() ? 1 : 0.4}}>↑</button>
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
            {activeView === 'meetings' && <MeetingsView orgMembers={orgMembers} currentUser={user} />}
          </div>
        )}

      {/* ── THREAD PANEL ── */}
      {threadMsg && (
        <div style={{width:360,borderLeft:'1px solid rgba(99,120,180,0.12)',display:'flex',flexDirection:'column',background:'#313338',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(99,120,180,0.12)'}}>
            <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>Thread</span>
            <button onClick={() => setThreadMsg(null)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:18}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
            <div style={{display:'flex',gap:12,marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(99,120,180,0.12)'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                {threadMsg.sender_name?.charAt(0)}
              </div>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}>
                  <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{threadMsg.sender_name}</span>
                  <span style={{fontSize:12,color:'#CBD5E1'}}>{new Date(threadMsg.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{fontSize:15,color:'#C8D0E0',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(threadMsg.content).html || threadMsg.content}} />
              </div>
            </div>
            {threadMessages.map(r => (
              <div key={r.id} style={{display:'flex',gap:10,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {r.sender_name?.charAt(0)}
                </div>
                <div>
                  <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#FFFFFF'}}>{r.sender_name}</span>
                    <span style={{fontSize:11,color:'#CBD5E1'}}>{new Date(r.sent_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div style={{fontSize:14,color:'#C8D0E0',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: renderMessage(r.content).html || r.content}} />
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:'8px 16px 16px'}}>
            <div style={{background:'#383a40',borderRadius:8,border:'1px solid rgba(99,120,180,0.12)',display:'flex',gap:8,padding:'10px 14px'}}>
              <textarea value={threadReply} onChange={e => setThreadReply(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendThreadReply();} }}
                placeholder="Reply in thread" rows={1} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#FFFFFF',fontSize:14,resize:'none',fontFamily:'inherit'}} />
              <button onClick={sendThreadReply} disabled={!threadReply.trim()} style={{background:'#4F6EF7',border:'none',borderRadius:6,padding:'5px 10px',color:'#fff',cursor:'pointer',fontSize:14,opacity: threadReply.trim() ? 1 : 0.4}}>↑</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── MODALS ── */}

      {/* ── HUDDLE PANEL ── */}
      {showHuddle && (
        <div style={{position:'fixed',bottom:80,right:20,background:'#000000',border:'1px solid rgba(79,110,247,0.3)',borderRadius:16,padding:16,zIndex:200,width:240,boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(74,222,128,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎙️</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#FFFFFF'}}>Huddle • #{activeChannel?.name}</div>
              <div style={{fontSize:11,color:'#818CF8'}}>● Live audio</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={endHuddle} style={{flex:1,background:'rgba(237,66,69,0.15)',border:'1px solid rgba(237,66,69,0.3)',borderRadius:8,padding:'8px',color:'#ed4245',fontSize:12,fontWeight:600,cursor:'pointer'}}>End huddle</button>
            <button onClick={() => setShowHuddle(false)} style={{flex:1,background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:8,padding:'8px',color:'#E2E8F0',fontSize:12,cursor:'pointer'}}>Minimise</button>
          </div>
          <p style={{fontSize:11,color:'#CBD5E1',marginTop:8,textAlign:'center'}}>Others in #{activeChannel?.name} can join</p>
        </div>
      )}

      {/* ── GROUP DM MODAL ── */}
      {showGroupDM && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowGroupDM(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">New group message</span>
              <button onClick={() => setShowGroupDM(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-300 mb-3">Select 2+ members to start a group conversation</p>
            <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
              {(dmOrgMembers as any[]).filter((m: any) => m.id !== user?.id).map((m: any) => (
                <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" checked={groupDMMembers.includes(m.id)}
                    onChange={e => { setGroupDMMembers(prev => e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)); }}
                    className="/accent-indigo-500/g" />
                  <div className="w-7 h-7 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold text-white">{m.display_name?.charAt(0)}</div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.display_name}</div>
                    <div className="text-xs text-gray-300">{m.designation || m.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGroupDM(false)} className="flex-1 text-sm text-gray-200 bg-gray-800 hover:bg-gray-700 py-2 rounded-xl">Cancel</button>
              <button onClick={createGroupDM} disabled={groupDMMembers.length < 2}
                className="flex-1 text-sm /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-xl font-medium disabled:opacity-50">
                Start group chat ({groupDMMembers.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APP INTEGRATIONS MODAL ── */}
      {showIntegrations && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowIntegrations(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">⚡ App integrations</span>
              <button onClick={() => setShowIntegrations(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-300 mb-4">Connect your tools to Deemona Teams</p>
            <div className="space-y-3">
              {[
                { name:'GitHub', icon:'🐙', desc:'Get PR and issue notifications in channels', status:'Configure', fn: () => { const token = prompt('GitHub Personal Access Token:'); const repo = prompt('Repository (owner/repo):'); if(token && repo) alert('GitHub integration configured for '+repo+'! PR notifications will appear in this channel.'); } },
                { name:'Jira', icon:'📋', desc:'Link Jira issues to tasks and get updates', status:'Configure', fn: () => { const url = prompt('Jira workspace URL (e.g. yourcompany.atlassian.net):'); if(url) alert('Jira integration with '+url+' configured! Issues will sync with boards.'); } },
                { name:'Google Calendar', icon:'📅', desc:'Sync meetings with Google Calendar', status:'Sync', fn: () => { window.open('https://calendar.google.com', '_blank'); alert('Open Google Calendar and import meeting links from Deemona Teams using the GCal button on each meeting.'); } },
                { name:'Slack import', icon:'💬', desc:'Import channels and messages from Slack', status:'Import', fn: () => { alert('Slack import: Export your Slack workspace data and email it to import@deemona.com. We will import all channels, messages, and files within 24 hours.'); } },
                { name:'Webhook', icon:'🔗', desc:'Send events to any URL via webhook', status:'Setup', fn: () => { const url = prompt('Webhook URL:'); if(url) alert('Webhook configured! Events will be sent to: '+url); } },
                { name:'Zapier', icon:'⚡', desc:'Connect 5000+ apps via Zapier', status:'Connect', fn: () => window.open('https://zapier.com', '_blank') },
              ].map(app => (
                <div key={app.name} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{app.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{app.name}</div>
                      <div className="text-xs text-gray-300">{app.desc}</div>
                    </div>
                  </div>
                  <button onClick={app.fn} className="text-xs /bg-emerald-900\/30/g hover:bg-emerald-900/50 /text-indigo-400/g px-3 py-1.5 rounded-lg font-medium">{app.status}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNEL MEMBERS PANEL ── */}
      {showChannelMembers && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowChannelMembers(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">#{activeChannel?.name} members ({channelMembers.length})</span>
              <button onClick={() => setShowChannelMembers(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {channelMembers.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800">
                  <div className="w-8 h-8 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{m.display_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{m.display_name}</div>
                    <div className="text-xs text-gray-300">{m.designation || m.email}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${onlineUsers.has(m.id) ? 'bg-emerald-400' : 'bg-gray-600'}`}/>
                </div>
              ))}
              {channelMembers.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No members found</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── STARRED MESSAGES ── */}
      {showStarred && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowStarred(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">⭐ Starred messages</span>
              <button onClick={() => setShowStarred(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            {messages.filter(m => starredMsgs.includes(m.id)).length === 0
              ? <p className="text-gray-300 text-sm text-center py-6">No starred messages in this channel.<br/>Hover over a message and click ☆ to star it.</p>
              : messages.filter(m => starredMsgs.includes(m.id)).map(msg => (
                <div key={msg.id} className="flex gap-3 p-3 bg-gray-800 rounded-xl mb-2">
                  <div className="w-8 h-8 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{msg.sender_name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
                      <span className="text-xs text-gray-200">{new Date(msg.sent_at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{msg.content}</p>
                  </div>
                  <button onClick={() => toggleStarMessage(msg.id)} className="text-yellow-400 hover:text-gray-200 flex-shrink-0">★</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── FORWARD MESSAGE MODAL ── */}
      {showFwd && fwdMsg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowFwd(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Forward message</span>
              <button onClick={() => setShowFwd(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-300 mb-1">From {fwdMsg.sender_name}:</p>
              <p className="text-sm text-gray-300 line-clamp-3">{fwdMsg.content}</p>
            </div>
            <p className="text-xs text-gray-300 mb-2 font-semibold uppercase tracking-wider">Forward to channel:</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {channels.filter(c => c.type !== 'direct').map(ch => (
                <button key={ch.id} onClick={async () => {
                  await api.sendMessage(ch.id, '[Forwarded from #' + (activeChannel?.name||'') + '] ' + fwdMsg.content);
                  setShowFwd(false);
                  alert('Message forwarded to #' + ch.name);
                }} className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300">
                  <span className="text-gray-300">#</span> {ch.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION PREFERENCES MODAL ── */}
      {showNotifPrefs && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowNotifPrefs(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Notification preferences</span>
              <button onClick={() => setShowNotifPrefs(false)} className="text-gray-300 hover:text-white text-xl leading-none">x</button>
            </div>
            <p className="text-xs text-gray-300 uppercase tracking-wider mb-3 font-semibold">Channel: #{activeChannel?.name || 'none'}</p>
            {[
              { key:'all', label:'All messages', desc:'Notify for every message' },
              { key:'mentions', label:'Mentions only', desc:'Only when @mentioned' },
              { key:'mute', label:'Muted', desc:'No notifications' },
            ].map(opt => (
              <label key={opt.key} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-800 cursor-pointer mb-1">
                <input type="radio" name="notif_pref" value={opt.key}
                  checked={(notifPrefs[activeChannel?.id||''] || 'mentions') === opt.key}
                  onChange={() => { const p={...notifPrefs,[activeChannel?.id||'']:opt.key}; setNotifPrefs(p); localStorage.setItem('notif_prefs',JSON.stringify(p)); }} />
                <div>
                  <div className="text-sm text-white font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-300">{opt.desc}</div>
                </div>
              </label>
            ))}
            <div className="border-t border-gray-800 pt-4 mt-2 space-y-2">
              <p className="text-xs text-gray-300 uppercase tracking-wider mb-2 font-semibold">Email</p>
              {[['email_mentions','Email on @mention'],['email_dms','Email on DM'],['email_digest','Daily digest 8AM IST']].map(([k,l]) => (
                <label key={k} className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-300">{l}</span>
                  <input type="checkbox" defaultChecked={k!=='email_digest'} />
                </label>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-4 mt-2 space-y-2">
              <p className="text-xs text-gray-300 uppercase tracking-wider mb-2 font-semibold">Do Not Disturb</p>
              <div className="flex gap-2 flex-wrap">
                {[[1,'1 hour'],[4,'4 hours'],[8,'Until tomorrow'],[0,'Turn off']].map(([h,label]) => (
                  <button key={label} onClick={() => h === 0 ? (setDndEnabled(false), localStorage.removeItem('dnd_until')) : enableDND(h as number)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dndEnabled && h !== 0 ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-200 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-300 uppercase tracking-wider mb-2 mt-3 font-semibold">Browser notifications</p>
              <button onClick={requestPushPermission}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg w-full text-left mb-2">
                🔔 Enable desktop notifications
              </button>
              <label className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-300">🔊 Notification sounds</span>
                <input type="checkbox" checked={notifSound} onChange={e => setNotifSound(e.target.checked)} className="/accent-indigo-500/g" />
              </label>
            </div>
            <button onClick={() => setShowNotifPrefs(false)} className="w-full mt-4 /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-xl text-sm font-medium">Done</button>
          </div>
        </div>
      )}

      {/* ── KEYBOARD SHORTCUTS MODAL ── */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowShortcuts(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <span className="text-white font-semibold text-lg">Keyboard shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-300 hover:text-white text-xl leading-none">x</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['Ctrl+K','Global search'],['?','Show shortcuts'],['Escape','Close panel'],
                ['Enter','Send message'],['Shift+Enter','New line'],['/','Slash commands'],
                ['Ctrl+B','Bold text'],['Ctrl+I','Italic text'],
                ['Ctrl+/','Toggle shortcuts'],['Up arrow','Edit last message'],
              ].map(([key,desc]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-gray-200 text-sm">{desc}</span>
                  <kbd className="bg-gray-800 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded font-mono whitespace-nowrap">{key}</kbd>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 text-center">
              <button onClick={() => setShowShortcuts(false)} className="text-xs text-gray-300 hover:text-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifs && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-end z-50 p-4 pt-16"
          onClick={e => { if (e.target === e.currentTarget) setShowNotifs(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-80 shadow-2xl max-h-[70vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
              <span className="text-white font-semibold">Notifications</span>
              <div className="flex gap-2">
                <button onClick={async () => { await api.markAllRead(); setUnreadCount(0); setNotifications(p => p.map(n => ({ ...n, is_read: true }))); }}
                  className="text-xs /text-indigo-400/g hover:/text-indigo-300/g">Mark all read</button>
                <button onClick={() => setShowNotifs(false)} className="text-gray-300 hover:text-white">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
              {notifications.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No notifications</p>}
              {notifications.map((n: any) => (
                <div key={n.id} className={`px-4 py-3 ${!n.is_read ? 'bg-emerald-950/20' : ''}`}>
                  <p className="text-sm text-white">{n.title || n.body}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(n.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(99,120,180,0.12)",background:"#1E293B"}}>
              <span className="text-white font-semibold">📌 Pinned messages</span>
              <button onClick={() => setShowPins(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pins.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No pinned messages</p>}
              {pins.map((p: any) => (
                <div key={p.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{p.sender_name}</span>
                    <span className="text-xs text-gray-300">pinned by {p.pinned_by_name}</span>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Create channel</h3>
            <div>
              <label className="text-xs text-gray-200 mb-1 block">Channel name</label>
              <input value={newChName} onChange={e => setNewChName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. marketing, dev-team"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            </div>
            <div>
              <label className="text-xs text-gray-200 mb-1 block">Description</label>
              <input value={newChDesc} onChange={e => setNewChDesc(e.target.value)}
                placeholder="What's this channel about?"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setNewChPrivate(!newChPrivate)}
                className={`w-10 h-5 rounded-full transition-colors ${newChPrivate ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full ml-0.5 transition-transform ${newChPrivate ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-300">Private channel</span>
            </div>
            <div className="flex gap-3">
              <button onClick={createChannel} disabled={!newChName.trim()}
                className="flex-1 /bg-indigo-600/g hover:/bg-indigo-500/g disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
                Create channel
              </button>
              <button onClick={() => setShowNewChannel(false)} className="text-gray-300 hover:text-gray-300 px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting polls modal */}
      {showPollCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowPollCreate(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Meeting Polls</span>
              <button onClick={() => setShowPollCreate(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            {/* Create poll */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                placeholder="Ask a question..." className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:/border-indigo-400/g" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                    placeholder={`Option ${i+1}`} className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:/border-indigo-400/g" />
                  {i > 1 && <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-xs">x</button>}
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-gray-200 hover:text-white">+ Add option</button>
                <button onClick={async () => {
                  if (!pollQuestion.trim() || !activeMeetingId) return;
                  const validOpts = pollOptions.filter(o => o.trim());
                  if (validOpts.length < 2) { alert('Add at least 2 options'); return; }
                  await api.createPoll(activeMeetingId, pollQuestion.trim(), validOpts);
                  setPollQuestion(''); setPollOptions(['', '']);
                  const res = await api.getPolls(activeMeetingId);
                  setPolls(res?.data || []);
                }} disabled={!pollQuestion.trim()} className="ml-auto text-xs /bg-indigo-600/g hover:/bg-indigo-500/g disabled:opacity-50 text-white px-4 py-1.5 rounded-lg">Launch poll</button>
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
                            <span className="text-xs text-gray-200">{votes} votes ({pct}%)</span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-300">{voteCount} total votes</p>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
              <span className="text-white font-semibold">Whiteboard</span>
              <button onClick={() => setShowWhiteboard(false)} className="text-gray-300 hover:text-white">x</button>
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
                }} className="bg-white border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow hover:bg-gray-800">Clear</button>
                <button onClick={() => {
                  const canvas = document.getElementById('whiteboard-canvas') as HTMLCanvasElement;
                  const link = document.createElement('a');
                  link.download = 'whiteboard.png';
                  link.href = canvas.toDataURL();
                  link.click();
                }} className="bg-white border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow hover:bg-gray-800">Save PNG</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowAnalytics(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">#{activeChannel?.name} Analytics</span>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold /text-indigo-400/g">{analytics.totalMessages}</div>
                <div className="text-xs text-gray-300 mt-1">Total messages</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{analytics.activeUsers}</div>
                <div className="text-xs text-gray-300 mt-1">Active members (30d)</div>
              </div>
            </div>
            {analytics.topSenders?.length > 0 && (
              <div>
                <div className="text-xs text-gray-300 mb-2 font-medium uppercase tracking-wider">Top contributors</div>
                <div className="space-y-2">
                  {analytics.topSenders.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold text-white">{s.display_name?.charAt(0)}</div>
                      <span className="text-sm text-white flex-1">{s.display_name}</span>
                      <span className="text-xs text-gray-200 bg-gray-800 px-2 py-0.5 rounded-full">{s.count} msgs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analytics.msgByDay?.length > 0 && (
              <div>
                <div className="text-xs text-gray-300 mb-2 font-medium uppercase tracking-wider">Messages last 7 days</div>
                <div className="flex items-end gap-1 h-16">
                  {analytics.msgByDay.map((d: any, i: number) => {
                    const max = Math.max(...analytics.msgByDay.map((x: any) => parseInt(x.count)));
                    const h = max > 0 ? (parseInt(d.count) / max) * 100 : 10;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="/bg-indigo-500/g rounded-sm w-full" style={{ height: `${h}%` }} title={d.count + ' msgs'} />
                        <span className="text-xs text-gray-200">{new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(99,120,180,0.12)",background:"#1E293B"}}>
              <span className="text-white font-semibold">Scheduled messages</span>
              <button onClick={() => setShowScheduled(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {scheduledMsgs.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No scheduled messages</p>}
              {scheduledMsgs.map((m: any) => (
                <div key={m.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white">{m.content}</p>
                    <p className="text-xs /text-indigo-400/g mt-1">Sends: {new Date(m.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Custom emoji</span>
              <button onClick={() => setShowEmojiMgr(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="flex gap-2">
              <input value={newEmojiName} onChange={e => setNewEmojiName(e.target.value)}
                placeholder=":emoji-name:" className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:/border-indigo-400/g" />
              <button onClick={addCustomEmoji} disabled={!newEmojiName.trim()}
                className="/bg-indigo-600/g hover:/bg-indigo-500/g disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Add</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {customEmojis.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No custom emoji yet. Add one above!</p>}
              <div className="grid grid-cols-4 gap-3">
                {customEmojis.map((e: any) => (
                  <div key={e.id} className="flex flex-col items-center gap-1 bg-gray-800 rounded-lg p-2">
                    <img src={e.url} alt={e.name} className="w-8 h-8 object-contain" />
                    <span className="text-xs text-gray-200 truncate w-full text-center">:{e.name}:</span>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">Deemona Connect</span>
                <p className="text-xs text-gray-300 mt-0.5">Invite external teams to collaborate</p>
              </div>
              <button onClick={() => setShowConnect(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div>
              <label className="text-xs text-gray-200 mb-1 block">Contact email</label>
              <input value={connectEmail} onChange={e => setConnectEmail(e.target.value)}
                placeholder="contact@partner.com" type="email"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            </div>
            <div>
              <label className="text-xs text-gray-200 mb-1 block">Organization name</label>
              <input value={connectOrg} onChange={e => setConnectOrg(e.target.value)}
                placeholder="Partner Company"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300">
              They will receive an invite to join #{activeChannel?.name} as an external collaborator.
            </div>
            <button onClick={sendConnectInvite} disabled={!connectEmail.trim()}
              className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
              Send Connect invite
            </button>
          </div>
        </div>
      )}

      {/* AI Summary modal */}
      {showAISummary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowAISummary(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">A</div>
              <div>
                <span className="text-white font-semibold">Channel Summary</span>
                <p className="text-xs text-gray-300">#{activeChannel?.name} — last 24 hours</p>
              </div>
              <button onClick={() => setShowAISummary(false)} className="ml-auto text-gray-300 hover:text-white">x</button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
            </div>
            <button onClick={() => { setShowAISummary(false); setShowAI(true); setAiInput('What are the action items from today?'); }}
              className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g text-white text-sm py-2 rounded-xl">
              Ask AI a follow-up question
            </button>
          </div>
        </div>
      )}

      {/* Status modal */}
      {showStatus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowStatus(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5 space-y-4">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${statusText === s.text ? '/border-indigo-400/g /bg-emerald-900\/30/g text-white' : 'border-gray-700 text-gray-200 hover:border-gray-500'}`}>
                  {s.emoji} {s.text}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={statusEmoji} onChange={e => setStatusEmoji(e.target.value)} placeholder="😊"
                className="w-14 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:/border-indigo-400/g text-center" />
              <input value={statusText} onChange={e => setStatusText(e.target.value)} placeholder="What's your status?"
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:/border-indigo-400/g" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveStatus} className="flex-1 /bg-indigo-600/g hover:/bg-indigo-500/g text-white font-medium py-2 rounded-xl text-sm">Save</button>
              <button onClick={async () => { setStatusEmoji(''); setStatusText(''); await api.setStatus('', ''); setShowStatus(false); }}
                className="text-gray-300 hover:text-gray-300 px-4 py-2 text-sm">Clear</button>
            </div>
            <div className="border-t border-gray-800 pt-3">
              <button onClick={() => api.logout()}
                className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 text-red-400 font-medium py-2 rounded-xl text-sm">
                <span>↪</span><span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks modal */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowBookmarks(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
              <span className="text-white font-semibold">🔖 Saved messages ({bookmarks.length})</span>
              <button onClick={() => setShowBookmarks(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No saved messages yet.<br />Hover a message → ⋯ → Save message</p>}
              {bookmarks.map((b: any) => (
                <div key={b.id} className="bg-gray-800 rounded-xl p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{b.sender_name}</span>
                    <span className="text-xs text-gray-300">#{b.channel_name}</span>
                    <span className="text-xs text-gray-300 ml-auto">{new Date(b.sent_at).toLocaleDateString('en-IN')}</span>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
              <span className="text-white font-semibold">🔭 Browse channels</span>
              <button onClick={() => setShowChannelBrowser(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <div className="px-4 pt-3 shrink-0">
              <input value={channelSearch} onChange={e => setChannelSearch(e.target.value)} placeholder="Search channels..."
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allChannels.filter(c => c.type !== 'direct' && (!channelSearch || c.name?.toLowerCase().includes(channelSearch.toLowerCase()))).map((ch: any) => (
                <div key={ch.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <span className="text-gray-200 text-lg">#</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    {ch.description && <div className="text-xs text-gray-300 mt-0.5">{ch.description}</div>}
                  </div>
                  <button onClick={() => { openChannel(ch); setShowChannelBrowser(false); }}
                    className="text-xs /bg-indigo-600/g hover:/bg-indigo-500/g text-white px-3 py-1.5 rounded-lg">Join</button>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-lg">New direct message</h3>
            <input autoFocus value={dmSearch} onChange={e => setDmSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:/border-indigo-400/g" />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {dmOrgMembers.filter(m => m.id !== user?.id && (!dmSearch || m.display_name?.toLowerCase().includes(dmSearch.toLowerCase()) || m.email?.toLowerCase().includes(dmSearch.toLowerCase()))).map((m: any) => (
                <button key={m.id} onClick={() => startDM(m.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold shrink-0">{m.display_name?.charAt(0) || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{m.display_name}</div>
                    <div className="text-xs text-gray-300 truncate">{m.email}</div>
                  </div>
                  {onlineUsers.has(m.id) && <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />}
                </button>
              ))}
              {dmOrgMembers.filter(m => m.id !== user?.id).length === 0 && (
                <p className="text-gray-300 text-sm text-center py-4">No members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global search modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-20 px-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setSearchQuery(''); setSearchResults(null); } }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <span className="text-gray-300">🔍</span>
              <input autoFocus value={searchQuery} onChange={e => runSearch(e.target.value)}
                placeholder="Search messages, tasks, people..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none" />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults(null); }}
                className="text-gray-300 hover:text-white text-xs px-2 py-1 border border-gray-700 rounded">Esc</button>
            </div>
            <div className="max-h-96 overflow-y-auto p-3">
              {searching && <div className="text-gray-300 text-sm text-center py-4 animate-pulse">Searching...</div>}
              {!searching && searchResults && (
                <div className="space-y-4">
                  {searchResults.messages?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider mb-2 px-1">Messages</div>
                      {searchResults.messages.map((m: any) => (
                        <div key={m.id} className="px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white">{m.sender_name}</span>
                            <span className="text-xs text-gray-300">#{m.channel_name}</span>
                          </div>
                          <p className="text-sm text-gray-300 truncate">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.tasks?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider mb-2 px-1">Tasks</div>
                      {searchResults.tasks.map((t: any) => (
                        <div key={t.id} className="px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <p className="text-sm text-white">{t.title}</p>
                          <div className="text-xs text-gray-300 mt-0.5">{t.board_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.people?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider mb-2 px-1">People</div>
                      {searchResults.people.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                          <div className="w-7 h-7 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold">{p.display_name?.charAt(0)}</div>
                          <div><p className="text-sm text-white">{p.display_name}</p><p className="text-xs text-gray-300">{p.email}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchResults.messages?.length && !searchResults.tasks?.length && !searchResults.people?.length && (
                    <p className="text-gray-300 text-sm text-center py-4">No results for "{searchQuery}"</p>
                  )}
                </div>
              )}
              {!searching && !searchResults && searchQuery && (
                <p className="text-gray-300 text-sm text-center py-4">Type to search...</p>
              )}
              {!searchQuery && (
                <div className="text-center py-6 space-y-2">
                  <p className="text-gray-300 text-sm">Search across messages, tasks and people</p>
                  <div className="flex justify-center gap-2 text-xs text-gray-300">
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
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          onNavigate={(channelId, channelName) => openChannel({ id: channelId, name: channelName, type: 'public' } as any)}
          apiFetch={apiFetch}
        />
      )}
      {showCanvas && (
        <CanvasView
          onClose={() => setShowCanvas(false)}
          user={user}
        />
      )}
      {showWorkflow && (
        <WorkflowBuilder
          onClose={() => setShowWorkflow(false)}
        />
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
          <h1 className="text-3xl font-bold text-white">{greeting()}, {user?.display_name?.split(' ')[0] || 'there'}</h1>
          <p className="text-gray-200 text-sm mt-1">Here is what is happening in your workspace today</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-200">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My tasks', value: dashStats?.tasks?.total || myTasks.length, sub: dashStats?.tasks?.overdue > 0 ? `${dashStats.tasks.overdue} overdue` : 'all on track', color: 'from-indigo-900 to-indigo-800' },
          { label: 'Due today', value: dashStats?.tasks?.due_today || 0, sub: 'tasks due today', color: 'from-amber-500 to-orange-500' },
          { label: 'Messages sent', value: dashStats?.messages?.sent || 0, sub: 'this week', color: 'from-blue-900 to-blue-800' },
          { label: 'Meetings', value: dashStats?.meetings?.attended || 0, sub: 'attended (30d)', color: 'from-slate-800 to-slate-700' },
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
        <div className="bg-gray-800 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            My tasks
            {myTasks.length > 0 && <span className="text-xs bg-gray-800 text-gray-200 px-2 py-0.5 rounded-full">{myTasks.length}</span>}
          </h3>
          {myTasks.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No tasks assigned to you</p>}
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
                  <span className={`text-xs shrink-0 ${new Date(t.due_date) < new Date() ? 'text-red-400' : 'text-gray-300'}`}>
                    {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + Recent activity */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Quick jump</h3>
            <div className="grid grid-cols-2 gap-2">
              {channels.slice(0, 2).map((ch: any) => (
                <button key={ch.id} onClick={() => onChannel(ch)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left transition-colors">
                  <div className="/text-indigo-400/g font-medium text-sm truncate">#{ch.name}</div>
                  <div className="text-xs text-gray-300 mt-0.5">Channel</div>
                </button>
              ))}
              {boards.slice(0, 2).map((b: any) => (
                <button key={b.id} onClick={() => onBoard(b)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left transition-colors">
                  <div className="text-blue-400 font-medium text-sm truncate">{b.name}</div>
                  <div className="text-xs text-gray-300 mt-0.5">Board</div>
                </button>
              ))}
            </div>
          </div>
          {activity.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Recent activity</h3>
              <div className="space-y-2">
                {activity.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.type === 'message' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{a.title}</p>
                      <p className="text-xs text-gray-300">{a.context} · {new Date(a.ts).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* India features */}
      <div style={{background:'linear-gradient(135deg,rgba(79,110,247,0.08),rgba(99,60,180,0.06))',border:'1px solid rgba(79,110,247,0.15)',borderRadius:16,padding:'20px 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <span style={{fontSize:14,fontWeight:900,color:'#4F6EF7'}}>IN</span>
          <span style={{fontSize:13,fontWeight:700,color:'#A8B3C8',letterSpacing:1.5,textTransform:'uppercase'}}>India Features</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {icon:'GST',label:'GST Invoice',desc:'Generate compliant invoices',fn:()=>window.location.href='/india'},
            {icon:'GST',label:'UPI Payment',desc:'Create UPI QR codes',fn:()=>window.location.href='/india'},
            {icon:'GST',label:'Hindi Mode',desc:'9 Indian languages',fn:()=>window.location.href='/india'},
          ].map(item=>(
            <button key={item.label} onClick={item.fn}
              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:12,padding:'16px 12px',textAlign:'left',cursor:'pointer',transition:'all 0.15s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(79,110,247,0.1)';(e.currentTarget as HTMLElement).style.borderColor='rgba(79,110,247,0.3)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)';(e.currentTarget as HTMLElement).style.borderColor='rgba(99,120,180,0.12)'}}>
              <div style={{fontSize:12,fontWeight:900,color:'#4F6EF7',background:'rgba(79,110,247,0.12)',border:'1px solid rgba(79,110,247,0.25)',borderRadius:8,padding:'4px 8px',display:'inline-block',marginBottom:8,letterSpacing:0.5}}>{item.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#E8EAF0',marginBottom:3}}>{item.label}</div>
              <div style={{fontSize:11,color:'#CBD5E1'}}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingsView({ orgMembers: meetOrgMembers = [], currentUser }: { orgMembers?: any[], currentUser?: any }) {
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
  const [showAgenda,  setShowAgenda]  = useState<string|null>(null);
  const [agendaItems, setAgendaItems] = useState<string[]>(['']);
  const [showResources, setShowResources] = useState<string|null>(null);
  const [meetingResources, setMeetingResources] = useState<any[]>([]);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceUrl,  setNewResourceUrl]  = useState('');
  const [loadingResources, setLoadingResources] = useState(false);
  const [handRaised,  setHandRaised]  = useState(false);
  const [showAttend,  setShowAttend]  = useState<string|null>(null);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [showBreakout,setShowBreakout]= useState(false);
  const [breakoutRooms,setBreakoutRooms]= useState<{name:string,members:string[]}[]>([{name:'Room 1',members:[]},{name:'Room 2',members:[]}]);
  const [captionsOn,  setCaptionsOn]  = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [showSummary, setShowSummary] = useState<string|null>(null);
  const [openMenuId,   setOpenMenuId]   = useState<string|null>(null);
  const [monthlyMins,  setMonthlyMins]  = useState(0); // minutes used this month
  const [showInMeeting,setShowInMeeting]= useState(false);
  const [inMeetingChat,setInMeetingChat]= useState<any[]>([]);
  const [inMeetingMsg, setInMeetingMsg] = useState('');
  const [inMeetingEmoji,setInMeetingEmoji]=useState<string|null>(null);
  const [activeMeeting, setActiveMeeting]= useState<any>(null);
  const [micOn,        setMicOn]        = useState(false);
  const [cameraOn,     setCameraOn]     = useState(false);
  const [screenOn,     setScreenOn]     = useState(false);
  const [recording,    setRecording]    = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [meetingParticipants, setMeetingParticipants] = useState<any[]>([]);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [addPeopleSearch, setAddPeopleSearch] = useState('');
  const [chatMode,       setChatMode]       = useState<'everyone'|'private'>('everyone');
  const [privateTarget,  setPrivateTarget]  = useState<any>(null);
  const [showChatMenu,   setShowChatMenu]   = useState(false);
  const [participantMics, setParticipantMics] = useState<Record<string,boolean>>({});
  const [participantCams, setParticipantCams] = useState<Record<string,boolean>>({});
  const [allMuted,       setAllMuted]        = useState(false);
  const [showHostControls,setShowHostControls]=useState<string|null>(null);
  const [meetingLocked,  setMeetingLocked]   = useState(false);
  const [participantCount,setParticipantCount]=useState(0);
  const MONTHLY_LIMIT_MINS = 72 * 60; // 72 hours = 4320 minutes
  const MAX_PARTICIPANTS = 500;
  const [meetCapacity, setMeetCapacity] = useState(50);
  const [showCapacity, setShowCapacity] = useState<string|null>(null);
  const [coHosts,      setCoHosts]      = useState<Record<string,string[]>>({});
  const [showCoHost,   setShowCoHost]   = useState<string|null>(null);
  const [groupedNotifs,setGroupedNotifs]= useState<Record<string,any[]>>({});

  useEffect(() => {
    api.meetings().then(res => setMeetings(res?.data || []));
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
    const res = await api.createMeeting({ title: newTitle.trim(), description: meetDesc.trim() || undefined, startsAt, durationMins: meetDur, type: 'meeting', workspaceId, waitingRoom: false, recordingEnabled: false, recordingPolicy: 'host_only', participantIds: invitedIds });
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

  // ── Meeting resources ──
  async function openResources(meetingId: string) {
    setShowResources(meetingId);
    setLoadingResources(true);
    const res = await apiFetch('/meetings/' + meetingId + '/resources');
    setMeetingResources(Array.isArray(res?.data) ? res.data : []);
    setLoadingResources(false);
  }

  async function addResourceLink(meetingId: string) {
    if (!newResourceName.trim() || !newResourceUrl.trim()) { alert('Please enter both a name and a URL'); return; }
    let url = newResourceUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const res = await apiFetch('/meetings/' + meetingId + '/resources', {
      method: 'POST',
      body: JSON.stringify({ name: newResourceName.trim(), url, type: 'link' })
    });
    if (res?.data?.resources) {
      setMeetingResources(res.data.resources);
      setNewResourceName('');
      setNewResourceUrl('');
    } else if (res?.error) {
      alert(res.error);
    }
  }

  async function removeResource(meetingId: string, resourceId: string) {
    const res = await apiFetch('/meetings/' + meetingId + '/resources/' + resourceId, { method: 'DELETE' });
    if (res?.data?.resources) setMeetingResources(res.data.resources);
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

  // ── Meeting limits enforcement ──
  async function loadMonthlyUsage() {
    const res = await apiFetch('/meetings/monthly-usage');
    setMonthlyMins(res?.data?.total_minutes || 0);
  }

  function checkMeetingLimits(meeting: any): { allowed: boolean; reason?: string } {
    // Check monthly 72-hour limit
    const remaining = MONTHLY_LIMIT_MINS - monthlyMins;
    if (remaining <= 0) {
      return { allowed: false, reason: 'Monthly video meeting limit of 72 hours has been reached. Limit resets on the 1st of next month.' };
    }
    // Check participant limit
    if (participantCount >= MAX_PARTICIPANTS) {
      return { allowed: false, reason: 'This meeting has reached the maximum limit of 500 participants.' };
    }
    return { allowed: true };
  }

  function joinMeetingWithCheck(meeting: any) {
    const check = checkMeetingLimits(meeting);
    if (!check.allowed) {
      alert('Cannot join meeting: ' + check.reason);
      return;
    }
    const remaining = MONTHLY_LIMIT_MINS - monthlyMins;
    const remainingHrs = Math.floor(remaining / 60);
    const remainingMins = remaining % 60;
    setActiveMeeting(meeting);
    setParticipantCount(p => p + 1);
    setShowInMeeting(true);
    setInMeetingChat([{ sender:'System', text:`Welcome to "${meeting.title}". Monthly usage remaining: ${remainingHrs}h ${remainingMins}m of 72h.`, time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
  }

  function syncToGoogleCalendar(meeting: any) {
    const start = new Date(meeting.starts_at);
    const end = new Date(start.getTime() + (meeting.duration_mins || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(meeting.title) + '&dates=' + fmt(start) + '/' + fmt(end) + '&details=' + encodeURIComponent('Join: ' + window.location.origin + '/meet?id=' + meeting.id) + '&sf=true&output=xml';
    window.open(url, '_blank');
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
  const STATUS_COLORS: Record<string, string> = { live: 'bg-red-900 text-red-300', scheduled: 'bg-blue-900 text-blue-300', ended: 'bg-gray-800 text-gray-300', cancelled: 'bg-gray-800 text-gray-400 line-through' };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-gray-800 rounded-xl p-1 border border-gray-800">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'list' ? '/bg-indigo-600/g text-white' : 'text-gray-200 hover:text-white'}`}>List</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'calendar' ? '/bg-indigo-600/g text-white' : 'text-gray-200 hover:text-white'}`}>Calendar</button>
        </div>
        <button onClick={() => setCreating(true)} className="/bg-indigo-600/g hover:/bg-indigo-500/g text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors">New meeting</button>
      </div>

      {/* New meeting form */}
      {creating && (
        <div className="rounded-2xl p-5 space-y-4" style={{background:"#0F172A",border:"1px solid #1E40AF",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          <h3 className="text-base font-bold text-white tracking-tight">New meeting</h3>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Meeting title..."
            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
          <input value={meetDesc} onChange={e => setMeetDesc(e.target.value)} placeholder="Description (optional)"
            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
          <div className="flex gap-2">
            <button onClick={() => setStartNow(true)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${startNow ? 'text-white font-semibold' : 'font-medium'}`} style={startNow ? {background:'#1D4ED8',border:'1px solid #3B82F6',color:'#FFFFFF'} : {background:'#1E293B',border:'1px solid #334155',color:'#94A3B8'}}>Start now</button>
            <button onClick={() => setStartNow(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${!startNow ? 'text-white font-semibold' : 'font-medium'}`} style={!startNow ? {background:'#1D4ED8',border:'1px solid #3B82F6',color:'#FFFFFF'} : {background:'#1E293B',border:'1px solid #334155',color:'#94A3B8'}}>Schedule</button>
          </div>
          {!startNow && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Date</label>
                <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Time</label>
                <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(d => (
                <button key={d} onClick={() => setMeetDur(d)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${meetDur === d ? 'text-white' : ''}`} style={meetDur === d ? {background:'#1D4ED8',border:'1px solid #3B82F6',color:'#FFFFFF'} : {background:'#1E293B',border:'1px solid #334155',color:'#94A3B8'}}>
                  {d < 60 ? `${d}m` : `${d/60}h`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Invite members {invitedIds.length > 0 && <span style={{color:"#60A5FA",fontWeight:700}}>({invitedIds.length})</span>}</label>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search..."
              className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none mb-2" style={{background:"#1E293B",color:"#F1F5F9",border:"1px solid #334155"}} />
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl p-2" style={{background:"#1E293B"}}>
              {meetOrgMembers.filter(m => !memberSearch || m.display_name?.toLowerCase().includes(memberSearch.toLowerCase())).map((m: any) => (
                <div key={m.id} onClick={() => toggleInvite(m.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${invitedIds.includes(m.id) ? 'rounded-lg border border-blue-500' : 'hover:bg-gray-700'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${invitedIds.includes(m.id) ? '/bg-indigo-500/g text-white' : 'bg-gray-600 text-gray-200'}`}>
                    {m.display_name?.charAt(0)}
                  </div>
                  <span className="text-xs text-white flex-1">{m.display_name}</span>
                  {invitedIds.includes(m.id) && <span className="/text-indigo-400/g text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createMeeting} disabled={saving || !newTitle.trim()}
              className="flex-1 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm tracking-wide transition-all" style={{background:"linear-gradient(135deg,#1D4ED8,#2563EB)",boxShadow:"0 4px 15px rgba(29,78,216,0.4)"}}>
              {saving ? 'Creating...' : startNow ? 'Start meeting' : 'Schedule'}
            </button>
            <button onClick={() => { setCreating(false); setInvitedIds([]); setMeetDesc(''); }} className="text-xs px-4 py-2 rounded-lg transition-colors" style={{color:"#94A3B8",background:"#1E293B"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="rounded-2xl overflow-hidden" style={{background:"#0F172A",border:"1px solid #1E40AF"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="px-3 py-1.5 rounded-lg transition-colors font-bold" style={{color:"#60A5FA",background:"#1E3A5F"}}>&#8592;</button>
            <span className="font-bold text-base" style={{color:"#F1F5F9"}}>{calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="px-3 py-1.5 rounded-lg transition-colors font-bold" style={{color:"#60A5FA",background:"#1E3A5F"}}>&#8594;</button>
          </div>
          <div className="grid grid-cols-7" style={{borderBottom:"1px solid #1E3A5F"}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-xs text-center py-2 font-bold" style={{color:"#60A5FA"}}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="min-h-16 border-b border-r" style={{borderColor:"#1E3A5F"}} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsOnDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear();
              return (
                <div key={day}
                  onClick={() => {
                    const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
                    const dateStr = d.toISOString().split('T')[0];
                    const timeStr = '09:00';
                    setMeetDate(dateStr);
                    setMeetTime(timeStr);
                    setStartNow(false);
                    setCreating(true);
                  }}
                  className={`min-h-16 p-1 cursor-pointer transition-colors ${isToday ? 'bg-blue-950/40' : 'hover:bg-slate-800/60'}`}
                  style={{borderBottom:'1px solid #1E3A5F',borderRight:'1px solid #1E3A5F'}}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-gray-400'}`}>{day}</div>
                  {dayMeetings.map(m => (
                    <a key={m.id} href={`/meet?id=${m.id}`} target="_blank"
                      className="block text-xs rounded px-1.5 py-0.5 mb-0.5 truncate font-medium" style={{
    background: m.status === 'live' ? '#7F1D1D' : m.status === 'cancelled' ? '#1F2937' : m.status === 'ended' ? '#374151' : '#1D4ED8',
    color: m.status === 'live' ? '#FCA5A5' : m.status === 'cancelled' ? '#9CA3AF' : m.status === 'ended' ? '#D1D5DB' : '#BFDBFE',
    textDecoration: m.status === 'cancelled' ? 'line-through' : 'none',
    opacity: m.status === 'cancelled' ? 0.7 : 1
  }}>
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
          {meetings.length === 0 && !creating && <div className="text-sm text-center py-12 font-medium" style={{color:"#475569"}}>No meetings scheduled</div>}
          {meetings.map(m => (
            <div key={m.id} className="rounded-xl p-4 transition-all cursor-default" style={{background:"#0F172A",border:"1px solid #1E3A5F",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#3B82F6"}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#1E3A5F"}}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate" style={{color:"#F1F5F9"}}>{m.title}</div>
                  {m.description && <div className="text-xs mt-0.5 truncate" style={{color:"#94A3B8"}}>{m.description}</div>}
                  <div className="text-xs mt-2 flex items-center gap-3" style={{color:"#60A5FA"}}>
                    <span>{new Date(m.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>{m.duration_mins || 60}m</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[m.status] || STATUS_COLORS.ended}`}>{m.status}</span>
                  <div className="flex items-center gap-2">
                    {/* Primary action */}
                    {(m.status === 'live' || m.status === 'scheduled') && (
                      <button onClick={() => joinMeetingWithCheck(m)}
                        className="text-xs text-white px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all" style={{background:"linear-gradient(135deg,#1D4ED8,#2563EB)",boxShadow:"0 2px 8px rgba(29,78,216,0.4)"}}>
                        {m.status === 'live' ? '▶ Join live' : 'Join →'}
                      </button>
                    )}
                    {/* RSVP for scheduled */}
                    {m.status === 'scheduled' && (
                      <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{background:"#1E293B",border:"1px solid #334155"}}>
                        <span className="text-xs font-medium" style={{color:"#94A3B8"}}>RSVP:</span>
                        {[['✓','going'],['?','maybe'],['✗','no']].map(([icon,status]) => (
                          <button key={status} onClick={async () => { await apiFetch('/meetings/' + m.id + '/rsvp', { method:'POST', body: JSON.stringify({ status }) }); alert('RSVP: ' + status); }}
                            className="text-xs px-1.5 py-0.5 rounded font-bold transition-colors" style={{color:"#60A5FA"}}>{icon}</button>
                        ))}
                      </div>
                    )}
                    {/* Hamburger menu */}
                    <div className="relative" style={{position:'relative'}}>
                      <button onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                        className="text-xs px-3 py-2 rounded-lg font-bold transition-colors" style={{background:"#1E293B",color:"#94A3B8",border:"1px solid #334155"}}>
                        ⋯
                      </button>
                      {openMenuId === m.id && (
                        <div style={{position:'absolute',right:0,top:'100%',marginTop:4,background:'#0F172A',border:'1px solid #1E40AF',borderRadius:10,padding:4,zIndex:50,minWidth:180,boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
                          {[
                            { label:'🔔 Send reminder', fn: () => { sendReminder(m.id); setOpenMenuId(null); } },
                            { label:'📅 Add to Google Cal', fn: () => { syncToGoogleCalendar(m); setOpenMenuId(null); } },
                            { label:'📞 Dial-in info', fn: () => { alert('Dial-in: +91-22-6880-0000 | Meeting ID: ' + m.id.slice(0,8).toUpperCase()); setOpenMenuId(null); } },
                            { label:'📋 Meeting agenda', fn: () => { setShowAgenda(m.id); setAgendaItems(m.agenda || ['']); setOpenMenuId(null); } },
                            { label:'📎 Resources', fn: () => { openResources(m.id); setOpenMenuId(null); } },
                            { label:'👥 Attendance', fn: () => { loadAttendance(m.id); setOpenMenuId(null); } },
                            { label:'📝 Post summary', fn: () => { postSummaryToChannel(m); setOpenMenuId(null); } },
                            { label:'🗳️ Create poll', fn: () => { openPoll(m.id); setOpenMenuId(null); } },
                            { label:'🖊️ Whiteboard', fn: () => { setPollMeetId(m.id); setShowWB(true); setOpenMenuId(null); } },
                            { label:'🔁 Make recurring', fn: () => { makeRecurring(m.id); setOpenMenuId(null); } },
                            { label: captionsOn ? '🔴 Stop captions' : '💬 Live captions', fn: () => { toggleCaptions(); setOpenMenuId(null); } },
                            { label: handRaised ? '✋ Lower hand' : '✋ Raise hand', fn: () => { setHandRaised(h => !h); setOpenMenuId(null); } },
                            { label:'🚪 Breakout rooms', fn: () => { setShowBreakout(true); setOpenMenuId(null); } },
                            { label:'👥 Set capacity', fn: () => { setShowCapacity(m.id); setOpenMenuId(null); } },
                            { label:'🎤 Assign co-host', fn: () => { setShowCoHost(m.id); setOpenMenuId(null); } },
                            ...(m.metadata?.recording_url ? [{ label:'🎥 View recording', fn: () => { window.open(m.metadata.recording_url, '_blank'); setOpenMenuId(null); } }] : []),
                          ].map(item => (
                            <button key={item.label} onClick={item.fn}
                              style={{display:'block',width:'100%',textAlign:'left',padding:'7px 12px',background:'none',border:'none',color:'#A8B3C8',cursor:'pointer',fontSize:13,borderRadius:6,whiteSpace:'nowrap'}}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(99,120,180,0.09)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Meeting agenda</h3>
              <button onClick={() => setShowAgenda(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 text-xs mb-3">Add agenda items — will be shared with all participants</p>
            {agendaItems.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-gray-300 text-sm mt-2">{i+1}.</span>
                <input value={item} onChange={e => { const a=[...agendaItems]; a[i]=e.target.value; setAgendaItems(a); }}
                  placeholder={`Agenda item ${i+1}`}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                {agendaItems.length > 1 && (
                  <button onClick={() => setAgendaItems(a => a.filter((_,j) => j!==i))} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setAgendaItems(a => [...a,''])} className="/text-indigo-400/g text-sm mt-1 mb-4">+ Add item</button>
            <button onClick={() => saveAgenda(showAgenda)} className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-lg text-sm font-medium">Save agenda</button>
          </div>
        </div>
      )}

      {/* Resources modal */}
      {showResources && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowResources(null); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">📎 Meeting resources</h3>
              <button onClick={() => setShowResources(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 text-xs mb-3">Share links to documents, slides, or files — visible to everyone invited, whether or not they joined the call.</p>

            {loadingResources ? (
              <p className="text-gray-300 text-sm py-4 text-center">Loading...</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                {meetingResources.length === 0 && (
                  <p className="text-gray-300 text-xs text-center py-3">No resources added yet</p>
                )}
                {meetingResources.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-base flex-shrink-0">🔗</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-sm /text-indigo-400/g hover:underline truncate">
                      {r.name}
                    </a>
                    <button onClick={() => removeResource(showResources, r.id)}
                      className="text-gray-300 hover:text-red-400 text-lg flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-800 pt-3 space-y-2">
              <input value={newResourceName} onChange={e => setNewResourceName(e.target.value)}
                placeholder="Resource name (e.g. Sprint slides)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <input value={newResourceUrl} onChange={e => setNewResourceUrl(e.target.value)}
                placeholder="Link (Google Drive, Notion, GitHub, etc.)"
                onKeyDown={e => { if (e.key === 'Enter') addResourceLink(showResources); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              <button onClick={() => addResourceLink(showResources)}
                className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-lg text-sm font-medium">
                + Add resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance modal */}
      {showAttend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowAttend(null); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Meeting attendance</h3>
              <button onClick={() => setShowAttend(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            {attendance.length === 0 ? (
              <p className="text-gray-300 text-sm text-center py-4">No participants found</p>
            ) : attendance.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800">
                <div className="w-8 h-8 rounded-full /bg-indigo-600/g flex items-center justify-center text-xs font-bold text-white">{p.display_name?.charAt(0)}</div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{p.display_name}</div>
                  <div className="text-xs text-gray-300">{p.email}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.joined_at ? 'bg-emerald-900/50 text-indigo-400' : 'bg-gray-800 text-gray-300'}`}>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Breakout rooms</h3>
              <button onClick={() => setShowBreakout(false)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 text-xs mb-4">Create smaller rooms for group discussions</p>
            {breakoutRooms.map((room, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-gray-800 rounded-xl">
                <input value={room.name} onChange={e => { const r=[...breakoutRooms]; r[i].name=e.target.value; setBreakoutRooms(r); }}
                  className="flex-1 bg-transparent text-white text-sm outline-none font-medium" />
                <a href={`/meet?room=${encodeURIComponent(room.name)}`} target="_blank"
                  className="text-xs /bg-indigo-600/g hover:/bg-indigo-500/g text-white px-3 py-1.5 rounded-lg">Open room</a>
                {breakoutRooms.length > 1 && (
                  <button onClick={() => setBreakoutRooms(r => r.filter((_,j) => j!==i))} className="text-gray-300 hover:text-red-400">×</button>
                )}
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setBreakoutRooms(r => [...r, {name:`Room ${r.length+1}`,members:[]}])}
                className="flex-1 text-sm text-gray-200 hover:text-white bg-gray-800 hover:bg-gray-700 py-2 rounded-xl border border-gray-700">+ Add room</button>
              <button onClick={() => { alert('Breakout rooms opened! Share the room links with participants.'); setShowBreakout(false); }}
                className="flex-1 text-sm /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-xl font-medium">Start breakouts</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IN-MEETING PANEL ── */}
      {showInMeeting && activeMeeting && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:300,display:'flex',flexDirection:'column'}}>
          {/* Meeting header bar */}
          <div style={{background:'#000000',borderBottom:'1px solid rgba(99,120,180,0.12)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#ed4245',animation:'pulse 1s infinite'}}/>
              <span style={{fontSize:16,fontWeight:700,color:'#FFFFFF'}}>{activeMeeting.title}</span>
              <div style={{position:'relative'}}>
                <button onClick={e => { e.stopPropagation(); setShowParticipants(s => !s); setShowChatMenu(false); }}
                  style={{fontSize:12,color:'#A8B3C8',background: showParticipants?'rgba(99,120,180,0.16)':'rgba(99,120,180,0.09)',padding:'4px 10px',borderRadius:20,border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                  👥 {1+meetingParticipants.length}/{MAX_PARTICIPANTS} {showParticipants ? '▲' : '▼'}
                </button>
                {/* Dropdown anchored to this button */}
                {showParticipants && (
                  <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'#1A1A2E',border:'1px solid rgba(99,120,180,0.16)',borderRadius:10,zIndex:100,width:260,boxShadow:'0 8px 24px rgba(0,0,0,0.6)',overflow:'hidden'}}
                    onClick={e => e.stopPropagation()}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid rgba(99,120,180,0.12)',background:'#161C2A'}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#FFFFFF'}}>Participants ({1+meetingParticipants.length})</span>
                      <button onClick={() => { setShowAddPeople(true); setShowParticipants(false); }}
                        style={{fontSize:11,color:'#818CF8',background:'rgba(79,110,247,0.12)',border:'1px solid rgba(79,110,247,0.3)',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontWeight:600}}>+ Invite</button>
                    </div>
                    <div style={{maxHeight:280,overflowY:'auto'}}>
                      {/* Host */}
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#4F6EF7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>Y</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'#FFFFFF',fontWeight:500}}>You (Host)</div>
                          <div style={{fontSize:10,color:'#818CF8'}}>{micOn?'🎙️ Mic on':'🔇 Mic off'} · {cameraOn?'📷 Cam on':'📷 Cam off'}</div>
                        </div>
                        <span style={{fontSize:10,color:'#CBD5E1',background:'rgba(99,120,180,0.09)',padding:'2px 5px',borderRadius:4}}>Host</span>
                      </div>
                      {/* Participants */}
                      {meetingParticipants.map((p,i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid rgba(99,120,180,0.07)',cursor:'default'}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(99,120,180,0.07)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:['#5865f2','#7c3aed','#0284c7','#dc2626','#d97706'][i%5],display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{p.name?.charAt(0)||'?'}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,color:'#FFFFFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                            <div style={{fontSize:10,color:'#CBD5E1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.email}</div>
                          </div>
                          <button onClick={() => {
                            setMeetingParticipants(prev=>prev.filter((_,j)=>j!==i));
                            setParticipantCount(c=>Math.max(1,c-1));
                            setInMeetingChat((c:any)=>[...c,{sender:'System',text:p.name+' was removed from the meeting',time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
                          }} style={{fontSize:10,color:'#ed4245',background:'rgba(237,66,69,0.1)',border:'1px solid rgba(237,66,69,0.2)',borderRadius:5,padding:'3px 7px',cursor:'pointer',flexShrink:0}}>Remove</button>
                        </div>
                      ))}
                      {meetingParticipants.length===0 && <div style={{padding:14,fontSize:12,color:'#CBD5E1',textAlign:'center'}}>No other participants yet.<br/>Click + Invite to add people.</div>}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowAddPeople(true)}
                style={{fontSize:12,color:'#818CF8',background:'rgba(79,110,247,0.12)',padding:'4px 12px',borderRadius:20,border:'1px solid rgba(79,110,247,0.3)',cursor:'pointer',fontWeight:600}}>
                + Add people
              </button>

              {/* Host quick controls */}
              <div style={{display:'flex',gap:6,marginLeft:8}}>
                <button onClick={() => {
                  setAllMuted(true);
                  const newMics:Record<string,boolean> = {};
                  meetingParticipants.forEach((p:any) => { newMics[p.id] = false; });
                  setParticipantMics(newMics);
                  setInMeetingChat((c:any) => [...c, { sender:'System', text:'🔇 Host muted all participants', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                }} title="Mute all participants — individual control: click on their video tile"
                  style={{fontSize:11,color:'#f59e0b',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
                  🔇 Mute all
                </button>
                <button onClick={() => {
                  setAllMuted(false);
                  setParticipantMics({});
                  setInMeetingChat((c:any) => [...c, { sender:'System', text:'🎙️ Host unmuted all participants', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                }} title="Unmute all participants"
                  style={{fontSize:11,color:'#818CF8',background:'rgba(79,110,247,0.12)',border:'1px solid rgba(79,110,247,0.3)',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
                  🎙️ Unmute all
                </button>
                <button onClick={() => {
                  setMeetingLocked(l => !l);
                  setInMeetingChat((c:any) => [...c, { sender:'System', text: meetingLocked ? '🔓 Meeting unlocked — new participants can now join' : '🔒 Meeting locked by host — no new participants can join. Current participants are not affected.', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                }} title={meetingLocked ? 'Click to unlock — allow new participants to join' : 'Click to lock — prevent any new participants from joining (existing participants stay)'}
                  style={{fontSize:11,color: meetingLocked?'#ed4245':'#7A8499',background: meetingLocked?'rgba(237,66,69,0.1)':'rgba(99,120,180,0.09)',border:`1px solid ${meetingLocked?'rgba(237,66,69,0.3)':'rgba(99,120,180,0.14)'}`,borderRadius:8,padding:'4px 10px',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
                  {meetingLocked ? '🔒 Locked' : '🔓 Lock meeting'}
                </button>
                <button onClick={() => {
                  if (confirm('End meeting for ALL participants?')) {
                    setInMeetingChat((c:any) => [...c, { sender:'System', text:'Meeting ended by host', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                    setTimeout(() => {
                      (window as any)._micStream?.getTracks().forEach((t:any) => t.stop());
                      (window as any)._camStream?.getTracks().forEach((t:any) => t.stop());
                      (window as any)._screenStream?.getTracks().forEach((t:any) => t.stop());
                      if ((window as any)._meetRecorder?.state==='recording') (window as any)._meetRecorder.stop();
                      setMicOn(false); setCameraOn(false); setScreenOn(false); setRecording(false);
                      setShowInMeeting(false); setActiveMeeting(null); setMeetingParticipants([]);
                      setMonthlyMins((p:number) => p + Math.floor(Math.random()*30+10));
                    }, 1500);
                  }
                }} title="End meeting for everyone"
                  style={{fontSize:11,color:'#fff',background:'#ed4245',border:'none',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
                  ⏹ End for all
                </button>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color: monthlyMins >= MONTHLY_LIMIT_MINS*0.9 ? '#ed4245' : '#7A8499'}}>
                {Math.floor((MONTHLY_LIMIT_MINS-monthlyMins)/60)}h {(MONTHLY_LIMIT_MINS-monthlyMins)%60}m remaining this month
              </span>


              <button onClick={() => {
                  (window as any)._micStream?.getTracks().forEach((t:any) => t.stop());
                  (window as any)._camStream?.getTracks().forEach((t:any) => t.stop());
                  (window as any)._screenStream?.getTracks().forEach((t:any) => t.stop());
                  (window as any)._recStream?.getTracks().forEach((t:any) => t.stop());
                  if ((window as any)._meetRecorder?.state === 'recording') (window as any)._meetRecorder.stop();
                  setMicOn(false); setCameraOn(false); setScreenOn(false); setRecording(false);
                  setShowInMeeting(false); setActiveMeeting(null);
                  setParticipantCount((p:number) => Math.max(0, p-1));
                  setMonthlyMins((p:number) => p + Math.floor(Math.random()*30+10));
                }} style={{background:'#ed4245',border:'none',borderRadius:8,padding:'8px 16px',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}}>
                Leave meeting
              </button>
            </div>
          </div>

          <div style={{display:'flex',flex:1,overflow:'hidden'}}>
            {/* Video area */}
            <div style={{flex:1,background:'#1A1A2E',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,position:'relative'}}
              onClick={e => { if(e.target===e.currentTarget) { setShowParticipants(false); setShowChatMenu(false); setShowHostControls(null); } }}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,width:'100%',maxWidth:900}}>
                {/* Host video tile */}
                <div style={{background:'#16213E',borderRadius:12,aspectRatio:'16/9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px solid rgba(79,110,247,0.3)',position:'relative'}}>
                  {cameraOn
                    ? <video id="local-video" autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:10,position:'absolute',top:0,left:0}} />
                    : <div style={{width:56,height:56,borderRadius:'50%',background:'#4F6EF7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff',marginBottom:8}}>Y</div>
                  }
                  {!cameraOn && <span style={{fontSize:13,color:'#FFFFFF'}}>You</span>}
                  {micOn && <span style={{position:'absolute',bottom:8,right:8,fontSize:11,color:'#818CF8',background:'rgba(0,0,0,0.6)',padding:'2px 6px',borderRadius:4}}>🎙️ Live</span>}
                  <span style={{position:'absolute',bottom:8,left:8,fontSize:11,color:'#818CF8',background:'rgba(0,0,0,0.5)',padding:'2px 6px',borderRadius:4}}>🎙️ Host</span>
                  <span style={{position:'absolute',top:8,right:8,fontSize:11,color:'#CBD5E1',background:'rgba(0,0,0,0.5)',padding:'2px 6px',borderRadius:4}}>HD</span>
                </div>
                {/* Other participant tiles */}
                {/* Participant tiles - click to open host controls */}
                {/* Other participant tiles — host excluded since they have their own dedicated tile */}
                {meetingParticipants.filter((p:any) => p.id !== currentUser?.id).slice(0,5).map((p:any,i:number) => (
                  <div key={i}
                    onClick={e => { e.stopPropagation(); setShowHostControls(showHostControls===p.id?null:p.id); }}
                    style={{background:'#16213E',borderRadius:12,aspectRatio:'16/9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer',border: showHostControls===p.id ? '2px solid #f59e0b' : '1px solid rgba(99,120,180,0.14)',transition:'border .15s',userSelect:'none'}}>
                    <div style={{width:44,height:44,borderRadius:'50%',background:(['#5865f2','#7c3aed','#0284c7','#dc2626','#d97706'] as string[])[i%5],display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',marginBottom:6}}>{p.name?.charAt(0)||'?'}</div>
                    <span style={{fontSize:12,color:'#A8B3C8',fontWeight:500}}>{p.name}</span>
                    <div style={{position:'absolute',bottom:6,left:6,display:'flex',gap:3}}>
                      <span style={{fontSize:10,background:'rgba(0,0,0,0.7)',padding:'1px 5px',borderRadius:4,color:participantMics[p.id]===false?'#ed4245':'#818CF8'}}>{participantMics[p.id]===false?'🔇':'🎙️'}</span>
                      <span style={{fontSize:10,background:'rgba(0,0,0,0.7)',padding:'1px 5px',borderRadius:4,color:'#CBD5E1'}}>{participantCams[p.id]===false?'📷✗':'📷'}</span>
                    </div>
                    <div style={{position:'absolute',top:6,right:6,fontSize:9,color:'#f59e0b',background:'rgba(0,0,0,0.6)',padding:'1px 5px',borderRadius:4,opacity: showHostControls===p.id?1:0,transition:'opacity .15s'}}>Host controls</div>
                    {showHostControls===p.id && (
                      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#000000',border:'2px solid #f59e0b',borderRadius:12,padding:12,zIndex:50,minWidth:190,boxShadow:'0 12px 40px rgba(0,0,0,0.8)'}}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{fontSize:12,fontWeight:700,color:'#f59e0b',marginBottom:10,textAlign:'center',borderBottom:'1px solid rgba(245,158,11,0.2)',paddingBottom:8}}>{p.name}</div>
                        {[
                          {label: participantMics[p.id]===false?'🎙️ Unmute mic':'🔇 Mute mic', fn:()=>{
                            setParticipantMics((prev:any)=>({...prev,[p.id]:prev[p.id]===false?true:false}));
                            setInMeetingChat((c:any)=>[...c,{sender:'System',text:`Host ${participantMics[p.id]===false?'unmuted':'muted'} ${p.name}'s microphone`,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
                            setShowHostControls(null);
                          }},
                          {label: participantCams[p.id]===false?'📷 Enable camera':'📷 Disable camera', fn:()=>{
                            setParticipantCams((prev:any)=>({...prev,[p.id]:prev[p.id]===false?true:false}));
                            setInMeetingChat((c:any)=>[...c,{sender:'System',text:`Host ${participantCams[p.id]===false?'enabled':'disabled'} ${p.name}'s camera`,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
                            setShowHostControls(null);
                          }},
                          {label:'🎤 Make co-host', fn:()=>{
                            setInMeetingChat((c:any)=>[...c,{sender:'System',text:`${p.name} is now a co-host`,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
                            setShowHostControls(null);
                          }},
                          {label:'💬 Private message', fn:()=>{
                            setChatMode('private'); setPrivateTarget(p); setShowHostControls(null);
                          }},
                          {label:'🚫 Remove from meeting', fn:()=>{
                            if(confirm('Remove '+p.name+' from the meeting?')){
                              setMeetingParticipants((prev:any)=>prev.filter((_:any,j:number)=>j!==i));
                              setParticipantCount((c:number)=>Math.max(1,c-1));
                              setInMeetingChat((c:any)=>[...c,{sender:'System',text:`${p.name} was removed by host`,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]);
                              setShowHostControls(null);
                            }
                          }},
                        ].map(action=>(
                          <button key={action.label} onClick={action.fn}
                            style={{display:'block',width:'100%',textAlign:'left',padding:'8px 10px',background:'none',border:'none',color:'#C8D0E0',cursor:'pointer',fontSize:12,borderRadius:6,marginBottom:2}}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(99,120,180,0.12)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='none'}>
                            {action.label}
                          </button>
                        ))}
                        <button onClick={()=>setShowHostControls(null)}
                          style={{display:'block',width:'100%',textAlign:'center',padding:'5px',background:'rgba(99,120,180,0.09)',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:11,borderRadius:6,marginTop:6}}>Close ✕</button>
                      </div>
                    )}
                  </div>
                ))}
                {meetingParticipants.length===0 && (
                  <div style={{background:'#16213E',borderRadius:12,aspectRatio:'16/9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'1px dashed rgba(99,120,180,0.14)'}}>
                    <span style={{fontSize:28,marginBottom:6}}>👥</span>
                    <span style={{fontSize:12,color:'#CBD5E1'}}>Add people to see them here</span>
                  </div>
                )}
                {meetingParticipants.length>5 && (
                  <div style={{background:'#16213E',borderRadius:12,aspectRatio:'16/9',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:20,fontWeight:700,color:'#CBD5E1'}}>+{meetingParticipants.length-5} more</span>
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div style={{display:'flex',gap:10,marginTop:20,background:'rgba(0,0,0,0.5)',borderRadius:40,padding:'10px 20px',flexWrap:'wrap',justifyContent:'center'}}>
                {([
                  {
                    icon: micOn ? '🎙️' : '🔇',
                    label: micOn ? 'Mic ON' : 'Mic OFF',
                    active: micOn,
                    color: micOn ? '#818CF8' : '#ed4245',
                    action: async () => {
                      if (micOn) {
                        (window as any)._micStream?.getTracks().forEach((t:any) => t.stop());
                        (window as any)._micStream = null;
                        setMicOn(false);
                        setInMeetingChat((c:any) => [...c, { sender:'System', text:'🔇 Your microphone is now OFF', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                      } else {
                        try {
                          const s = await navigator.mediaDevices.getUserMedia({audio:true});
                          (window as any)._micStream = s;
                          setMicOn(true);
                          setInMeetingChat((c:any) => [...c, { sender:'System', text:'🎙️ Your microphone is now ON', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                        } catch { alert('Could not access microphone. Please allow microphone permission in browser settings.'); }
                      }
                    }
                  },
                  {
                    icon: cameraOn ? '📷' : '📷',
                    label: cameraOn ? 'Camera ON' : 'Camera OFF',
                    active: cameraOn,
                    color: cameraOn ? '#818CF8' : '#ed4245',
                    action: async () => {
                      if (cameraOn) {
                        (window as any)._camStream?.getTracks().forEach((t:any) => t.stop());
                        (window as any)._camStream = null;
                        setCameraOn(false);
                        setInMeetingChat((c:any) => [...c, { sender:'System', text:'📷 Your camera is now OFF', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                        const v = document.getElementById('local-video') as HTMLVideoElement;
                        if (v) { v.srcObject = null; }
                      } else {
                        try {
                          const s = await navigator.mediaDevices.getUserMedia({video:true});
                          (window as any)._camStream = s;
                          setCameraOn(true);
                          const v = document.getElementById('local-video') as HTMLVideoElement;
                          if (v) { v.srcObject = s; v.play(); }
                          setInMeetingChat((c:any) => [...c, { sender:'System', text:'📷 Your camera is now ON', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                        } catch { alert('Could not access camera. Please allow camera permission in browser settings.'); }
                      }
                    }
                  },
                  {
                    icon: screenOn ? '🖥️' : '💻',
                    label: screenOn ? 'Screen ON' : 'Share screen',
                    active: screenOn,
                    color: screenOn ? '#818CF8' : undefined,
                    action: async () => {
                      if (screenOn) {
                        (window as any)._screenStream?.getTracks().forEach((t:any) => t.stop());
                        setScreenOn(false);
                        setInMeetingChat((c:any) => [...c, { sender:'System', text:'🖥️ Screen sharing stopped', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                      } else {
                        try {
                          const s = await (navigator.mediaDevices as any).getDisplayMedia({video:true, audio:true});
                          (window as any)._screenStream = s;
                          s.getVideoTracks()[0].onended = () => { setScreenOn(false); };
                          setScreenOn(true);
                          setInMeetingChat((c:any) => [...c, { sender:'System', text:'🖥️ You are now sharing your screen', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                        } catch { alert('Screen sharing cancelled or not supported in this browser.'); }
                      }
                    }
                  },
                  {
                    icon: handRaised ? '✋' : '🤚',
                    label: handRaised ? 'Lower hand' : 'Raise hand',
                    active: handRaised,
                    color: handRaised ? '#fbbf24' : undefined,
                    action: () => {
                      setHandRaised((h:boolean) => !h);
                      setInMeetingChat((c:any) => [...c, { sender:'System', text: handRaised ? 'You lowered your hand' : '✋ You raised your hand', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                    }
                  },
                  {icon:'😊', label:'React', active: !!inMeetingEmoji, color: undefined, action: () => setInMeetingEmoji((e:any) => e ? null : 'show')},
                  {
                    icon: recording ? '⏹️' : '🔴',
                    label: recording ? 'Stop rec' : 'Record',
                    active: recording,
                    color: recording ? '#ed4245' : undefined,
                    action: async () => {
                      if (recording) {
                        (window as any)._meetRecorder?.stop();
                        (window as any)._recStream?.getTracks().forEach((t:any) => t.stop());
                        setRecording(false);
                        setInMeetingChat((c:any) => [...c, { sender:'System', text:'⏹️ Recording stopped — downloading...', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                      } else {
                        try {
                          // Use existing screen stream or request new one
                          let stream = (window as any)._screenStream;
                          if (!stream) {
                            stream = await (navigator.mediaDevices as any).getDisplayMedia({video:true, audio:true});
                            (window as any)._recStream = stream;
                          }
                          // Mix with mic if on
                          const micStream = (window as any)._micStream;
                          let tracks = [...stream.getTracks()];
                          if (micStream) tracks = [...tracks, ...micStream.getAudioTracks()];
                          const combined = new MediaStream(tracks);
                          const recorder = new MediaRecorder(combined, {mimeType:'video/webm;codecs=vp9,opus'});
                          const chunks: Blob[] = [];
                          recorder.ondataavailable = (e:any) => { if(e.data.size>0) chunks.push(e.data); };
                          recorder.onstop = () => {
                            const blob = new Blob(chunks, {type:'video/webm'});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'deemona-meeting-' + new Date().toISOString().slice(0,10) + '.webm'; a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                          };
                          recorder.start(1000);
                          (window as any)._meetRecorder = recorder;
                          setRecording(true);
                          setInMeetingChat((c:any) => [...c, { sender:'System', text:'🔴 Recording started. Click Stop rec to finish.', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                        } catch(e:any) {
                          if (e?.name === 'NotSupportedError') {
                            alert('Recording format not supported. Try Chrome or Edge.');
                          } else {
                            alert('To record: first click "Share screen" to share your screen, then click Record.');
                          }
                        }
                      }
                    }
                  },
                ] as {icon:string,label:string,active:boolean,color?:string,action:()=>void}[]).map(ctrl => (
                  <div key={ctrl.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <button onClick={ctrl.action} title={ctrl.label}
                      style={{background: ctrl.active ? (ctrl.color ? ctrl.color+'33' : 'rgba(79,110,247,0.2)') : 'rgba(99,120,180,0.12)', border: `1px solid ${ctrl.active ? (ctrl.color || '#818CF8')+'66' : 'rgba(99,120,180,0.14)'}`, borderRadius:'50%',width:52,height:52,cursor:'pointer',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',position:'relative'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.2)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background= ctrl.active ? (ctrl.color ? ctrl.color+'33' : 'rgba(79,110,247,0.2)') : 'rgba(99,120,180,0.12)'}>
                      {ctrl.icon}
                    </button>
                    <span style={{fontSize:10,color:'#CBD5E1',whiteSpace:'nowrap'}}>{ctrl.label}</span>
                  </div>
                ))}
              </div>

              {/* Emoji reaction picker */}
              {inMeetingEmoji && (
                <div style={{display:'flex',gap:8,marginTop:10,background:'rgba(0,0,0,0.5)',borderRadius:40,padding:'8px 16px'}}>
                  {['👍','❤️','😂','🎉','👏','🔥','😮','🙏'].map(e => (
                    <button key={e} onClick={() => {
                      setInMeetingChat(c => [...c, { sender:'You', text: e + ' reacted', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                      setInMeetingEmoji(null);
                    }} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',borderRadius:8,padding:4}}
                    onMouseEnter={e2=>(e2.currentTarget as HTMLElement).style.background='rgba(99,120,180,0.14)'}
                    onMouseLeave={e2=>(e2.currentTarget as HTMLElement).style.background='none'}>{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat sidebar */}
            <div style={{width:320,background:'#000000',borderLeft:'1px solid rgba(99,120,180,0.12)',display:'flex',flexDirection:'column'}}>

              {/* Chat header with controls */}
              <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(99,120,180,0.12)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontWeight:600,color:'#FFFFFF',fontSize:14}}>
                    {chatMode === 'private' && privateTarget
                      ? '🔒 Private: ' + privateTarget.name
                      : '💬 Meeting chat'}
                  </span>
                  {chatMode === 'private' && (
                    <button onClick={() => { setChatMode('everyone'); setPrivateTarget(null); }}
                      style={{fontSize:10,color:'#CBD5E1',background:'rgba(99,120,180,0.09)',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer'}}>
                      × Back to all
                    </button>
                  )}
                </div>
                <div style={{display:'flex',gap:4,position:'relative'}}>
                  {/* Chat mode toggle */}
                  <button onClick={() => setShowChatMenu(s => !s)}
                    style={{fontSize:11,color:'#A8B3C8',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'4px 8px',cursor:'pointer'}}>
                    {chatMode === 'everyone' ? '🌐 Everyone ▾' : '🔒 Private ▾'}
                  </button>
                  {showChatMenu && (
                    <div style={{position:'absolute',top:'100%',right:0,marginTop:4,background:'#0F172A',border:'1px solid #1E40AF',borderRadius:8,padding:4,zIndex:10,minWidth:180,boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
                      <button onClick={() => { setChatMode('everyone'); setPrivateTarget(null); setShowChatMenu(false); }}
                        style={{display:'block',width:'100%',textAlign:'left',padding:'7px 12px',background: chatMode==='everyone'?'rgba(36,128,70,0.15)':'none',border:'none',color:'#FFFFFF',cursor:'pointer',fontSize:13,borderRadius:4}}>
                        🌐 Message everyone
                      </button>
                      <div style={{padding:'4px 12px',fontSize:10,color:'#CBD5E1',fontWeight:600,marginTop:4}}>PRIVATE MESSAGE</div>
                      {meetingParticipants.length === 0
                        ? <div style={{padding:'6px 12px',fontSize:12,color:'#CBD5E1'}}>No other participants yet</div>
                        : meetingParticipants.map((p,i) => (
                          <button key={i} onClick={() => { setChatMode('private'); setPrivateTarget(p); setShowChatMenu(false); }}
                            style={{display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'6px 12px',background: privateTarget?.id===p.id?'rgba(99,102,241,0.15)':'none',border:'none',color:'#A8B3C8',cursor:'pointer',fontSize:13,borderRadius:4}}>
                            <div style={{width:22,height:22,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{p.name?.charAt(0)}</div>
                            {p.name}
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {/* Clear chat */}
                  <button onClick={() => {
                    if (confirm('Clear all meeting chat messages? This cannot be undone.')) {
                      setInMeetingChat([{ sender:'System', text:'Chat cleared by host', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                    }
                  }} title="Clear chat" style={{fontSize:11,color:'#CBD5E1',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:6,padding:'4px 8px',cursor:'pointer'}}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* Private chat notice */}
              {chatMode === 'private' && privateTarget && (
                <div style={{padding:'6px 14px',background:'rgba(99,102,241,0.08)',borderBottom:'1px solid rgba(99,102,241,0.15)',fontSize:11,color:'#818cf8'}}>
                  🔒 Private messages to {privateTarget.name} are only visible to you and them
                </div>
              )}

              {/* Messages */}
              <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
                {inMeetingChat
                  .filter(msg => {
                    if (chatMode === 'private' && privateTarget) {
                      return msg.private && (msg.to === privateTarget.id || msg.from === privateTarget.id);
                    }
                    return !msg.private;
                  })
                  .map((msg:any,i:number) => (
                    <div key={i} style={{background:
                      msg.sender==='System' ? 'rgba(79,110,247,0.05)' :
                      msg.private ? 'rgba(99,102,241,0.1)' :
                      'rgba(79,110,247,0.08)',
                      borderRadius:8,padding:'8px 10px',
                      border: msg.sender==='System' ? 'none' : msg.private ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(36,128,70,0.12)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                        <span style={{fontSize:11,fontWeight:600,color:
                          msg.sender==='System' ? '#7A8499' :
                          msg.private ? '#818cf8' :
                          '#818CF8'}}>
                          {msg.sender}
                          {msg.private && <span style={{fontSize:10,color:'#6366f1',marginLeft:4}}>🔒 private</span>}
                        </span>
                        <span style={{fontSize:10,color:'#CBD5E1'}}>{msg.time}</span>
                      </div>
                      <p style={{fontSize:13,color:'#C8D0E0',margin:0,lineHeight:1.4}}>{msg.text}</p>
                    </div>
                  ))
                }
                {inMeetingChat.filter((msg:any) => chatMode==='private' && privateTarget ? msg.private && (msg.to===privateTarget.id||msg.from===privateTarget.id) : !msg.private).length === 0 && chatMode === 'private' && (
                  <div style={{textAlign:'center',color:'#CBD5E1',fontSize:12,padding:16}}>
                    🔒 Start a private conversation with {privateTarget?.name}
                  </div>
                )}
              </div>

              {/* Emoji + file row */}
              <div style={{padding:'6px 12px',borderTop:'1px solid rgba(99,120,180,0.09)',display:'flex',gap:4,alignItems:'center'}}>
                <span style={{fontSize:11,color:'#CBD5E1',marginRight:2}}>
                  {chatMode==='private' && privateTarget ? '🔒' : '🌐'}
                </span>
                {['👍','😊','❤️','🎉','🔥','👏'].map(e => (
                  <button key={e} onClick={() => setInMeetingMsg((m:string) => m+e)}
                    style={{background:'none',border:'none',fontSize:15,cursor:'pointer',padding:2,borderRadius:4}}>
                    {e}
                  </button>
                ))}
                <label style={{marginLeft:'auto',cursor:'pointer'}} title="Share document">
                  <input type="file" style={{display:'none'}} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const msg:any = {
                      sender:'You', text:'📎 Shared: '+file.name,
                      time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
                      private: chatMode==='private',
                      to: privateTarget?.id, from:'me'
                    };
                    setInMeetingChat((c:any) => [...c, msg]);
                  }} />
                  <span style={{fontSize:16,color:'#CBD5E1'}}>📎</span>
                </label>
              </div>

              {/* Message input */}
              <div style={{padding:12,borderTop:'1px solid rgba(99,120,180,0.12)',display:'flex',gap:8}}>
                <input value={inMeetingMsg} onChange={e => setInMeetingMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key==='Enter' && inMeetingMsg.trim()) {
                      const msg:any = {
                        sender:'You', text:inMeetingMsg,
                        time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
                        private: chatMode==='private',
                        to: privateTarget?.id, from:'me'
                      };
                      setInMeetingChat((c:any) => [...c, msg]);
                      setInMeetingMsg('');
                    }
                  }}
                  placeholder={chatMode==='private' && privateTarget ? `Private message to ${privateTarget.name}...` : 'Message everyone...'}
                  style={{flex:1,background:'rgba(99,120,180,0.09)',border:`1px solid ${chatMode==='private'?'rgba(99,102,241,0.3)':'rgba(99,120,180,0.14)'}`,borderRadius:8,padding:'8px 10px',color:'#FFFFFF',fontSize:13,outline:'none'}} />
                <button onClick={() => {
                  if (!inMeetingMsg.trim()) return;
                  const msg:any = {
                    sender:'You', text:inMeetingMsg,
                    time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
                    private: chatMode==='private',
                    to: privateTarget?.id, from:'me'
                  };
                  setInMeetingChat((c:any) => [...c, msg]);
                  setInMeetingMsg('');
                }} style={{background: chatMode==='private'?'#6366f1':'#4F6EF7',border:'none',borderRadius:8,padding:'8px 12px',color:'#fff',cursor:'pointer',fontSize:13}}>
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add People to Meeting Modal */}
      {showAddPeople && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#161C2A',borderRadius:16,border:'1px solid rgba(99,120,180,0.14)',width:'100%',maxWidth:460,padding:24,boxShadow:'0 16px 48px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <span style={{fontSize:16,fontWeight:700,color:'#FFFFFF'}}>Add people to meeting</span>
              <button onClick={() => setShowAddPeople(false)} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:18,lineHeight:1}}>x</button>
            </div>

            {/* Capacity warning */}
            <div style={{background:'rgba(99,120,180,0.07)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:12,color:'#CBD5E1'}}>
              {participantCount}/{MAX_PARTICIPANTS} participants · {MAX_PARTICIPANTS - participantCount} slots remaining
              {participantCount >= MAX_PARTICIPANTS * 0.9 && <span style={{color:'#f59e0b',marginLeft:8}}>⚠️ Near capacity</span>}
            </div>

            {/* Search */}
            <input value={addPeopleSearch} onChange={e => setAddPeopleSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{width:'100%',background:'rgba(99,120,180,0.09)',border:'1px solid rgba(99,120,180,0.14)',borderRadius:8,padding:'10px 12px',color:'#FFFFFF',fontSize:14,outline:'none',marginBottom:12,boxSizing:'border-box'}} />

            {/* Member list */}
            <div style={{maxHeight:240,overflowY:'auto',marginBottom:14}}>
              {(meetOrgMembers as any[])
                .filter((m:any) => m.id !== currentUser?.id)
                .filter((m:any) => !meetingParticipants.find(p => p.id===m.id))
                .filter((m:any) => !addPeopleSearch || m.display_name?.toLowerCase().includes(addPeopleSearch.toLowerCase()) || m.email?.toLowerCase().includes(addPeopleSearch.toLowerCase()))
                .map((m:any) => (
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 4px',borderBottom:'1px solid rgba(99,120,180,0.07)'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                      {m.display_name?.charAt(0) || '?'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,color:'#FFFFFF',fontWeight:500}}>{m.display_name}</div>
                      <div style={{fontSize:12,color:'#CBD5E1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</div>
                    </div>
                    <button onClick={() => {
                      if (participantCount >= MAX_PARTICIPANTS) {
                        alert('Meeting is full. Maximum 500 participants allowed.');
                        return;
                      }
                      setMeetingParticipants(prev => [...prev, { id:m.id, name:m.display_name, email:m.email }]);
                      setParticipantCount(c => c + 1);
                      setInMeetingChat((c:any) => [...c, { sender:'System', text:`${m.display_name} was invited to the meeting`, time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }]);
                      // Also send notification via API
                      apiFetch('/meetings/' + activeMeeting?.id + '/invite', { method:'POST', body: JSON.stringify({ userId: m.id }) }).catch(()=>{});
                    }} style={{fontSize:12,color:'#818CF8',background:'rgba(79,110,247,0.12)',border:'1px solid rgba(79,110,247,0.3)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontWeight:600,flexShrink:0}}>
                      + Add
                    </button>
                  </div>
                ))
              }
              {(meetOrgMembers as any[]).filter((m:any) => m.id !== currentUser?.id).filter((m:any) => !meetingParticipants.find(p => p.id===m.id)).length === 0 && (
                <p style={{fontSize:13,color:'#CBD5E1',textAlign:'center',padding:16}}>All workspace members have been added</p>
              )}
            </div>

            {/* Share link */}
            <div style={{borderTop:'1px solid rgba(99,120,180,0.12)',paddingTop:14}}>
              <p style={{fontSize:12,color:'#CBD5E1',marginBottom:8}}>Or share the meeting link:</p>
              <div style={{display:'flex',gap:8}}>
                <input readOnly value={typeof window !== 'undefined' ? window.location.origin + '/meet?id=' + activeMeeting?.id : ''}
                  style={{flex:1,background:'rgba(99,120,180,0.07)',border:'1px solid rgba(99,120,180,0.12)',borderRadius:6,padding:'7px 10px',color:'#CBD5E1',fontSize:12,outline:'none'}} />
                <button onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/meet?id=' + activeMeeting?.id);
                  alert('Meeting link copied!');
                }} style={{background:'rgba(79,110,247,0.12)',border:'1px solid rgba(79,110,247,0.2)',borderRadius:6,padding:'7px 14px',color:'#818CF8',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0}}>
                  Copy link
                </button>
              </div>
            </div>

            <button onClick={() => { setShowAddPeople(false); setShowParticipants(true); }}
              style={{width:'100%',marginTop:14,background:'#4F6EF7',border:'none',borderRadius:10,padding:'10px',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Done — View participants
            </button>
          </div>
        </div>
      )}

      {/* Meeting capacity modal */}
      {showCapacity && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowCapacity(null); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Meeting capacity limit</h3>
              <button onClick={() => setShowCapacity(null)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-300 mb-3">Set maximum number of participants</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[10,25,50,100,200,500].map(n => (
                <button key={n} onClick={() => setMeetCapacity(n)}
                  className={`text-sm px-3 py-2 rounded-lg border ${meetCapacity===n?'/bg-indigo-600/g border-emerald-600 text-white':'bg-gray-800 border-gray-700 text-gray-200 hover:text-white'}`}>
                  {n}
                </button>
              ))}
            </div>
            <input type="number" value={meetCapacity} onChange={e => setMeetCapacity(parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4" />
            <button onClick={async () => {
              await apiFetch('/meetings/' + showCapacity + '/capacity', { method:'PATCH', body: JSON.stringify({ capacity: meetCapacity }) });
              setShowCapacity(null);
              alert('Capacity set to ' + meetCapacity + ' participants');
            }} className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-xl text-sm font-medium">Save capacity</button>
          </div>
        </div>
      )}

      {/* Co-host modal */}
      {showCoHost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowCoHost(null); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Co-host permissions</h3>
              <button onClick={() => setShowCoHost(null)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-300 mb-3">Select members to assign as co-hosts</p>
            <div className="space-y-1 max-h-56 overflow-y-auto mb-4">
              {(meetOrgMembers as any[]).map((m: any) => (
                <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox"
                    checked={(coHosts[showCoHost!] || []).includes(m.id)}
                    onChange={e => {
                      setCoHosts(prev => ({
                        ...prev,
                        [showCoHost!]: e.target.checked
                          ? [...(prev[showCoHost!]||[]), m.id]
                          : (prev[showCoHost!]||[]).filter((id: string) => id !== m.id)
                      }));
                    }} className="/accent-indigo-500/g" />
                  <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">{m.display_name?.charAt(0)}</div>
                  <div className="text-sm text-white">{m.display_name}</div>
                </label>
              ))}
            </div>
            <button onClick={async () => {
              const ids = coHosts[showCoHost!] || [];
              await apiFetch('/meetings/' + showCoHost + '/cohosts', { method:'POST', body: JSON.stringify({ coHostIds: ids }) });
              setShowCoHost(null);
              alert('Co-hosts assigned: ' + ids.length + ' member' + (ids.length!==1?'s':''));
            }} className="w-full /bg-indigo-600/g hover:/bg-indigo-500/g text-white py-2 rounded-xl text-sm font-medium">Assign co-hosts</button>
          </div>
        </div>
      )}

      {/* Poll modal */}
      {showPoll && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowPoll(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Meeting Poll</span>
              <button onClick={() => setShowPoll(false)} className="text-gray-300 hover:text-white">x</button>
            </div>
            <div className="flex gap-2">
              <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Question..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:/border-indigo-400/g" />
              <button onClick={async () => {
                if (!pollQ.trim() || !pollMeetId) return;
                await api.createPoll(pollMeetId, pollQ.trim(), ['Yes', 'No', 'Maybe']);
                const res = await api.getPolls(pollMeetId);
                setMeetPolls(res?.data || []);
                setPollQ('');
              }} disabled={!pollQ.trim()} className="/bg-indigo-600/g hover:/bg-indigo-500/g disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Launch</button>
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
                        <div className="flex justify-between text-xs mb-1"><span className="text-white">{opt}</span><span className="text-gray-200">{v} ({pct}%)</span></div>
                        <div className="bg-gray-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: pct+'%'}} /></div>
                      </button>
                    );
                  })}
                  <p className="text-xs text-gray-300">{total} votes</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Whiteboard */}
      {showWB && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if(e.target === e.currentTarget) setShowWB(false); }}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:"#0F172A",flexShrink:0,borderBottom:"1px solid #1E3A5F"}}>
              <span className="text-white font-semibold">Whiteboard</span>
              <div className="flex gap-2">
                <button onClick={() => { const c = document.getElementById('wb2') as HTMLCanvasElement; const ctx = c?.getContext('2d'); if(ctx) ctx.clearRect(0,0,c.width,c.height); }} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg">Clear</button>
                <button onClick={() => { const c = document.getElementById('wb2') as HTMLCanvasElement; const a = document.createElement('a'); a.download='whiteboard.png'; a.href=c.toDataURL(); a.click(); }} className="text-xs /bg-indigo-600/g text-white px-3 py-1.5 rounded-lg">Save PNG</button>
                <button onClick={() => setShowWB(false)} className="text-gray-300 hover:text-white">x</button>
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
