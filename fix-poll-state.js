const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Insert poll state after line 1553 (index 1552)
lines.splice(1553, 0,
  "  const [meetPolls, setMeetPolls] = useState<any[]>([]);",
  "  const [showMeetPoll, setShowMeetPoll] = useState(false);",
  "  const [meetPollMeetingId, setMeetPollMeetingId] = useState<string|null>(null);",
  "  const [showMeetWhiteboard, setShowMeetWhiteboard] = useState(false);"
);
// Fix setPolls and setShowPollCreate references inside MeetingsView
for(let i = 1560; i < lines.length; i++) {
  if(lines[i].includes('setPolls(') && !lines[i].includes('setMeetPolls')) lines[i] = lines[i].replace('setPolls(', 'setMeetPolls(');
  if(lines[i].includes('setShowPollCreate(true)')) lines[i] = lines[i].replace('setShowPollCreate(true)', 'setShowMeetPoll(true)');
  if(lines[i].includes('setShowWhiteboard(true)') && i > 1560) lines[i] = lines[i].replace('setShowWhiteboard(true)', 'setShowMeetWhiteboard(true)');
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done. Line 1554:', lines[1553]);
