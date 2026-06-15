#!/usr/bin/env node
// Atomically reserve the next sequential report number.
//
// Usage:
//   node reserve-report-num.mjs            -> prints next number (zero-padded, e.g. "297")
//   node reserve-report-num.mjs --release N -> releases reservation N so a future
//                                               run can reuse it if N was never written
import { readdirSync, existsSync, mkdirSync, unlinkSync, openSync, closeSync, constants } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, 'reports');
const RESERVE_DIR = join(ROOT, '.report-reservations');

function maxFromDir(dir, pattern) {
  let max = 0;
  if (!existsSync(dir)) return max;
  for (const f of readdirSync(dir)) {
    const m = f.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

const args = process.argv.slice(2);

if (args[0] === '--release') {
  const num = args[1];
  if (!num) {
    console.error('Usage: node reserve-report-num.mjs --release <num>');
    process.exit(1);
  }
  const lockFile = join(RESERVE_DIR, `${num}.lock`);
  if (existsSync(lockFile)) unlinkSync(lockFile);
  process.exit(0);
}

if (!existsSync(RESERVE_DIR)) mkdirSync(RESERVE_DIR, { recursive: true });

const baseline = Math.max(
  maxFromDir(REPORTS_DIR, /^(\d+)-/),
  maxFromDir(RESERVE_DIR, /^(\d+)\.lock$/)
);

let candidate = baseline + 1;
for (;;) {
  const lockFile = join(RESERVE_DIR, `${candidate}.lock`);
  try {
    closeSync(openSync(lockFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY));
    break;
  } catch (e) {
    if (e.code === 'EEXIST') {
      candidate++;
      continue;
    }
    throw e;
  }
}

console.log(String(candidate).padStart(3, '0'));
