const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
const meetIdx = lines.findIndex(l => l.includes('function MeetingsView'));
// Add meetOrgMembers state if missing
const hasIt = lines.some((l,i) => i > meetIdx && l.includes('meetOrgMembers'));
if(!hasIt) {
  const si = lines.findIndex((l,i) => i > meetIdx && l.includes('useState'));
  lines.splice(si+1, 0, '  const [meetOrgMembers, setMeetOrgMembers] = useState<any[]>([]);');
}
// Fix all orgMembers references inside MeetingsView
for(let i = meetIdx; i < lines.length; i++) {
  if(lines[i].includes('setOrgMembers(')) lines[i] = lines[i].replace(/setOrgMembers\(/g, 'setMeetOrgMembers(');
  if(lines[i].includes('orgMembers.') && !lines[i].includes('meetOrgMembers')) lines[i] = lines[i].replace(/\borgMembers\./g, 'meetOrgMembers.');
  if(lines[i].includes('orgMembers,') && !lines[i].includes('meetOrgMembers')) lines[i] = lines[i].replace(/\borgMembers,/g, 'meetOrgMembers,');
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done');
