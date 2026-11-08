const fs = require('fs');
const lines = fs.readFileSync('C:/Users/watsi/.gemini/antigravity/brain/c3912b26-43f4-4c1c-9c09-07cb70dfef91/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');
for (let i = 480; i <= 520; i++) {
  const l = lines.find(line => line.includes('"step_index":' + i + ','));
  if (l) {
    const j = JSON.parse(l);
    if (j.thinking) console.log('Step', i, 'thinking:', j.thinking.slice(0, 300));
    if (j.content && j.source === 'MODEL') console.log('Step', i, 'content:', j.content.slice(0, 300));
  }
}
