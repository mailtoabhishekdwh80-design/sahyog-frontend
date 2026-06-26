const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace('setUser((u) => u ? { ...u, status_emoji: \'\', status_text: \'\' } : u)', 'setUser((u: any) => u ? { ...u, status_emoji: \'\', status_text: \'\' } : u)');
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
