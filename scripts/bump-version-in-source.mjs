#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_FILE = 'mustache.js';
const VERSION_PATTERN = /version: '([^']+)'/;

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const source = readFileSync(SOURCE_FILE, 'utf8');
const match = source.match(VERSION_PATTERN);

if (!match) {
  console.error(`ERROR: Can't find version in '${SOURCE_FILE}'`);
  process.exit(1);
}

if (match[1] === version) {
  process.exit(0);
}

console.log(`> bumping version in '${SOURCE_FILE}': ${match[1]} -> ${version}...`);
writeFileSync(SOURCE_FILE, source.replace(VERSION_PATTERN, `version: '${version}'`));

execFileSync('git', ['add', SOURCE_FILE]);
execFileSync('git', ['commit', '--amend', '--no-edit']);

console.log(`successfully bumped version to ${version}!`);
console.log("don't forget to `npm publish`!");
