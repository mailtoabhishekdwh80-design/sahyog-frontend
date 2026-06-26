const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace(/\/\/ fixed[\s\S]*$/, '').trimEnd() + '\n';
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done, last line:', c.split('\n').slice(-3).join(' | '));
