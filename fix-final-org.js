const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines.forEach((l,i) => { if(l.includes('adminMembers') && i > 1560) console.log(i+1, l.trim()); });
const idx = lines.findIndex((l,i) => i > 1560 && l.includes('adminMembers'));
if(idx > 0) {
  lines[idx] = "    api.adminMembers().then(res => { if(Array.isArray(res?.data)) { setMeetOrgMembers(res.data); } });";
  console.log('Fixed line', idx+1);
}
// Also add meetOrgMembers state if missing
const hasMeetOrg = lines.some(l => l.includes('meetOrgMembers'));
if(!hasMeetOrg) {
  const meetIdx = lines.findIndex(l => l.includes('function MeetingsView'));
  const stateIdx = lines.findIndex((l,i) => i > meetIdx && l.includes('useState'));
  lines.splice(stateIdx + 1, 0, '  const [meetOrgMembers, setMeetOrgMembers] = useState<any[]>([]);');
  console.log('Added meetOrgMembers state');
}
// Replace orgMembers inside MeetingsView
const meetStart = lines.findIndex(l => l.includes('function MeetingsView'));
for(let i = meetStart; i < lines.length; i++) {
  if(lines[i].includes('orgMembers') && !lines[i].includes('meetOrgMembers')) {
    lines[i] = lines[i].replace(/\borgMembers\b/g, 'meetOrgMembers');
  }
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done');
