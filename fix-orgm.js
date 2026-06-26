const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace(
  'api.adminMembers().then(res => setOrgMembers(Array.isArray(res?.data) ? res.data : []));',
  'api.adminMembers().then(res => { const m = Array.isArray(res?.data) ? res.data : []; setMeetOrgMembers(m); });'
);
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
