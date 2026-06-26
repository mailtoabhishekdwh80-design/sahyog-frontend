const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Add orgMembers state inside MeetingsView after line 1564 (index 1563)
lines.splice(1564, 0, '  const [meetOrgMembers, setMeetOrgMembers] = useState<any[]>([]);');
// Fix the api call on what is now line 1569
lines[1569] = "    api.adminMembers().then(res => setMeetOrgMembers(Array.isArray(res?.data) ? res.data : []));";
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done. Line 1565:', lines[1564]);
console.log('Line 1570:', lines[1569]);
