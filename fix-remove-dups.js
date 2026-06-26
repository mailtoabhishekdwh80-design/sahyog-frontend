const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
const toRemove = ['polls,','showPollCreate,','pollQuestion,','pollOptions,','showWhiteboard,','activeMeetingId,'];
const result = lines.filter((l, i) => {
  if(i > 150) return true; // only check main component state area
  const isdup = toRemove.some(name => l.includes('const [' + name));
  if(isdup) console.log('Removing line', i+1, ':', l.trim());
  return !isdup;
});
fs.writeFileSync('components/WorkspaceShell.tsx', result.join('\n'));
console.log('Done');
