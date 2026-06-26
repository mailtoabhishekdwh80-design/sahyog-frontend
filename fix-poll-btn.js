const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace(
                          <button onClick={async () => {
                          setActiveMeetingId(m.id);
                          const res = await api.getPolls(m.id);
                          setPolls(res?.data || []);
                          setShowPollCreate(true);
                        }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg" title="Meeting polls">Poll</button>
                        <button onClick={() => { setActiveMeetingId(m.id); setShowWhiteboard(true); }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg" title="Whiteboard">Board</button>,
  <button onClick={async () => {
                          const res = await api.getPolls(m.id);
                          setMeetPolls(res?.data || []); setMeetPollMeetingId(m.id); setShowMeetPoll(true);
                        }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Poll</button>
                        <button onClick={() => { setMeetPollMeetingId(m.id); setShowMeetWhiteboard(true); }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Board</button>
);
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
