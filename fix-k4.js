const fs = require('fs');
const lines = fs.readFileSync('components/KanbanView.tsx', 'utf8').split('\n');
// Replace line 156 (index 155) - add missing closing divs
lines.splice(155, 1, '        </div>', '      </div>', '    )}');
fs.writeFileSync('components/KanbanView.tsx', lines.join('\n'));
lines.forEach((l,i) => { if(i >= 153 && i <= 162) console.log(i+1, l); });
