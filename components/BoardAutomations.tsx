'use client';
import { useState } from 'react';

interface Automation {
  id: string;
  name: string;
  trigger: { type: string; value?: string };
  action: { type: string; value?: string };
  enabled: boolean;
  runCount: number;
}

const TRIGGERS = [
  { id: 'card_moved_to',    label: 'When a card is moved to list', hasValue: true, valuePlaceholder: 'List name (e.g. Done)' },
  { id: 'card_created',     label: 'When a card is created', hasValue: false },
  { id: 'due_date_today',   label: 'When due date is today', hasValue: false },
  { id: 'due_date_passed',  label: 'When due date has passed', hasValue: false },
  { id: 'priority_set',     label: 'When priority is set to', hasValue: true, valuePlaceholder: 'critical / high / medium / low' },
  { id: 'card_assigned',    label: 'When a card is assigned', hasValue: false },
  { id: 'checklist_complete', label: 'When checklist is 100% complete', hasValue: false },
];

const ACTIONS = [
  { id: 'move_to_list',    label: 'Move card to list', hasValue: true, valuePlaceholder: 'List name (e.g. Done)' },
  { id: 'set_priority',    label: 'Set priority to', hasValue: true, valuePlaceholder: 'critical / high / medium / low' },
  { id: 'notify_channel',  label: 'Send notification to channel', hasValue: true, valuePlaceholder: 'Channel name (e.g. general)' },
  { id: 'assign_member',   label: 'Assign to member', hasValue: true, valuePlaceholder: 'Member email' },
  { id: 'add_label',       label: 'Add label', hasValue: true, valuePlaceholder: 'Label name' },
  { id: 'set_due_date',    label: 'Set due date in N days', hasValue: true, valuePlaceholder: 'Number of days (e.g. 7)' },
  { id: 'archive_card',    label: 'Archive the card', hasValue: false },
];

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: '1',
    name: 'Auto-complete on Done',
    trigger: { type: 'card_moved_to', value: 'Done' },
    action: { type: 'set_priority', value: 'low' },
    enabled: true,
    runCount: 12,
  },
  {
    id: '2',
    name: 'Escalate overdue cards',
    trigger: { type: 'due_date_passed' },
    action: { type: 'set_priority', value: 'critical' },
    enabled: true,
    runCount: 5,
  },
  {
    id: '3',
    name: 'Notify on high priority',
    trigger: { type: 'priority_set', value: 'critical' },
    action: { type: 'notify_channel', value: 'general' },
    enabled: false,
    runCount: 0,
  },
  {
    id: '4',
    name: 'Set deadline on creation',
    trigger: { type: 'card_created' },
    action: { type: 'set_due_date', value: '7' },
    enabled: false,
    runCount: 0,
  },
];

interface AutomationsProps {
  onClose: () => void;
  boardName?: string;
}

export default function BoardAutomations({ onClose, boardName }: AutomationsProps) {
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [triggerType, setTriggerType] = useState('card_moved_to');
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState('move_to_list');
  const [actionValue, setActionValue] = useState('');

  const selectedTrigger = TRIGGERS.find(t => t.id === triggerType);
  const selectedAction = ACTIONS.find(a => a.id === actionType);

  function toggle(id: string) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  function deleteAutomation(id: string) {
    setAutomations(prev => prev.filter(a => a.id !== id));
  }

  function addAutomation() {
    if (!newName.trim()) { alert('Please enter a name'); return; }
    const auto: Automation = {
      id: Date.now().toString(),
      name: newName.trim(),
      trigger: { type: triggerType, value: triggerValue || undefined },
      action: { type: actionType, value: actionValue || undefined },
      enabled: true,
      runCount: 0,
    };
    setAutomations(prev => [...prev, auto]);
    setNewName(''); setTriggerValue(''); setActionValue('');
    setTriggerType('card_moved_to'); setActionType('move_to_list');
    setCreating(false);
  }

  function getTriggerLabel(auto: Automation) {
    const t = TRIGGERS.find(x => x.id === auto.trigger.type);
    return t ? t.label + (auto.trigger.value ? ` "${auto.trigger.value}"` : '') : auto.trigger.type;
  }

  function getActionLabel(auto: Automation) {
    const a = ACTIONS.find(x => x.id === auto.action.type);
    return a ? a.label + (auto.action.value ? ` "${auto.action.value}"` : '') : auto.action.type;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ margin: 'auto', background: '#0F172A', border: '1px solid #1E40AF', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15 }}>Automations</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{boardName || 'Board'} · {automations.filter(a => a.enabled).length} active rules</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCreating(!creating)}
              style={{ background: '#1D4ED8', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + New Rule
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 22 }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Create form */}
          {creating && (
            <div style={{ background: '#1E293B', border: '1px solid #1D4ED8', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>New Automation Rule</div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Rule Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Auto-move completed tasks"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>When (Trigger)</label>
                <select value={triggerType} onChange={e => { setTriggerType(e.target.value); setTriggerValue(''); }}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', marginBottom: 8 }}>
                  {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                {selectedTrigger?.hasValue && (
                  <input value={triggerValue} onChange={e => setTriggerValue(e.target.value)}
                    placeholder={selectedTrigger.valuePlaceholder}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none' }} />
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Then (Action)</label>
                <select value={actionType} onChange={e => { setActionType(e.target.value); setActionValue(''); }}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', marginBottom: 8 }}>
                  {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
                {selectedAction?.hasValue && (
                  <input value={actionValue} onChange={e => setActionValue(e.target.value)}
                    placeholder={selectedAction.valuePlaceholder}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addAutomation}
                  style={{ background: '#1D4ED8', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Create Rule
                </button>
                <button onClick={() => setCreating(false)}
                  style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Automations list */}
          {automations.length === 0 && !creating && (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>No automations yet</div>
              <div style={{ fontSize: 13 }}>Create rules to automate repetitive tasks</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {automations.map(auto => (
              <div key={auto.id} style={{ background: '#1E293B', border: `1px solid ${auto.enabled ? '#1E40AF' : '#334155'}`, borderRadius: 12, padding: 16, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{auto.name}</span>
                      {auto.runCount > 0 && (
                        <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(29,78,216,0.2)', color: '#60A5FA', borderRadius: 4, border: '1px solid rgba(29,78,216,0.3)' }}>
                          {auto.runCount} runs
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: '#0F172A', color: '#94A3B8', borderRadius: 4, border: '1px solid #1E3A5F' }}>WHEN</span>
                      <span style={{ color: '#94A3B8' }}>{getTriggerLabel(auto)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: '#0F172A', color: '#60A5FA', borderRadius: 4, border: '1px solid #1E3A5F' }}>THEN</span>
                      <span style={{ color: '#93C5FD' }}>{getActionLabel(auto)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggle(auto.id)}
                      style={{ width: 44, height: 24, borderRadius: 12, background: auto.enabled ? '#1D4ED8' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: auto.enabled ? 22 : 2, transition: 'left 0.2s' }} />
                    </button>
                    <button onClick={() => deleteAutomation(auto.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, opacity: 0.7 }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: 10, fontSize: 12, color: '#64748B' }}>
            ℹ️ Automations run when their trigger conditions are met. Rules marked as active will execute automatically. Full server-side execution coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
