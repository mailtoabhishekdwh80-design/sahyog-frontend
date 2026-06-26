const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');

// Move status/bookmarks/channels to user footer area for easy access
const oldFooter =         {/* User footer */}
        <div className="px-3 py-2 border-t border-gray-800">
          <button onClick={() => { api.logout(); window.location.href = '/login'; }};

const newFooter =         {/* User footer */}
        <div className="px-3 py-2 border-t border-gray-800 space-y-1">
          <div className="flex gap-1 mb-1">
            <button onClick={() => setShowStatus(true)} title="Set status"
              className="flex-1 text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1">
              <span>{user?.status_emoji || '??'}</span>
              <span className="truncate">{user?.status_text || 'Status'}</span>
            </button>
            <button onClick={loadBookmarks} title="Saved messages"
              className="text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">??</button>
            <button onClick={loadChannelBrowser} title="Browse channels"
              className="text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">??</button>
          </div>
          <button onClick={() => { api.logout(); window.location.href = '/login'; }};

content = content.replace(oldFooter, newFooter);
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
