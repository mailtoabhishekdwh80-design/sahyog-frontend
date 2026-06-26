const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
// Line 104 (index 103) - add closing div before it
lines.splice(103, 0, '      </div>');
fs.writeFileSync('components/KanbanView.tsx', lines.join('\n'));
console.log('Done. Lines 102-107:', lines.slice(101,107).join('\n'));
