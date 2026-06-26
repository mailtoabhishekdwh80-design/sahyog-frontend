const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
content = content.replace(
  'ch.unread_count > 99 ? \'99+\' : ch.unread_count',
  '(ch.unread_count ?? 0) > 99 ? \'99+\' : ch.unread_count'
);
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
