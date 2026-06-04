// Self-host feed/island images that currently point at external Unsplash URLs.
// Mitigates research.md risk S1 (외부 URL 로딩 실패 / 저작권 / 트래픽 폭증).
//
// WHAT IT DOES
//   1) Reads distinct external image URLs from the live DB (questions +
//      categories) OR, with --from-seed, from supabase/seed_clean.sql.
//   2) Downloads each image.
//   3) Uploads it to a public Supabase Storage bucket (default: feed-images).
//   4) Emits a timestamped migration file under supabase/migrations/ that
//      UPDATEs each old URL to its new Storage public URL, and stamps
//      schema_migrations. Review it, then apply via SQL editor / supabase CLI.
//
// WHY A SCRIPT (not auto-run): uploading requires the service role key and is an
// outward-facing change to your live project. Run it yourself when ready.
//
// PREREQUISITES (env vars — never commit these):
//   SUPABASE_URL=https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # storage write needs this
// Create the bucket once (public) in the dashboard or:
//   supabase storage create feed-images --public
//
// USAGE
//   node scripts/migrate-feed-images-to-storage.mjs            # read from live DB
//   node scripts/migrate-feed-images-to-storage.mjs --from-seed
//   node scripts/migrate-feed-images-to-storage.mjs --bucket my-bucket
//   node scripts/migrate-feed-images-to-storage.mjs --dry-run  # download+plan only

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const FROM_SEED = args.includes('--from-seed');
const DRY_RUN = args.includes('--dry-run');
const BUCKET = argValue('--bucket') ?? 'feed-images';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --dry-run).');
  process.exit(1);
}

const EXTERNAL_RE = /^https?:\/\/(images\.unsplash\.com|source\.unsplash\.com)/i;

const urls = FROM_SEED ? await collectFromSeed() : await collectFromDb();
const external = [...new Set(urls)].filter((u) => EXTERNAL_RE.test(u));

if (external.length === 0) {
  console.log('No external image URLs found. Nothing to migrate.');
  process.exit(0);
}
console.log(`Found ${external.length} distinct external image URL(s).`);

const mapping = []; // { oldUrl, newUrl }
for (const oldUrl of external) {
  const ext = guessExt(oldUrl);
  const key = `${createHash('sha1').update(oldUrl).digest('hex').slice(0, 16)}.${ext}`;
  const bytes = await download(oldUrl);
  if (!bytes) continue;

  if (DRY_RUN) {
    console.log(`[dry-run] ${oldUrl} -> ${BUCKET}/${key} (${bytes.length} bytes)`);
    mapping.push({ oldUrl, newUrl: `${SUPABASE_URL ?? '<SUPABASE_URL>'}/storage/v1/object/public/${BUCKET}/${key}` });
    continue;
  }

  const newUrl = await upload(key, bytes);
  if (newUrl) {
    console.log(`uploaded ${oldUrl} -> ${newUrl}`);
    mapping.push({ oldUrl, newUrl });
  }
}

if (mapping.length === 0) {
  console.error('No images migrated.');
  process.exit(1);
}

writeMigration(mapping);
console.log(`\nDone. Review the emitted migration, then apply it. (${mapping.length} URL rewrites)`);

// ---------- helpers ----------

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function guessExt(url) {
  const m = url.split('?')[0].match(/\.(jpe?g|png|webp|avif|gif)$/i);
  return (m ? m[1] : 'jpg').toLowerCase().replace('jpeg', 'jpg');
}

async function collectFromSeed() {
  const path = join('supabase', 'seed_clean.sql');
  const text = readFileSync(path, 'utf8');
  return text.match(/https?:\/\/[^'")\s]+/g) ?? [];
}

async function collectFromDb() {
  const found = [];
  for (const [table, cols] of [
    ['questions', ['option_a_image_url', 'option_b_image_url']],
    ['categories', ['image_url']]
  ]) {
    const select = cols.join(',');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    if (!res.ok) {
      console.warn(`Skip ${table}: ${res.status}`);
      continue;
    }
    for (const row of await res.json()) {
      for (const c of cols) if (row[c]) found.push(row[c]);
    }
  }
  return found;
}

async function download(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`download failed ${res.status}: ${url}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn(`download error: ${url} (${e.message})`);
    return null;
  }
}

async function upload(key, bytes) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: bytes
  });
  if (!res.ok) {
    console.warn(`upload failed ${res.status}: ${key} ${await res.text()}`);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

function writeMigration(rows) {
  const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const file = join('supabase', 'migrations', `${version}_self_host_feed_images.sql`);
  const updates = rows
    .map(({ oldUrl, newUrl }) => {
      const o = oldUrl.replace(/'/g, "''");
      const n = newUrl.replace(/'/g, "''");
      return [
        `UPDATE public.questions SET option_a_image_url = '${n}' WHERE option_a_image_url = '${o}';`,
        `UPDATE public.questions SET option_b_image_url = '${n}' WHERE option_b_image_url = '${o}';`,
        `UPDATE public.categories SET image_url = '${n}' WHERE image_url = '${o}';`
      ].join('\n');
    })
    .join('\n\n');
  const sql = `-- Auto-generated: rewrite external image URLs to self-hosted Storage URLs.\n-- Generated by scripts/migrate-feed-images-to-storage.mjs\n\n${updates}\n\nINSERT INTO public.schema_migrations (version, name)\nVALUES ('${version}', 'self_host_feed_images')\nON CONFLICT (version) DO NOTHING;\n`;
  writeFileSync(file, sql, 'utf8');
  console.log(`Wrote migration: ${file}`);
}
