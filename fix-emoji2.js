const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');

// Replace the 3 broken button lines with text labels instead of emojis
content = content
  .replace(
    'className="text-xs text-gray-500 hover:text-white transition-colors" title="Set status">{user?.status_emoji || "\uD83D\uDE42"}</button>',
    'className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Set status">Status</button>'
  )
  .replace(
    'className="text-xs text-gray-500 hover:text-white transition-colors" title="Saved">{"\\uD83D\\uDD16"}</button>',
    'className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Saved messages">Saved</button>'
  )
  .replace(
    'className="text-xs text-gray-500 hover:text-white transition-colors" title="Browse channels">{"\\uD83D\\uDD2D"}</button>',
    'className="text-xs text-gray-500 hover:text-white transition-colors px-1.5 py-1 rounded hover:bg-gray-800" title="Browse channels">Channels</button>'
  );
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
