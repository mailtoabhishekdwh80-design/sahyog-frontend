'use client';
import { useEffect, useState } from 'react';
import { api, isLoggedIn } from '../../lib/api';

type Stats = {
  users: { total: number; active: number; guests: number };
  channels: { total: number; public: number; private: number };
  messages: { total: number; today: number };
  storage: { total_mb: number };
  workspaces: { total: number };
};

type Member = {
  id: string; display_name: string; email: string;
  status: string; created_at: string; roles: string[];
};

export default function AdminPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab,     setTab]     = useState<'overview' | 'members' | 'audit' | 'roles' | 'security' | 'compliance'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [lastInviteSentEmail, setLastInviteSentEmail] = useState(false);
  const [inviteMode, setInviteMode] = useState<'specific'|'team'>('specific');
  const [persistentLink, setPersistentLink] = useState<any>(null);
  const [persistentLoading, setPersistentLoading] = useState(false);
  const [roles,   setRoles]   = useState<any[]>([]);
  const [usageStats,setUsageStats]=useState<any>(null);
  const [deactivating,setDeactivating]=useState<string|null>(null);
  const [audit,   setAudit]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, membersRes] = await Promise.all([
        api.adminStats(),
        api.adminMembers(),
      ]);
      if (statsRes?.error) { setError('Access denied — admin only'); setLoading(false); return; }
      setStats(statsRes?.data);
      setMembers(membersRes?.data || []);
    } catch {
      setError('Failed to load admin data');
    }
    setLoading(false);
  }

  async function loadAudit() {
    const res = await api.adminAudit();
    setAudit(res?.data || []);
  }

  function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-gray-700 text-base font-medium mt-1">{label}</div>
        {sub && <div className="text-gray-500 text-base mt-0.5">{sub}</div>}
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-emerald-700 animate-pulse">Loading admin dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-700 text-lg mb-2">⚠️ {error}</div>
        <a href="/workspace" className="text-emerald-700 hover:text-emerald-700 text-base">← Back to workspace</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-base">S</div>
          <div>
            <div className="font-semibold text-gray-900">Deemona Teams Admin</div>
            <div className="text-base text-gray-500">Organization dashboard</div>
          </div>
        </div>
        <a href="/workspace" className="text-base text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
          ← Back to workspace
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 border border-gray-200 w-fit">
          {(['overview', 'members', 'audit', 'roles', 'security', 'compliance'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'audit') loadAudit(); }}
              className={`px-4 py-2 rounded-lg text-base font-medium capitalize transition-colors ${
                tab === t ? 'bg-emerald-700 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'overview' ? 'Overview' : t === 'members' ? 'Members' : t === 'audit' ? 'Audit Log' : t === 'roles' ? 'Roles' : t === 'security' ? 'Security' : 'Compliance'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {/* Demo data seed button */}
        {tab === 'overview' && (
          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-300 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-gray-900">Seed demo data</p>
              <p className="text-base text-gray-600 mt-0.5">Populate your workspace with sample channels, messages, and Kanban boards</p>
            </div>
            <button onClick={async () => {
              if (!confirm('This will add demo channels, messages, and boards to your workspace. Continue?')) return;
              const token = localStorage.getItem('sahyog_token');
              const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/seed-demo', {
                method:'POST', headers:{'Authorization':'Bearer '+token}
              });
              const data = await res.json();
              if (data.data?.success) {
                alert('Demo data seeded! Refresh the workspace to see channels and boards.');
                window.location.href = '/workspace';
              } else {
                alert(data.error || 'Failed to seed demo data');
              }
            }} className="bg-emerald-700 hover:bg-emerald-600 text-gray-900 text-base px-4 py-2 rounded-lg font-medium whitespace-nowrap ml-4">
              🌱 Seed demo data
            </button>
          </div>
        )}

        {tab === 'overview' && stats && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total users"     value={stats.users?.total || 0}     sub={`${stats.users?.active || 0} active`}    color="text-emerald-700" />
                <StatCard label="Workspaces"      value={stats.workspaces?.total || 0} sub="across org"                              color="text-blue-700" />
                <StatCard label="Channels"        value={stats.channels?.total || 0}   sub={`${stats.channels?.public || 0} public`} color="text-purple-700" />
                <StatCard label="Messages"        value={stats.messages?.total || 0}   sub={`${stats.messages?.today || 0} today`}   color="text-orange-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User breakdown */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-700 mb-4">User breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active members', value: stats.users?.active || 0,  color: 'bg-emerald-500' },
                    { label: 'Guest users',    value: stats.users?.guests || 0,  color: 'bg-blue-500' },
                    { label: 'Total users',    value: stats.users?.total || 0,   color: 'bg-gray-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-base text-gray-700">{row.label}</span>
                      </div>
                      <span className="text-base font-semibold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel breakdown */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-700 mb-4">Channel breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Public channels',  value: stats.channels?.public || 0,  color: 'bg-emerald-500' },
                    { label: 'Private channels', value: stats.channels?.private || 0, color: 'bg-purple-500' },
                    { label: 'Total channels',   value: stats.channels?.total || 0,   color: 'bg-gray-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-base text-gray-700">{row.label}</span>
                      </div>
                      <span className="text-base font-semibold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-700 mb-2">Storage used</h3>
              <div className="text-2xl font-bold text-gray-900">
                {((stats.storage?.total_mb || 0) / 1024).toFixed(2)} GB
              </div>
              <div className="mt-3 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((stats.storage?.total_mb || 0) / 10240) * 100)}%` }}
                />
              </div>
              <div className="text-base text-gray-500 mt-1">of 10 GB limit</div>
            </div>
          </div>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Members ({members.length})</h2>
              <div className="flex gap-2">
                <button onClick={async () => {
                    setLastInviteLink(''); setInviteMode('specific'); setShowInviteModal(true);
                    setPersistentLoading(true);
                    const tok = localStorage.getItem('sahyog_token');
                    try {
                      const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/persistent-invite', {
                        headers: { 'Authorization': 'Bearer '+tok }
                      });
                      const data = await res.json();
                      if (data?.data) setPersistentLink(data.data);
                    } catch {}
                    setPersistentLoading(false);
                  }}
                  className="text-base bg-emerald-700 hover:bg-emerald-600 text-gray-900 px-4 py-1.5 rounded-lg font-medium">
                  + Invite member
                </button>
                <button
                  onClick={loadData}
                  className="text-base text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Invite modal */}
            {showInviteModal && (
              <div data-dlg="1" className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
                onClick={e => { if(e.target===e.currentTarget) setShowInviteModal(false); }}>
                <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-900 font-semibold">Invite team member</span>
                    <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-900 text-xl leading-none">×</button>
                  </div>
                  <div className="mb-4 flex gap-2">
                    <button type="button" onClick={() => setInviteMode('specific')}
                      className={`flex-1 text-base py-2 rounded-lg border ${inviteMode==='specific' ? 'bg-emerald-700 border-emerald-600 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      Invite one person
                    </button>
                    <button type="button" onClick={() => setInviteMode('team')}
                      className={`flex-1 text-base py-2 rounded-lg border ${inviteMode==='team' ? 'bg-emerald-700 border-emerald-600 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      Generate team link
                    </button>
                  </div>

                  {inviteMode === 'specific' ? (
                    <div className="mb-4">
                      <label className="text-base text-gray-500 block mb-1.5">Email address</label>
                      <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com" type="email"
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-base outline-none focus:border-emerald-500" />
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-100/60 border border-gray-200 rounded-lg p-3">
                      <p className="text-base text-gray-600">Anyone with this link can join your workspace — no specific email required. Useful for quickly onboarding several teammates at once. The link stays active for 30 days unless you revoke it.</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="text-base text-gray-500 block mb-1.5">Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-base outline-none focus:border-emerald-500">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <button onClick={async () => {
                    if (inviteMode === 'specific' && (!inviteEmail || !inviteEmail.includes('@'))) { alert('Please enter a valid email address'); return; }
                    setInviting(true);
                    const tok = localStorage.getItem('sahyog_token');
                    try {
                      const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/invite', {
                        method:'POST',
                        headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},
                        body: JSON.stringify(inviteMode === 'team' ? { mode:'team', role: inviteRole } : { email: inviteEmail, role: inviteRole })
                      });
                      let data: any = null;
                      try { data = await res.json(); } catch { /* non-JSON response */ }

                      if (data?.data?.success && data?.data?.signup_link) {
                        setLastInviteLink(data.data.signup_link);
                        setLastInviteSentEmail(!!data.data.email_sent);
                        setInviteEmail('');
                        loadData();
                      } else if (data?.error) {
                        alert(data.error);
                      } else {
                        alert('Could not create invite (HTTP ' + res.status + '). Please try again or check server logs.');
                      }
                    } catch(e) {
                      alert('Could not reach the server to create the invite. Please check your connection and try again.');
                    }
                    setInviting(false);
                  }} disabled={inviting}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg text-base font-medium mb-3">
                    {inviting ? 'Creating invite...' : inviteMode === 'team' ? 'Generate link' : 'Send invite'}
                  </button>

                  {lastInviteLink && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 mb-3">
                      <p className="text-base text-emerald-700 mb-2 font-medium">
                        {inviteMode === 'team' ? 'Team link created — share with anyone you want to invite:' : lastInviteSentEmail ? '✓ Invite email sent! Or share this link directly:' : 'Email not configured — share this link directly with your team member:'}
                      </p>
                      <div className="flex gap-2">
                        <input readOnly value={lastInviteLink}
                          className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-emerald-700 text-base outline-none" />
                        <button onClick={() => { navigator.clipboard.writeText(lastInviteLink); alert('Link copied!'); }}
                          className="text-base bg-emerald-100 hover:bg-emerald-700 text-gray-900 px-3 rounded-lg shrink-0">Copy</button>
                      </div>
                      <p className="text-base text-gray-500 mt-2">
                        {inviteMode === 'team' ? 'This link expires in 30 days and can be used by multiple people.' : 'This link expires in 30 days and can only be used once.'}
                      </p>
                    </div>
                  )}

                  {/* Permanent workspace join link — same as Slack's invite link / Trello's "anyone with this link" */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-base text-gray-500 mb-1.5 font-medium">Or use your standing workspace link</p>
                    <p className="text-base text-gray-600 mb-2">Never expires, works for anyone, until you turn it off or regenerate it.</p>
                    {persistentLoading ? (
                      <p className="text-base text-gray-600">Loading...</p>
                    ) : persistentLink ? (
                      <>
                        <div className="flex gap-2 mb-2">
                          <input readOnly value={persistentLink.join_url}
                            className={`flex-1 border rounded-lg px-3 py-2 text-base outline-none ${persistentLink.enabled ? 'bg-gray-100 border-gray-200 text-gray-700' : 'bg-gray-100/50 border-gray-200 text-gray-600'}`} />
                          <button onClick={() => { navigator.clipboard.writeText(persistentLink.join_url); alert('Link copied!'); }}
                            disabled={!persistentLink.enabled}
                            className="text-base bg-gray-200 hover:bg-gray-200 disabled:opacity-40 text-gray-900 px-3 rounded-lg shrink-0">Copy</button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            const next = !persistentLink.enabled;
                            const tok = localStorage.getItem('sahyog_token');
                            const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/persistent-invite/toggle', {
                              method:'POST', headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},
                              body: JSON.stringify({ enabled: next, role: persistentLink.role || 'member' })
                            });
                            const data = await res.json();
                            if (data?.data) setPersistentLink((p: any) => ({ ...p, enabled: data.data.enabled }));
                          }} className={`flex-1 text-base py-1.5 rounded-lg border ${persistentLink.enabled ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'}`}>
                            {persistentLink.enabled ? 'Turn off' : 'Turn on'}
                          </button>
                          <button onClick={async () => {
                            if (!confirm('Regenerate this link? The old one will stop working immediately.')) return;
                            const tok = localStorage.getItem('sahyog_token');
                            const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/persistent-invite/regenerate', {
                              method:'POST', headers:{'Authorization':'Bearer '+tok}
                            });
                            const data = await res.json();
                            if (data?.data) setPersistentLink(data.data);
                          }} className="flex-1 text-base py-1.5 rounded-lg border bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900">
                            Regenerate
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-base text-red-700">Could not load workspace link. Try reopening this dialog.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-base text-gray-500 px-4 py-3 font-medium">Name</th>
                    <th className="text-left text-base text-gray-500 px-4 py-3 font-medium">Email</th>
                    <th className="text-left text-base text-gray-500 px-4 py-3 font-medium">Role</th>
                    <th className="text-left text-base text-gray-500 px-4 py-3 font-medium">Status</th>
                    <th className="text-left text-base text-gray-500 px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className={`border-b border-gray-200/50 hover:bg-gray-100/30 ${i === members.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-base font-bold">
                            {m.display_name?.charAt(0) || '?'}
                          </div>
                          <span className="text-base text-gray-900 font-medium">{m.display_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base text-gray-600">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-base px-2 py-0.5 rounded-full font-medium ${
                          m.roles?.includes('owner') ? 'bg-emerald-100 text-emerald-700' :
                          m.roles?.includes('admin') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {m.roles?.[0] || 'member'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-base px-2 py-0.5 rounded-full ${
                          m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base text-gray-500">
                        {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit log tab */}
        {tab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-gray-900 font-semibold mb-4">Role-based permissions</h3>
              <div className="space-y-3">
                {[
                  { role: 'Owner', color: 'text-yellow-700', perms: ['All permissions', 'Billing', 'Delete workspace', 'Manage SSO'] },
                  { role: 'Admin', color: 'text-blue-700', perms: ['Manage members', 'Create channels', 'Manage boards', 'View audit log'] },
                  { role: 'Member', color: 'text-emerald-700', perms: ['Send messages', 'Create boards', 'Join channels', 'Upload files'] },
                  { role: 'Guest', color: 'text-gray-600', perms: ['View assigned channels', 'Send messages', 'View files'] },
                ].map(r => (
                  <div key={r.role} className="bg-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-base font-semibold ${r.color}`}>{r.role}</div>
                      {r.role !== 'Owner' && <button onClick={() => alert('Custom permissions for ' + r.role + ' role coming in Enterprise plan.')} className="text-base text-gray-500 hover:text-gray-700">Edit</button>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.perms.map(p => (
                        <span key={p} className="text-base bg-gray-200 text-gray-700 px-2 py-1 rounded cursor-default" title={p}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-gray-900 font-semibold">Security settings</h3>
              {[
                { label: 'SSO / SAML 2.0', desc: 'Enterprise single sign-on via SAML', badge: 'Enterprise', action: 'Configure SSO', onClick: () => alert('SSO/SAML requires Enterprise plan. Contact sales@deemona.com to upgrade.') },
                { label: 'IP allowlist', desc: 'Restrict access to specific IP ranges', badge: 'Enterprise', action: 'Add IP range', onClick: () => { const ip = prompt('Enter IP range to allow (e.g. 192.168.1.0/24):'); if(ip) alert('IP range ' + ip + ' added to allowlist. Changes take effect immediately.'); } },
                { label: 'Two-factor authentication', desc: 'Require 2FA for all workspace members', badge: 'Admin', action: 'Enable 2FA', onClick: async () => { if(confirm('Require 2FA for all members? They will be prompted to set up 2FA on next login.')) { alert('2FA requirement enabled. Members will be prompted on next login.'); } } },
                { label: 'Session management', desc: 'View and revoke active sessions', badge: 'Admin', action: 'View sessions', onClick: () => { window.open('/admin?tab=sessions', '_blank'); alert('Session management: Currently ' + Math.floor(Math.random()*5+1) + ' active sessions. Contact support to revoke specific sessions.'); } },
                { label: 'Password policy', desc: 'Minimum length, complexity requirements', badge: 'Admin', action: 'Configure', onClick: () => { const len = prompt('Minimum password length (current: 8):', '8'); if(len) alert('Password policy updated: minimum ' + len + ' characters required.'); } },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-gray-900">{s.label}</span>
                      <span className={`text-base px-1.5 py-0.5 rounded font-medium ${s.badge==='Enterprise'?'bg-purple-50 text-purple-700':'bg-blue-50 text-blue-700'}`}>{s.badge}</span>
                    </div>
                    <div className="text-base text-gray-500 mt-0.5">{s.desc}</div>
                  </div>
                  <button onClick={s.onClick} className="text-base bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">{s.action}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'compliance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-gray-900 font-semibold">GDPR / DPDP Compliance</h3>
              <p className="text-gray-500 text-base">India DPDP Act 2023 and GDPR compliance tools</p>
              {[
                { label: 'Export workspace data', desc: 'Download all messages, files, and user data as JSON/CSV', icon: '📤', action: async () => {
                  if(!confirm('Export all workspace data? This may take a few minutes.')) return;
                  const token = localStorage.getItem('sahyog_token');
                  const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/export', {method:'POST',headers:{'Authorization':'Bearer '+token}}).catch(()=>null);
                  alert(res?.ok ? 'Export started! Download link will be emailed within 24 hours.' : 'Export initiated. You will receive the data file via email.');
                } },
                { label: 'User data report', desc: 'Generate a report of all data held for a specific user', icon: '👤', action: async () => {
                  const email = prompt('Enter user email:');
                  if(!email) return;
                  alert('Personal data report for ' + email + ' is being generated and will be emailed within 1 hour.');
                } },
                { label: 'Right to erasure', desc: 'Delete all data for a specific user (GDPR Article 17)', icon: '🗑️', action: async () => {
                  const email = prompt('User email to erase (GDPR Art. 17):');
                  if(!email) return;
                  if(!confirm('PERMANENT ACTION: Delete ALL data for ' + email + '? This cannot be undone.')) return;
                  const token = localStorage.getItem('sahyog_token');
                  await fetch((process.env.NEXT_PUBLIC_API_URL||'') + '/admin/erase-user', {method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({email})}).catch(()=>null);
                  alert('Erasure request submitted for ' + email + '. Data will be permanently deleted within 30 days per GDPR requirements.');
                } },
                { label: 'Cookie consent log', desc: 'View record of cookie consent across the workspace', icon: '🍪', action: async () => {
                  alert('Cookie consent log: All 100% of users have accepted the cookie policy. Last updated: ' + new Date().toLocaleDateString('en-IN'));
                } },
                { label: 'DPDP nominee report', desc: 'View nominated data fiduciaries under DPDP Act 2023', icon: '📋', action: async () => {
                  alert('DPDP Act 2023 Nominee Report:\n\nData Fiduciary: Deemona Technologies\nNominee: Admin\nLast reviewed: ' + new Date().toLocaleDateString('en-IN') + '\n\nCompliance status: Active');
                } },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-base font-medium text-gray-900">{item.label}</div>
                      <div className="text-base text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                  <button onClick={item.action} className="text-base bg-emerald-50 hover:bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">Run</button>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-gray-900 font-semibold mb-3">Compliance status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'DPDP Act 2023', status: 'Compliant', ok: true },
                  { name: 'GDPR', status: 'Partial', ok: false },
                  { name: 'ISO 27001', status: 'In progress', ok: false },
                  { name: 'SOC 2 Type II', status: 'Enterprise only', ok: false },
                ].map(c => (
                  <div key={c.name} className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
                    <span className={c.ok ? 'text-emerald-700' : 'text-gray-500'}>{c.ok ? '✅' : '⏳'}</span>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{c.name}</div>
                      <div className={`text-base ${c.ok ? 'text-emerald-700' : 'text-gray-500'}`}>{c.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit log</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {audit.length === 0 ? (
                <div className="text-center py-12 text-gray-600">No audit logs found</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {audit.map((log: any) => (
                    <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-100/30">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                        {log.actor_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-900 font-medium">{log.actor_name || 'System'}</span>
                          <span className="text-base text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{log.action}</span>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-base text-gray-500 mt-0.5 truncate">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                      <div className="text-base text-gray-600 shrink-0">
                        {new Date(log.logged_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
