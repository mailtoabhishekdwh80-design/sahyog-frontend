// lib/api.ts — Sahyog API client

const API_BASE = 'http://localhost:3000/api/v1';

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

    // Auto-refresh on token expiry
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
  } catch (err) {
    return { ok: false, error: 'Cannot connect to server. Is the backend running?' };
  }
}

export function logout() {
  tokenStore.clear();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

export const isLoggedIn = () => !!tokenStore.get();

// ── API helpers ───────────────────────────────────────────────
export const api = {
  login,
  logout,
  me:           () => apiFetch('/users/me'),
  workspaces:   () => apiFetch('/workspaces'),
  channels:     (workspaceId?: string) =>
    apiFetch(`/channels${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  messages:     (channelId: string) =>
    apiFetch(`/channels/${channelId}/messages?limit=50`),
  sendMessage:  (channelId: string, content: string) =>
    apiFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  boards:       (workspaceId?: string) =>
    apiFetch(`/boards${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  createBoard:  (name: string, workspaceId: string) =>
    apiFetch('/boards', { method: 'POST', body: JSON.stringify({ name, workspaceId }) }),
  lists:        (boardId: string) => apiFetch(`/boards/${boardId}/lists`),
  tasks:        (boardId: string) => apiFetch(`/boards/${boardId}/tasks`),
  createList:   (boardId: string, name: string, position: number) =>
    apiFetch(`/boards/${boardId}/lists`, {
      method: 'POST',
      body: JSON.stringify({ name, position }),
    }),
  createTask:   (boardId: string, title: string, listId: string, description?: string) =>
    apiFetch(`/boards/${boardId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, listId, description }),
    }),
  meetings:        () => apiFetch('/meetings'),
  createMeeting:   (data: Record<string, any>) =>
    apiFetch('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  joinMeeting:     (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/join`, { method: 'POST' }),
  startRecording:  (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/recording/start`, { method: 'POST' }),
  stopRecording:   (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/recording/stop`, { method: 'POST' }),
  getRecordings:   (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/recordings`),

  leaveMeeting:    (meetingId: string) =>
    apiFetch(`/meetings/${meetingId}/leave`, { method: 'POST' }),

  // Files
  getUploadUrl: (fileName: string, mimeType: string, sizeBytes: number, workspaceId?: string) =>
    apiFetch('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, mimeType, sizeBytes, workspaceId }),
    }),
  confirmUpload: (data: Record<string, any>) =>
    apiFetch('/files/confirm', { method: 'POST', body: JSON.stringify(data) }),
  getFiles: (workspaceId?: string) =>
    apiFetch(`/files${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  getDownloadUrl: (fileId: string) =>
    apiFetch(`/files/${fileId}/download-url`),

  // Search
  search: (q: string, type = 'all') =>
    apiFetch(`/search?q=${encodeURIComponent(q)}&type=${type}`),

  // Notifications
  notifications:    () => apiFetch('/users/me/notifications'),
  markRead:         (id: string) => apiFetch(`/users/me/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:      () => apiFetch('/users/me/notifications/read-all', { method: 'POST' }),

  // Admin
  adminStats:   () => apiFetch('/admin/stats'),
  adminMembers: () => apiFetch('/users/directory'),
  adminAudit:   () => apiFetch('/admin/audit-logs'),

  updateTask: (taskId: string, data: Record<string, any>) =>
    apiFetch(`/boards/task/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTask: (taskId: string) =>
    apiFetch(`/boards/task/${taskId}`, { method: 'DELETE' }),

  moveTask: (taskId: string, listId: string, position: number) =>
    apiFetch(`/boards/task/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ listId, position }),
    }),
};
