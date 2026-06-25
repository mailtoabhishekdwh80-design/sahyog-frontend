const fs = require('fs');
let lines = fs.readFileSync('lib/api.ts', 'utf8').split('\n');

// Remove duplicate getRecordings (keep first, remove second at line ~149)
let foundFirst = false;
lines = lines.filter(line => {
  if (line.trim().startsWith('getRecordings:')) {
    if (!foundFirst) { foundFirst = true; return true; }
    return false;
  }
  // Remove the orphan apiFetch line for recordings
  if (line.includes('apiFetch') && line.includes('/recordings') && line.includes('meetingId')) return false;
  return true;
});

// Add getComments before moveTask if missing
const content = lines.join('\n');
if (!content.includes('getComments')) {
  const old = '  moveTask: (taskId: string, listId: string, position: number) =>';
  const add = [
    "  getTask:         (taskId) => apiFetch('/boards/task/' + taskId),",
    "  getComments:     (taskId) => apiFetch('/boards/task/' + taskId + '/comments'),",
    "  addComment:      (taskId, c) => apiFetch('/boards/task/' + taskId + '/comments', { method: 'POST', body: JSON.stringify({ content: c }) }),",
    "  getChecklist:    (taskId) => apiFetch('/boards/task/' + taskId + '/checklist'),",
    "  addCheckItem:    (taskId, title) => apiFetch('/boards/task/' + taskId + '/checklist', { method: 'POST', body: JSON.stringify({ title }) }),",
    "  toggleCheckItem: (taskId, itemId, isChecked) => apiFetch('/boards/task/' + taskId + '/checklist/' + itemId, { method: 'PATCH', body: JSON.stringify({ isChecked }) }),",
    "  deleteCheckItem: (taskId, itemId) => apiFetch('/boards/task/' + taskId + '/checklist/' + itemId, { method: 'DELETE' }),",
    "",
    old
  ].join('\n');
  fs.writeFileSync('lib/api.ts', lines.join('\n').replace(old, add));
} else {
  fs.writeFileSync('lib/api.ts', lines.join('\n'));
}
const final = fs.readFileSync('lib/api.ts', 'utf8');
const dups = (final.match(/getRecordings/g) || []).length;
console.log('getComments:', final.includes('getComments'), '| getRecordings count:', dups);
