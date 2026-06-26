const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines.splice(770, 1);
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done. Line 770 now:', lines[769]);
