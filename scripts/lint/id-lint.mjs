#!/usr/bin/env node
// id-lint.mjs - ID/Index 校验器
//
// 校验 openspec/changes/<change>/ 下工件文件的 Index 段与 ID 一致性。
// 移植自 BMW DX Workflow v2.1 的 dx-lint-ids.sh。
//
// 校验规则：
//   1. 工件文件必须含 ## Index 段
//   2. Index 段必须含 version: 整数
//   3. Index 段必须含 derived_from: [...]
//   4. Index 中声明的每个 ID 在正文必须存在
//   5. Index 中的 ID 不可重复
//   6. derived_from 引用的上游工件必须存在
//   7. derived_from 上游版本不可领先于实际上游 version
//
// 退出码：0 = PASS，非 0 = FAIL
//
// 使用：
//   node scripts/lint/id-lint.mjs [--changes <dir>]

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const RED = '\u001b[0;31m';
const YELLOW = '\u001b[0;33m';
const GREEN = '\u001b[0;32m';
const NC = '\u001b[0m';

const args = process.argv.slice(2);
let changesDir = 'openspec/changes';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--changes' && args[i + 1]) {
    changesDir = args[i + 1];
    i++;
  }
}

const root = process.cwd();
const absoluteChangesDir = path.isAbsolute(changesDir)
  ? changesDir
  : path.join(root, changesDir);

let errors = 0;
let warnings = 0;

function err(msg) {
  console.error(`${RED}[ERROR]${NC} ${msg}`);
  errors++;
}

function warn(msg) {
  console.error(`${YELLOW}[WARN]${NC}  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`${GREEN}[OK]${NC}    ${msg}`);
}

if (!existsSync(absoluteChangesDir)) {
  console.log(`${changesDir} not found (no changes yet, skip)`);
  process.exit(0);
}

const fileVersionMap = new Map();

const changeDirs = readdirSync(absoluteChangesDir).filter((name) => {
  const full = path.join(absoluteChangesDir, name);
  return existsSync(full);
});

let totalArtifacts = 0;
const allArtifacts = [];

for (const changeName of changeDirs) {
  const changePath = path.join(absoluteChangesDir, changeName);
  let entries;
  try {
    entries = readdirSync(changePath);
  } catch {
    continue;
  }

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    if (entry === 'tasks.md') continue;
    const artifactPath = path.join(changePath, entry);
    allArtifacts.push({ change: changeName, file: entry, path: artifactPath });
    totalArtifacts++;
  }
}

if (totalArtifacts === 0) {
  console.log(`no artifacts under ${changesDir} (skip)`);
  process.exit(0);
}

function extractVersion(content) {
  const match = content.match(/^version:\s*(\d+)/m);
  return match ? match[1] : null;
}

function extractDerivedFrom(content) {
  const match = content.match(/^derived_from:\s*\[(.*?)\]/m);
  return match ? match[1].trim() : null;
}

function extractIndexBlock(content) {
  const lines = content.split('\n');
  let inBlock = false;
  const block = [];
  for (const line of lines) {
    if (line.match(/^##\s+Index\b/)) {
      inBlock = true;
      continue;
    }
    if (inBlock && line.match(/^##\s+/)) break;
    if (inBlock) block.push(line);
  }
  return block.join('\n');
}

function extractIds(indexBlock) {
  // 移除 HTML 注释
  const cleaned = indexBlock.replace(/<!--[\s\S]*?-->/g, '');
  const idPattern = /^-\s+([A-Z][A-Z0-9_-]*(?:-[A-Z0-9]+)*-?\d*)\s*[:→]/gm;
  const ids = [];
  let m;
  while ((m = idPattern.exec(cleaned)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

function findIdInBody(content, id) {
  // 在 Index 段之后的正文中查找
  const lines = content.split('\n');
  let afterIndex = false;
  for (const line of lines) {
    if (line.match(/^---\s*$/)) {
      afterIndex = true;
      continue;
    }
    if (!afterIndex) continue;
    const pattern = new RegExp(`(?:^|[^A-Z0-9])${id}(?:[^A-Z0-9]|$)`);
    if (pattern.test(line)) return true;
  }
  return false;
}

// 第一轮：检查每个工件的 Index 完整性
for (const { change, file, path: artifactPath } of allArtifacts) {
  const baseName = `${change}/${file.replace(/\.md$/, '')}`;
  let content;
  try {
    content = readFileSync(artifactPath, 'utf8');
  } catch (e) {
    err(`${baseName}: 无法读取 - ${e.message}`);
    continue;
  }

  if (!/^##\s+Index\b/m.test(content)) {
    err(`${baseName}: 缺少 ## Index 段`);
    continue;
  }

  const version = extractVersion(content);
  if (!version) {
    err(`${baseName}: Index 缺少 version 字段（应为：version: <整数>）`);
  } else {
    fileVersionMap.set(baseName, version);
  }

  const derivedFrom = extractDerivedFrom(content);
  if (derivedFrom === null) {
    err(`${baseName}: Index 缺少 derived_from 字段（应为：derived_from: [...]）`);
  }
}

// 第二轮：检查 ID 一致性、derived_from 一致性
for (const { change, file, path: artifactPath } of allArtifacts) {
  const baseName = `${change}/${file.replace(/\.md$/, '')}`;
  const content = readFileSync(artifactPath, 'utf8');
  const indexBlock = extractIndexBlock(content);
  const ids = extractIds(indexBlock);

  // ID 重复检查
  if (ids.length > 0) {
    const seen = new Set();
    const dups = new Set();
    for (const id of ids) {
      if (seen.has(id)) dups.add(id);
      seen.add(id);
    }
    if (dups.size > 0) {
      err(`${baseName}: Index 中存在重复 ID：${[...dups].join(', ')}`);
    }
  }

  // 校验每个 ID 在正文存在
  if (ids.length > 0) {
    for (const id of ids) {
      if (!findIdInBody(content, id)) {
        warn(`${baseName}: Index 声明 ID '${id}' 但正文未引用（请确认是否为示例占位）`);
      }
    }
  }

  // derived_from 上游版本一致性校验
  const derivedLine = content.match(/^derived_from:\s*\[(.*?)\]/m);
  if (derivedLine) {
    const upstreamPattern = /([a-z][a-z0-9_-]+)@v?(\d+)/g;
    let m;
    while ((m = upstreamPattern.exec(derivedLine[1])) !== null) {
      const [, upName, upVer] = m;
      // 查找上游工件
      let found = false;
      for (const candidate of allArtifacts) {
        const candidateBase = candidate.file.replace(/\.md$/, '');
        if (candidateBase === upName || candidateBase.includes(upName)) {
          found = true;
          const actualVer = fileVersionMap.get(`${candidate.change}/${candidateBase}`);
          if (actualVer && upVer !== actualVer) {
            if (parseInt(upVer, 10) < parseInt(actualVer, 10)) {
              warn(`${baseName}: derived_from 落后于上游 '${upName}'（声明 v${upVer}，实际 v${actualVer}）—— 本工件可能过时`);
            } else {
              err(`${baseName}: derived_from 声明上游 '${upName}@v${upVer}' 高于实际 v${actualVer}`);
            }
          }
          break;
        }
      }
      if (!found) {
        warn(`${baseName}: derived_from 引用上游 '${upName}' 但找不到对应工件文件`);
      }
    }
  }
}

console.log('');
console.log('====================');
console.log(' ID Lint 结果');
console.log('====================');
console.log(` 工件数：${totalArtifacts}`);
console.log(` 错误：${errors}`);
console.log(` 警告：${warnings}`);
console.log('====================');

if (errors > 0) {
  console.log(`${RED}FAIL${NC}`);
  process.exit(1);
}

ok('PASS');
process.exit(0);
