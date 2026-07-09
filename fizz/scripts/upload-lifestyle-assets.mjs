import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE = 'g9rykd-jt.myshopify.com';
const ASSETS_DIR = path.resolve(__dirname, '../assets');
const FILES = [
  'fizz-lifestyle-gallery-hero.jpg',
  'fizz-lifestyle-gallery-poolside.jpg',
  'fizz-lifestyle-gallery-commute.jpg',
  'fizz-lifestyle-gallery-studio.jpg',
  'fizz-lifestyle-gallery-outdoor.jpg',
  'fizz-lifestyle-gallery-social.jpg',
];

function runGraphql(query, variables = {}, allowMutations = false) {
  const args = [
    'store',
    'execute',
    '-s',
    STORE,
    '-j',
    '-q',
    query,
    '-v',
    JSON.stringify(variables),
  ];
  if (allowMutations) args.push('--allow-mutations');
  const output = execFileSync('shopify', args, { encoding: 'utf8' });
  return JSON.parse(output);
}

async function uploadFile(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  const stats = fs.statSync(filePath);
  const mimeType = 'image/jpeg';

  const staged = runGraphql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      input: [
        {
          filename,
          mimeType,
          resource: 'FILE',
          fileSize: String(stats.size),
          httpMethod: 'POST',
        },
      ],
    },
    true
  );

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const param of target.parameters) {
    form.append(param.name, param.value);
  }
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: mimeType }), filename);

  const uploadResponse = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed for ${filename}: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  const created = runGraphql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id alt fileStatus }
        userErrors { field message }
      }
    }`,
    {
      files: [
        {
          alt: filename.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
          contentType: 'IMAGE',
          originalSource: target.resourceUrl,
        },
      ],
    },
    true
  );

  const file = created.fileCreate.files?.[0];
  if (!file) {
    throw new Error(`fileCreate failed for ${filename}: ${JSON.stringify(created.fileCreate.userErrors)}`);
  }
  return file;
}

function ensureAboutUsPage() {
  const existing = runGraphql(`query {
    pages(first: 1, query: "handle:about-us") {
      nodes { id title handle templateSuffix }
    }
  }`);

  const page = existing.pages.nodes[0];
  if (page) {
    const updated = runGraphql(
      `mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id title handle templateSuffix }
          userErrors { field message }
        }
      }`,
      {
        id: page.id,
        page: {
          title: 'About Us',
          handle: 'about-us',
          templateSuffix: 'lifestyle',
          body: '<p>Fizz culture, rituals, and everyday sparkle.</p>',
        },
      },
      true
    );
    return updated.pageUpdate.page;
  }

  const created = runGraphql(
    `mutation pageCreate($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id title handle templateSuffix }
        userErrors { field message }
      }
    }`,
    {
      page: {
        title: 'About Us',
        handle: 'about-us',
        templateSuffix: 'lifestyle',
        body: '<p>Fizz culture, rituals, and everyday sparkle.</p>',
        isPublished: true,
      },
    },
    true
  );

  if (created.pageCreate.userErrors?.length) {
    throw new Error(JSON.stringify(created.pageCreate.userErrors));
  }
  return created.pageCreate.page;
}

const uploaded = [];
for (const filename of FILES) {
  const file = await uploadFile(filename);
  uploaded.push({ filename, id: file.id, status: file.fileStatus });
}

const page = ensureAboutUsPage();
console.log(JSON.stringify({ uploaded, page }, null, 2));
