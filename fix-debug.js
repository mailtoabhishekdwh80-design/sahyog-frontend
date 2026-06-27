const fs = require('fs');
let c = fs.readFileSync('components/KanbanView.tsx', 'utf8');
c = c.replace(
  'const res = await api.aiSuggestTasks(aiProjectDesc.trim(), boardId);',
  'const res = await api.aiSuggestTasks(aiProjectDesc.trim(), boardId); console.log("AI res:", JSON.stringify(res));'
);
fs.writeFileSync('components/KanbanView.tsx', c);
console.log('Done');
