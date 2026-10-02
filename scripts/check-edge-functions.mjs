/**
 * Pre-deploy check for the admin-agent Edge Function.
 *
 * A deploy that reaches Supabase with a syntax error costs a round trip and
 * fails with a bundler message that points at a line number in the uploaded
 * copy, not the local file. This runs the same type check locally first, and
 * refuses to continue if it fails.
 *
 *   node scripts/check-edge-functions.mjs
 *
 * Wired to `npm run deploy:agent`. Skipped gracefully when Deno is not
 * installed, so this can never block someone who lacks it -- it warns instead.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
    'supabase/functions/admin-agent/index.ts',
    'supabase/functions/admin-agent/_shared/web.ts',
    'supabase/functions/admin-agent/_shared/github.ts',
    'supabase/functions/admin-agent/_shared/themeTokens.ts',
];

/** Deno is commonly installed by winget/brew/cargo into one of these. */
function findDeno() {
    const candidates = [
        process.env.DENO_BIN,
        'deno',
        process.env.USERPROFILE &&
            `${process.env.USERPROFILE}\\.deno\\bin\\deno.exe`,
        process.env.LOCALAPPDATA &&
            `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Links\\deno.exe`,
    ].filter(Boolean);

    for (const c of candidates) {
        if (c === 'deno') {
            const probe = spawnSync('deno', ['--version'], { encoding: 'utf8', shell: true });
            if (probe.status === 0) return 'deno';
            continue;
        }
        if (existsSync(c)) return c;
    }

    // WinGet stores packages under a hash-suffixed directory, so glob for it.
    if (process.env.LOCALAPPDATA) {
        const base = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages`;
        if (existsSync(base)) {
            const found = spawnSync(
                'powershell',
                ['-NoProfile', '-Command', `Get-ChildItem -Path '${base}' -Filter deno.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName`],
                { encoding: 'utf8' },
            );
            const path = (found.stdout ?? '').trim();
            if (path) return path;
        }
    }

    return null;
}

const deno = findDeno();

if (!deno) {
    console.warn(
        '\n  WARNING: Deno was not found, so the Edge Functions were NOT type-checked.\n' +
            '  Install it with:  winget install DenoLand.Deno\n' +
            '  Continuing, because a missing type checker should not block a deploy.\n',
    );
    process.exit(0);
}

console.log(`Using Deno at: ${deno}\n`);

let failed = false;
for (const target of TARGETS) {
    const abs = resolve(root, target);
    if (!existsSync(abs)) {
        console.error(`  MISSING  ${target}`);
        failed = true;
        continue;
    }

    const res = spawnSync(deno, ['check', abs], { encoding: 'utf8', cwd: root });
    const output = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
    const errors = output.match(/TS\d+ \[ERROR\]/g) ?? [];

    if (res.status === 0 && errors.length === 0) {
        console.log(`  OK       ${target}`);
    } else {
        failed = true;
        console.error(`  FAILED   ${target}`);
        // Print only the diagnostics, not Deno's download chatter.
        for (const line of output.split('\n')) {
            if (/TS\d+|error:|^\s{2,}\S/.test(line) && !/^Download/.test(line)) {
                console.error(`           ${line.trimEnd()}`);
            }
        }
    }
}

if (failed) {
    console.error(
        '\n  Refusing to continue: fix the errors above before deploying.\n' +
            '  The Supabase bundler rejects syntax errors with a line number in the\n' +
            '  uploaded copy, which is harder to act on than this output.\n',
    );
    process.exit(1);
}

console.log('\n  All Edge Function modules type-check cleanly.\n');
