const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Find and fix setActiveMeetingId inside MeetingsView
lines.forEach((l,i) => {
  if(l.includes('setActiveMeetingId') && i > 1550) {
    console.log(i+1, l.trim());
  }
});
