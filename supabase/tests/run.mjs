// Database test runner. Builds a fresh database, applies the Supabase stand-in (plain Postgres only),
// every migration in order, the test helpers, then runs each tests/database/*.test.sql (pgTAP).
// Usage: DATABASE_URL=postgres://postgres@localhost:54329/postgres node supabase/tests/run.mjs
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const admin = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:54329/postgres';
const dbName = 'pohnch_test';
const testUrl = admin.replace(/\/[^/?]*(\?|$)/, `/${dbName}$1`);

const psql = (url, args, opts = {}) =>
  execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', url, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });

psql(admin, ['-c', `drop database if exists ${dbName} with (force)`, '-c', `create database ${dbName}`]);

const hasAuth = psql(testUrl, ['-tAc', "select to_regclass('auth.users') is not null"]).trim() === 't';
if (!hasAuth) psql(testUrl, ['-f', join(here, 'shim.sql')]);

const migrations = readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const m of migrations) {
  try {
    psql(testUrl, ['-f', join(root, 'migrations', m)]);
  } catch (e) {
    console.error(`migration ${m} failed:\n${e.stderr}`);
    process.exit(1);
  }
}
psql(testUrl, ['-f', join(here, 'helpers.sql')]);
psql(testUrl, ['-f', join(here, 'fixtures.sql')]);

let failed = 0;
let passed = 0;
const files = readdirSync(join(here, 'database')).filter((f) => f.endsWith('.test.sql')).sort();
for (const f of files) {
  let out = '';
  try {
    out = psql(testUrl, ['-tA', '-f', join(here, 'database', f)]);
  } catch (e) {
    console.error(`✗ ${f}: SQL error\n${e.stderr}`);
    failed++;
    continue;
  }
  const lines = out.split('\n');
  const bad = lines.filter((l) => l.startsWith('not ok') || l.startsWith('# Looks like'));
  const ok = lines.filter((l) => l.startsWith('ok')).length;
  passed += ok;
  if (bad.length) {
    failed++;
    console.error(`✗ ${f}\n${lines.filter((l) => l.startsWith('not ok') || l.startsWith('#')).join('\n')}`);
  } else {
    console.log(`✓ ${f} (${ok} checks)`);
  }
}
console.log(`\n${passed} checks passed, ${failed} file(s) failed, ${migrations.length} migration(s) applied`);
process.exit(failed ? 1 : 0);
