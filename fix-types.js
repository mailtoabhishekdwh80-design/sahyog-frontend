const fs = require('fs');
let content = fs.readFileSync('lib/api.ts', 'utf8');
content = content
  .replace("  getTask:         (taskId) =>", "  getTask:         (taskId: string) =>")
  .replace("  getComments:     (taskId) =>", "  getComments:     (taskId: string) =>")
  .replace("  addComment:      (taskId, c) =>", "  addComment:      (taskId: string, c: string) =>")
  .replace("  addComment:      (taskId, content) =>", "  addComment:      (taskId: string, content: string) =>")
  .replace("  getChecklist:    (taskId) =>", "  getChecklist:    (taskId: string) =>")
  .replace("  addCheckItem:    (taskId, title) =>", "  addCheckItem:    (taskId: string, title: string) =>")
  .replace("  toggleCheckItem: (taskId, itemId, isChecked) =>", "  toggleCheckItem: (taskId: string, itemId: string, isChecked: boolean) =>")
  .replace("  deleteCheckItem: (taskId, itemId) =>", "  deleteCheckItem: (taskId: string, itemId: string) =>");
fs.writeFileSync('lib/api.ts', content);
console.log('Done');
