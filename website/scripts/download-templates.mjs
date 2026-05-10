// 从 pokemon.json 批量下载精灵头像模板
// 用法: node scripts/download-templates.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POKEMON_PATH = join(ROOT, 'src', 'config', 'pokemon.json');
const OUT_DIR = join(ROOT, 'resources', 'templates', 'pets');

mkdirSync(OUT_DIR, { recursive: true });

// 把 wiki 缩略图 URL 转成原图 URL
// thumb/.../180px-xxx.png → 原始文件
function toOriginalUrl(url) {
  if (!url.includes('/thumb/')) return url;
  // /thumb/X/Y/filename.png/180px-xxx.png → /X/Y/filename.png
  return url
    .replace('/thumb/', '/')
    .replace(/\/\d+px-.*$/, '');
}

const pokemonList = JSON.parse(readFileSync(POKEMON_PATH, 'utf-8'));
const total = pokemonList.length;
let success = 0;
let skipped = 0;
let failed = 0;

console.log(`共 ${total} 只精灵，开始下载...\n`);

for (let i = 0; i < total; i++) {
  const { name, image_url } = pokemonList[i];
  if (!image_url) { skipped++; continue; }

  const outPath = join(OUT_DIR, `${name}.png`);
  if (existsSync(outPath)) {
    console.log(`[${i + 1}/${total}] ${name} 已存在，跳过`);
    skipped++;
    continue;
  }

  const originalUrl = toOriginalUrl(image_url);

  try {
    const res = await fetch(originalUrl);
    if (!res.ok) {
      console.error(`[${i + 1}/${total}] ${name} 下载失败 (HTTP ${res.status})`);
      failed++;
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(outPath, buf);
    console.log(`[${i + 1}/${total}] ${name} ✓ (${(buf.length / 1024).toFixed(1)} KB)`);
    success++;

    // 限速，避免被 ban
    await new Promise((r) => setTimeout(r, 200));
  } catch (err) {
    console.error(`[${i + 1}/${total}] ${name} 下载失败: ${err.message}`);
    failed++;
  }
}

console.log(`\n=== 完成 ===`);
console.log(`成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`);
