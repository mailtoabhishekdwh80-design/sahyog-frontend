'use client';
import { useEffect, useState } from 'react';
import { api, isLoggedIn } from '../../lib/api';

type Tab = 'profile' | 'password' | 'team' | 'invites' | 'workspace' | 'appearance';

export default function SettingsPage() {
  const [tab,         setTab]         = useState<Tab>('profile');
  const [user,        setUser]        = useState<any>(null);
  const [org,         setOrg]         = useState<any>(null);
  const [members,     setMembers]     = useState<any[]>([]);
  const [roles,       setRoles]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState('');
  const [error,       setError]       = useState('');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department,  setDepartment]  = useState('');
  const [timezone,    setTimezone]    = useState('Asia/Kolkata');

  // Password
  const [currentPw,   setCurrentPw]   = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');

  // Invites
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole,   setInviteRole]   = useState('');

  // Workspace
  const [orgName,     setOrgName]     = useState('');
  const [orgSlug,     setOrgSlug]     = useState('');

  // Theme
  const [theme, setTheme] = useState<'dark'|'light'>('dark');

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    loadData();
    const saved = localStorage.getItem('sahyog_theme') as 'dark'|'light' || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  async function loadData() {
    setLoading(true);
    const [meRes, orgRes, membersRes, rolesRes] = await Promise.all([
      api.me(), api.getOrg(), api.orgMembers(), api.orgRoles(),
    ]);
    const u = meRes?.data;
    setUser(u);
    setDisplayName(u?.display_name || '');
    setDesignation(u?.designation || '');
    setDepartment(u?.department || '');
    setTimezone(u?.timezone || 'Asia/Kolkata');
    const o = orgRes?.data;
    setOrg(o);
    setOrgName(o?.name || '');
    setOrgSlug(o?.slug || '');
    setMembers(membersRes?.data || []);
    const r = rolesRes?.data || [];
    setRoles(r);
    if (r.length > 0) setInviteRole(r[0].id);
    setLoading(false);
  }

  function showSuccess(msg: string) {
    setSuccess(msg); setError('');
    setTimeout(() => setSuccess(''), 3000);
  }

  function showError(msg: string) {
    setError(msg); setSuccess('');
  }

  async function saveProfile() {
    setSaving(true);
    const res = await api.updateProfile({ displayName, designation, department, timezone });
    setSaving(false);
    if (res?.data) showSuccess('Profile updated successfully!');
    else showError(res?.error?.message || 'Failed to update profile');
  }

  async function changePassword() {
    if (!currentPw || !newPw) { showError('Please fill all fields'); return; }
    if (newPw.length < 8) { showError('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { showError('Passwords do not match'); return; }
    setSaving(true);
    const res = await api.changePassword(currentPw, newPw);
    setSaving(false);
    if (res?.data) {
      showSuccess('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } else showError(res?.error?.message || 'Failed to change password');
  }

  async function sendInvites() {
    if (!inviteEmails.trim()) { showError('Please enter email addresses'); return; }
    const emails = inviteEmails.split(/[\n,;]/).map(e => e.trim()).filter(e => e.includes('@'));
    if (emails.length === 0) { showError('No valid emails found'); return; }
    setSaving(true);
    const res = await api.inviteMembers(emails, inviteRole);
    setSaving(false);
    if (res?.data) {
      showSuccess(`Invites sent to ${emails.length} email(s)!`);
      setInviteEmails('');
    } else showError(res?.error?.message || 'Failed to send invites');
  }

  async function updateMemberRole(userId: string, roleId: string) {
    await api.updateMemberRole(userId, roleId);
    showSuccess('Role updated');
    loadData();
  }

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    await api.removeMember(userId);
    showSuccess(`${name} removed`);
    loadData();
  }

  async function saveWorkspace() {
    setSaving(true);
    const res = await api.updateOrg({ name: orgName });
    setSaving(false);
    if (res?.data) showSuccess('Workspace updated!');
    else showError(res?.error?.message || 'Failed to update');
  }

  function applyTheme(t: 'dark'|'light') {
    if (t === 'light') {
      document.documentElement.style.setProperty('--bg', '#ffffff');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }

  function toggleTheme(t: 'dark'|'light') {
    setTheme(t);
    localStorage.setItem('sahyog_theme', t);
    applyTheme(t);
    showSuccess(`Switched to ${t} mode`);
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile',    label: 'Profile',    icon: '👤' },
    { id: 'password',   label: 'Password',   icon: '🔒' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'team',       label: 'Team',       icon: '👥' },
    { id: 'invites',    label: 'Invite',     icon: '✉️' },
    { id: 'workspace',  label: 'Workspace',  icon: '⚙️' },
  ];

  const inputClass = "w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 placeholder-gray-500";
  const labelClass = "block text-xs text-gray-400 mb-1.5 font-medium";
  const btnClass   = "bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-colors";

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-emerald-400 animate-pulse">Loading settings...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">S</div>
          <div>
            <div className="font-semibold text-white">Settings</div>
            <div className="text-xs text-gray-500">{org?.name}</div>
          </div>
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Back to workspace</a>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-colors ${
                  tab === t.id ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Success/Error banner */}
          {success && (
            <div className="mb-4 bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm rounded-xl px-4 py-3">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">
              ⚠ {error}
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
              <h2 className="text-lg font-semibold text-white">Profile settings</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.display_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{user?.display_name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Display name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Designation</label>
                  <input value={designation} onChange={e => setDesignation(e.target.value)} className={inputClass} placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. Engineering" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className={inputClass + ' cursor-pointer'}>
                  <option value="Asia/Kolkata">India (IST +5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Dubai">Dubai (GST +4)</option>
                  <option value="Asia/Singapore">Singapore (SGT +8)</option>
                </select>
              </div>
              <button onClick={saveProfile} disabled={saving} className={btnClass}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
              <h2 className="text-lg font-semibold text-white">Change password</h2>
              <div>
                <label className={labelClass}>Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputClass} placeholder="Enter current password" />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputClass} placeholder="Min 8 characters" />
                {newPw && (
                  <div className="mt-1.5 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= Math.min(4, Math.floor(newPw.length/3)) ? newPw.length >= 12 ? 'bg-emerald-500' : 'bg-yellow-500' : 'bg-gray-700'}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className={inputClass + (confirmPw && confirmPw !== newPw ? ' border-red-700' : '')}
                  placeholder="Repeat new password" />
                {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
              </div>
              <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                {[
                  { text: 'At least 8 characters',       met: newPw.length >= 8 },
                  { text: 'Contains a number',            met: /\d/.test(newPw) },
                  { text: 'Contains special character',   met: /[^a-zA-Z0-9]/.test(newPw) },
                  { text: 'Passwords match',              met: newPw === confirmPw && confirmPw !== '' },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2">
                    <span className={`text-xs ${r.met ? 'text-emerald-400' : 'text-gray-600'}`}>{r.met ? '✓' : '○'}</span>
                    <span className={`text-xs ${r.met ? 'text-gray-300' : 'text-gray-600'}`}>{r.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={changePassword} disabled={saving || newPw.length < 8 || newPw !== confirmPw} className={btnClass}>
                {saving ? 'Changing...' : 'Change password'}
              </button>
            </div>
          )}

          {/* Appearance tab */}
          {tab === 'appearance' && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-6">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <div>
                <label className={labelClass}>Theme</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button onClick={() => toggleTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-colors ${theme === 'dark' ? 'border-emerald-500' : 'border-gray-700 hover:border-gray-500'}`}>
                    <div className="w-full h-24 bg-gray-950 rounded-lg mb-3 flex flex-col p-2 gap-1">
                      <div className="h-2 bg-gray-800 rounded w-3/4" />
                      <div className="h-2 bg-gray-800 rounded w-1/2" />
                      <div className="h-2 bg-emerald-900 rounded w-2/3 mt-auto" />
                    </div>
                    <div className="text-sm font-medium text-white">🌙 Dark</div>
                    <div className="text-xs text-gray-500">Easy on the eyes</div>
                    {theme === 'dark' && <div className="text-xs text-emerald-400 mt-1">✓ Active</div>}
                  </button>
                  <button onClick={() => toggleTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-colors ${theme === 'light' ? 'border-emerald-500' : 'border-gray-700 hover:border-gray-500'}`}>
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex flex-col p-2 gap-1">
                      <div className="h-2 bg-gray-300 rounded w-3/4" />
                      <div className="h-2 bg-gray-300 rounded w-1/2" />
                      <div className="h-2 bg-emerald-400 rounded w-2/3 mt-auto" />
                    </div>
                    <div className="text-sm font-medium text-white">☀️ Light</div>
                    <div className="text-xs text-gray-500">Clean and bright</div>
                    {theme === 'light' && <div className="text-xs text-emerald-400 mt-1">✓ Active</div>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team tab */}
          {tab === 'team' && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Team members ({members.length})</h2>
                <button onClick={loadData} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800">↻ Refresh</button>
              </div>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {m.display_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{m.display_name}</div>
                      <div className="text-xs text-gray-500 truncate">{m.email}</div>
                    </div>
                    <select
                      value={m.roles?.[0] === 'owner' ? 'owner' : roles.find(r => m.roles?.includes(r.name))?.id || ''}
                      onChange={e => updateMemberRole(m.id, e.target.value)}
                      disabled={m.roles?.includes('owner')}
                      className="text-xs bg-gray-700 text-gray-300 rounded-lg px-2 py-1 border border-gray-600 focus:outline-none disabled:opacity-50">
                      {m.roles?.includes('owner') && <option value="owner">Owner</option>}
                      {roles.filter(r => r.name !== 'owner').map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {!m.roles?.includes('owner') && m.id !== user?.id && (
                      <button onClick={() => removeMember(m.id, m.display_name)}
                        className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-900/30 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invites tab */}
          {tab === 'invites' && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
              <h2 className="text-lg font-semibold text-white">Invite team members</h2>
              <div>
                <label className={labelClass}>Email addresses</label>
                <textarea value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} rows={4}
                  placeholder="Enter one email per line, or separate with commas:&#10;john@company.com&#10;jane@company.com"
                  className={inputClass + ' resize-none'} />
                <p className="text-xs text-gray-600 mt-1">Enter multiple emails separated by commas, semicolons, or new lines</p>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={inputClass + ' cursor-pointer'}>
                  {roles.filter(r => r.name !== 'owner').map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">What happens when you invite?</h3>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>📧 They receive an email with a signup link</li>
                  <li>👥 They join your organization automatically</li>
                  <li>🔑 They get the role you assign</li>
                  <li>💬 They can access all public channels</li>
                </ul>
              </div>
              <button onClick={sendInvites} disabled={saving || !inviteEmails.trim()} className={btnClass}>
                {saving ? 'Sending...' : '✉️ Send invites'}
              </button>
            </div>
          )}

          {/* Workspace tab */}
          {tab === 'workspace' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
                <h2 className="text-lg font-semibold text-white">Workspace settings</h2>
                <div>
                  <label className={labelClass}>Organization name</label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} className={inputClass} placeholder="Your organization name" />
                </div>
                <div>
                  <label className={labelClass}>Workspace URL <span className="text-gray-600">(read-only)</span></label>
                  <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <span className="text-gray-500 text-xs px-3 py-2.5 border-r border-gray-700 bg-gray-850 shrink-0">sahyog.in/</span>
                    <span className="text-gray-400 text-sm px-3 py-2.5">{orgSlug}</span>
                  </div>
                </div>
                <button onClick={saveWorkspace} disabled={saving} className={btnClass}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>

              {/* Danger zone */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 space-y-4">
                <h3 className="text-sm font-semibold text-red-400">Danger zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">Export all data</div>
                    <div className="text-xs text-gray-500">Download all messages, files, and settings</div>
                  </div>
                  <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">Export</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
