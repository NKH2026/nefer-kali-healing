/**
 * Loads theme tokens and applies them, per surface.
 *
 * Mounted twice:
 *   - once at the app root with surface="site", for the storefront
 *   - once inside the admin layout with surface="admin", for the admin panel
 *
 * Tokens are stored as a base layer plus optional per-surface overrides, so the
 * admin panel can be made psychedelic without touching the customer-facing shop.
 * A surface sets its CSS variables on its own element (not the document), which
 * is what keeps the two from overwriting each other.
 *
 * Fails soft on purpose: if the theme can't be loaded, the site keeps its
 * original look rather than rendering unstyled.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import {
    DEFAULT_TOKENS, THEME_KEYS, applyTheme, resolveTokens,
    type ThemeTokens,
} from './theme';

interface ThemeContextValue {
    tokens: ThemeTokens;
    /** True once the stored theme has been read (or the read failed). */
    ready: boolean;
    /** Force a re-read, e.g. right after the agent applies a theme change. */
    refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
    tokens: DEFAULT_TOKENS,
    ready: false,
    refresh: async () => {},
});

interface Props {
    /** Which surface this provider drives. */
    surface: 'site' | 'admin';
    children: React.ReactNode;
    /** Wrapper class, so layout styles can be applied alongside the theme vars. */
    className?: string;
}

export const ThemeProvider: React.FC<Props> = ({ surface, children, className }) => {
    const [tokens, setTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
    const [ready, setReady] = useState(false);
    const hostRef = useRef<HTMLDivElement>(null);

    const load = React.useCallback(async () => {
        try {
            // One query for both layers: the base row and this surface's override.
            const keys = ['tokens', THEME_KEYS[surface]];
            const { data, error } = await supabase
                .from('theme_settings')
                .select('key,value')
                .in('key', keys);

            if (error) {
                // A missing table (migration not applied yet) is not fatal.
                console.warn('[theme] could not load theme tokens:', error.message);
                return;
            }

            const byKey = new Map((data ?? []).map((r) => [r.key, r.value]));
            setTokens(resolveTokens(byKey.get('tokens'), byKey.get(THEME_KEYS[surface])));
        } catch (err) {
            console.warn('[theme] theme load failed:', err);
        } finally {
            setReady(true);
        }
    }, [surface]);

    useEffect(() => {
        void load();
    }, [load]);

    // Applied to this provider's own element rather than document.documentElement,
    // so the admin surface and the site surface cannot clobber each other.
    useEffect(() => {
        applyTheme(tokens, hostRef.current);
    }, [tokens]);

    const value = useMemo<ThemeContextValue>(
        () => ({ tokens, ready, refresh: load }),
        [tokens, ready, load],
    );

    return (
        <ThemeContext.Provider value={value}>
            <div
                ref={hostRef}
                data-tb-surface={surface}
                className={className}
                style={surface === 'admin' ? { backgroundColor: '#0a0a0a' } : undefined}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
