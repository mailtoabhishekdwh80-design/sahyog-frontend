const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
lines[486] = '              <button onClick={() => setShowStatus(true)} className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Set status">Status</button>';
lines[487] = '              <button onClick={loadBookmarks} className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Saved messages">Saved</button>';
lines[488] = '              <button onClick={loadChannelBrowser} className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Browse channels">Channels</button>';
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done');
