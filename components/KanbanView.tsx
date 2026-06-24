'use client';
import { useEffect, useState, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';

type List = { id: string; name: string; position: number };
type Task = {
  id: string; title: string; description?: string;
  list_id: string; priority: string; position: number;
  checklist_total?: number; checklist_done?: number; comment_count?: number;
};

const PC: Record<string, string> = {
  low:      'text-gray-400 bg-gray-800',
  medium:   'text-blue-400 bg-blue-900/40',
  high:     'text-orange-400 bg-orange-900/40',
  critical: 'text-red-400 bg-red-900/40',
};
const LC = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', listId: task.list_id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 cursor-grab active:cursor-grabbing select-none transition-colors"
    >
      <p className="text-sm text-white font-medium leading-snug">{task.title}</p>
      {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PC[task.priority] || PC.medium}`}>{task.priority}</span>
        {(task.checklist_total || 0) > 0 && (
          <span className={`text-xs ${task.checklist_done === task.checklist_total ? 'text-emerald-400' : 'text-gray-500'}`}>
            ☑ {task.checklist_done}/{task.checklist_total}
          </span>
        )}
        {(task.comment_count || 0) > 0 && <span className="text-xs text-gray-500">💬 {task.comment_count}</span>}
      </div>
    </div>
  );
}

interface Props { boardId: string; boardName: string; onBack: () => void; }

export default function KanbanView({ boardId, boardName, onBack }: Props) {
  const [lists,   setLists]   = useState<List[]>([]);
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Use refs to track drag state — avoids stale closure issues
  const activeTaskRef   = useRef<Task | null>(null);
  const targetListIdRef = useRef<string | null>(null);

  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc,  setNewTaskDesc]  = useState('');
  const [addingList,   setAddingList]   = useState(false);
  const [newListName,  setNewListName]  = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editDesc,     setEditDesc]     = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [saving,       setSaving]       = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadBoard(); }, [boardId]);

  async function loadBoard() {
    setLoading(true);
    const [lr, tr] = await Promise.all([api.lists(boardId), api.tasks(boardId)]);
    setLists((Array.isArray(lr?.data) ? lr.data : []).sort((a: List, b: List) => a.position - b.position));
    setTasks(Array.isArray(tr?.data) ? tr.data : []);
    setLoading(false);
  }

  function onDragStart(e: DragStartEvent) {
    const task = tasks.find(t => t.id === e.active.id);
    if (!task) return;
    activeTaskRef.current   = task;
    targetListIdRef.current = task.list_id; // start in same list
    setActiveTask(task);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || !activeTaskRef.current) return;

    const overIsTask   = tasks.some(t => t.id === over.id);
    const newListId    = overIsTask
      ? tasks.find(t => t.id === over.id)!.list_id
      : String(over.id);

    // Track target in ref — never stale
    targetListIdRef.current = newListId;

    // Optimistic visual update
    if (activeTaskRef.current.list_id !== newListId) {
      setTasks(prev => prev.map(t =>
        t.id === activeTaskRef.current!.id ? { ...t, list_id: newListId } : t
      ));
      // Update ref too so subsequent checks are correct
      activeTaskRef.current = { ...activeTaskRef.current, list_id: newListId };
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    const task       = activeTaskRef.current;
    const targetList = targetListIdRef.current;

    setActiveTask(null);
    activeTaskRef.current   = null;
    targetListIdRef.current = null;

    if (!task || !targetList) return;

    // Final optimistic state — make sure task is in target list
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, list_id: targetList } : t
    ));

    // Persist to backend
    const pos = tasks.filter(t => t.list_id === targetList).length;
    try {
      await api.moveTask(task.id, targetList, pos);
    } catch (err) {
      console.error('Move failed, reloading:', err);
      loadBoard(); // only reload on actual failure
    }
  }

  async function addTask(listId: string) {
    if (!newTaskTitle.trim()) return;
    await api.createTask(boardId, newTaskTitle.trim(), listId, newTaskDesc.trim() || undefined);
    setNewTaskTitle(''); setNewTaskDesc(''); setAddingToList(null);
    loadBoard();
  }

  async function addList() {
    if (!newListName.trim()) return;
    await api.createList(boardId, newListName.trim(), lists.length);
    setNewListName(''); setAddingList(false);
    loadBoard();
  }

  function openTask(task: Task) {
    setSelectedTask(task); setEditTitle(task.title);
    setEditDesc(task.description || ''); setEditPriority(task.priority);
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-emerald-400 animate-pulse">Loading board...</div></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-lg">←</button>
        <span>📋</span>
        <span className="font-semibold text-white">{boardName}</span>
        <span className="text-xs text-gray-500 ml-1">{tasks.length} tasks</span>
        <button onClick={loadBoard} className="ml-auto text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800">↻ Refresh</button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 p-4 h-full">
            {lists.map((list, idx) => {
              const listTasks = tasks.filter(t => t.list_id === list.id).sort((a, b) => a.position - b.position);
              return (
                <div key={list.id} className="w-72 shrink-0 flex flex-col rounded-xl border border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: LC[idx % LC.length] }} />
                    <span className="text-sm font-semibold text-gray-200 flex-1">{list.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{listTasks.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]">
                    <SortableContext items={listTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {listTasks.map(task => (
                        <TaskCard key={task.id} task={task} onClick={() => openTask(task)} />
                      ))}
                    </SortableContext>

                    {addingToList === list.id ? (
                      <div className="bg-gray-800 rounded-lg p-2.5 border border-emerald-600 space-y-1.5">
                        <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addTask(list.id); if (e.key === 'Escape') { setAddingToList(null); setNewTaskTitle(''); setNewTaskDesc(''); } }}
                          placeholder="Task title..."
                          className="w-full bg-gray-900 text-sm text-white placeholder-gray-500 focus:outline-none rounded px-2 py-1" />
                        <input value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full bg-gray-900 text-xs text-gray-300 placeholder-gray-600 focus:outline-none rounded px-2 py-1" />
                        <div className="flex gap-2">
                          <button onClick={() => addTask(list.id)} className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded">Add task</button>
                          <button onClick={() => { setAddingToList(null); setNewTaskTitle(''); setNewTaskDesc(''); }} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingToList(list.id); setNewTaskTitle(''); }}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-300 px-2 py-1.5 rounded hover:bg-gray-800 flex items-center gap-1 transition-colors">
                        + Add task
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="w-64 shrink-0">
              {addingList ? (
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 space-y-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm flex items-center gap-2 transition-colors">
                  + Add list
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-gray-700 rounded-lg p-3 border border-emerald-500 shadow-2xl w-72 rotate-2">
                <p className="text-sm text-white font-medium">{activeTask.title}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${PC[activeTask.priority] || PC.medium}`}>{activeTask.priority}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setSelectedTask(null); }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Task detail</span>
              <div className="flex gap-2">
                <button onClick={async () => { await api.deleteTask(selectedTask.id); setSelectedTask(null); loadBoard(); }}
                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/30">Delete</button>
                <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 resize-none" placeholder="Add a description..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {['low','medium','high','critical'].map(p => (
                    <button key={p} onClick={() => setEditPriority(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${editPriority === p ? PC[p] : 'text-gray-500 bg-gray-800 hover:bg-gray-700'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-600">List: {lists.find(l => l.id === selectedTask.list_id)?.name || '—'}</div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={async () => { setSaving(true); await api.updateTask(selectedTask.id, { title: editTitle, description: editDesc, priority: editPriority }); setSaving(false); setSelectedTask(null); loadBoard(); }}
                disabled={saving} className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
