'use client';
import { useState, useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  priority?: string;
  status?: string;
  due_date?: string;
  created_at?: string;
  list_id?: string;
  assigned_to?: string;
  assignees?: { id: string; name: string }[];
  description?: string;
}

interface List { id: string; name: string; }

interface TableViewProps {
  tasks: Task[];
  lists: List[];
  onTaskClick: (task: Task) => void;
  orgMembers?: any[];
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)',  text: '#FCA5A5' },
  high:     { bg: 'rgba(249,115,22,0.15)', text: '#FDBA74' },
  medium:   { bg: 'rgba(59,130,246,0.15)', text: '#93C5FD' },
  low:      { bg: 'rgba(148,163,184,0.1)', text: '#E2E8F0' },
};

export default function TableView({ tasks, lists, onTaskClick, orgMembers = [] }: TableViewProps) {
  const [sortBy, setSortBy] = useState<'title'|'priority'|'due_date'|'list'|'created_at'>('list');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [search, setSearch] = useState('');

  const listMap: Record<string, string> = {};
  lists.forEach(l => { listMap[l.id] = l.name; });

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = useMemo(() => {
    let t = [...tasks];
    if (filterPriority !== 'all') t = t.filter(x => x.priority === filterPriority);
    if (filterList !== 'all') t = t.filter(x => x.list_id === filterList);
    if (search.trim()) t = t.filter(x => x.title.toLowerCase().includes(search.toLowerCase()));
    t.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortBy === 'priority') cmp = (priorityOrder[a.priority||'low']||3) - (priorityOrder[b.priority||'low']||3);
      else if (sortBy === 'due_date') cmp = (a.due_date||'').localeCompare(b.due_date||'');
      else if (sortBy === 'list') cmp = (listMap[a.list_id||'']||'').localeCompare(listMap[b.list_id||'']||'');
      else if (sortBy === 'created_at') cmp = (a.created_at||'').localeCompare(b.created_at||'');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return t;
  }, [tasks, sortBy, sortDir, filterPriority, filterList, search]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span style={{ color: '#64748B', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: '#60A5FA', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const today = new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      {/* Filters toolbar */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
          style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', color: '#F1F5F9', fontSize: 12, outline: 'none', width: 180 }} />
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', color: '#E2E8F0', fontSize: 12, outline: 'none' }}>
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterList} onChange={e => setFilterList(e.target.value)}
          style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', color: '#E2E8F0', fontSize: 12, outline: 'none' }}>
          <option value="all">All lists</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#E2E8F0' }}>{filtered.length} tasks</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0A0F1E', borderBottom: '1px solid #1E3A5F', position: 'sticky', top: 0, zIndex: 10 }}>
              {[
                { label: 'Task', col: 'title' as const, width: '35%' },
                { label: 'List', col: 'list' as const, width: '15%' },
                { label: 'Priority', col: 'priority' as const, width: '10%' },
                { label: 'Assignee', col: null, width: '15%' },
                { label: 'Due Date', col: 'due_date' as const, width: '12%' },
                { label: 'Created', col: 'created_at' as const, width: '13%' },
              ].map(({ label, col, width }) => (
                <th key={label} onClick={() => col && toggleSort(col)}
                  style={{ padding: '10px 12px', textAlign: 'left', color: '#E2E8F0', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width, cursor: col ? 'pointer' : 'default', userSelect: 'none' }}>
                  {label}{col && <SortIcon col={col} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((task, i) => {
              const pStyle = PRIORITY_COLORS[task.priority || 'low'] || PRIORITY_COLORS.low;
              const due = task.due_date ? new Date(task.due_date) : null;
              const isOverdue = due && due < today;
              const assigneeName = task.assignees?.[0]?.name || '';
              return (
                <tr key={task.id} onClick={() => onTaskClick(task)}
                  style={{ borderBottom: '1px solid #0F1E35', cursor: 'pointer', background: i % 2 === 0 ? '#000' : '#050810' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0F172A'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#000' : '#050810'}>
                  <td style={{ padding: '10px 12px', color: '#F1F5F9', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: pStyle.text, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#E2E8F0', fontSize: 12 }}>
                    {listMap[task.list_id || ''] || '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: pStyle.bg, color: pStyle.text, fontWeight: 600, textTransform: 'capitalize' }}>
                      {task.priority || 'low'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#E2E8F0', fontSize: 12 }}>
                    {assigneeName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          {assigneeName.charAt(0)}
                        </div>
                        <span style={{ fontSize: 12, color: '#E2E8F0' }}>{assigneeName.split(' ')[0]}</span>
                      </div>
                    ) : <span style={{ color: '#64748B' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: isOverdue ? '#FCA5A5' : '#E2E8F0', fontWeight: isOverdue ? 600 : 400 }}>
                    {due ? due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    {isOverdue && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠️</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#E2E8F0' }}>
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#E2E8F0', fontSize: 14 }}>
                  No tasks match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
