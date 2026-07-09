import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sectionsDir = path.join(__dirname, '../sections');

const BG_SETTINGS = `    { "type": "header", "content": "Section background" },
    { "type": "color", "id": "background_color", "label": "Background color" }`;

const EMPTY_SETTINGS_REPLACEMENT = `"settings": [
    { "type": "header", "content": "Section background" },
    { "type": "color", "id": "background_color", "label": "Background color" }
  ]`;

const REMAINING = [
  '404.liquid',
  'article.liquid',
  'blog.liquid',
  'cart.liquid',
  'collection.liquid',
  'custom-section.liquid',
  'footer.liquid',
  'header.liquid',
  'hello-world.liquid',
  'ks-footer.liquid',
  'ks-header.liquid',
  'page.liquid',
  'password.liquid',
  'product.liquid',
  'search.liquid',
];

for (const file of REMAINING) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('"id": "background_color"')) {
    continue;
  }

  if (content.includes('"settings": []')) {
    content = content.replace('"settings": []', EMPTY_SETTINGS_REPLACEMENT);
  } else {
    content = content.replace(
      /"settings": \[([\s\S]*?)\n {2}\],/,
      (match, body) => {
        const trimmed = body.replace(/\s+$/, '');
        const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');
        return `"settings": [${body}${needsComma ? ',' : ''}\n${BG_SETTINGS}\n  ],`;
      }
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`patched ${file}`);
}
