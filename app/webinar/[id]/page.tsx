'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = 'https://sahyog-api-ajbr.onrender.com/api/v1';

type Info = {
  id: string; title: string; description?: string; starts_at: string; duration_mins: number;
  host_name?: string; capacity: number; registered: number; spots_left: number; registration_open: boolean;
};

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 10, border: '1px solid #475569',
  background: '#FFFFFF', color: '#0F172A', outline: 'none', boxSizing: 'border-box'};
const label: React.CSSProperties = { display: 'block', fontSize:14, fontWeight: 600, color: '#0F172A', margin: '14px 0 6px' };

export default function WebinarPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [info, setInfo] = useState<Info | null>(null);
  const [state, setState] = useState<'loading' | 'notfound' | 'ready' | 'done'>('loading');
  const [slow, setSlow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [already, setAlready] = useState(false);
  const [pending, setPending] = useState(false);
  const [f, setF] = useState({ name: '', email: '', company: '', role: '', question: '' });

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => setSlow(true), 6000);
    fetch(`${API}/webinars/${id}`)
      .then(async r => {
        if (!r.ok) { setState('notfound'); return; }
        const j = await r.json();
        setInfo(j.data); setState('ready');
      })
      .catch(() => setState('notfound'))
      .finally(() => clearTimeout(t));
    return () => clearTimeout(t);
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await fetch(`${API}/webinars/${id}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setAlready(!!j.data?.already); setPending(j.data?.status === 'pending'); setState('done');
      } else setErr(j.error || 'Something went wrong. Please try again.');
    } catch { setErr('Could not reach the server. Please try again.'); }
    setBusy(false);
  }

  const when = info ? new Date(info.starts_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : '';
  const full = info && info.spots_left <= 0;

  return (
    <main style={{ minHeight: '100vh', background: '#0B1220', color: '#0F172A', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {state === 'loading' && (
          <p style={{ color: '#0F172A', textAlign: 'center', marginTop: 80 }}>
            Loading webinar…{slow && <><br /><small style={{ color: '#475569' }}>The server is waking up, this can take up to a minute.</small></>}
          </p>
        )}
        {state === 'notfound' && <p style={{ textAlign: 'center', marginTop: 80, color: '#0F172A' }}>This webinar was not found.</p>}
        {info && state !== 'loading' && state !== 'notfound' && (
          <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 16, padding: 24 }}>
            <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>{info.title}</h1>
            <p style={{ color: '#0F172A', margin: '0 0 4px' }}>{when} · {info.duration_mins} min</p>
            {info.host_name && <p style={{ color: '#475569', margin: '0 0 12px' }}>Hosted by {info.host_name}</p>}
            {info.description && <p style={{ color: '#0F172A', lineHeight: 1.5 }}>{info.description}</p>}
            {state === 'done' ? (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#052E1B', border: '1px solid #16A34A' }}>
                <b>{already ? 'You are already registered.' : pending ? 'Request received — the host will approve it.' : 'You are registered!'}</b>
                <p style={{ margin: '8px 0 0', color: '#0F172A' }}>Save this page link and come back at the start time. We have not sent a confirmation email.</p>
              </div>
            ) : !info.registration_open ? (
              <p style={{ marginTop: 20, color: '#DC2626' }}>Registration is closed for this webinar.</p>
            ) : full ? (
              <p style={{ marginTop: 20, color: '#DC2626' }}>This webinar is full.</p>
            ) : (
              <form onSubmit={submit}>
                <p style={{ color: '#475569', fontSize:14, margin: '16px 0 0' }}>{info.spots_left} spots left</p>
                <label style={label}>Full name *</label>
                <input style={input} required maxLength={120} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
                <label style={label}>Email *</label>
                <input style={input} type="email" required maxLength={200} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
                <label style={label}>Company</label>
                <input style={input} maxLength={200} value={f.company} onChange={e => setF({ ...f, company: e.target.value })} />
                <label style={label}>Role</label>
                <input style={input} maxLength={100} value={f.role} onChange={e => setF({ ...f, role: e.target.value })} />
                <label style={label}>Question for the host</label>
                <textarea style={{ ...input, minHeight: 80 }} maxLength={2000} value={f.question} onChange={e => setF({ ...f, question: e.target.value })} />
                {err && <p style={{ color: '#DC2626', marginTop: 12 }}>{err}</p>}
                <button disabled={busy} type="submit" style={{ marginTop: 18, width: '100%', padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Registering…' : 'Register'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
