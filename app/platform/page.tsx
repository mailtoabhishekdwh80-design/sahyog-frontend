'use client';
import { useEffect, useState } from 'react';
import { isLoggedIn } from '../../lib/api';

type OrgRow = {
  id: string; name: string; slug: string; plan: string; data_region: string;
  is_active: boolean; created_at: string;
  member_count: number; active_member_count: number;
  owner_email: string | null;
  channel_count: number; board_count: number;
};

type MemberRow = {
  id: string; email: string; display_name: string; designation: string | null;
  status: string; last_seen_at: string | null; created_at: string; roles: string[] | null;
};

export default function PlatformAdminPage() {
  const [overview, setOverview] = useState<any>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<Record<string, MemberRow[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    loadAll();
  }, []);

  function token() { return localStorage.getItem('sahyog_token') || ''; }
  function apiUrl(path: string) { return (process.env.NEXT_PUBLIC_API_URL || '') + path; }

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': 'Bearer ' + token() };
      const [ovRes, orgRes] = await Promise.all([
        fetch(apiUrl('/platform/overview'), { headers }),
        fetch(apiUrl('/platform/organizations'), { headers }),
      ]);

      if (ovRes.status === 403 || orgRes.status === 403) {
        setError('This account does not have platform admin access. This view is restricted to the platform operator only.');
        setLoading(false);
        return;
      }

      const ovData = await ovRes.json();
      const orgData = await orgRes.json();
      setOverview(ovData?.data || null);
      setOrgs(orgData?.data?.organizations || []);
    } catch {
      setError('Could not reach the server. Please try again.');
    }
    setLoading(false);
  }

  async function toggleOrgMembers(orgId: string) {
    if (expandedOrgId === orgId) { setExpandedOrgId(null); return; }
    setExpandedOrgId(orgId);
    if (orgMembers[orgId]) return; // already loaded

    setLoadingMembers(orgId);
    try {
      const res = await fetch(apiUrl('/platform/organizations/' + orgId + '/members'), {
        headers: { 'Authorization': 'Bearer ' + token() }
      });
      const data = await res.json();
      setOrgMembers(prev => ({ ...prev, [orgId]: data?.data?.members || [] }));
    } catch {}
    setLoadingMembers(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 text-sm">
        Loading platform overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-6 max-w-md text-center">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-red-300 text-sm">{error}</p>
          <a href="/workspace" className="inline-block mt-4 text-emerald-400 text-sm hover:underline">← Back to your workspace</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">All organisations on this deployment — visible only to the platform operator</p>
        </div>
        <a href="/admin" className="text-xs text-gray-400 hover:text-white">← Back to my workspace admin</a>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top-level stats */}
        {overview && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Organisations', value: overview.total_organizations },
              { label: 'Total users',   value: overview.total_users },
              { label: 'Messages sent', value: overview.total_messages },
              { label: 'Meetings held', value: overview.total_meetings },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="text-2xl font-bold text-white">{s.value?.toLocaleString?.() ?? s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Organisations table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Organisations ({orgs.length})</h2>
          <button onClick={loadAll} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800">↻ Refresh</button>
        </div>

        <div className="space-y-3">
          {orgs.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-8">No organisations found yet.</p>
          )}
          {orgs.map(org => (
            <div key={org.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button onClick={() => toggleOrgMembers(org.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{org.name}</div>
                    <div className="text-xs text-gray-500">/{org.slug} · {org.plan} · {org.data_region}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                  <span>{org.member_count} member{org.member_count !== 1 ? 's' : ''}</span>
                  <span>{org.channel_count} channel{org.channel_count !== 1 ? 's' : ''}</span>
                  <span>{org.board_count} board{org.board_count !== 1 ? 's' : ''}</span>
                  <span className="text-gray-600">{new Date(org.created_at).toLocaleDateString()}</span>
                  <span className="text-gray-500">{expandedOrgId === org.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedOrgId === org.id && (
                <div className="border-t border-gray-800 px-4 py-3 bg-gray-950/50">
                  {org.owner_email && (
                    <p className="text-xs text-gray-500 mb-3">Owner: <span className="text-gray-300">{org.owner_email}</span></p>
                  )}
                  {loadingMembers === org.id ? (
                    <p className="text-xs text-gray-600">Loading members...</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(orgMembers[org.id] || []).map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-900 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {m.display_name?.charAt(0) || '?'}
                            </div>
                            <span className="text-gray-200 truncate">{m.display_name}</span>
                            <span className="text-gray-600 truncate">{m.email}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(m.roles || []).map(r => (
                              <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{r}</span>
                            ))}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(orgMembers[org.id] || []).length === 0 && (
                        <p className="text-xs text-gray-600">No members found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
