/**
 * eleventyComputed.js — per-page locale data, applied to every template.
 *
 * Gives every page four things without any page having to declare them:
 *
 *   lang        the locale code, derived from the URL prefix unless set in front matter
 *   ref         the translation key — the URL with its locale prefix stripped, so a page and its
 *               twins in other locales share one stable identifier
 *   canonical   the absolute canonical URL for this page (there was none before; see D-10)
 *   alternates  hreflang entries, emitted only for locales that are actually built, plus x-default
 *
 * `alternates` is empty while French is the only built locale, so `base.njk` emits no hreflang at all —
 * which is correct. When English is switched on in `i18n.js`, every page gains its pair automatically.
 */

const i18n = require('./i18n.js');
const whatsapp = require('./whatsapp.js');

module.exports = {
  // The WhatsApp deep link for this page: the confirmed number plus a pre-filled message composed from
  // where the visitor actually is. A page may override the message with `whatsappText` in front matter.
  wa: (data) => {
    const base = whatsapp.forUrl((data.page && data.page.url) || '/');
    if (!data.whatsappText) return base;
    return {
      ...base,
      text: data.whatsappText,
      href: `https://wa.me/${base.number}?text=${encodeURIComponent(data.whatsappText)}`,
    };
  },

  lang: (data) => data.lang || i18n.localeFromUrl(data.page && data.page.url),

  ref: (data) => data.ref || i18n.refFromUrl(data.page && data.page.url),

  canonical: (data) => {
    const url = data.page && data.page.url;
    if (!url || !data.site || !data.site.url) return null;
    return data.site.url.replace(/\/$/, '') + url;
  },

  alternates: (data) => {
    const ref = data.ref || i18n.refFromUrl(data.page && data.page.url);
    if (!ref) return [];

    // Only built locales. A hreflang pointing at an unbuilt route is a promise the site cannot keep.
    const built = i18n.built;
    if (built.length < 2) return [];

    const base = data.site && data.site.url ? data.site.url.replace(/\/$/, '') : '';
    const entries = built.map((l) => ({
      hreflang: l.hreflang,
      href: base + i18n.urlFor(ref, l.code),
    }));
    entries.push({ hreflang: 'x-default', href: base + i18n.urlFor(ref, i18n.default) });
    return entries;
  },
};
