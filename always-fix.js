const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
// Fix all recurring issues at once
c = c.replace(/onClick=\{logout\}/g, 'onClick={() => api.logout()}');
c = c.replace(/onBoard=\{\(b\) =>/g, 'onBoard={(b: any) =>');
c = c.replace(/onBoard=\{\(b: Board\) =>/g, 'onBoard={(b: any) =>');
c = c.replace(/type Message\s*=\s*\{[^}]+\};/, 'type Message = { id: string; content: string; sender_name: string; sender_id: string; sent_at: string; is_edited?: boolean; is_pinned?: boolean; reply_count?: number; reactions?: Record<string, number>; channel_id?: string; };');
c = c.replace(/\{msg\.reply_count > 0 && \(/g, '{(msg.reply_count ?? 0) > 0 && (');
fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('All fixes applied');
