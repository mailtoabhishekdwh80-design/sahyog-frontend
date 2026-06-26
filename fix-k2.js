const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
// Remove line 157 (index 156) - extra </div>
console.log('Line 156:', lines[155]);
console.log('Line 157:', lines[156]);
console.log('Line 158:', lines[157]);
lines.splice(156, 1);
fs.writeFileSync('components/KanbanView.tsx', lines.join('\n'));
console.log('Done');
