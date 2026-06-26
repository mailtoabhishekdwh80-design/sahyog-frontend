const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines[1764] = lines[1764].replace('setActiveMeetingId(m.id);', 'setMeetPollMeetingId(m.id);');
lines[1769] = lines[1769].replace('setActiveMeetingId(m.id); setShowWhiteboard(true);', 'setMeetPollMeetingId(m.id); setShowMeetWhiteboard(true);');
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Fixed:', lines[1764].trim(), '|', lines[1769].trim());
