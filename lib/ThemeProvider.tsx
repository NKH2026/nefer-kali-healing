/**
 * Loads the site's theme tokens and applies them to the document.
 *
 * Mounted once at the app root so a single theme drives the storefront and the
 * admin panel together. Reading is public (the table has a select-only public
 * policy); writing happens only through the admin agent's proposal flow.
 *
 * Fails soft on purpose: if the theme can't be loaded, the site keeps its
 * original look rather than rendering unstyled.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import {
    DEFAULT_TOKENS, applyTheme, normaliseTokens,
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tokens, setTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
    const [ready, setReady] = useState(false);

    const load = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('theme_settings')
                .select('value')
                .eq('key', 'tokens')
                .maybeSingle();

            if (error) {
                // A missing table (migration not applied yet) is not fatal.
                console.warn('[theme] could not load theme tokens:', error.message);
                return;
            }
            setTokens(normaliseTokens(data?.value));
        } catch (err) {
            console.warn('[theme] theme load failed:', err);
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Apply whenever tokens change. Defaults are applied first so the site is
    // never rendered with variables unset.
    useEffect(() => {
        applyTheme(tokens);
    }, [tokens]);

    const value = useMemo<ThemeContextValue>(
        () => ({ tokens, ready, refresh: load }),
        [tokens, ready, load],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
