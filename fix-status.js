const fs = require('fs');
let c = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');

// Add Available as first preset option
c = c.replace(
  "{ emoji: '??', text: 'In a meeting' },",
  "{ emoji: '', text: 'Available' },\n                { emoji: '\uD83D\uDCBC', text: 'In a meeting' },"
);

// Fix Clear button to properly reset
c = c.replace(
  "onClick={async () => { setStatusEmoji(''); setStatusText(''); await api.setStatus('', ''); setShowStatus(false); }}",
  "onClick={async () => { setStatusEmoji(''); setStatusText(''); await api.setStatus('', ''); setUser((u) => u ? { ...u, status_emoji: '', status_text: '' } : u); setShowStatus(false); }}"
);

fs.writeFileSync('components/WorkspaceShell.tsx', c);
console.log('Done');
