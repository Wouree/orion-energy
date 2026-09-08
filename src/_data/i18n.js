/**
 * i18n.js — locale architecture.
 *
 * French is the site. English is a later phase: `docs/BUILD_BRIEF.md` says to build the structure and
 * write no English copy.
 *
 * So the machinery is complete — locale registry, URL derivation, translation keys, `hreflang` emission,
 * `lang` attribute, canonical URLs — but `en.built` is false, and **nothing is emitted for a locale that
 * is not built**. Advertising `hreflang="en"` at a URL that 404s is worse than advertising nothing: it is
 * a claim about the site that the site cannot honour, which is the exact failure mode this project exists
 * to correct.
 *
 * Turning English on is one line — `built: true` on the `en` entry, plus the pages themselves.
 * No template changes, no permalink rewrites, no data migration.
 */

const locales = [
  { code: 'fr', label: 'Français', hreflang: 'fr', prefix: '', default: true, built: true },
  { code: 'en', label: 'English', hreflang: 'en', prefix: '/en', default: false, built: false },
];

const byCode = Object.fromEntries(locales.map((l) => [l.code, l]));
const defaultLocale = locales.find((l) => l.default);

/** Strip a locale prefix off a URL, yielding the translation key shared by all its twins. */
function refFromUrl(url) {
  if (!url) return null;
  for (const l of locales) {
    if (l.prefix && (url === l.prefix || url.startsWith(l.prefix + '/'))) {
      return url.slice(l.prefix.length) || '/';
    }
  }
  return url;
}

/** Which locale a URL belongs to, read from its prefix. */
function localeFromUrl(url) {
  if (!url) return defaultLocale.code;
  for (const l of locales) {
    if (l.prefix && (url === l.prefix || url.startsWith(l.prefix + '/'))) return l.code;
  }
  return defaultLocale.code;
}

/** The URL a given translation key takes in a given locale. */
function urlFor(ref, code) {
  const l = byCode[code] || defaultLocale;
  if (!ref) return null;
  return (l.prefix + ref) || '/';
}

module.exports = {
  locales,
  byCode,
  default: defaultLocale.code,
  defaultLocale,
  built: locales.filter((l) => l.built),
  refFromUrl,
  localeFromUrl,
  urlFor,
};
