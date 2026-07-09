#!/usr/bin/env node
/**
 * Fetch Stitch screen HTML + screenshots for Fizz PDP and cart.
 * Requires: STITCH_API_KEY
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DESIGN_ROOT = join(ROOT, 'design', 'stitch');
const ASSETS = join(ROOT, 'assets');
const MAP_PATH = join(ASSETS, 'stitch-asset-map.json');

const PROJECT_ID = '13307174822560991499';
const SCREENS = [
  { id: 'e824092ed29e40bfa8e1679f38bd8d91', slug: 'pdp', title: 'Fizz Origin - Product Detail Page' },
  { id: '72772ecf9b9b4bcfb600fdd33956bb96', slug: 'cart', title: 'Fizz - Premium Shopping Cart' },
];

async function download(url, dest) {
  if (!url) return false;
  execSync(`curl -fsSL "${url}" -o "${dest}"`, { stdio: 'inherit' });
  return true;
}

function extractImageUrls(html) {
  const re = /https:\/\/lh3\.googleusercontent\.com\/[^"'\s)]+/g;
  return [...new Set(html.match(re) || [])];
}

async function appendAssetMap(entries) {
  let map = {};
  if (existsSync(MAP_PATH)) {
    map = JSON.parse(await readFile(MAP_PATH, 'utf8'));
  }
  Object.assign(map, entries);
  await writeFile(MAP_PATH, JSON.stringify(map, null, 2) + '\n');
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error('STITCH_API_KEY is not set. Export it and re-run.');
    process.exit(1);
  }

  const { stitch } = await import('@google/stitch-sdk');
  const project = stitch.project(PROJECT_ID);
  const notes = ['# Stitch design notes', '', `Project: ${PROJECT_ID}`, ''];

  for (const screenMeta of SCREENS) {
    const dir = join(DESIGN_ROOT, screenMeta.slug);
    await mkdir(dir, { recursive: true });

    console.log(`\n==> ${screenMeta.title} (${screenMeta.id})`);
    const screen = await project.getScreen(screenMeta.id);
    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();

    const htmlPath = join(dir, 'reference.html');
    const pngPath = join(dir, 'reference.png');
    const metaPath = join(dir, 'meta.json');

    await download(htmlUrl, htmlPath);
    await download(imageUrl, pngPath);
    await writeFile(
      metaPath,
      JSON.stringify({ id: screenMeta.id, title: screenMeta.title, htmlUrl, imageUrl }, null, 2)
    );

    const html = await readFile(htmlPath, 'utf8');
    const urls = extractImageUrls(html);
    const newEntries = {};
    urls.forEach((url, i) => {
      const filename = `stitch-${screenMeta.slug}-${i + 1}.jpg`;
      const dest = join(ASSETS, filename);
      try {
        execSync(`curl -fsSL "${url}" -o "${dest}"`, { stdio: 'pipe' });
        newEntries[url] = filename;
        console.log(`  asset: ${filename}`);
      } catch (e) {
        console.warn(`  skip asset ${i + 1}`);
      }
    });
    if (Object.keys(newEntries).length) await appendAssetMap(newEntries);

    notes.push(`## ${screenMeta.title}`, `- Screen ID: \`${screenMeta.id}\``, `- Reference: \`design/stitch/${screenMeta.slug}/\``, '');
  }

  notes.push(
    '## Tokens (extract from reference.html)',
    '- Fonts: Hanken Grotesk, JetBrains Mono (label caps)',
    '- Surfaces: #030303 bg, glass-card panels',
    '- Accent: product color slug or #FF7F50 coral',
    '- Radius: 1rem media, 9999px CTAs',
    '- Max width: 1280px commerce, 1440px rails'
  );

  await writeFile(join(DESIGN_ROOT, 'DESIGN-NOTES.md'), notes.join('\n') + '\n');
  console.log('\nDone. See fizz/design/stitch/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
