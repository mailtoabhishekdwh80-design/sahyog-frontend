const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
content = content.replace(
  "    if (ws.current?.readyState === WebSocket.OPEN) {\n      ws.current.send(JSON.stringify({ type: 'channel.join', payload: { channelId: dm.id } }));\n    }",
  "    subscribe(dm.id);"
);
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
