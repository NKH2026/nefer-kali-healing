/**
 * PostCSS runs during `vite build` and `vite dev`.
 *
 * Tailwind is compiled here instead of being loaded from the CDN in index.html.
 * The CDN build is development-only: it ships the whole engine to every visitor
 * and generates styles at runtime, which blocks rendering and causes a flash of
 * unstyled content on a production site.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
