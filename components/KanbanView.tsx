'use client';
import GanttView from './GanttView';
import TableView from './TableView';
import BoardTemplates from './BoardTemplates';
import { useEffect, useState, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCenter, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api, apiFetch } from '../lib/api';

type List = { id: string; name: string; position: number };
type Task = {
  id: string; title: string; description?: string;
  list_id: string; priority: string; position: number;
  due_date?: string; assignees?: any[]; labels?: any[];
  checklist_total?: number; checklist_done?: number; comment_count?: number;
  cover_color?: string; cover_url?: string;
};

const PC: Record<string, string> = {
  low: 'text-gray-400 bg-gray-800', medium: 'text-blue-400 bg-blue-900/40',
  high: 'text-orange-400 bg-orange-900/40', critical: 'text-red-400 bg-red-900/40',
};
const LC = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
const BOARD_COLORS = [
  { name: 'Dark', value: '#030712' },
  { name: 'Ocean', value: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
  { name: 'Forest', value: 'linear-gradient(135deg,#134e4a,#065f46)' },
  { name: 'Sunset', value: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  { name: 'Fire', value: 'linear-gradient(135deg,#b91c1c,#d97706)' },
  { name: 'Sky', value: 'linear-gradient(135deg,#1e40af,#0e7490)' },
];
const COVER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4'];

function DroppableList({ list, children, isOver }: { list: List; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });
  return (
    <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] rounded-b-xl transition-colors ${isOver ? 'bg-emerald-900/10' : ''}`}>
      {children}
    </div>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id, data: { type: 'task', listId: task.list_id },
  });
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes} {...listeners}
      onClick={onClick}
      className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 cursor-grab active:cursor-grabbing select-none overflow-hidden group/card"
    >
      {task.cover_color && <div style={{ backgroundColor: task.cover_color }} className="h-8 w-full" />}
      <div className="p-3">
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((l: any) => (
              <span key={l.id} style={{ backgroundColor: l.color + '40', color: l.color }}
                className="text-xs px-2 py-0.5 rounded-full font-medium">{l.name}</span>
            ))}
          </div>
        )}
        <p className="text-sm text-white font-medium leading-snug">{task.title}</p>
        {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PC[task.priority] || PC.medium}`}>{task.priority}</span>
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              📅 {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {(task.checklist_total || 0) > 0 && (
            <span className={`text-xs ${task.checklist_done === task.checklist_total ? 'text-emerald-400' : 'text-gray-500'}`}>
              ☑ {task.checklist_done}/{task.checklist_total}
            </span>
          )}
          {(task.comment_count || 0) > 0 && <span className="text-xs text-gray-500">💬 {task.comment_count}</span>}
          {/* Vote count */}
          {((task as any).vote_count || 0) > 0 && (
            <span className="text-xs text-blue-400">👍 {(task as any).vote_count}</span>
          )}
          {/* Estimate display */}
          {(task as any).estimate_hours && (
            <span className="text-xs text-blue-400" title="Estimated time">⏱ {(task as any).estimate_hours}h</span>
          )}
          {/* Card aging indicator */}
          {(task as any).updated_at && (() => {
            const days = Math.floor((Date.now() - new Date((task as any).updated_at).getTime()) / 86400000);
            if (days >= 7) return <span className={`text-xs ${days >= 14 ? 'text-red-400' : 'text-yellow-500'}`} title={`No activity for ${days} days`}>⏳ {days}d</span>;
            return null;
          })()}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1 ml-auto">
              {task.assignees.slice(0, 3).map((a: any) => (
                <div key={a.id} className="w-5 h-5 rounded-full bg-purple-700 border border-gray-800 flex items-center justify-center text-xs font-bold text-white" title={a.display_name}>
                  {a.display_name?.charAt(0)}
                </div>
              ))}
              {task.assignees.length > 3 && <span className="text-xs text-gray-500 ml-1">+{task.assignees.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AITaskResults({ tasks, onAdd, onBack, listName }: { tasks: any[]; onAdd: (t: any[]) => void; onBack: () => void; listName: string }) {
  const [selected, setSelected] = useState<Set<number>>(new Set(tasks.map((_, i) => i)));

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const PC: Record<string, string> = {
    critical: 'text-red-400 bg-red-900/30 border-red-800',
    high: 'text-orange-400 bg-orange-900/30 border-orange-800',
    medium: 'text-blue-400 bg-blue-900/30 border-blue-800',
    low: 'text-gray-400 bg-gray-800 border-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">AI generated {tasks.length} tasks</p>
          <p className="text-xs text-gray-500 mt-0.5">Select which tasks to add to "{listName}"</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelected(new Set(tasks.map((_,i) => i)))} className="text-xs text-emerald-400 hover:text-emerald-300">Select all</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-300">Deselect all</button>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((task: any, i: number) => (
          <div key={i} onClick={() => toggle(i)}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selected.has(i) ? 'bg-emerald-900/20 border-emerald-700' : 'bg-gray-800 border-gray-700 opacity-60'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${selected.has(i) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600'}`}>
              {selected.has(i) && <span className="text-white text-xs">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-white font-medium">{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PC[task.priority] || PC.medium}`}>{task.priority}</span>
              </div>
              {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2 border-t border-gray-800">
        <button onClick={onBack} className="flex-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl transition-colors">
          Back
        </button>
        <button onClick={() => onAdd(tasks.filter((_, i) => selected.has(i)))}
          disabled={selected.size === 0}
          className="flex-1 text-sm text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 py-2.5 rounded-xl font-medium transition-all">
          Add {selected.size} task{selected.size !== 1 ? 's' : ''} to board
        </button>
      </div>
    </div>
  );
}

interface Props { boardId: string; boardName: string; onBack: () => void; }

export default function KanbanView({ boardId, boardName, onBack }: Props) {
  const [lists,       setLists]       = useState<List[]>([]);
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTask,  setActiveTask]  = useState<Task | null>(null);
  const [overListId,  setOverListId]  = useState<string | null>(null);
  const [boardBg,     setBoardBg]     = useState(BOARD_COLORS[0].value);
  const [showBgPicker,setShowBgPicker]= useState(false);
  const tasksRef      = useRef<Task[]>([]);
  const activeIdRef   = useRef<string | null>(null);
  const targetListRef = useRef<string | null>(null);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingList,   setAddingList]   = useState(false);
  const [newListName,  setNewListName]  = useState('');

  // Templates
  const [showTemplates,  setShowTemplates]  = useState(false);
  const [viewMode, setViewMode] = useState<'kanban'|'gantt'|'table'>('kanban');
  const [showAISuggest,  setShowAISuggest]  = useState(false);
  // ── Kanban feature state ──
  const [quickEditTask,  setQuickEditTask]  = useState<any>(null);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [listColors,     setListColors]     = useState<Record<string,string>>({});
  const [showListColor,  setShowListColor]  = useState<string|null>(null);
  const [showBoardInvite,setShowBoardInvite]= useState(false);
  const [boardSearch,    setBoardSearch]    = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showActivity,   setShowActivity]   = useState(false);
  const [showRecurring,  setShowRecurring]  = useState<string|null>(null);
  const [showEstimate,   setShowEstimate]   = useState<string|null>(null);
  const [showBoardPerms, setShowBoardPerms] = useState(false);
  const [boardPrivate,   setBoardPrivate]   = useState(false);
  const [checklistTpls,  setChecklistTpls]  = useState(false);
  const [estimateHours,  setEstimateHours]  = useState('');
  const [showWatcher,    setShowWatcher]    = useState<string|null>(null);
  const [showCrossBoard, setShowCrossBoard] = useState<string|null>(null);
  const [boardActivity,  setBoardActivity]  = useState<any[]>([]);
  const [boards,        setBoards]        = useState<any[]>([]);
  const [boardInviteUrl, setBoardInviteUrl] = useState('');
  const [aiProjectDesc,  setAiProjectDesc]  = useState('');
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<any[]>([]);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiError,        setAiError]        = useState('');
  const [templates,     setTemplates]     = useState<any[]>([]);

  // Task modal
  const [selectedTask,  setSelectedTask]  = useState<Task | null>(null);
  const [editTitle,     setEditTitle]     = useState('');
  const [editDesc,      setEditDesc]      = useState('');
  const [editPriority,  setEditPriority]  = useState('medium');
  const [editDueDate,   setEditDueDate]   = useState('');
  const [saving,        setSaving]        = useState(false);
  const [comments,      setComments]      = useState<any[]>([]);
  const [newComment,    setNewComment]    = useState('');
  const [checklist,     setChecklist]     = useState<any[]>([]);
  const [newCheckItem,  setNewCheckItem]  = useState('');
  const [attachments,   setAttachments]   = useState<any[]>([]);
  const [subtasks,      setSubtasks]      = useState<any[]>([]);
  const [newSubtask,    setNewSubtask]    = useState('');
  const [dependencies,  setDependencies]  = useState<any[]>([]);
  const [timeLogs,      setTimeLogs]      = useState<any[]>([]);
  const [totalMinutes,  setTotalMinutes]  = useState(0);
  const [logMins,       setLogMins]       = useState('');
  const [logNote,       setLogNote]       = useState('');
  const [boardAnalytics,setBoardAnalytics]= useState<any>(null);
  const [showBoardAnalytics,setShowBoardAnalytics] = useState(false);
  const [showCalendar,  setShowCalendar]  = useState(false);
  const [calMonth,      setCalMonth]      = useState(new Date());
  const [activity,      setActivity]      = useState<any[]>([]);
  const [orgMembers,    setOrgMembers]    = useState<any[]>([]);
  const [taskTab,       setTaskTab]       = useState<'details'|'comments'|'checklist'|'attachments'|'activity'|'subtasks'|'time'|'deps'>('details');
  const attachFileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    loadBoard();
    api.adminMembers().then(r => setOrgMembers(Array.isArray(r?.data) ? r.data : []));
  }, [boardId]);

  async function loadBoard() {
    setLoading(true);
    const [lr, tr] = await Promise.all([api.lists(boardId), api.tasks(boardId)]);
    setLists((lr?.data || []).sort((a: List, b: List) => a.position - b.position));
    setTasks(Array.isArray(tr?.data) ? tr.data : []);
    setLoading(false);
  }

  function getListIdFromOver(overId: string): string | null {
    if (overId.startsWith('list-')) return overId.replace('list-', '');
    const overTask = tasksRef.current.find(t => t.id === overId);
    return overTask ? overTask.list_id : null;
  }

  function onDragStart(e: DragStartEvent) {
    const task = tasksRef.current.find(t => t.id === e.active.id);
    if (!task) return;
    activeIdRef.current = task.id;
    targetListRef.current = task.list_id;
    setActiveTask(task);
  }

  function onDragOver(e: DragOverEvent) {
    const { over } = e;
    if (!over || !activeIdRef.current) return;
    const listId = getListIdFromOver(String(over.id));
    if (!listId) return;
    targetListRef.current = listId;
    setOverListId(listId);
    setTasks(prev => prev.map(t => t.id === activeIdRef.current ? { ...t, list_id: listId } : t));
  }

  async function onDragEnd(e: DragEndEvent) {
    const taskId = activeIdRef.current;
    const targetList = targetListRef.current;
    activeIdRef.current = null; targetListRef.current = null;
    setActiveTask(null); setOverListId(null);
    if (!taskId || !targetList) return;
    const pos = tasksRef.current.filter(t => t.list_id === targetList && t.id !== taskId).length;
    api.moveTask(taskId, targetList, pos).catch(() => loadBoard());
  }

  function onDragCancel() {
    activeIdRef.current = null; targetListRef.current = null;
    setActiveTask(null); setOverListId(null);
    loadBoard();
  }

  async function addTask(listId: string) {
    if (!newTaskTitle.trim()) return;
    await api.createTask(boardId, newTaskTitle.trim(), listId);
    setNewTaskTitle(''); setAddingToList(null);
    loadBoard();
  }

  async function addList() {
    if (!newListName.trim()) return;
    await api.createList(boardId, newListName.trim(), lists.length);
    setNewListName(''); setAddingList(false);
    loadBoard();
  }

  async function openTask(task: Task) {
    setSelectedTask(task); setEditTitle(task.title);
    setEditDesc(task.description || ''); setEditPriority(task.priority);
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setTaskTab('details');
    const [commRes, checkRes, attRes, actRes, subRes, depRes, timeRes] = await Promise.all([
      api.getComments(task.id), api.getChecklist(task.id),
      api.getAttachments(task.id), api.getActivity(task.id),
      api.getSubtasks(task.id), api.getDependencies(task.id), api.getTimeLogs(task.id),
    ]);
    setComments(commRes?.data || []);
    setChecklist(checkRes?.data || []);
    setAttachments(attRes?.data || []);
    setActivity(actRes?.data || []);
    setSubtasks(subRes?.data || []);
    setDependencies(depRes?.data || []);
    setTimeLogs(timeRes?.data?.logs || []);
    setTotalMinutes(timeRes?.data?.totalMinutes || 0);
  }

  async function saveTask() {
    if (!selectedTask) return;
    setSaving(true);
    await api.updateTask(selectedTask.id, {
      title: editTitle, description: editDesc,
      priority: editPriority, dueDate: editDueDate || null,
    });
    setSaving(false);
    setSelectedTask(null);
    loadBoard();
  }

  async function addCommentFn() {
    if (!newComment.trim() || !selectedTask) return;
    await api.addComment(selectedTask.id, newComment.trim());
    setNewComment('');
    const res = await api.getComments(selectedTask.id);
    setComments(res?.data || []);
  }

  async function addCheckItemFn() {
    if (!newCheckItem.trim() || !selectedTask) return;
    await api.addCheckItem(selectedTask.id, newCheckItem.trim());
    setNewCheckItem('');
    const res = await api.getChecklist(selectedTask.id);
    setChecklist(res?.data || []);
  }

  async function toggleCheckItemFn(itemId: string, checked: boolean) {
    if (!selectedTask) return;
    await api.toggleCheckItem(selectedTask.id, itemId, !checked);
    const res = await api.getChecklist(selectedTask.id);
    setChecklist(res?.data || []);
  }

  async function uploadAttachment(file: File) {
    if (!selectedTask) return;
    try {
      const wsRes = await api.workspaces();
      const workspaceId = wsRes?.data?.[0]?.id;
      const uploaded = await (api as any).uploadFile(file, workspaceId);
      await api.addAttachment(selectedTask.id, { fileName: file.name, fileUrl: uploaded.url, mimeType: file.type, sizeBytes: file.size });
      const res = await api.getAttachments(selectedTask.id);
      setAttachments(res?.data || []);
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Please try again'));
    }
  }

  async function suggestTasksWithAI() {
    if (!aiProjectDesc.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestedTasks([]);
    const res = await api.aiSuggestTasks(aiProjectDesc.trim(), boardId);
    setAiLoading(false);
    let parsedTasks = res?.data?.tasks || [];
    if (parsedTasks.length === 0 && res?.data?.raw) {
      try {
        const rawText = res.data.raw;
        const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
        const match = cleaned.match(/\[[\s\S]+\]/);
        if (match) parsedTasks = JSON.parse(match[0]);
      } catch(e) { console.log('Parse error:', e); }
    }
    if (parsedTasks.length > 0) {
      setAiSuggestedTasks(parsedTasks);
    } else {
      setAiError('Could not generate tasks. Try a more detailed description.');
    }
  }

  async function createAISuggestedTasks(selectedTasks: any[]) {
    if (!lists.length) { alert('Add a list to the board first!'); return; }
    const firstList = lists[0];
    for (const task of selectedTasks) {
      await api.createTask(boardId, task.title, firstList.id, task.priority || 'medium');
    }
    setShowAISuggest(false);
    setAiSuggestedTasks([]);
    setAiProjectDesc('');
    loadBoard();
  }

  // ── Task recurring ──
  async function setTaskRecurring(taskId: string, frequency: string) {
    await apiFetch('/boards/task/' + taskId + '/recurring', { method: 'POST', body: JSON.stringify({ frequency }) });
    setShowRecurring(null);
    alert('Task set to repeat ' + frequency);
    loadBoard();
  }

  // ── Board permissions ──
  async function setBoardPermissions(isPrivate: boolean) {
    await apiFetch('/boards/' + boardId + '/permissions', { method: 'PATCH', body: JSON.stringify({ is_private: isPrivate }) });
    setBoardPrivate(isPrivate);
    setShowBoardPerms(false);
    alert('Board is now ' + (isPrivate ? 'private' : 'public'));
  }

  // ── Checklist templates ──
  const CHECKLIST_TEMPLATES = [
    { name: 'Code review', items: ['Review code logic', 'Check error handling', 'Test edge cases', 'Update documentation', 'Approve PR'] },
    { name: 'Feature launch', items: ['Code complete', 'Tests passing', 'Design approved', 'Docs updated', 'Stakeholder sign-off', 'Deploy to staging', 'Deploy to production'] },
    { name: 'Bug fix', items: ['Reproduce the bug', 'Identify root cause', 'Write fix', 'Add test case', 'Code review', 'Deploy fix'] },
    { name: 'Meeting prep', items: ['Set agenda', 'Invite participants', 'Prepare materials', 'Send reminder', 'Book meeting room'] },
  ];

  // ── Task estimate ──
  async function saveEstimate(taskId: string, hours: number) {
    await apiFetch('/boards/task/' + taskId + '/estimate', { method:'POST', body: JSON.stringify({ estimate_hours: hours }) });
    setShowEstimate(null);
    loadBoard();
  }

  // ── Card watcher ──
  async function watchTask(taskId: string) {
    await apiFetch('/boards/task/' + taskId + '/watch', { method:'POST' });
    setShowWatcher(null);
    alert('You will be notified of all updates to this task.');
  }

  // ── Move card to another board ──
  async function moveToBoard(taskId: string, targetBoardId: string) {
    await apiFetch('/boards/task/' + taskId + '/move-board', { method:'POST', body: JSON.stringify({ targetBoardId }) });
    setShowCrossBoard(null);
    loadBoard();
    alert('Task moved to selected board!');
  }

  // ── Export board to CSV ──
  function exportBoardCSV() {
    setExportLoading(true);
    const rows = [['Title','List','Priority','Due Date','Assignee']];
    lists.forEach((list: any) => {
      (list.tasks || []).forEach((task: any) => {
        rows.push([task.title, list.name, task.priority || '', task.due_date || '', task.assignee_name || '']);
      });
    });
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=boardName+'.csv'; a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  }

  // ── Copy/duplicate task ──
  async function duplicateTask(task: any) {
    await api.createTask(boardId, task.title + ' (copy)', task.list_id, task.priority || 'medium');
    loadBoard();
  }

  // ── Archive list ──
  async function archiveList(listId: string) {
    if (!confirm('Archive this list? Tasks will be hidden.')) return;
    await apiFetch('/boards/lists/' + listId + '/archive', { method: 'POST' });
    loadBoard();
  }

  // ── Generate board invite link ──
  function generateInviteLink() {
    const url = window.location.origin + '/workspace?board=' + boardId + '&invite=true';
    setBoardInviteUrl(url);
    setShowBoardInvite(true);
    navigator.clipboard.writeText(url).catch(() => {});
  }

  // ── Card aging calculation ──
  function getCardAge(updatedAt: string): number {
    if (!updatedAt) return 0;
    return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  function getAgingStyle(updatedAt: string): object {
    const days = getCardAge(updatedAt);
    if (days < 3) return {};
    if (days < 7) return {opacity: 0.85, borderLeft: '2px solid #f59e0b'};
    if (days < 14) return {opacity: 0.7, borderLeft: '2px solid #ef4444'};
    return {opacity: 0.55, borderLeft: '2px solid #7f1d1d', filter: 'grayscale(20%)'};
  }

  async function loadBoardAnalytics() {
    const res = await api.boardAnalytics(boardId);
    setBoardAnalytics(res?.data);
    setShowBoardAnalytics(true);
  }

  async function addSubtaskFn() {
    if (!newSubtask.trim() || !selectedTask) return;
    await api.addSubtask(selectedTask.id, newSubtask.trim());
    setNewSubtask('');
    const res = await api.getSubtasks(selectedTask.id);
    setSubtasks(res?.data || []);
  }

  async function logTimeFn() {
    if (!logMins || !selectedTask) return;
    await api.logTime(selectedTask.id, parseInt(logMins), logNote || undefined);
    setLogMins(''); setLogNote('');
    const res = await api.getTimeLogs(selectedTask.id);
    setTimeLogs(res?.data?.logs || []);
    setTotalMinutes(res?.data?.totalMinutes || 0);
  }

  function getTasksForDay(day: number) {
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getFullYear() === calMonth.getFullYear() &&
             d.getMonth() === calMonth.getMonth() &&
             d.getDate() === day;
    });
  }

  async function loadTemplates() {
    const fallback = [
      { id: 'scrum',   name: 'Scrum Sprint',    description: 'Backlog to Done',        lists: ['Backlog','Sprint','In Progress','Review','Done'],   color: 'from-violet-600 to-indigo-600',   icon: 'S' },
      { id: 'kanban',  name: 'Simple Kanban',   description: 'To Do, Doing, Done',     lists: ['To Do','In Progress','Done'],                        color: 'from-emerald-600 to-teal-600',    icon: 'K' },
      { id: 'bug',     name: 'Bug Tracker',     description: 'Track bugs to resolved', lists: ['Reported','Confirmed','In Fix','Testing','Resolved'], color: 'from-red-600 to-rose-600',        icon: 'B' },
      { id: 'hiring',  name: 'Hiring Pipeline', description: 'Track candidates',       lists: ['Applied','Screening','Interview','Offer','Hired'],    color: 'from-amber-500 to-orange-500',    icon: 'H' },
      { id: 'project', name: 'Project Launch',  description: 'Full project lifecycle', lists: ['Ideas','Planning','Development','Testing','Launched'], color: 'from-blue-600 to-cyan-600',       icon: 'P' },
      { id: 'crm',     name: 'Sales CRM',       description: 'Track deals and clients',lists: ['Leads','Qualified','Proposal','Negotiation','Closed Won'], color: 'from-pink-600 to-fuchsia-600', icon: 'C' },
    ];
    const res = await api.getTemplates();
    setTemplates(res?.data?.length ? res.data : fallback);
    setShowTemplates(true);
  }

  async function applyTemplate(templateId: string) {
    await api.applyTemplate(boardId, templateId);
    setShowTemplates(false);
    loadBoard();
  }

  const checkProgress = checklist.length > 0
    ? Math.round((checklist.filter((c: any) => c.is_checked).length / checklist.length) * 100) : 0;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-emerald-400 animate-pulse">Loading board...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 shrink-0">
        {/* Title row */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={onBack} className="text-gray-500 hover:text-white text-lg leading-none">&#8592;</button>
          <span className="font-semibold text-white">{boardName}</span>
          <span className="text-xs text-gray-500">{tasks.length} tasks</span>
        </div>
        {/* Toolbar row */}
        <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto">
          <button onClick={() => setShowAISuggest(true)}
            className="text-xs text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 px-3 py-1.5 rounded-lg font-medium">
            AI Tasks
          </button>
          <div style={{display:'flex',background:'#1E293B',borderRadius:8,border:'1px solid #334155',overflow:'hidden',marginLeft:'auto'}}>
            {(['kanban','gantt','table'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{padding:'4px 12px',background:viewMode===v?'#1D4ED8':'none',border:'none',color:viewMode===v?'#fff':'#94A3B8',fontSize:11,cursor:'pointer',fontWeight:viewMode===v?700:400,textTransform:'capitalize'}}>
                {v === 'kanban' ? '⊞ Board' : v === 'gantt' ? '📅 Timeline' : '☰ Table'}
              </button>
            ))}
          </div>
          
          <button onClick={loadTemplates}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Templates
          </button>
          <button onClick={exportBoardCSV} disabled={exportLoading}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={generateInviteLink}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Invite Link
          </button>
          <button onClick={() => setShowBoardPerms(true)}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            {boardPrivate ? '🔒 Private' : '🌐 Public'}
          </button>
          <button onClick={() => setChecklistTpls(s => !s)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${checklistTpls ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
            Checklist templates
          </button>
          <input value={boardSearch} onChange={e => setBoardSearch(e.target.value)}
            placeholder="Search tasks..." className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg outline-none focus:border-emerald-500 w-36" />
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1.5 rounded-lg outline-none">
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={loadBoardAnalytics}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Analytics
          </button>
          <button onClick={() => setShowCalendar(s => !s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showCalendar ? 'bg-emerald-700 text-white border-emerald-600' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border-gray-700'}`}>
            Calendar
          </button>
          <button onClick={() => setShowBgPicker(s => !s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showBgPicker ? 'bg-emerald-700 text-white border-emerald-600' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border-gray-700'}`}>
              Theme
            </button>
          <button onClick={loadBoard}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Refresh
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {showCalendar && (
        <div className="shrink-0 border-b border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
              className="text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-gray-800 rounded">&lt;</button>
            <span className="text-white font-semibold text-sm">
              {calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
              className="text-gray-500 hover:text-white px-2 py-1 hover:bg-gray-800 rounded">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>
            ))}
            {Array.from({ length: new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth();
              return (
                <div key={day} className={`min-h-12 rounded-lg p-1 ${isToday ? 'bg-emerald-950/50 border border-emerald-800' : 'bg-gray-800/40'}`}>
                  <div className={`text-xs mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>{day}</div>
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} onClick={() => openTask(t)}
                      className="text-xs bg-emerald-900/60 text-emerald-300 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-emerald-900">{t.title}</div>
                  ))}
                  {dayTasks.length > 2 && <div className="text-xs text-gray-500">+{dayTasks.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" style={{ background: boardBg }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
          <div className="flex gap-3 p-4 h-full">
            {lists.map((list, idx) => {
              const listTasks = tasks.filter(t => t.list_id === list.id).sort((a, b) => a.position - b.position);
              const isOver = overListId === list.id;
              return (
                <div key={list.id} className={`w-72 shrink-0 flex flex-col rounded-xl border transition-colors ${isOver ? 'border-emerald-500' : 'border-gray-700'} bg-gray-900/95 backdrop-blur`}>
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: LC[idx % LC.length] }} />
                    <span className="text-sm font-semibold text-gray-200 flex-1">{list.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{listTasks.length}</span>
                  </div>
                  <DroppableList list={list} isOver={isOver}>
                    <SortableContext items={listTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {listTasks.filter(task => {
                        if (boardSearch && !task.title.toLowerCase().includes(boardSearch.toLowerCase())) return false;
                        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
                        return true;
                      }).map(task => (
                        <TaskCard key={task.id} task={task} onClick={() => openTask(task)} />
                      ))}
                    </SortableContext>
                    {addingToList === list.id ? (
                      <div className="bg-gray-800 rounded-lg p-2.5 border border-emerald-600 space-y-1.5">
                        <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addTask(list.id); if (e.key === 'Escape') { setAddingToList(null); setNewTaskTitle(''); } }}
                          placeholder="Task title..."
                          className="w-full bg-gray-900 text-sm text-white placeholder-gray-500 focus:outline-none rounded px-2 py-1" />
                        <div className="flex gap-2">
                          <button onClick={() => addTask(list.id)} className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded">Add</button>
                          <button onClick={() => { setAddingToList(null); setNewTaskTitle(''); }} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingToList(list.id); setNewTaskTitle(''); }}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-300 px-2 py-1.5 rounded hover:bg-gray-800 flex items-center gap-1 transition-colors">
                        + Add task
                      </button>
                    )}
                  </DroppableList>
                </div>
              );
            })}

            {/* Add list */}
            <div className="w-64 shrink-0">
              {addingList ? (
                <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-3 space-y-2">
                  <input autoFocus value={newListName} onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') { setAddingList(false); setNewListName(''); } }}
                    placeholder="List name..."
                    className="w-full bg-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none rounded px-3 py-2 border border-gray-700 focus:border-emerald-500" />
                  <div className="flex gap-2">
                    <button onClick={addList} className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded">Add list</button>
                    <button onClick={() => { setAddingList(false); setNewListName(''); }} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingList(true)}
                  className="w-full px-4 py-3 rounded-xl border border-dashed border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400 text-sm flex items-center gap-2 bg-gray-900/60 backdrop-blur transition-colors">
                  + Add list
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-gray-700 rounded-lg p-3 border border-emerald-500 shadow-2xl w-72 rotate-1 opacity-95">
                <p className="text-sm text-white font-medium">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedTask(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'details',     label: 'Details' },
                  { id: 'comments',    label: `Comments (${comments.length})` },
                  { id: 'checklist',   label: `Checklist (${checklist.filter((c: any) => c.is_checked).length}/${checklist.length})` },
                  { id: 'subtasks',    label: `Subtasks (${subtasks.length})` },
                  { id: 'time',        label: `Time (${Math.floor(totalMinutes/60)}h${totalMinutes%60}m)` },
                  { id: 'deps',        label: 'Dependencies' },
                  { id: 'attachments', label: `Files (${attachments.length})` },
                  { id: 'activity',    label: 'Activity' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setTaskTab(tab.id as any)}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${taskTab === tab.id ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await api.deleteTask(selectedTask.id); setSelectedTask(null); loadBoard(); }}
                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/30">Delete</button>
                <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Details */}
              {taskTab === 'details' && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Title</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Add a description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                      <div className="flex gap-2 flex-wrap">
                        {['low','medium','high','critical'].map(p => (
                          <button key={p} onClick={() => setEditPriority(p)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg capitalize transition-colors ${editPriority === p ? PC[p] : 'text-gray-500 bg-gray-800 hover:bg-gray-700'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Due date</label>
                      <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                        className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  {/* Cover color */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Card cover color</label>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={async () => { await api.setCoverColor(selectedTask.id, ''); loadBoard(); }}
                        className="w-7 h-7 rounded-lg border-2 border-gray-600 hover:border-white bg-gray-800 text-xs text-gray-500">x</button>
                      {COVER_COLORS.map(c => (
                        <button key={c} onClick={async () => { await api.setCoverColor(selectedTask.id, c); loadBoard(); }}
                          style={{ backgroundColor: c }}
                          className="w-7 h-7 rounded-lg border-2 border-transparent hover:border-white transition-colors" />
                      ))}
                    </div>
                  </div>
                  {/* Assignees */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Assignees</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assignees?.map((a: any) => (
                        <span key={a.id} className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-full text-xs text-gray-300">
                          <span className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">{a.display_name?.charAt(0)}</span>
                          {a.display_name?.split(' ')[0]}
                        </span>
                      ))}
                      {orgMembers.filter(m => !selectedTask.assignees?.some((a: any) => a.id === m.id)).slice(0, 5).map((m: any) => (
                        <button key={m.id} onClick={async () => {
                          await api.updateTask(selectedTask.id, { assigneeIds: [...(selectedTask.assignees?.map((a: any) => a.id) || []), m.id] });
                          loadBoard();
                          const updated = await api.getTask(selectedTask.id);
                          if (updated?.data) setSelectedTask(updated.data);
                        }}
                          className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                          + {m.display_name?.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    List: {lists.find(l => l.id === selectedTask.list_id)?.name || '—'}
                  </div>
                </div>
              )}

              {/* Comments */}
              {taskTab === 'comments' && (
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {comments.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No comments yet</p>}
                    {comments.map((c: any) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {c.display_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-white">{c.display_name}</span>
                            <span className="text-xs text-gray-600">{new Date(c.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-gray-300 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-800">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCommentFn()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    <button onClick={addCommentFn} disabled={!newComment.trim()}
                      className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Post</button>
                  </div>
                </div>
              )}

              {/* Checklist */}
              {taskTab === 'checklist' && (
                <div className="p-5 space-y-3">
                  {checklist.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{checkProgress}% complete</span>
                        <span className="text-xs text-gray-500">{checklist.filter((c: any) => c.is_checked).length}/{checklist.length}</span>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${checkProgress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {checklist.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <button onClick={() => toggleCheckItemFn(item.id, item.is_checked)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${item.is_checked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600 hover:border-emerald-500'}`}>
                          {item.is_checked && <span className="text-white text-xs">✓</span>}
                        </button>
                        <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>{item.title}</span>
                        <button onClick={async () => { await api.deleteCheckItem(selectedTask.id, item.id); const r = await api.getChecklist(selectedTask.id); setChecklist(r?.data || []); }}
                          className="hidden group-hover:block text-gray-600 hover:text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-800">
                    <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCheckItemFn()}
                      placeholder="Add checklist item..."
                      className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    <button onClick={addCheckItemFn} disabled={!newCheckItem.trim()}
                      className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Add</button>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {taskTab === 'attachments' && (
                <div className="p-5 space-y-3">
                  <input ref={attachFileRef} type="file" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAttachment(e.target.files[0])} />
                  <button onClick={() => attachFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-xl py-6 text-gray-500 hover:text-emerald-400 text-sm transition-colors">
                    + Upload attachment
                  </button>
                  {attachments.length === 0 && <p className="text-gray-600 text-sm text-center py-2">No attachments yet</p>}
                  {attachments.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                      <span className="text-2xl">{a.mime_type?.startsWith('image/') ? '🖼️' : '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{a.file_name}</p>
                        <p className="text-xs text-gray-500">{a.uploader_name} · {new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300">↓</a>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtasks */}
              {taskTab === 'subtasks' && (
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSubtaskFn()}
                      placeholder="Add subtask..." className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    <button onClick={addSubtaskFn} disabled={!newSubtask.trim()}
                      className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">Add</button>
                  </div>
                  {subtasks.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No subtasks yet</p>}
                  {subtasks.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                      <div className={`w-2 h-2 rounded-full ${PC[s.priority] ? 'bg-current' : 'bg-gray-500'}`} />
                      <span className="text-sm text-white flex-1">{s.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${PC[s.priority] || PC.medium}`}>{s.priority}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Time tracking */}
              {taskTab === 'time' && (
                <div className="p-5 space-y-4">
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{Math.floor(totalMinutes/60)}h {totalMinutes%60}m</div>
                    <div className="text-xs text-gray-500 mt-1">Total time logged</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
                      <input type="number" value={logMins} onChange={e => setLogMins(e.target.value)}
                        placeholder="e.g. 90" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Note</label>
                      <input value={logNote} onChange={e => setLogNote(e.target.value)}
                        placeholder="What did you do?" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <button onClick={logTimeFn} disabled={!logMins}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm py-2.5 rounded-xl">Log time</button>
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    {timeLogs.length === 0 && <p className="text-gray-600 text-sm text-center py-2">No time logged yet</p>}
                    {timeLogs.map((l: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg p-2.5">
                        <div className="text-sm font-semibold text-emerald-400 w-16">{Math.floor(l.minutes/60)}h {l.minutes%60}m</div>
                        <div className="flex-1">
                          <div className="text-xs text-white">{l.display_name}</div>
                          {l.note && <div className="text-xs text-gray-500">{l.note}</div>}
                        </div>
                        <div className="text-xs text-gray-600">{new Date(l.logged_at).toLocaleDateString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {taskTab === 'deps' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={async () => {
                      const id = prompt('Task ID that this task BLOCKS:');
                      if (!id || !selectedTask) return;
                      await api.addDependency(selectedTask.id, { blocksTaskId: id });
                      const res = await api.getDependencies(selectedTask.id);
                      setDependencies(res?.data || []);
                    }} className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left border border-gray-700 hover:border-orange-500 transition-colors">
                      <div className="text-sm font-semibold text-orange-400 mb-1">Blocks</div>
                      <div className="text-xs text-gray-500">This task must be done first</div>
                    </button>
                    <button onClick={async () => {
                      const id = prompt('Task ID that BLOCKS this task:');
                      if (!id || !selectedTask) return;
                      await api.addDependency(selectedTask.id, { blockedByTaskId: id });
                      const res = await api.getDependencies(selectedTask.id);
                      setDependencies(res?.data || []);
                    }} className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left border border-gray-700 hover:border-red-500 transition-colors">
                      <div className="text-sm font-semibold text-red-400 mb-1">Blocked by</div>
                      <div className="text-xs text-gray-500">This task is waiting on another</div>
                    </button>
                  </div>
                  {dependencies.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No dependencies set</p>}
                  {dependencies.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${d.type === 'blocks' ? 'bg-orange-900/40 text-orange-400' : 'bg-red-900/40 text-red-400'}`}>
                        {d.type === 'blocks' ? 'Blocks' : 'Blocked by'}
                      </span>
                      <span className="text-sm text-white flex-1">{d.related_title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PC[d.related_priority] || PC.medium}`}>{d.related_priority}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity */}
              {taskTab === 'activity' && (
                <div className="p-5 space-y-3">
                  {activity.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No activity yet</p>}
                  {activity.map((a: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {a.display_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium text-white">{a.display_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{a.type === 'comment' ? 'commented:' : ''} {a.content}</span>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {new Date(a.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {taskTab === 'details' && (
              <div className="px-5 pb-5 shrink-0 border-t border-gray-800 pt-4">
                <button onClick={saveTask} disabled={saving}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme picker modal */}
      {showBgPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowBgPicker(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-400 mb-3 font-medium">Board theme</p>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map(c => (
                <button key={c.name} onClick={() => { setBoardBg(c.value); setShowBgPicker(false); }}
                  className="w-12 h-12 rounded-xl border-2 border-gray-600 hover:border-white transition-colors flex items-end p-1"
                  style={{ background: c.value }} title={c.name}>
                  <span className="text-white text-xs opacity-70">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checklist Templates Panel */}
      {checklistTpls && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setChecklistTpls(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Checklist templates</h3>
              <button onClick={() => setChecklistTpls(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Apply a checklist template to any task by opening the task and clicking Checklist</p>
            <div className="space-y-3">
              {CHECKLIST_TEMPLATES.map(tpl => (
                <div key={tpl.name} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{tpl.name}</span>
                    <span className="text-xs text-gray-500">{tpl.items.length} items</span>
                  </div>
                  <div className="space-y-1">
                    {tpl.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3 h-3 border border-gray-600 rounded flex-shrink-0"/>
                        {item}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { alert('Checklist template "' + tpl.name + '" ready! Open any task and click Checklist to apply it.'); setChecklistTpls(false); }}
                    className="mt-3 w-full text-xs bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 py-1.5 rounded-lg">Use template</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Board Permissions Modal */}
      {showBoardPerms && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowBoardPerms(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Board permissions</h3>
              <button onClick={() => setShowBoardPerms(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="space-y-3">
              {[
                { label:'🌐 Public', desc:'All workspace members can view and edit', value: false },
                { label:'🔒 Private', desc:'Only invited members can access this board', value: true },
              ].map(opt => (
                <label key={opt.label} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${boardPrivate === opt.value ? 'border-emerald-700 bg-emerald-900/20' : 'border-gray-700 hover:bg-gray-800'}`}>
                  <input type="radio" name="board_perm" checked={boardPrivate === opt.value}
                    onChange={() => setBoardPermissions(opt.value)} className="mt-0.5 accent-emerald-500" />
                  <div>
                    <div className="text-sm font-medium text-white">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estimate Modal */}
      {showEstimate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowEstimate(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Set time estimate</h3>
              <button onClick={() => setShowEstimate(null)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-2">Estimated hours</label>
              <input type="number" value={estimateHours} onChange={e => setEstimateHours(e.target.value)}
                placeholder="e.g. 4" min="0.5" step="0.5"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
              <div className="flex gap-2 mt-2">
                {[0.5,1,2,4,8].map(h => (
                  <button key={h} onClick={() => setEstimateHours(String(h))}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded">{h}h</button>
                ))}
              </div>
            </div>
            <button onClick={() => saveEstimate(showEstimate, parseFloat(estimateHours))}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium">Save estimate</button>
          </div>
        </div>
      )}

      {/* Move to Board Modal */}
      {showCrossBoard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowCrossBoard(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Move to another board</h3>
              <button onClick={() => setShowCrossBoard(null)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Select a board to move this task to:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {boards.filter((b: any) => b.id !== boardId).map((b: any) => (
                <button key={b.id} onClick={() => moveToBoard(showCrossBoard!, b.id)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-white flex items-center gap-2">
                  <span className="text-gray-500 text-xs">B</span>{b.name}
                </button>
              ))}
              {boards.filter((b: any) => b.id !== boardId).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No other boards available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Board Invite Modal */}
      {showBoardInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if(e.target===e.currentTarget) setShowBoardInvite(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Invite to board</h3>
              <button onClick={() => setShowBoardInvite(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <p className="text-gray-400 text-sm mb-3">Share this link to invite people to this board:</p>
            <div className="flex gap-2">
              <input value={boardInviteUrl} readOnly
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(boardInviteUrl); alert('Copied!'); }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg font-medium">Copy</button>
            </div>
            <p className="text-xs text-gray-600 mt-3">Anyone with this link can view this board (requires workspace login)</p>
          </div>
        </div>
      )}

      {/* AI Task Suggestion Modal */}
      {showAISuggest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowAISuggest(false); setAiSuggestedTasks([]); } }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">AI</div>
              <div>
                <h3 className="text-white font-semibold">AI Task Generator</h3>
                <p className="text-xs text-gray-500">Describe your project and Deemona AI will create tasks for you</p>
              </div>
              <button onClick={() => { setShowAISuggest(false); setAiSuggestedTasks([]); }} className="ml-auto text-gray-500 hover:text-white">x</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {aiSuggestedTasks.length === 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block font-medium uppercase tracking-wider">Project description</label>
                    <textarea value={aiProjectDesc} onChange={e => setAiProjectDesc(e.target.value)}
                      rows={5} placeholder="Describe your project in detail. For example: 'Build a mobile app for food delivery in India. Users can browse restaurants, order food, track delivery in real-time. Needs payment integration with UPI and WhatsApp notifications.'"
                      className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 resize-none placeholder-gray-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'E-commerce website with payment gateway and inventory management',
                      'Mobile app for cab booking with GPS tracking and driver app',
                      'SaaS dashboard for HR management with payroll and attendance',
                      'Food delivery platform with restaurant onboarding and UPI payments',
                    ].map(s => (
                      <button key={s} onClick={() => setAiProjectDesc(s)}
                        className="text-left text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2.5 rounded-xl border border-gray-700 hover:border-emerald-600 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                  {aiError && <p className="text-red-400 text-sm">{aiError}</p>}
                  <button onClick={suggestTasksWithAI} disabled={!aiProjectDesc.trim() || aiLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-all">
                    {aiLoading ? 'Deemona AI is thinking...' : 'Generate tasks with AI'}
                  </button>
                  {aiLoading && (
                    <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white animate-pulse">AI</div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Analyzing your project...</p>
                        <p className="text-xs text-gray-500 mt-0.5">Breaking down into actionable tasks</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <AITaskResults tasks={aiSuggestedTasks} onAdd={createAISuggestedTasks} onBack={() => setAiSuggestedTasks([])} listName={lists[0]?.name || 'first list'} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Board analytics modal */}
      {showBoardAnalytics && boardAnalytics && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowBoardAnalytics(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Board Analytics</span>
              <button onClick={() => setShowBoardAnalytics(false)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{boardAnalytics.summary?.total || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Total tasks</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-400">{boardAnalytics.summary?.overdue || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Overdue</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-orange-400">{boardAnalytics.summary?.critical || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Critical</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Tasks by list</div>
              <div className="space-y-2">
                {boardAnalytics.byList?.map((l: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LC[i % LC.length] }} />
                    <span className="text-sm text-white flex-1">{l.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-800 rounded-full h-1.5 w-24">
                        <div className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${boardAnalytics.summary?.total > 0 ? (l.count / boardAnalytics.summary.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right">{l.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {boardAnalytics.byAssignee?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Top assignees</div>
                <div className="space-y-2">
                  {boardAnalytics.byAssignee.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">{a.display_name?.charAt(0)}</div>
                      <span className="text-sm text-white flex-1">{a.display_name}</span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{a.task_count} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <BoardTemplates
          onClose={() => setShowTemplates(false)}
          onSelect={async (template) => {
            // Create lists and tasks from template
            for (const list of template.lists) {
              const listRes = await api.createList(boardId, list.name, lists.length);
              if (listRes?.data?.id) {
                for (const taskTitle of list.tasks) {
                  await api.createTask(boardId, taskTitle, listRes.data.id).catch(()=>{});
                }
              }
            }
            await loadBoard();
            setShowTemplates(false);
          }}
        />
      )}
    </div>
  );
}
