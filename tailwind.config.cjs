/** @type {import('tailwindcss').Config} */

/**
 * Pinned to Tailwind 3.4.17 -- the exact version the site was rendering with
 * when it loaded `cdn.tailwindcss.com` from index.html. Compiling locally at the
 * same version keeps the generated CSS identical. Do not bump this to v4 in
 * isolation: v4 changes default border colours, ring widths and shadow scales,
 * so it is a visual migration, not a build fix.
 */
module.exports = {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    // The 3D world builds its HUD from plain JS and toggles the `hidden`
    // utility at runtime (boot.js, engine/ui/touch.js). If these files are not
    // scanned, `.hidden` is never generated and the world's toast, prompt and
    // touch buttons can no longer be hidden.
    './jyotisha-loka/**/*.{js,ts,tsx}',
  ],
  /**
   * Classes assembled by string interpolation cannot be found by the scanner,
   * because the literal class name never appears in the source. The CDN build
   * hid this by scanning the live DOM. These are the interpolated ones:
   *
   *   pages/guides/HetHerWombPlusTeaGuide.tsx
   *     `from-${benefit.color}-900/30`, `bg-${benefit.color}-500/20`, ...
   *     with benefit.color in { pink, amber, rose }
   *
   * Everything else that looked dynamic is safe: constants.tsx DESTINY_PATHS,
   * the statusColors maps in the admin pages and ReviewDisplay's
   * textColorClasses all hold complete literal class strings, which the
   * scanner does find.
   */
  safelist: [
    {
      pattern: /(bg|from|to|border|text|hover:border)-(pink|amber|rose)-(200|400|500|900|950)(\/(20|30|40))?/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
