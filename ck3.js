const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
lines.forEach((l,i) => { if(i >= 128 && i <= 162) console.log(i+1, l); });
