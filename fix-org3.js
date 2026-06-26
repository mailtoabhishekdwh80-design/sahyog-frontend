const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace(
  'api.adminMembers().then(res => setOrgMembers(Array.isArray(res?.data) ? res.data : []));',
  'api.adminMembers().then(res => { if(Array.isArray(res?.data)) setInviteMembers(res.data); });'
);
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
