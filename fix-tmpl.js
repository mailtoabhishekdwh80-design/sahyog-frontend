const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
lines[300] = '          <button onClick={loadTemplates} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800">Templates</button>';
fs.writeFileSync('components/KanbanView.tsx', lines.join('\n'));
console.log('Fixed:', lines[300]);
