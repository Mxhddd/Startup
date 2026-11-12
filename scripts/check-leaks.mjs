// Checks that no secret, token, phone number or child's name can leak (CLAUDE.md, data rules).
//
//   node scripts/check-leaks.mjs                       source checks only
//   node scripts/check-leaks.mjs apps/web/.next/static apps/parent/dist ...   also scan built bundles
//
// 1. Source: no console.* outside the two Edge Function entry points; every server log line may only
//    print an allowed field (the action, the HTTP status, the push step and counts); every crash
//    report setup (Sentry.init) scrubs reports and attaches no screenshots or personal data.
// 2. Git: no .env file is committed (only .env.example).
// 3. Bundles: no service-role key or other server secret, no private key, and no phone number except
//    the public pilot WhatsApp number. (Children's names never reach a bundle: they come from the
//    database at run time. The practice run's pretend names are deliberate.)
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const problems = [];

function walk(dir, keep) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', 'dist', '.expo', 'test-results', 'playwright-report'].includes(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, keep));
    else if (keep(p)) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- 1. source
const SOURCE_DIRS = ['apps/parent/src', 'apps/driver/src', 'apps/web/app', 'packages', 'supabase/functions'].map((d) => join(root, d));
const isCode = (p) => /\.(ts|tsx|js|mjs)$/.test(p) && !/\.test\.|\/e2e\//.test(p);
const ALLOWED_CONSOLE = ['supabase/functions/app/index.ts', 'supabase/functions/send-sms/index.ts'];
// The only things a server log line may print.
const ALLOWED_LOG_VARS = new Set(["action ? name : 'unknown'", 'status', 'job.step', 'sent', 'dead.length', 'res.ok ? 200 : 502']);

for (const file of SOURCE_DIRS.flatMap((d) => walk(d, isCode))) {
  const rel = relative(root, file);
  const src = readFileSync(file, 'utf8');
  if (/\bconsole\.(log|info|warn|error|debug)\(/.test(src) && !ALLOWED_CONSOLE.includes(rel)) {
    problems.push(`${rel}: uses console.* (log only through the Edge Functions' log, with allowed fields)`);
  }
  if (rel.startsWith('supabase/functions/_shared/')) {
    for (const m of src.matchAll(/\blog\(`([^`]*)`\)/g)) {
      for (const v of m[1].matchAll(/\$\{([^}]*)\}/g)) {
        if (!ALLOWED_LOG_VARS.has(v[1].trim())) problems.push(`${rel}: log line prints \${${v[1]}}; only ${[...ALLOWED_LOG_VARS].join(', ')} are allowed`);
      }
    }
    for (const m of src.matchAll(/\blog\(([^`)][^)]*)\)/g)) {
      if (!/^'[^']*'$/.test(m[1].trim()) && m[1].trim() !== 'line') problems.push(`${rel}: log(${m[1]}) must be a fixed string or a checked template`);
    }
  }
}

// Crash reports: every Sentry.init must scrub reports and send nothing personal (v8).
for (const file of SOURCE_DIRS.flatMap((d) => walk(d, isCode))) {
  const src = readFileSync(file, 'utf8');
  if (!/Sentry\.init\(/.test(src)) continue;
  const rel = relative(root, file);
  for (const need of [/sendDefaultPii:\s*false/, /beforeSend:[^\n]*scrubEvent\(/, /attachScreenshot:\s*false/, /attachViewHierarchy:\s*false/]) {
    if (!need.test(src)) problems.push(`${rel}: Sentry.init without ${need.source.replace(/\\s\*|\\/g, '')}`);
  }
}

// ---------------------------------------------------------------- 2. git
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n');
for (const f of tracked) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example')) problems.push(`${f}: an .env file is committed`);
}

// ---------------------------------------------------------------- 3. bundles
// v20: a NEXT_PUBLIC_ variable is shipped to every browser, so its name must never suggest a secret.
for (const file of SOURCE_DIRS.flatMap((d) => walk(d, isCode)).concat([join(root, 'apps/web/next.config.ts'), join(root, '.env.example')].filter((f) => { try { return statSync(f).isFile(); } catch { return false; } }))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE|PRIVATE|PASSWORD)[A-Z0-9_]*/g)) problems.push(`${relative(root, file)}: ${m[0]} would be sent to every browser`);
}

const SECRET_PATTERNS = [
  [/service_role/, 'the words service_role'],
  [/c2VydmljZV9yb2xl/, 'a service-role JWT (base64 of "service_role")'],
  [/SUPABASE_SERVICE_ROLE_KEY|SMS_GATEWAY_KEY|SEND_SMS_HOOK_SECRET|EXPO_ACCESS_TOKEN|EAS_TOKEN|SENTRY_AUTH_TOKEN|APNS_PRIVATE_KEY/, 'a server-only setting name'],
  [/sntrys_[A-Za-z0-9_+/=]{20,}/, 'a Sentry auth token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/whsec_[A-Za-z0-9+/=]{16,}/, 'a webhook secret'],
  [/(?<![A-Za-z0-9])sb_secret_[A-Za-z0-9_-]{20,}/, 'a Supabase secret key'],
  [/0x4AAAAAA[A-Za-z0-9_-]{24,}/, 'a Cloudflare Turnstile secret (site keys are shorter)'],
  [/cfat_[A-Za-z0-9_-]{20,}|TURNSTILE_SECRET\s*[:=]\s*['"][^'"]+/, 'a Cloudflare token or a written-in Turnstile secret'],
];
const ALLOWED_PHONES = new Set(['03001478729', '923001478729', '+923001478729']); // the public pilot WhatsApp
const PHONE = /(?<![0-9])(?:\+?92|0)3\d{2}[ -]?\d{7}(?![0-9])/g;

const bundleDirs = process.argv.slice(2).map((d) => join(root, d));
let scanned = 0;
for (const dir of bundleDirs) {
  let files;
  try {
    files = walk(dir, (p) => /\.(js|hbc|json|html|map)$/.test(p) && !p.endsWith('.map'));
  } catch {
    problems.push(`${relative(root, dir)}: bundle folder not found (build first)`);
    continue;
  }
  for (const file of files) {
    scanned++;
    const text = readFileSync(file, 'latin1');
    for (const [re, what] of SECRET_PATTERNS) if (re.test(text)) problems.push(`${relative(root, file)}: contains ${what}`);
    for (const m of text.matchAll(PHONE)) {
      const digits = m[0].replace(/[ -]/g, '');
      if (!ALLOWED_PHONES.has(digits)) problems.push(`${relative(root, file)}: contains a phone number (${digits.slice(0, 4)}…)`);
    }
  }
}

if (problems.length) {
  console.error(`Leak check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Leak check passed: source, git${bundleDirs.length ? `, ${scanned} bundle files` : ''}.`);
