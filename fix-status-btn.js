const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
const newLines = [
  '              <button onClick={() => setShowStatus(true)} className="text-xs text-gray-500 hover:text-white transition-colors" title="Set status">{user?.status_emoji || "??"}</button>',
  '              <button onClick={loadBookmarks} className="text-xs text-gray-500 hover:text-white transition-colors" title="Saved">??</button>',
  '              <button onClick={loadChannelBrowser} className="text-xs text-gray-500 hover:text-white transition-colors" title="Browse channels">??</button>'
];
lines.splice(486, 0, ...newLines);
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done. Lines now:', lines[486], lines[487], lines[488]);
