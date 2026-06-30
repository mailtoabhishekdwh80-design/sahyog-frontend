// lib/api.ts — Deemona Teams API client
const API_BASE = 'https://sahyog-api-ajbr.onrender.com/api/v1';

// ── Token storage ─────────────────────────────────────────────
export const tokenStore = {
  get:        () => typeof window !== 'undefined' ? localStorage.getItem('sahyog_token') : null,
  set:        (t: string) => localStorage.setItem('sahyog_token', t),
  clear:      () => localStorage.removeItem('sahyog_token'),
  getRefresh: () => typeof window !== 'undefined' ? localStorage.getItem('sahyog_refresh') : null,
  setRefresh: (t: string) => localStorage.setItem('sahyog_refresh', t),
};

// ── Core fetch ────────────────────────────────────────────────
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    if (!text) return {};
    const data = JSON.parse(text);
    if (data?.error?.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${tokenStore.get()}`;
        const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryText = await retry.text();
        return retryText ? JSON.parse(retryText) : {};
      } else {
        tokenStore.clear();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
      }
    }
    return data;
  } catch (err) {
    console.error('API Error:', path, err);
    return null;
  }
}

// ── Refresh ───────────────────────────────────────────────────
async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data?.data?.accessToken) {
      tokenStore.set(data.data.accessToken);
      if (data.data.refreshToken) tokenStore.setRefresh(data.data.refreshToken);
      return true;
    }
  } catch {}
  return false;
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data?.data?.accessToken) {
      tokenStore.set(data.data.accessToken);
      tokenStore.setRefresh(data.data.refreshToken);
      return { ok: true, user: data.data.user };
    }
    return { ok: false, error: data?.error?.message || 'Login failed' };
  } catch {
    return { ok: false, error: 'Cannot connect to server. Is the backend running?' };
  }
}

export function logout() {
  tokenStore.clear();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

export const isLoggedIn = () => !!tokenStore.get();

// ── API ───────────────────────────────────────────────────────
export const api = {
  login,
  logout,

  // User
  me:           () => apiFetch('/users/me'),
  updateProfile: (data: any) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Workspaces
  workspaces:   () => apiFetch('/workspaces'),

  // Channels
  channels:     (workspaceId?: string) =>
    apiFetch(`/channels${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  messages:     (channelId: string) =>
    apiFetch(`/channels/${channelId}/messages?limit=50`),
  sendMessage:  (channelId: string, content: string) =>
    apiFetch(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  createChannel: (workspaceId: string, name: string, description?: string, isPrivate?: boolean) =>
    apiFetch('/channels', { method: 'POST', body: JSON.stringify({ workspaceId, name, description, type: isPrivate ? 'private' : 'public' }) }),
  editMessage:  (channelId: string, msgId: string, content: string) =>
    apiFetch(`/channels/${channelId}/messages/${msgId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteMessage: (channelId: string, msgId: string) =>
    apiFetch(`/channels/${channelId}/messages/${msgId}`, { method: 'DELETE' }),

  // Reactions
  addReaction:    (channelId: string, msgId: string, emoji: string) =>
    apiFetch(`/channels/${channelId}/messages/${msgId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  removeReaction: (channelId: string, msgId: string, emoji: string) =>
    apiFetch(`/channels/${channelId}/messages/${msgId}/reactions/${emoji}`, { method: 'DELETE' }),

  // Threads
  threadMessages:  (channelId: string, msgId: string) =>
    apiFetch(`/channels/${channelId}/messages?threadId=${msgId}&limit=50`),
  sendThreadReply: (channelId: string, threadId: string, content: string) =>
    apiFetch(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content, threadId }) }),

  // Pins
  getPins:      (channelId: string) => apiFetch(`/channels/${channelId}/pins`),
  pinMessage:   (channelId: string, msgId: string) =>
    apiFetch(`/channels/${channelId}/pins`, { method: 'POST', body: JSON.stringify({ messageId: msgId }) }),
  unpinMessage: (channelId: string, msgId: string) =>
    apiFetch(`/channels/${channelId}/pins/${msgId}`, { method: 'DELETE' }),

  // Direct Messages
  dmList:    () => apiFetch('/channels/dm/list'),
  createDM:  (userId: string) =>
    apiFetch('/channels/dm', { method: 'POST', body: JSON.stringify({ userId }) }),

  // Boards
  boards:     (workspaceId?: string) =>
    apiFetch(`/boards${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  createBoard: (name: string, workspaceId: string) =>
    apiFetch('/boards', { method: 'POST', body: JSON.stringify({ name, workspaceId }) }),
  lists:      (boardId: string) => apiFetch(`/boards/${boardId}/lists`),
  tasks:      (boardId: string) => apiFetch(`/boards/${boardId}/tasks`),
  createList: (boardId: string, name: string, position: number) =>
    apiFetch(`/boards/${boardId}/lists`, { method: 'POST', body: JSON.stringify({ name, position }) }),
  createTask: (boardId: string, title: string, listId: string, priority?: string, description?: string) =>
    apiFetch(`/boards/${boardId}/tasks`, { method: 'POST', body: JSON.stringify({ title, listId, description }) }),
  updateTask: (taskId: string, data: Record<string, any>) =>
    apiFetch(`/boards/task/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (taskId: string) =>
    apiFetch(`/boards/task/${taskId}`, { method: 'DELETE' }),
  moveTask:   (taskId: string, listId: string, position: number) =>
    apiFetch(`/boards/task/${taskId}/move`, { method: 'PATCH', body: JSON.stringify({ listId, position }) }),
  getTask:         (taskId: string) => apiFetch('/boards/task/' + taskId),
  getComments:     (taskId: string) => apiFetch('/boards/task/' + taskId + '/comments'),
  addComment:      (taskId: string, content: string) =>
    apiFetch('/boards/task/' + taskId + '/comments', { method: 'POST', body: JSON.stringify({ content }) }),
  getChecklist:    (taskId: string) => apiFetch('/boards/task/' + taskId + '/checklist'),
  addCheckItem:    (taskId: string, title: string) =>
    apiFetch('/boards/task/' + taskId + '/checklist', { method: 'POST', body: JSON.stringify({ title }) }),
  toggleCheckItem: (taskId: string, itemId: string, isChecked: boolean) =>
    apiFetch('/boards/task/' + taskId + '/checklist/' + itemId, { method: 'PATCH', body: JSON.stringify({ isChecked }) }),
  deleteCheckItem: (taskId: string, itemId: string) =>
    apiFetch('/boards/task/' + taskId + '/checklist/' + itemId, { method: 'DELETE' }),

  // Meetings
  meetings:        () => apiFetch('/meetings'),
  createMeeting:   (data: Record<string, any>) =>
    apiFetch('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  joinMeeting:     (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/join`, { method: 'POST' }),
  leaveMeeting:    (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/leave`, { method: 'POST' }),
  getMeeting:      (id: string) => apiFetch('/meetings/' + id),
  getParticipants: (id: string) => apiFetch('/meetings/' + id + '/participants'),
  getMeetingChat:  (id: string) => apiFetch('/meetings/' + id + '/chat'),
  sendMeetingChat: (id: string, content: string) =>
    apiFetch('/meetings/' + id + '/chat', { method: 'POST', body: JSON.stringify({ content }) }),
  getMeetingNotes: (id: string) => apiFetch('/meetings/' + id + '/notes'),
  saveMeetingNotes: (id: string, content: string) =>
    apiFetch('/meetings/' + id + '/notes', { method: 'POST', body: JSON.stringify({ content }) }),
  getMeetingResources: (id: string) => apiFetch('/meetings/' + id + '/resources'),
  addMeetingResource: (id: string, data: { name: string; url: string; type: 'file'|'link'; sizeBytes?: number }) =>
    apiFetch('/meetings/' + id + '/resources', { method: 'POST', body: JSON.stringify(data) }),
  removeMeetingResource: (id: string, resourceId: string) =>
    apiFetch('/meetings/' + id + '/resources/' + resourceId, { method: 'DELETE' }),
  getRecordings:   (id: string) => apiFetch('/meetings/' + id + '/recordings'),
  endMeeting:      (id: string) => apiFetch('/meetings/' + id + '/end', { method: 'POST' }),
  sendReminder:    (id: string) => apiFetch('/meetings/' + id + '/remind', { method: 'POST' }),
  startRecording:  (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/recording/start`, { method: 'POST' }),
  stopRecording:   (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/recording/stop`, { method: 'POST' }),

  // Files
  getUploadUrl: (fileName: string, mimeType: string, sizeBytes: number, workspaceId?: string) =>
    apiFetch('/files/upload-url', { method: 'POST', body: JSON.stringify({ fileName, mimeType, sizeBytes, workspaceId }) }),
  confirmUpload: (data: Record<string, any>) =>
    apiFetch('/files/confirm', { method: 'POST', body: JSON.stringify(data) }),
  getFiles:     (workspaceId?: string) =>
    apiFetch(`/files${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),

  // Bookmarks
  getBookmarks:   () => apiFetch('/users/me/bookmarks'),
  addBookmark:    (messageId: string) =>
    apiFetch('/users/me/bookmarks', { method: 'POST', body: JSON.stringify({ messageId }) }),
  removeBookmark: (messageId: string) =>
    apiFetch('/users/me/bookmarks/' + messageId, { method: 'DELETE' }),

  // Status
  setStatus: (statusEmoji: string, statusText: string) =>
    apiFetch('/users/me/status', { method: 'PATCH', body: JSON.stringify({ statusEmoji, statusText }) }),

  // Notifications
  notifications: () => apiFetch('/users/me/notifications'),
  markRead:      (id: string) => apiFetch(`/users/me/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:   () => apiFetch('/users/me/notifications/read-all', { method: 'POST' }),

  // Search
  search: (q: string, type = 'all') =>
    apiFetch(`/search?q=${encodeURIComponent(q)}&type=${type}`),

  // Team management
  orgMembers:       () => apiFetch('/orgs/me/members'),
  orgRoles:         () => apiFetch('/orgs/me/roles'),
  inviteMembers:    (emails: string[], roleId: string) =>
    apiFetch('/orgs/me/members/invite', { method: 'POST', body: JSON.stringify({ emails, roleId }) }),
  updateMemberRole: (userId: string, roleId: string) =>
    apiFetch('/orgs/me/members/' + userId + '/role', { method: 'PATCH', body: JSON.stringify({ roleId }) }),
  removeMember:     (userId: string) =>
    apiFetch('/orgs/me/members/' + userId, { method: 'DELETE' }),
  getOrg:           () => apiFetch('/orgs/me'),
  updateOrg:        (data: any) =>
    apiFetch('/orgs/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword:   (currentPassword: string, newPassword: string) =>
    apiFetch('/auth/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Task attachments & activity
  getAttachments:  (taskId: string) => apiFetch('/boards/task/' + taskId + '/attachments'),
  addAttachment:   (taskId: string, data: any) =>
    apiFetch('/boards/task/' + taskId + '/attachments', { method: 'POST', body: JSON.stringify(data) }),
  getActivity:     (taskId: string) => apiFetch('/boards/task/' + taskId + '/activity'),
  setCoverColor:   (taskId: string, coverColor: string) =>
    apiFetch('/boards/task/' + taskId + '/cover', { method: 'PATCH', body: JSON.stringify({ coverColor }) }),

  // Card dependencies
  getDependencies: (taskId: string) => apiFetch('/boards/task/' + taskId + '/dependencies'),
  addDependency:   (taskId: string, data: any) =>
    apiFetch('/boards/task/' + taskId + '/dependencies', { method: 'POST', body: JSON.stringify(data) }),

  // Time tracking
  logTime:    (taskId: string, minutes: number, note?: string) =>
    apiFetch('/boards/task/' + taskId + '/time', { method: 'POST', body: JSON.stringify({ minutes, note }) }),
  getTimeLogs: (taskId: string) => apiFetch('/boards/task/' + taskId + '/time'),

  // Subtasks
  getSubtasks:  (taskId: string) => apiFetch('/boards/task/' + taskId + '/subtasks'),
  addSubtask:   (taskId: string, title: string) =>
    apiFetch('/boards/task/' + taskId + '/subtasks', { method: 'POST', body: JSON.stringify({ title }) }),

  // Board analytics
  boardAnalytics: (boardId: string) => apiFetch('/boards/' + boardId + '/analytics'),

  // Meeting polls
  createPoll:  (meetingId: string, question: string, options: string[]) =>
    apiFetch('/boards/meeting-polls', { method: 'POST', body: JSON.stringify({ meetingId, question, options }) }),
  votePoll:    (pollId: string, optionIndex: number) =>
    apiFetch('/boards/meeting-polls/' + pollId + '/vote', { method: 'POST', body: JSON.stringify({ optionIndex }) }),
  getPolls:    (meetingId: string) => apiFetch('/boards/meeting-polls/' + meetingId),

  // Board templates
  getTemplates:    () => apiFetch('/boards/templates'),
  applyTemplate:   (boardId: string, templateId: string) =>
    apiFetch('/boards/' + boardId + '/from-template', { method: 'POST', body: JSON.stringify({ templateId }) }),

  // Scheduled messages
  scheduleMessage:    (channelId: string, content: string, scheduledAt: string) =>
    apiFetch('/channels/' + channelId + '/messages/schedule', { method: 'POST', body: JSON.stringify({ content, scheduledAt }) }),
  getScheduled:       (channelId: string) => apiFetch('/channels/' + channelId + '/messages/scheduled'),
  cancelScheduled:    (channelId: string, msgId: string) =>
    apiFetch('/channels/' + channelId + '/messages/scheduled/' + msgId, { method: 'DELETE' }),

  // Channel analytics
  channelAnalytics:   (channelId: string) => apiFetch('/channels/' + channelId + '/analytics'),

  // Custom emoji
  getCustomEmojis:    () => apiFetch('/channels/custom-emojis'),
  addCustomEmoji:     (name: string, url: string) =>
    apiFetch('/channels/custom-emojis', { method: 'POST', body: JSON.stringify({ name, url }) }),

  // Deemona Connect (cross-org)
  connectInvite:      (email: string, channelId: string, orgName: string) =>
    apiFetch('/channels/connect-invite', { method: 'POST', body: JSON.stringify({ email, channelId, orgName }) }),

  // @here mention
  notifyHere:      (channelId: string, message: string) =>
    apiFetch('/channels/' + channelId + '/here', { method: 'POST', body: JSON.stringify({ message }) }),

  // Guest access
  guestInvite:     (email: string, channelIds: string[]) =>
    apiFetch('/channels/guest-invite', { method: 'POST', body: JSON.stringify({ email, channelIds }) }),

  // Recurring meetings
  makeRecurring:   (meetingId: string, frequency: string, endDate?: string) =>
    apiFetch('/meetings/' + meetingId + '/recurring', { method: 'POST', body: JSON.stringify({ frequency, endDate }) }),
  callHistory:     () => apiFetch('/meetings/call-history'),

  // Push notifications
  savePushSub:     (subscription: any) =>
    apiFetch('/users/me/push-subscription', { method: 'POST', body: JSON.stringify({ subscription }) }),

  // Home dashboard
  myTasks:          () => apiFetch('/boards/tasks/assigned-to-me'),
  recentActivity:   () => apiFetch('/users/me/activity'),
  dashboardStats:   () => apiFetch('/users/me/dashboard'),

  // AI Assistant
  aiChat:           (message: string, channelId?: string, boardId?: string) =>
    apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message, channelId, boardId }) }),
  aiSummarize:      (channelId: string) =>
    apiFetch('/ai/summarize-channel', { method: 'POST', body: JSON.stringify({ channelId }) }),
  aiSuggestTasks:   (description: string, boardId?: string) =>
    apiFetch('/ai/suggest-tasks', { method: 'POST', body: JSON.stringify({ description, boardId }) }),
  aiTranslate:      (text: string, targetLang: string) =>
    apiFetch('/ai/translate', { method: 'POST', body: JSON.stringify({ text, targetLang }) }),

  // WhatsApp notifications
  sendWhatsApp:     (to: string, message: string) =>
    apiFetch('/notifications/whatsapp', { method: 'POST', body: JSON.stringify({ to, message }) }),

  // Admin
  adminStats:   () => apiFetch('/admin/stats'),
  adminMembers: () => apiFetch('/users/directory'),
  adminAudit:   () => apiFetch('/admin/audit-logs'),
};
