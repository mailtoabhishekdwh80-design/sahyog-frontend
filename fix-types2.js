const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
c = c.replace('onBoard={(b: Board) =>', 'onBoard={(b: any) =>');
c = c.replace('onBoard={(b) =>', 'onBoard={(b: any) =>');
c = c.replace('{(msg.reply_count ?? 0) > 0 && (', '{(msg.reply_count ?? 0) > 0 && (');
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
