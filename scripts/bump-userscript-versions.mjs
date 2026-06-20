#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ROOT_FILES = ['thefp.js'];
const SCRIPT_GLOB = /^scripts\/.+\.user\.js$/;

function usage() {
  console.error('Usage: node scripts/bump-userscript-versions.mjs --changed|--all');
  process.exit(2);
}

function allUserscripts() {
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  return tracked.filter((path) => ROOT_FILES.includes(path) || SCRIPT_GLOB.test(path));
}

function changedUserscripts() {
  const changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const scripts = new Set(allUserscripts());
  return changed.filter((path) => scripts.has(path));
}

function bumpPatch(version) {
  const parts = version.split('.').map((part) => Number.parseInt(part, 10));
  while (parts.length < 3) parts.push(0);
  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Cannot bump non-numeric version: ${version}`);
  }
  parts[2] += 1;
  return parts.slice(0, 3).join('.');
}

async function bumpFile(path) {
  const source = await readFile(path, 'utf8');
  let changed = false;
  const next = source.replace(/(\/\/\s+@version\s+)(\S+)/, (_match, prefix, version) => {
    changed = true;
    return `${prefix}${bumpPatch(version)}`;
  });

  if (!changed) {
    throw new Error(`No @version metadata found in ${path}`);
  }

  await writeFile(path, next);
  console.log(`bumped ${path}`);
}

const mode = process.argv[2];
if (mode !== '--changed' && mode !== '--all') usage();

const files = mode === '--all' ? allUserscripts() : changedUserscripts();
for (const file of files) {
  await bumpFile(file);
}

if (files.length === 0) {
  console.log('no userscript versions to bump');
}
