const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines.forEach((l,i) => { if(l.includes('setInviteMembers')) console.log(i+1, l.trim()); });
const result = lines.filter(l => !l.includes('setInviteMembers'));
fs.writeFileSync('components/WorkspaceShell.tsx', result.join('\n'));
console.log('Done');
