const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
content = content
  .replace('{user?.status_emoji || "??"}', '{user?.status_emoji || "??"}')
  .replace('className="text-xs text-gray-500 hover:text-white transition-colors" title="Saved">??</button>', 'className="text-xs text-gray-500 hover:text-white transition-colors" title="Saved">{"??"}</button>')
  .replace('className="text-xs text-gray-500 hover:text-white transition-colors" title="Browse channels">??</button>', 'className="text-xs text-gray-500 hover:text-white transition-colors" title="Browse channels">{"??"}</button>');
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
