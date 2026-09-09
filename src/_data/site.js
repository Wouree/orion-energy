/**
 * site.js — site-wide settings.
 *
 * Replaces the former `src/_data/site.json`. The editorial source is now
 * `content/site_settings/general.md`, so the CMS edits one file per collection item everywhere on the
 * site rather than one JSON blob in a different shape from everything else.
 *
 * Field names are snake_case here, matching the rest of the content model. `cities` is derived from the
 * `city` collection rather than duplicated, so coverage is stated in exactly one place.
 *
 * Two fields are intentionally empty and must stay that way until the client supplies them —
 * `form_endpoint` (docs/PENDING.md P-02) and `phone` / `phone_clean` (P-01). Templates test for a value
 * before rendering a link; a placeholder number is never emitted.
 */

const content = require('./orion.js');

const settings = content.site_settings[0];

if (!settings) {
  throw new Error('content/site_settings/general.md is missing — the site has no configuration.');
}

module.exports = {
  ...settings,

  // Derived, never duplicated: coverage is whatever the city collection says it is.
  cities: content.city
    .slice()
    .sort((a, b) => (a.order || 99) - (b.order || 99))
    .map((c) => c.name),

  // True when a real, non-placeholder number exists. Templates gate `tel:` links on this.
  has_phone: Boolean(settings.phone && settings.phone_clean && !/X/i.test(settings.phone_clean)),
  has_form_endpoint: Boolean(settings.form_endpoint),
};
