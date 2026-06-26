const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
// Only replace orgMembers inside MeetingsView context (after line 1550)
const parts = c.split('function MeetingsView()');
if (parts.length > 1) {
  parts[1] = parts[1].replace(/\borgMembers\b/g, 'meetOrgMembers');
  c = parts.join('function MeetingsView()');
}
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
