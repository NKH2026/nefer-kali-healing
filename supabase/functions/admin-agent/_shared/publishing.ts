/**
 * Publishing adapters (Tier 3).
 *
 * Tier 3 actions leave the building and cannot be un-sent. Everything here is
 * therefore written defensively:
 *   - `send` is never called by the agent. It is reachable only through the
 *     `send` action on the Edge Function, which the admin UI triggers.
 *   - a draft is CLAIMED before the network call, so two concurrent sends cannot
 *     both go out.
 *   - the exact payload is returned so the caller can store what was sent.
 *
 * Publishers are configured by name. An unconfigured publisher returns a clear
 * error naming the secret to set, rather than silently doing nothing.
 */

export interface PublishPayload {
    channel: string
    subject: string | null
    body: string
}

export interface PublishResult {
    /** Provider-side identifier, for the audit trail. */
    ref: string | null
    /** What the provider reported, stored verbatim. */
    detail: unknown
}

export class PublishError extends Error {}

/**
 * Kit (ConvertKit) newsletter broadcast.
 *
 * Requires a Kit API v4 secret and the broadcast id/sequence the newsletter
 * belongs to. Both are account-specific, so they are secrets rather than
 * hard-coded values.
 */
export async function publishViaKit(
    payload: PublishPayload,
    apiKey: string,
): Promise<PublishResult> {
    if (!apiKey) {
        throw new PublishError(
            'Kit is not configured. Add the KIT_API_KEY secret (Kit v4 API secret) to enable sending.',
        )
    }

    const res = await fetch('https://api.kit.com/v4/broadcasts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Kit-Api-Key': apiKey,
        },
        body: JSON.stringify({
            // Kit's broadcast body is HTML; plain text is accepted and rendered
            // by Kit, so newlines are converted rather than required as markup.
            subject: payload.subject ?? 'Newsletter',
            content: payload.body
                .split(/\n{2,}/)
                .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
                .join('\n'),
            // Deliberately NOT sending a `send_at`: the broadcast is created as a
            // draft in Kit, so the owner still has a final confirmation inside
            // Kit itself. Publishing from here does not auto-send to subscribers.
            public: false,
        }),
    })

    if (!res.ok) {
        const detail = await res.text()
        throw new PublishError(`Kit returned ${res.status}: ${detail.slice(0, 300)}`)
    }

    const body = (await res.json()) as { broadcast?: { id?: number | string } }
    const id = body?.broadcast?.id
    return {
        ref: id != null ? String(id) : null,
        detail: { provider: 'kit', response: body },
    }
}

/**
 * Generic outbound webhook.
 *
 * For anything without a first-party adapter: Zapier, Make, Buffer, a social
 * scheduler. This keeps the feature useful without pretending to integrate with
 * platforms whose APIs need per-account setup that cannot be verified from here.
 */
export async function publishViaWebhook(
    payload: PublishPayload,
    webhookUrl: string,
    secret: string,
): Promise<PublishResult> {
    if (!webhookUrl) {
        throw new PublishError(
            'No publishing webhook is configured. Add the PUBLISH_WEBHOOK_URL secret, ' +
                'or use a supported integration.',
        )
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(secret ? { 'X-Publish-Secret': secret } : {}),
        },
        body: JSON.stringify({
            channel: payload.channel,
            subject: payload.subject,
            body: payload.body,
            // Sent so a downstream automation can attribute the message.
            source: 'nefer-kali-healing admin assistant',
            sent_at: new Date().toISOString(),
        }),
    })

    const detail = await res.text()

    if (!res.ok) {
        throw new PublishError(`The publishing webhook returned ${res.status}: ${detail.slice(0, 300)}`)
    }

    return { ref: null, detail: { provider: 'webhook', status: res.status, response: detail.slice(0, 500) } }
}

/** Chooses a publisher. Returns null when the channel has none configured. */
export function selectPublisher(
    channel: string,
    config: { kitKey: string; webhookUrl: string; webhookSecret: string },
): { name: string; send: (p: PublishPayload) => Promise<PublishResult> } | null {
    if (channel === 'newsletter' && config.kitKey) {
        return { name: 'kit', send: (p) => publishViaKit(p, config.kitKey) }
    }
    if (config.webhookUrl) {
        return {
            name: 'webhook',
            send: (p) => publishViaWebhook(p, config.webhookUrl, config.webhookSecret),
        }
    }
    return null
}

/** Channels that cannot be sent from here, and why. Used for honest errors. */
export const UNSUPPORTED_CHANNELS: Record<string, string> = {
    instagram:
        'Instagram publishing needs a Meta Business account, a linked Facebook Page and a long-lived ' +
        'access token. Configure PUBLISH_WEBHOOK_URL to route this through a scheduler instead.',
    facebook:
        'Facebook publishing needs a Meta app with page permissions. Configure PUBLISH_WEBHOOK_URL ' +
        'to route this through a scheduler instead.',
    press:
        'Press notes go to humans. Copy the text and send it from your own email.',
    partner_outreach:
        'Partner emails go to humans and are personal. Copy the text and send it yourself.',
};
