'use client';
import { useEffect, useState, useRef } from 'react';
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

  // ── Boot: check auth, load data ───────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    (async () => {
      const [meRes, wsRes] = await Promise.all([api.me(), api.workspaces()]);
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
    try {
      const res = await api.messages(ch.id);
      const msgs = Array.isArray(res?.data) ? res.data : [];
      setMessages(msgs.reverse());
    } catch(e) { setMessages([]); }
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
        <div className="mt-auto">
          <button
            onClick={logout}
            title="Sign out"
            className="w-9 h-9 rounded-xl bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-300 text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Workspace name */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="font-semibold text-sm text-white truncate">{activeWs?.name}</div>
          <div className="text-xs text-gray-500 truncate">{user?.display_name}</div>
        </div>

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

            {/* Composer */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
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
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
              <span>📋</span>
              <span className="font-semibold text-white">{activeBoard.name}</span>
              <span className="text-xs text-gray-500 ml-2">{tasks.length} tasks</span>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 p-4 h-full">
                {lists.length === 0 && (
                  <div className="text-gray-600 text-sm m-auto">
                    Loading lists... (board was just created — lists are being set up)
                  </div>
                )}

                {lists.map(list => {
                  const listTasks = tasks.filter(t => t.list_id === list.id);
                  return (
                    <div
                      key={list.id}
                      className="w-72 shrink-0 bg-gray-900 rounded-xl flex flex-col border border-gray-800"
                    >
                      {/* List header */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
                        <span className="text-sm font-semibold text-gray-200">{list.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
                          {listTasks.length}
                        </span>
                      </div>

                      {/* Tasks */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {listTasks.map(task => (
                          <div
                            key={task.id}
                            className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                          >
                            <p className="text-sm text-white font-medium leading-snug">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                            )}
                            <div className="mt-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor[task.priority] || 'bg-gray-700 text-gray-400'}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Add task inline */}
                        {addingToList === list.id ? (
                          <div className="bg-gray-800 rounded-lg p-2 border border-emerald-700">
                            <input
                              autoFocus
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') addTask(list.id);
                                if (e.key === 'Escape') { setAddingToList(null); setNewTaskTitle(''); }
                              }}
                              placeholder="Task title..."
                              className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => addTask(list.id)}
                                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setAddingToList(null); setNewTaskTitle(''); }}
                                className="text-xs text-gray-500 hover:text-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingToList(list.id)}
                            className="w-full text-left text-xs text-gray-600 hover:text-gray-400 px-2 py-1.5 rounded hover:bg-gray-800 transition-colors"
                          >
                            + Add task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
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

  useEffect(() => {
    api.meetings().then(res => setMeetings(res?.data || []));
  }, []);

  return (
    <div className="space-y-3 max-w-2xl">
      {meetings.length === 0 && (
        <div className="text-gray-600 text-sm">No meetings found.</div>
      )}
      {meetings.map(m => (
        <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-white">{m.title}</div>
              {m.description && (
                <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {new Date(m.starts_at).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              m.status === 'live' ? 'bg-red-900 text-red-300 animate-pulse' :
              m.status === 'scheduled' ? 'bg-blue-900 text-blue-300' :
              'bg-gray-800 text-gray-400'
            }`}>
              {m.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
