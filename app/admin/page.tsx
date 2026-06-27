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
  const [tab,     setTab]     = useState<'overview' | 'members' | 'audit'>('overview');
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
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-gray-300 text-sm font-medium mt-1">{label}</div>
        {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-emerald-400 animate-pulse">Loading admin dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-lg mb-2">⚠️ {error}</div>
        <a href="/" className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to workspace</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">S</div>
          <div>
            <div className="font-semibold text-white">Deemona Teams Admin</div>
            <div className="text-xs text-gray-500">Organization dashboard</div>
          </div>
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          ← Back to workspace
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {(['overview', 'members', 'audit'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'audit') loadAudit(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'overview' ? '📊 Overview' : t === 'members' ? '👥 Members' : '📋 Audit Log'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && stats && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Organization stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total users"     value={stats.users?.total || 0}     sub={`${stats.users?.active || 0} active`}    color="text-emerald-400" />
                <StatCard label="Workspaces"      value={stats.workspaces?.total || 0} sub="across org"                              color="text-blue-400" />
                <StatCard label="Channels"        value={stats.channels?.total || 0}   sub={`${stats.channels?.public || 0} public`} color="text-purple-400" />
                <StatCard label="Messages"        value={stats.messages?.total || 0}   sub={`${stats.messages?.today || 0} today`}   color="text-orange-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User breakdown */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">User breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active members', value: stats.users?.active || 0,  color: 'bg-emerald-500' },
                    { label: 'Guest users',    value: stats.users?.guests || 0,  color: 'bg-blue-500' },
                    { label: 'Total users',    value: stats.users?.total || 0,   color: 'bg-gray-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-sm text-gray-300">{row.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel breakdown */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Channel breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Public channels',  value: stats.channels?.public || 0,  color: 'bg-emerald-500' },
                    { label: 'Private channels', value: stats.channels?.private || 0, color: 'bg-purple-500' },
                    { label: 'Total channels',   value: stats.channels?.total || 0,   color: 'bg-gray-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-sm text-gray-300">{row.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Storage used</h3>
              <div className="text-2xl font-bold text-white">
                {((stats.storage?.total_mb || 0) / 1024).toFixed(2)} GB
              </div>
              <div className="mt-3 bg-gray-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((stats.storage?.total_mb || 0) / 10240) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">of 10 GB limit</div>
            </div>
          </div>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Members ({members.length})</h2>
              <button
                onClick={loadData}
                className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                ↻ Refresh
              </button>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs text-gray-500 px-4 py-3 font-medium">Name</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3 font-medium">Email</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3 font-medium">Role</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3 font-medium">Status</th>
                    <th className="text-left text-xs text-gray-500 px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${i === members.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                            {m.display_name?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-white font-medium">{m.display_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.roles?.includes('owner') ? 'bg-emerald-900 text-emerald-300' :
                          m.roles?.includes('admin') ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {m.roles?.[0] || 'member'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
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
        {tab === 'audit' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Audit log</h2>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {audit.length === 0 ? (
                <div className="text-center py-12 text-gray-600">No audit logs found</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {audit.map((log: any) => (
                    <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-800/30">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs shrink-0">
                        {log.actor_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{log.actor_name || 'System'}</span>
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{log.action}</span>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 shrink-0">
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
