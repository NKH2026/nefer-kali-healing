/**
 * Minimal GitHub client for the source-editing tools.
 *
 * Everything the agent can do to the repository goes through here, so the
 * restrictions live in one place rather than being spread across tools:
 *
 *   - a hard path denylist, so build config, dependencies, CI and secrets can
 *     never be touched, regardless of what the model asks for
 *   - an extension allowlist, so this edits site content and styling only
 *   - one branch per change, never a direct commit to the default branch
 *
 * A Supabase Edge Function cannot import from ../../lib, so unlike theme tokens
 * this is a standalone module with no browser counterpart.
 */

const API = 'https://api.github.com'

export interface RepoRef {
  owner: string
  repo: string
  token: string
  defaultBranch: string
}

export interface FileChange {
  /** Repository-relative path, e.g. "pages/About.tsx". */
  path: string
  /** Full new contents of the file. */
  content: string
}

export interface ExistingFile {
  path: string
  content: string
  /** Blob SHA, required by the Contents API when updating. */
  sha: string
}

/** Thrown for an expected, explainable failure (bad path, missing file, ...). */
export class GitHubToolError extends Error {}

// ---------------------------------------------------------------------------
// Restrictions
// ---------------------------------------------------------------------------

/**
 * Files the agent must never modify. These either control the build, hold
 * configuration, or would let a change escape the preview-and-approve flow.
 */
const BLOCKED_PATHS = [
  /^package(-lock)?\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /^yarn\.lock$/i,
  /^vite\.config\./i,
  /^tsconfig.*\.json$/i,
  /^vercel\.json$/i,
  /^tailwind\.config\./i,
  /^postcss\.config\./i,
  /^\.env/i,
  /^\.gitignore$/i,
  /^\.npmrc$/i,
  /^index\.html$/i,
  /^metadata\.json$/i,
  /^App\.tsx$/i,
  /^index\.tsx$/i,
  /^lib\//i,
  /^supabase\//i,
  /^scripts\//i,
  /^docs\//i,
  /^\.github\//i,
  /^\.gemini\//i,
  /^public\/assets\//i,
]

/** Only these file types are editable, and only in these directories. */
export const ALLOWED_PATTERNS = [
  /^pages\/[A-Za-z0-9_\-/]+\.tsx$/,
  /^components\/[A-Za-z0-9_\-/]+\.tsx$/,
  /^index\.css$/,
  /^constants\.tsx$/,
]

/** Files larger than this are readable but too big to safely rewrite. */
export const MAX_EDITABLE_BYTES = 140_000

export function assertEditable(path: string): void {
  const clean = path.replace(/^\/+/, '').trim()
  if (!clean || clean.includes('..')) {
    throw new GitHubToolError(`Refusing "${path}": path must be repository-relative with no "..".`)
  }
  if (BLOCKED_PATHS.some((re) => re.test(clean))) {
    throw new GitHubToolError(
      `Refusing to edit "${clean}": that file controls the build, dependencies or configuration ` +
        `and is deliberately off-limits. Only page and component source can be edited.`,
    )
  }
  if (!ALLOWED_PATTERNS.some((re) => re.test(clean))) {
    throw new GitHubToolError(
      `Refusing to edit "${clean}": editable files are .tsx under pages/ or components/, ` +
        `plus index.css. Layout, configuration and data files are out of scope.`,
    )
  }
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function gh(
  ref: RepoRef,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${ref.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'nkh-admin-agent',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })

  if (res.status === 401) {
    throw new GitHubToolError('GitHub rejected the token (401). Check GITHUB_TOKEN is valid and not expired.')
  }
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    throw new GitHubToolError(
      remaining === '0'
        ? 'GitHub rate limit reached. Try again shortly.'
        : 'GitHub refused the request (403). The token likely lacks Contents or Pull requests write access.',
    )
  }
  if (res.status === 404) {
    throw new GitHubToolError(`GitHub returned 404 for ${path}. The token may not have access to this repository.`)
  }
  if (!res.ok) {
    const detail = await res.text()
    throw new GitHubToolError(`GitHub ${res.status} on ${path}: ${detail.slice(0, 300)}`)
  }
  return res.status === 204 ? null : await res.json()
}

const repoPath = (ref: RepoRef) => `/repos/${ref.owner}/${ref.repo}`

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Lists every editable source file, with its size. One API call. */
export async function listSourceFiles(ref: RepoRef): Promise<{ path: string; size: number }[]> {
  const tree = await gh(ref, `${repoPath(ref)}/git/trees/${ref.defaultBranch}?recursive=1`)
  const entries: { path: string; size?: number }[] = tree?.tree ?? []
  return entries
    .filter((e) => ALLOWED_PATTERNS.some((re) => re.test(e.path)))
    .filter((e) => !BLOCKED_PATHS.some((re) => re.test(e.path)))
    .map((e) => ({ path: e.path, size: e.size ?? 0 }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export async function getFile(ref: RepoRef, path: string, branch?: string): Promise<ExistingFile> {
  assertEditable(path)
  const ref_ = branch ?? ref.defaultBranch
  const data = await gh(ref, `${repoPath(ref)}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref_)}`)

  if (Array.isArray(data)) {
    throw new GitHubToolError(`"${path}" is a directory, not a file.`)
  }
  if (data.encoding !== 'base64' || typeof data.content !== 'string') {
    throw new GitHubToolError(`Could not decode "${path}" from GitHub.`)
  }

  // GitHub returns base64 with newlines; atob tolerates them but be explicit.
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0))
  const content = new TextDecoder().decode(bytes)

  if (bytes.byteLength > MAX_EDITABLE_BYTES) {
    throw new GitHubToolError(
      `"${path}" is ${Math.round(bytes.byteLength / 1024)} kB, too large to edit safely.`,
    )
  }

  return { path, content, sha: data.sha }
}

// ---------------------------------------------------------------------------
// Writes -- always to a new branch, never the default branch
// ---------------------------------------------------------------------------

export async function getDefaultBranchSha(ref: RepoRef): Promise<string> {
  const data = await gh(ref, `${repoPath(ref)}/git/ref/heads/${ref.defaultBranch}`)
  const sha = data?.object?.sha
  if (typeof sha !== 'string') throw new GitHubToolError('Could not read the default branch head.')
  return sha
}

export async function createBranch(ref: RepoRef, branch: string, fromSha: string): Promise<void> {
  await gh(ref, `${repoPath(ref)}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${branch}`, sha: fromSha },
  })
}

/**
 * Commits several files in one commit.
 *
 * Uses the low-level git data API rather than the Contents API so a multi-file
 * change lands atomically: the preview either reflects all of it or none.
 */
export async function commitFiles(
  ref: RepoRef,
  branch: string,
  changes: FileChange[],
  message: string,
): Promise<{ sha: string; url: string }> {
  if (changes.length === 0) throw new GitHubToolError('No file changes to commit.')

  const baseSha = await getDefaultBranchSha(ref)
  const baseCommit = await gh(ref, `${repoPath(ref)}/git/commits/${baseSha}`)
  const baseTreeSha = baseCommit?.tree?.sha
  if (typeof baseTreeSha !== 'string') throw new GitHubToolError('Could not read the base tree.')

  const blobs = await Promise.all(
    changes.map(async (c) => {
      assertEditable(c.path)
      const blob = await gh(ref, `${repoPath(ref)}/git/blobs`, {
        method: 'POST',
        body: { content: c.content, encoding: 'utf-8' },
      })
      return { path: c.path, sha: blob.sha as string }
    }),
  )

  const tree = await gh(ref, `${repoPath(ref)}/git/trees`, {
    method: 'POST',
    body: {
      base_tree: baseTreeSha,
      tree: blobs.map((b) => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
    },
  })

  const commit = await gh(ref, `${repoPath(ref)}/git/commits`, {
    method: 'POST',
    body: { message, tree: tree.sha, parents: [baseSha] },
  })

  await gh(ref, `${repoPath(ref)}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: { sha: commit.sha, force: true },
  })

  return { sha: commit.sha as string, url: commit.html_url as string }
}

export async function openPullRequest(
  ref: RepoRef,
  branch: string,
  title: string,
  body: string,
): Promise<{ number: number; url: string }> {
  const pr = await gh(ref, `${repoPath(ref)}/pulls`, {
    method: 'POST',
    body: { title, head: branch, base: ref.defaultBranch, body },
  })
  return { number: pr.number as number, url: pr.html_url as string }
}

export async function mergePullRequest(
  ref: RepoRef,
  number: number,
  commitTitle: string,
): Promise<{ merged: boolean; sha: string | null }> {
  const result = await gh(ref, `${repoPath(ref)}/pulls/${number}/merge`, {
    method: 'PUT',
    body: { merge_method: 'squash', commit_title: commitTitle },
  })
  return { merged: result?.merged === true, sha: (result?.sha as string) ?? null }
}

export async function closePullRequest(ref: RepoRef, number: number): Promise<void> {
  await gh(ref, `${repoPath(ref)}/pulls/${number}`, {
    method: 'PATCH',
    body: { state: 'closed' },
  })
}

export async function deleteBranch(ref: RepoRef, branch: string): Promise<void> {
  try {
    await gh(ref, `${repoPath(ref)}/git/refs/heads/${branch}`, { method: 'DELETE' })
  } catch (err) {
    // A missing branch is not worth failing an otherwise successful cleanup.
    console.warn('[github] branch delete failed:', err instanceof Error ? err.message : err)
  }
}
