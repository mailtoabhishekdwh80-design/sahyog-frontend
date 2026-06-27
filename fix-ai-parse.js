const fs = require('fs');
let c = fs.readFileSync('components/KanbanView.tsx', 'utf8');
// Remove debug log
c = c.replace(
  'const res = await api.aiSuggestTasks(aiProjectDesc.trim(), boardId); console.log("AI res:", JSON.stringify(res));',
  'const res = await api.aiSuggestTasks(aiProjectDesc.trim(), boardId);'
);
// Fix to use raw if tasks empty
c = c.replace(
  'if (res?.data?.tasks?.length > 0) {\n      setAiSuggestedTasks(res.data.tasks);\n    } else {\n      const errMsg = res?.data?.error || res?.data?.raw || \'Could not generate tasks. Try a more detailed description.\';\n      setAiError(typeof errMsg === \'string\' ? errMsg.substring(0, 200) : \'No tasks returned. Check AI configuration.\');\n    }',
  let tasks = res?.data?.tasks || [];
    if (tasks.length === 0 && res?.data?.raw) {
      try {
        const raw = res.data.raw;
        const match = raw.match(/\\[([\\s\\S]+?)\\]/);
        if (match) tasks = JSON.parse('[' + match[1] + ']');
      } catch(e) {}
    }
    if (tasks.length > 0) {
      setAiSuggestedTasks(tasks);
    } else {
      setAiError('Could not generate tasks. Try a more detailed description.');
    }
);
fs.writeFileSync('components/KanbanView.tsx', c);
console.log('Done');
