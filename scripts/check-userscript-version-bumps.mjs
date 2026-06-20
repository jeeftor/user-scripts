#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const ROOT_FILES = new Set(['thefp.js']);
const SCRIPT_GLOB = /^scripts\/.+\.user\.js$/;
const ZERO_SHA = /^0+$/;

function usage() {
  console.error('Usage: node scripts/check-userscript-version-bumps.mjs <base-sha> <head-sha>');
  process.exit(2);
}

function isUserscript(path) {
  return ROOT_FILES.has(path) || SCRIPT_GLOB.test(path);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function changedUserscripts(base, head) {
  return git(['diff', '--name-only', base, head])
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(isUserscript);
}

function fileExistsAt(ref, path) {
  try {
    git(['cat-file', '-e', `${ref}:${path}`]);
    return true;
  } catch {
    return false;
  }
}

function versionAt(ref, path) {
  const source = git(['show', `${ref}:${path}`]);
  const match = source.match(/\/\/\s+@version\s+(\S+)/);
  return match ? match[1] : '';
}

const [base, head] = process.argv.slice(2);
if (!base || !head) usage();

if (ZERO_SHA.test(base)) {
  console.log('skipping version bump check for initial push');
  process.exit(0);
}

const failures = [];
for (const path of changedUserscripts(base, head)) {
  if (!fileExistsAt(base, path) || !fileExistsAt(head, path)) {
    continue;
  }

  const before = versionAt(base, path);
  const after = versionAt(head, path);
  if (!before || !after || before === after) {
    failures.push(`${path}: ${before || '(missing)'} -> ${after || '(missing)'}`);
  }
}

if (failures.length > 0) {
  console.error('Changed userscripts must bump @version:');
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log('userscript version bumps verified');
