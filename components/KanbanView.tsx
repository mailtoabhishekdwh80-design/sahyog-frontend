'use client';
import { useEffect, useState, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCenter, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';

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
      className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 cursor-grab active:cursor-grabbing select-none overflow-hidden"
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
  const [showTemplates, setShowTemplates] = useState(false);
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
  const [activity,      setActivity]      = useState<any[]>([]);
  const [orgMembers,    setOrgMembers]    = useState<any[]>([]);
  const [taskTab,       setTaskTab]       = useState<'details'|'comments'|'checklist'|'attachments'|'activity'>('details');
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
    const [commRes, checkRes, attRes, actRes] = await Promise.all([
      api.getComments(task.id), api.getChecklist(task.id),
      api.getAttachments(task.id), api.getActivity(task.id),
    ]);
    setComments(commRes?.data || []);
    setChecklist(checkRes?.data || []);
    setAttachments(attRes?.data || []);
    setActivity(actRes?.data || []);
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
    const wsRes = await api.workspaces();
    const workspaceId = wsRes?.data?.[0]?.id;
    const urlRes = await api.getUploadUrl(file.name, file.type, file.size, workspaceId);
    if (!urlRes?.data?.uploadUrl) { alert('Upload failed'); return; }
    await fetch(urlRes.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    const fileUrl = urlRes.data.uploadUrl.split('?')[0];
    await api.addAttachment(selectedTask.id, { fileName: file.name, fileUrl, mimeType: file.type, sizeBytes: file.size });
    const res = await api.getAttachments(selectedTask.id);
    setAttachments(res?.data || []);
  }

  async function loadTemplates() {
    const fallback = [
      { id: 'scrum',   name: 'Scrum Sprint',    description: 'Backlog to Done',        lists: ['Backlog','Sprint','In Progress','Review','Done'] },
      { id: 'kanban',  name: 'Simple Kanban',   description: 'To Do, Doing, Done',     lists: ['To Do','In Progress','Done'] },
      { id: 'bug',     name: 'Bug Tracker',     description: 'Track bugs to resolved', lists: ['Reported','Confirmed','In Fix','Testing','Resolved'] },
      { id: 'hiring',  name: 'Hiring Pipeline', description: 'Track candidates',       lists: ['Applied','Screening','Interview','Offer','Hired'] },
      { id: 'project', name: 'Project Launch',  description: 'Full project lifecycle', lists: ['Ideas','Planning','Development','Testing','Launched'] },
      { id: 'crm',     name: 'Sales CRM',       description: 'Track deals and clients',lists: ['Leads','Qualified','Proposal','Negotiation','Closed Won'] },
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
        <div className="flex items-center gap-2 px-3 pb-2">
          <button onClick={loadTemplates}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Templates
          </button>
          <div className="relative">
            <button onClick={() => setShowBgPicker(s => !s)}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
              Theme
            </button>
            {showBgPicker && (
              <div className="absolute left-0 top-9 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl z-50 flex gap-2 flex-wrap w-48">
                {BOARD_COLORS.map(c => (
                  <button key={c.name} onClick={() => { setBoardBg(c.value); setShowBgPicker(false); }}
                    className="w-8 h-8 rounded-lg border-2 border-gray-600 hover:border-white transition-colors"
                    style={{ background: c.value }} title={c.name} />
                ))}
              </div>
            )}
          </div>
          <button onClick={loadBoard}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700">
            Refresh
          </button>
        </div>
      </div>

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
                      {listTasks.map(task => (
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
                      <button onClick={() => { api.setCoverColor(selectedTask.id, ''); loadBoard(); }}
                        className="w-7 h-7 rounded-lg border-2 border-gray-600 hover:border-white bg-gray-800 text-xs text-gray-500">x</button>
                      {COVER_COLORS.map(c => (
                        <button key={c} onClick={() => { api.setCoverColor(selectedTask.id, c); loadBoard(); }}
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

      {/* Templates modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowTemplates(false); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">📐 Board templates</h3>
              <button onClick={() => setShowTemplates(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <p className="text-gray-500 text-sm">Pick a template to add lists to this board instantly</p>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t: any) => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-left border border-gray-700 hover:border-emerald-500 transition-colors">
                  <div className="text-sm font-semibold text-white mb-1">{t.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{t.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.lists.map((l: string) => (
                      <span key={l} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
