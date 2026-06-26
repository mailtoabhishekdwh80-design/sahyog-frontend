const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Find line 1787 (</div>) and line 1789 (Poll modal)
// Move Poll modal BEFORE line 1787
const closeDiv = 1786; // index of </div>
const pollLine = lines.findIndex((l,i) => i > closeDiv && l.includes('{/* Poll modal */}'));
console.log('closeDiv:', closeDiv+1, '| pollLine:', pollLine+1);
// Extract modals (from pollLine to end-3)
const endIdx = lines.length - 3; // before ); }
const modals = lines.splice(pollLine, endIdx - pollLine + 3);
// Remove empty line before poll
if(lines[closeDiv] === '') lines.splice(closeDiv, 1);
// Insert modals before closing </div>
const newCloseDiv = lines.findIndex((l,i) => i >= 1784 && l.trim() === '</div>');
lines.splice(newCloseDiv, 0, ...modals.slice(0, -3));
// Add back closing
lines.push(...modals.slice(-3));
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done, total lines:', lines.length);
