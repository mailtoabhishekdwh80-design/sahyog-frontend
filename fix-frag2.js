const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Remove the blank line 1788 and move Poll modal inside </div>
// Line 1786 = '    </div>' - change to keep modals before it
const divIdx = lines.findIndex((l,i) => i >= 1784 && l.trim() === '</div>');
console.log('Found closing div at:', divIdx+1);
// Remove lines from divIdx onwards until end of return, reinsert in right order
const pollStart = lines.findIndex(l => l.includes('{/* Poll modal */}'));
const modals = lines.splice(pollStart);
// Now insert modals before the closing div
const newDivIdx = lines.findIndex((l,i) => i >= 1782 && l.trim() === '</div>');
lines.splice(newDivIdx, 0, ...modals);
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done');
