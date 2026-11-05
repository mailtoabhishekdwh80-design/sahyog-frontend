'use client';
import { useState, useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  due_date?: string;
  created_at?: string;
  priority?: string;
  list_id?: string;
  assigned_to?: string;
  assignees?: { id: string; name: string; avatar?: string }[];
}

interface List {
  id: string;
  name: string;
}

interface GanttViewProps {
  tasks: Task[];
  lists: List[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#3B82F6',
  low:      '#E2E8F0',
};

const LIST_COLORS = ['#1D4ED8','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#DB2777','#65A30D'];

export default function GanttView({ tasks, lists }: GanttViewProps) {
  const [zoom, setZoom] = useState<'week'|'month'|'quarter'>('month');
  const [startOffset, setStartOffset] = useState(0);

  const today = new Date();

  // Calculate date range
  const dates = useMemo(() => {
    const days = zoom === 'week' ? 14 : zoom === 'month' ? 60 : 120;
    const start = new Date(today);
    start.setDate(start.getDate() - 7 + startOffset);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [zoom, startOffset]);

  const colWidth = zoom === 'week' ? 60 : zoom === 'month' ? 32 : 20;
  const totalWidth = dates.length * colWidth;

  function getTaskBar(task: Task) {
    if (!task.due_date) return null;
    const due = new Date(task.due_date);
    const created = task.created_at ? new Date(task.created_at) : new Date(today.getTime() - 7 * 86400000);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const taskStart = created < startDate ? startDate : created;
    const taskEnd = due > endDate ? endDate : due;

    if (taskStart > endDate || taskEnd < startDate) return null;

    const startDay = Math.floor((taskStart.getTime() - startDate.getTime()) / 86400000);
    const duration = Math.max(1, Math.floor((taskEnd.getTime() - taskStart.getTime()) / 86400000) + 1);
    const isOverdue = due < today;

    return { left: startDay * colWidth, width: duration * colWidth, isOverdue };
  }

  const listMap: Record<string, List> = {};
  lists.forEach((l, i) => { listMap[l.id] = { ...l }; });

  // Group tasks by list
  const tasksByList = lists.map(list => ({
    list,
    tasks: tasks.filter(t => t.list_id === list.id),
  }));

  const todayOffset = Math.floor((today.getTime() - dates[0].getTime()) / 86400000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F1F5F9', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <span style={{ fontSize:14, fontWeight: 700, color: '#0F172A' }}>Timeline</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button onClick={() => setStartOffset(o => o - (zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90))}
            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 10px', color: '#0F172A', fontSize:13, cursor: 'pointer' }}>
            ← Prev
          </button>
          <button onClick={() => setStartOffset(0)}
            style={{ background: '#1D4ED8', border: 'none', borderRadius: 6, padding: '3px 10px', color: '#fff', fontSize:13, cursor: 'pointer', fontWeight: 600 }}>
            Today
          </button>
          <button onClick={() => setStartOffset(o => o + (zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90))}
            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 10px', color: '#0F172A', fontSize:13, cursor: 'pointer' }}>
            Next →
          </button>
        </div>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 6, border: '1px solid #CBD5E1', overflow: 'hidden' }}>
          {(['week', 'month', 'quarter'] as const).map(z => (
            <button key={z} onClick={() => setZoom(z)}
              style={{ padding: '3px 10px', background: zoom === z ? '#1D4ED8' : 'none', border: 'none', color: zoom === z ? '#fff' : '#E2E8F0', fontSize:12, cursor: 'pointer', fontWeight: zoom === z ? 700 : 400, textTransform: 'capitalize' }}>
              {z}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: task labels */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid #E2E8F0', overflowY: 'auto' }}>
          {/* Header spacer */}
          <div style={{ height: 48, borderBottom: '1px solid #E2E8F0', background: '#F1F5F9' }} />
          {tasksByList.map(({ list, tasks: listTasks }, li) => (
            <div key={list.id}>
              <div style={{ padding: '6px 12px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LIST_COLORS[li % LIST_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize:12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{list.name}</span>
                <span style={{ fontSize:12, color: '#0F172A', marginLeft: 'auto' }}>{listTasks.length}</span>
              </div>
              {listTasks.map(task => (
                <div key={task.id} style={{ height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #0F1E35' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority || 'low'], flexShrink: 0 }} />
                  <span style={{ fontSize:13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: Gantt chart */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ width: Math.max(totalWidth, 100), minHeight: '100%', position: 'relative' }}>
            {/* Date header */}
            <div style={{ height: 48, display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9', position: 'sticky', top: 0, zIndex: 10 }}>
              {dates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const showLabel = zoom === 'week' ? true : zoom === 'month' ? d.getDate() % 5 === 1 : d.getDate() === 1;
                return (
                  <div key={i} style={{ width: colWidth, flexShrink: 0, borderRight: '1px solid #0F1E35', background: isToday ? 'rgba(29,78,216,0.2)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {showLabel && (
                      <>
                        <span style={{ fontSize:11, color: '#0F172A' }}>{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        <span style={{ fontSize:12, color: isToday ? '#2563EB' : '#0F172A', fontWeight: isToday ? 700 : 400 }}>{d.getDate()}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today line */}
            {todayOffset >= 0 && todayOffset < dates.length && (
              <div style={{ position: 'absolute', top: 48, bottom: 0, left: todayOffset * colWidth + colWidth / 2, width: 2, background: '#1D4ED8', zIndex: 5, opacity: 0.8 }} />
            )}

            {/* Task rows */}
            {tasksByList.map(({ list, tasks: listTasks }, li) => (
              <div key={list.id}>
                {/* List header row */}
                <div style={{ height: 29, borderBottom: '1px solid #E2E8F0', background: '#F1F5F9' }}>
                  {dates.map((_, i) => (
                    <span key={i} style={{ display: 'inline-block', width: colWidth, height: '100%', borderRight: '1px solid #0A0F1E' }} />
                  ))}
                </div>
                {/* Task bars */}
                {listTasks.map(task => {
                  const bar = getTaskBar(task);
                  return (
                    <div key={task.id} style={{ height: 36, position: 'relative', borderBottom: '1px solid #0F1E35' }}>
                      {/* Grid lines */}
                      {dates.map((d, i) => (
                        <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * colWidth, width: colWidth, borderRight: '1px solid #0A0F1E', background: d.toDateString() === today.toDateString() ? 'rgba(29,78,216,0.05)' : 'transparent' }} />
                      ))}
                      {/* Bar */}
                      {bar && (
                        <div style={{
                          position: 'absolute',
                          top: 6,
                          height: 24,
                          left: bar.left,
                          width: Math.max(bar.width, 20),
                          background: bar.isOverdue ? '#FEE2E2' : LIST_COLORS[li % LIST_COLORS.length],
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 6,
                          overflow: 'hidden',
                          zIndex: 2,
                          boxShadow: '0 1px 4px rgba(15,23,42,0.10)',
                          border: bar.isOverdue ? '1px solid #EF4444' : 'none'}}>
                          <span style={{ fontSize:12, color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.title}
                          </span>
                        </div>
                      )}
                      {/* No due date indicator */}
                      {!task.due_date && (
                        <div style={{ position: 'absolute', top: 12, left: 8, fontSize:12, color: '#64748B' }}>No due date</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '6px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize:12, color: '#0F172A' }}>Legend:</span>
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize:12, color: '#0F172A', textTransform: 'capitalize' }}>{p}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <div style={{ width: 20, height: 8, background: '#FEE2E2', borderRadius: 2, border: '1px solid #EF4444' }} />
          <span style={{ fontSize:12, color: '#0F172A' }}>Overdue</span>
        </div>
      </div>
    </div>
  );
}
