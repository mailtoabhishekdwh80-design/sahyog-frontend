const fs = require('fs');
let c = fs.readFileSync('components/KanbanView.tsx', 'utf8');
c = c.replace('>\u00F0\u009F\u0093\u0090 Templates<', '>Templates<');
c = c.replace('>?? Board templates<', '>Board templates<');
fs.writeFileSync('components/KanbanView.tsx', c);
console.log('Done');
