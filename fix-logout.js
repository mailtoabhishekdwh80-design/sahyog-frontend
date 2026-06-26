const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace('onClick={logout}', 'onClick={() => api.logout()}');
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
