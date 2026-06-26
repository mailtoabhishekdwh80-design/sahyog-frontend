const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines.forEach((l,i) => { if(l.includes('setMeetDate') || l.includes('setMeetTime')) console.log(i+1, l.trim()); });
// Find line with setMeetDate and insert const d before it
const idx = lines.findIndex(l => l.includes('setMeetDate(d.'));
if (idx > 0) {
  lines.splice(idx, 0, '    const d = new Date(Date.now() + 60 * 60 * 1000);');
  console.log('Inserted at', idx+1);
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
