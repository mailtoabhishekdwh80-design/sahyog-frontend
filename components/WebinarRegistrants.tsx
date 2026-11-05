'use client';
import { useEffect, useState } from 'react';

type Props = { onClose: () => void; apiFetch: (path: string, opts?: any) => Promise<any> };

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize:13, color: '#475569', borderBottom: '1px solid #CBD5E1' };
const td: React.CSSProperties = { padding: '8px 10px', fontSize:14, color: '#0F172A', borderBottom: '1px solid #E2E8F0', verticalAlign: 'top' };
const btn: React.CSSProperties = { background: '#F1F5F9', border: '1px solid #475569', color: '#0F172A', borderRadius: 8, padding: '5px 12px', fontSize:13, cursor: 'pointer' };

export default function WebinarRegistrants({ onClose, apiFetch }: Props) {
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<any>(null);
  const [regs, setRegs] = useState<any[] | null>(null);

  useEffect(() => {
    apiFetch('/webinars').then((r: any) => setList(r?.data || [])).catch(() => setErr('Could not load webinars.'));
  }, []);

  async function show(w: any) {
    setOpen(w); setRegs(null); setErr('');
    try { const r = await apiFetch(`/webinars/${w.id}/registrations`); setRegs(r?.data || []); }
    catch { setErr('Could not load registrants (host or admin only).'); setRegs([]); }
  }
  function csv() {
    if (!regs || !open) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Name', 'Email', 'Company', 'Role', 'Question', 'Status', 'Registered at'],
      ...regs.map(x => [x.name, x.email, x.company, x.role, x.question, x.status, x.created_at])];
    const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `registrants-${open.id.slice(0, 8)}.csv`; a.click();
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #93C5FD', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <b style={{ color: '#0F172A', fontSize: 16 }}>{open ? open.title : 'Webinar registrants'}</b>
        <div style={{ display: 'flex', gap: 8 }}>
          {open && <button style={btn} onClick={() => { setOpen(null); setRegs(null); }}>Back</button>}
          <button style={btn} onClick={onClose}>Close</button>
        </div>
      </div>
      {err && <p style={{ color: '#DC2626', fontSize:14 }}>{err}</p>}
      {!open && list === null && !err && <p style={{ color: '#0F172A' }}>Loading…</p>}
      {!open && list && list.length === 0 && <p style={{ color: '#0F172A' }}>No webinars yet.</p>}
      {!open && list && list.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Title</th><th style={th}>When</th><th style={th}>Registered</th><th style={th}></th></tr></thead>
            <tbody>
              {list.map(w => (
                <tr key={w.id}>
                  <td style={td}>{w.title}</td>
                  <td style={td}>{new Date(w.starts_at).toLocaleString()}</td>
                  <td style={td}>{w.registered} / {w.capacity}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button style={btn} onClick={() => show(w)}>Registrants</button>{' '}
                    <button style={btn} onClick={() => { try { navigator.clipboard.writeText(w.registration_url); } catch {} }}>Copy link</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && regs === null && !err && <p style={{ color: '#0F172A' }}>Loading…</p>}
      {open && regs && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ marginBottom: 8 }}><button style={btn} onClick={csv} disabled={regs.length === 0}>Download CSV</button></div>
          {regs.length === 0 ? <p style={{ color: '#0F172A' }}>No registrations yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Company</th><th style={th}>Question</th><th style={th}>Status</th></tr></thead>
              <tbody>
                {regs.map(x => (
                  <tr key={x.id}><td style={td}>{x.name}</td><td style={td}>{x.email}</td><td style={td}>{x.company || '-'}</td><td style={td}>{x.question || '-'}</td><td style={td}>{x.status}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
