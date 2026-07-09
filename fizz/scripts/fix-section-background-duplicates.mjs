import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sectionsDir = path.join(__dirname, '../sections');

const BG_BLOCK =
  /,?\s*\{ "type": "header", "content": "Section background" \},\s*\{ "type": "color", "id": "background_color", "label": "Background color" \}/g;

let fixed = 0;

for (const file of fs.readdirSync(sectionsDir).sort()) {
  if (!file.endsWith('.liquid')) continue;

  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const blocksIdx = content.indexOf('"blocks":');

  if (blocksIdx === -1) continue;

  const beforeBlocks = content.slice(0, blocksIdx);
  const blocksAndAfter = content.slice(blocksIdx);
  const cleaned = blocksAndAfter.replace(BG_BLOCK, '');
  const next = beforeBlocks + cleaned;

  if (next !== content) {
    fs.writeFileSync(filePath, next);
    fixed += 1;
    console.log(`fixed ${file}`);
  }
}

console.log(`Done. Fixed ${fixed} files.`);
