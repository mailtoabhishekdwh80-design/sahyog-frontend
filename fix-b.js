const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace('onBoard={(b) =>', 'onBoard={(b: any) =>');
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done, changed:', !c.includes('onBoard={(b) =>'));
