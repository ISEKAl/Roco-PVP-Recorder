import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { PokemonConfig } from '../../src/types';

// 从编译后的 dist 找模板目录，和 package.json 同目录
function getTemplatesDir(): string {
  // __dirname = dist/main/ → 上两级是项目根
  return join(__dirname, '../../resources/templates/pets');
}

// 读取 resources/templates/pets/ 下所有 .png → Map<精灵名, string路径>
export function loadTemplateNames(): string[] {
  const dir = getTemplatesDir();
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
    return files.map((f) => f.replace('.png', ''));
  } catch {
    return [];
  }
}

// 模板目录的绝对路径（供 MAA Resource 加载）
export function getTemplatesPath(): string {
  return getTemplatesDir();
}

// 从 pokemon.json 读取精灵名列表（编译后不可用 import，直接读 JSON）
export function loadPokemonNames(): string[] {
  try {
    // 项目根下的 src/config/pokemon.json
    const path = join(__dirname, '../../src/config/pokemon.json');
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw) as PokemonConfig[];
    return data.map((p) => p.name);
  } catch {
    return [];
  }
}
