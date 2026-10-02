/**
 * Copies the shared theme token vocabulary from lib/theme.ts into the Edge
 * Function's own directory.
 *
 * Why: a Supabase Edge Function is bundled from its own folder and cannot import
 * from ../../lib, and Deno would reject the file's browser-only exports anyway.
 * Copying the block keeps ONE source of truth for the token names, ranges and
 * preset values, so the agent's tool schema and the UI's sliders cannot drift
 * apart.
 *
 * Run after editing lib/theme.ts:
 *     node scripts/sync-theme-tokens.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'lib/theme.ts');
const OUT = resolve(root, 'supabase/functions/admin-agent/_shared/themeTokens.ts');

/** Everything from the top of the file up to the CSS-variable section. */
const END_MARKER = '// ---------------------------------------------------------------------------\n// CSS custom properties';

const src = readFileSync(SRC, 'utf8');
const endIndex = src.indexOf(END_MARKER);

if (endIndex === -1) {
    console.error(
        `Could not find the end marker in ${SRC}.\n` +
            `Expected the comment block that begins the CSS custom properties section. ` +
            `If lib/theme.ts was reorganised, update END_MARKER in this script.`,
    );
    process.exit(1);
}

const shared = src.slice(0, endIndex).trimEnd();

const header = `// ============================================================================
// GENERATED FILE -- DO NOT EDIT BY HAND
// ============================================================================
// Copied from lib/theme.ts by scripts/sync-theme-tokens.mjs so the token
// vocabulary, ranges and preset names cannot drift between the browser and the
// Edge Function. Edit lib/theme.ts and re-run:
//
//     node scripts/sync-theme-tokens.mjs
// ============================================================================

`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, header + shared + '\n', 'utf8');

const lineCount = (header + shared).split('\n').length;
const rel = OUT.replace(root + '\\', '').replace(root + '/', '');
console.log(`Synced theme tokens -> ${rel}`);
console.log(`  ${lineCount} lines`);

// Report the tokens found, so a broken parse is obvious.
const tokens = [...shared.matchAll(/^\s{4}(\w+):\s*\{ label/gm)].map((m) => m[1]);
if (tokens.length === 0) {
    console.warn('  WARNING: no token definitions detected -- check the TOKEN_SPEC format.');
} else {
    console.log(`  tokens: ${tokens.join(', ')}`);
}
