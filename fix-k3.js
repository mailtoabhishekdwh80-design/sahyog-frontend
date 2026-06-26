const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
lines.forEach((l,i) => { if(i >= 150 && i <= 162) console.log(i+1, l); });
lines.splice(155, 1);
fs.writeFileSync('components/KanbanView.tsx', lines.join('\n'));
console.log('Done');
