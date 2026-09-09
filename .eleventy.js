const content = require('./src/_data/orion.js');
const i18n = require('./src/_data/i18n.js');
const markdownIt = require('markdown-it');

// Collection bodies are Markdown and must be rendered as such — otherwise a list renders as hyphens and
// emphasis as literal asterisks. Bundled with Eleventy, so no new dependency.
const md = markdownIt({ html: true, breaks: false, linkify: true, typographer: true });

module.exports = function (eleventyConfig) {
  /* ------------------------------------------------------------------ *
   * Content governance
   *
   * CLAUDE.md: "Unapproved claims must not render. Enforce this in the template, not by editorial
   * discipline." The loader already drops unapproved claims before they become data; these shortcodes are
   * the only way a template can reach one, and they have no escape hatch. A missing or unapproved claim
   * renders nothing at all — plus an HTML comment naming the slug, so an omission is visible in
   * view-source rather than mysterious.
   * ------------------------------------------------------------------ */

  eleventyConfig.addShortcode('claim', function (slug) {
    const c = content.claimBySlug[slug];
    if (!c) return `<!-- claim "${slug}": absente ou non approuvée, rien n'est rendu -->`;
    return c.text;
  });

  // Raw figure, for calculators and spec tables. Returns an empty string, never a zero — a zero would be
  // arithmetic on a fact nobody confirmed.
  eleventyConfig.addFilter('claimValue', function (slug) {
    const c = content.claimBySlug[slug];
    return c && c.value !== undefined ? c.value : '';
  });

  eleventyConfig.addFilter('claimText', function (slug) {
    const c = content.claimBySlug[slug];
    return c ? c.text : '';
  });

  // True when a claim exists and is approved. Lets a template omit a whole block rather than render a
  // heading over an empty slot.
  eleventyConfig.addFilter('hasClaim', function (slug) {
    return Boolean(content.claimBySlug[slug]);
  });

  /**
   * Citation for a claim, rendered inline beside the figure it supports.
   *
   * A `donnee_externe` is a fact about the world, so the reader gets the source and the date and can go
   * and check it. That is the difference between a figure and an assertion — and on the fiscal page it is
   * the whole point: a business acting on a tax figure needs to know where it came from and how old it is.
   */
  eleventyConfig.addFilter('claimCite', function (slug) {
    const c = content.claimBySlug[slug];
    if (!c || !c.evidence_url) return '';

    const date = c.evidence_date
      ? new Date(c.evidence_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    // Internal references are not links: there is nothing for a reader to open.
    if (String(c.evidence_url).startsWith('internal:')) {
      return `<span class="claim-cite">Source : donnée confirmée par le client${date ? ', ' + date : ''}</span>`;
    }

    let host = c.evidence_url;
    try {
      host = new URL(c.evidence_url).hostname.replace(/^www\./, '');
    } catch (e) {
      /* keep the raw value */
    }
    return `<span class="claim-cite">Source : <a href="${c.evidence_url}" target="_blank" rel="noopener nofollow">${host}</a>${date ? ', ' + date : ''}</span>`;
  });

  /* ------------------------------------------------------------------ *
   * Collections and lookups
   * ------------------------------------------------------------------ */

  eleventyConfig.addFilter('bySlug', (items, slug) => (items || []).find((i) => i.slug === slug) || null);

  /**
   * Destination for a CTA, looked up by its `form_type`.
   *
   * Every call-to-action on the site used `href="#"` (D-02) — 21 of them, duplicated across six
   * templates. They are modal triggers, so they worked with JavaScript and did nothing without it: no
   * destination for a middle-click, a crawler, or a failed script load.
   *
   * Resolving through the `cta` collection means a destination is edited in one file rather than hunted
   * across six. Anything without its own page yet points at /contact/, so no link is ever dead.
   */
  eleventyConfig.addFilter('ctaHref', function (formType) {
    const match = content.cta.find((c) => c.form_type === formType);
    return (match && match.href) || '/contact/';
  });

  eleventyConfig.addFilter('ctaWhatsapp', function (formType) {
    const match = content.cta.find((c) => c.form_type === formType);
    return (match && match.whatsapp_text) || '';
  });

  eleventyConfig.addFilter('sortByOrder', (items) =>
    (items || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99))
  );

  eleventyConfig.addFilter('where', (items, key, value) =>
    (items || []).filter((i) => i[key] === value)
  );

  // Group a collection into ordered sections — e.g. FAQ items by `category`.
  eleventyConfig.addFilter('groupBy', function (items, key, orderKey) {
    const groups = new Map();
    for (const item of items || []) {
      const k = item[key] || '';
      if (!groups.has(k)) groups.set(k, { key: k, order: item[orderKey] || 99, items: [] });
      groups.get(k).items.push(item);
    }
    return [...groups.values()]
      .sort((a, b) => a.order - b.order)
      .map((g) => ({ ...g, items: g.items.sort((a, b) => (a.order || 99) - (b.order || 99)) }));
  });

  /* ------------------------------------------------------------------ *
   * i18n
   * ------------------------------------------------------------------ */

  // Rewrite a URL into another locale. Used by the language switcher once English is built.
  eleventyConfig.addFilter('localeUrl', (url, code) => i18n.urlFor(i18n.refFromUrl(url), code));

  /* ------------------------------------------------------------------ *
   * Formatting
   * ------------------------------------------------------------------ */

  eleventyConfig.addFilter('date', function (value, format) {
    if (format === 'Y') return new Date().getFullYear();
    return value;
  });

  // French number formatting: narrow no-break spaces as thousands separators, as in 500 000 FCFA.
  eleventyConfig.addFilter('fcfa', function (n) {
    if (n === undefined || n === null || n === '') return '';
    return Number(n).toLocaleString('fr-FR').replace(/ /g, ' ');
  });

  // URL-encode for WhatsApp deep links and mailto bodies.
  eleventyConfig.addFilter('urlencode', (s) => encodeURIComponent(String(s === undefined ? '' : s)));

  eleventyConfig.addFilter('markdown', (value) => (value ? md.render(String(value)) : ''));
  eleventyConfig.addFilter('markdownInline', (value) => (value ? md.renderInline(String(value)) : ''));

  /* ------------------------------------------------------------------ *
   * Assets
   * ------------------------------------------------------------------ */

  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/images');
  eleventyConfig.addPassthroughCopy('src/admin');
  // Cloudflare Pages reads _redirects from the output root.
  eleventyConfig.addPassthroughCopy({ 'src/_redirects': '_redirects' });

  // Client-supplied source material is never publishable. `dir.input` is `src`, so docs/ is already out
  // of scope; .eleventyignore states it explicitly so the exclusion survives a change to the input dir
  // rather than depending on one. Passthrough globs are all scoped to src/ for the same reason.
  eleventyConfig.ignores.add('docs/**');
  eleventyConfig.ignores.add('reference/**');

  eleventyConfig.addWatchTarget('src/css/');
  eleventyConfig.addWatchTarget('src/js/');
  // Editorial content lives outside the input directory, so Eleventy must be told to watch it.
  eleventyConfig.addWatchTarget('./content/');

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
