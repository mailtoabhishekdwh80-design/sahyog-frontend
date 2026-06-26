const fs = require('fs');
const lines = fs.readFileSync('lib/api.ts', 'utf8').split('\n');
lines[158] = "    apiFetch('/boards/task/' + taskId + '/move', { method: 'PATCH', body: JSON.stringify({ listId, position }) }),";
fs.writeFileSync('lib/api.ts', lines.join('\n'));
console.log('Fixed:', lines[158]);
