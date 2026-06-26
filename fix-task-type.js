const fs = require('fs');
let c = fs.readFileSync('components/KanbanView.tsx', 'utf8');
c = c.replace(
  'type Task = {\n  id: string; title: string; description?: string;\n  list_id: string; priority: string; position: number;\n  due_date?: string; assignees?: any[]; labels?: any[];\n  checklist_total?: number; checklist_done?: number; comment_count?: number;\n};',
  'type Task = {\n  id: string; title: string; description?: string;\n  list_id: string; priority: string; position: number;\n  due_date?: string; assignees?: any[]; labels?: any[];\n  checklist_total?: number; checklist_done?: number; comment_count?: number;\n  cover_color?: string; cover_url?: string;\n};'
);
fs.writeFileSync('components/KanbanView.tsx', c);
console.log('Done');
