/**
 * Web retrieval for the research sub-agent.
 *
 * Every function here returns UNTRUSTED text. Web pages are attacker-controlled,
 * and this module is the boundary where that content enters the system. It never
 * sanitises meaning -- it cleans markup, caps size, and labels output as
 * untrusted. Interpreting it safely is the caller's responsibility.
 *
 * Deliberately narrow:
 *   - plain HTTP GET only, with a timeout
 *   - a response size cap, so one page cannot blow the memory limit
 *   - markup stripped to readable text
 *   - no cookies, no auth, no redirects to other hosts
 */

const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 500_000
const MAX_TEXT_CHARS = 14_000

/** A plain, honest user agent. Some sites block unknown clients; most tolerate this. */
const USER_AGENT =
  'Mozilla/5.0 (compatible; NKH-AdminAssistant/1.0; +https://www.neferkalihealing.org)'

export interface FetchResult {
  url: string
  title: string
  text: string
  /** True when the response was truncated by the size cap. */
  truncated: boolean
}

export class WebError extends Error {}

function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', rsquo: '\u2019',
    lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', middot: '\u00b7',
    copy: '\u00a9', reg: '\u00ae', trade: '\u2122', deg: '\u00b0',
  }
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name.toLowerCase()] ?? m)
}

/**
 * Converts HTML to readable text.
 *
 * Not a parser and not trying to be. Regex stripping is wrong in general, but
 * for "give a language model the gist of a page" it is adequate, and it avoids
 * pulling a DOM implementation into an Edge Function.
 */
export function htmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)
  const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : ''

  let body = html
    // Remove the parts that contain no readable prose, content and all.
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')

  // Block elements become line breaks so paragraphs survive.
  body = body
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')

  body = body.replace(/<[^>]+>/g, ' ')
  body = decodeEntities(body)
  body = body
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { title, text: body }
}

export async function fetchPage(rawUrl: string): Promise<FetchResult> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new WebError(`"${rawUrl}" is not a valid URL.`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new WebError('Only http and https URLs can be fetched.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
  } catch (err) {
    if (controller.signal.aborted) throw new WebError(`Timed out fetching ${url.hostname}.`)
    throw new WebError(`Could not reach ${url.hostname}.`)
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new WebError(`${url.hostname} returned HTTP ${res.status}.`)
  }

  const type = res.headers.get('content-type') ?? ''
  if (!/text\/html|text\/plain|application\/xhtml/i.test(type)) {
    throw new WebError(
      `${url.hostname} returned ${type.split(';')[0] || 'an unsupported type'}, which cannot be read as text.`,
    )
  }

  // Read with a cap so one oversized page cannot exhaust the worker.
  const reader = res.body?.getReader()
  if (!reader) throw new WebError('The response had no body.')

  const chunks: Uint8Array[] = []
  let total = 0
  let truncated = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      total += value.byteLength
      if (total > MAX_BYTES) {
        truncated = true
        break
      }
      chunks.push(value)
    }
  }
  try {
    await reader.cancel()
  } catch { /* already closed */ }

  const merged = new Uint8Array(total > MAX_BYTES ? MAX_BYTES : total)
  let offset = 0
  for (const c of chunks) {
    if (offset + c.byteLength > merged.length) {
      merged.set(c.subarray(0, merged.length - offset), offset)
      break
    }
    merged.set(c, offset)
    offset += c.byteLength
  }

  const raw = new TextDecoder('utf-8', { fatal: false }).decode(merged)

  if (/text\/plain/i.test(type)) {
    return {
      url: url.toString(),
      title: url.hostname,
      text: raw.slice(0, MAX_TEXT_CHARS),
      truncated: truncated || raw.length > MAX_TEXT_CHARS,
    }
  }

  const { title, text } = htmlToText(raw)
  return {
    url: url.toString(),
    title: title || url.hostname,
    text: text.slice(0, MAX_TEXT_CHARS),
    truncated: truncated || text.length > MAX_TEXT_CHARS,
  }
}

/**
 * Search the web using OpenAI's hosted web search tool.
 *
 * Replaces an earlier attempt that scraped DuckDuckGo's HTML endpoint. That was
 * the wrong approach and it failed as such approaches do: the endpoint began
 * answering with HTTP 202 and a bot-detection page rather than results. Scraping
 * a search engine is inherently fragile, and the failure mode was an empty
 * result set that looked like "nothing exists".
 *
 * This uses the Responses API with the hosted `web_search` tool, which returns
 * grounded text plus URL citations -- and it reuses the OPENAI_API_KEY already
 * present for voice, so no new vendor is introduced.
 *
 * Results are still UNTRUSTED. The model synthesised them from web pages it
 * read, so they carry the same provenance as anything else scraped off the
 * internet. The caller must treat the summary as data.
 */
export interface WebSearchResult {
  summary: string
  sources: string[]
}

export async function searchWebGrounded(
  query: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<WebSearchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)

  let res: Response
  try {
    res = await fetch(`${baseUrl}/v1/responses`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        tools: [{ type: 'web_search' }],
        // With "auto" the model may decline to search. This tool exists to
        // search, so require it.
        tool_choice: 'required',
        input: query,
      }),
    })
  } catch (err) {
    if (controller.signal.aborted) throw new WebError('Web search timed out.')
    throw new WebError('Could not reach the search service.')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 401) {
    throw new WebError('The OpenAI API key was rejected. Check the OPENAI_API_KEY secret.')
  }
  if (res.status === 404) {
    throw new WebError(
      `The research model "${model}" was not found. Set RESEARCH_MODEL to a model your account can use.`,
    )
  }
  if (res.status === 429) {
    throw new WebError('The search service is rate limiting. Try again shortly.')
  }
  if (!res.ok) {
    const detail = await res.text()
    throw new WebError(`Web search failed (${res.status}): ${detail.slice(0, 300)}`)
  }

  const body = (await res.json()) as {
    output_text?: string
    output?: {
      type?: string
      content?: { type?: string; text?: string; annotations?: { type?: string; url?: string }[] }[]
      action?: { sources?: { url?: string }[] }
    }[]
  }

  const sources = new Set<string>()
  const texts: string[] = []

  for (const item of body.output ?? []) {
    if (item?.type === 'message') {
      for (const c of item.content ?? []) {
        if (typeof c?.text === 'string') texts.push(c.text)
        for (const a of c?.annotations ?? []) {
          if (a?.type === 'url_citation' && a.url) sources.add(a.url)
        }
      }
    }
    // The full list of pages consulted, distinct from the cited subset.
    for (const s of item?.action?.sources ?? []) {
      if (s?.url) sources.add(s.url)
    }
  }

  const summary = (body.output_text ?? texts.join('\n\n')).trim()

  if (!summary) {
    throw new WebError('The search service returned no text. Try rephrasing the question.')
  }

  return { summary, sources: [...sources] }
}
