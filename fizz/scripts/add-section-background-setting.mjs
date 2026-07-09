import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sectionsDir = path.join(__dirname, '../sections');
const SPACING_RENDER = "{% render 'fizz-section-spacing', section: section %}\n\n";
const SKIP_FILES = new Set(['nextfil-app-wrapper.liquid']);

const BG_SETTINGS = `
    { "type": "header", "content": "Section background" },
    { "type": "color", "id": "background_color", "label": "Background color" }`;

function prependSpacingRender(content) {
  if (content.includes("render 'fizz-section-spacing'")) {
    return content;
  }

  const commentMatch = content.match(/^(\{% comment %\}[\s\S]*?\{% endcomment %\}\n*)/);
  if (commentMatch) {
    return commentMatch[1] + SPACING_RENDER + content.slice(commentMatch[1].length);
  }

  return SPACING_RENDER + content;
}

function addBackgroundSchema(content) {
  if (content.includes('"id": "background_color"')) {
    return content;
  }

  return content.replace(/"settings": \[([\s\S]*?)\n {2}\],/g, (match, settingsBody) => {
    if (settingsBody.includes('background_color')) {
      return match;
    }

    const trimmed = settingsBody.replace(/\s+$/, '');
    const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');

    return `"settings": [${settingsBody}${needsComma ? ',' : ''}${BG_SETTINGS}\n  ],`;
  });
}

let updated = 0;

for (const file of fs.readdirSync(sectionsDir).sort()) {
  if (!file.endsWith('.liquid') || SKIP_FILES.has(file)) {
    continue;
  }

  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('{% schema %}')) {
    continue;
  }

  const next = addBackgroundSchema(prependSpacingRender(content));

  if (next !== content) {
    fs.writeFileSync(filePath, next);
    updated += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`Done. Updated ${updated} section files.`);
