/**
 * orion.js — the single loader for every editorial collection.
 *
 * Exposed to templates as `orion.product`, `orion.claim`, and so on. It is deliberately NOT called
 * `content`: `content` is a reserved Eleventy data property (it holds a template's rendered body), and a
 * global data file of that name aborts the build.
 *
 * Content lives in `content/<collection>/*.md` at the repository root, outside Eleventy's `src` input
 * directory, so these files are never mistaken for templates.
 *
 * This loader does four jobs, in order:
 *
 *   1. VALIDATE — every item is checked against its schema. A missing required field or a bad enum value
 *      fails the build. A CMS that can write invalid content is a CMS that will.
 *
 *   2. GATE — items that have not cleared their governance condition are dropped here, before they ever
 *      become data. `CLAUDE.md` requires that an unapproved claim cannot render and that enforcement live
 *      in the template rather than in editorial discipline; dropping at load is one level stronger still,
 *      because no template can render what was never handed to it.
 *
 *   3. RESOLVE — cross-collection references are slugs. A reference to a missing or gated item is dropped
 *      and counted, so it renders as nothing rather than as a broken link or an empty card.
 *
 *   4. REPORT — every drop is tallied and printed at build time. Silent disappearance is the failure mode
 *      this file exists to prevent.
 *
 * See docs/CONTENT-MODEL.md for the field-level specification.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..', '..', 'content');

/* ------------------------------------------------------------------ *
 * Schemas
 * ------------------------------------------------------------------ */

const CLAIM_CLASSES = ['fait_verifie', 'spec_fabricant', 'donnee_externe', 'estimation', 'ambition'];

const COLLECTIONS = {
  claim: {
    required: ['slug', 'text', 'class', 'owner'],
    enums: { class: CLAIM_CLASSES },
    // An unapproved claim never renders. This is the rule the whole project turns on.
    gate: (i) => i.approved === true,
    gateReason: 'approved !== true',
    // Evidence is mandatory for anything asserted as fact. Estimations and ambitions are exempt because
    // they are not claims about the world: they carry their assumptions instead, visibly, at the point of use.
    validate(i) {
      const needsEvidence = ['fait_verifie', 'spec_fabricant', 'donnee_externe'].includes(i.class);
      if (needsEvidence && i.approved === true && (!i.evidence_url || !i.evidence_date)) {
        return `class "${i.class}" requires evidence_url and evidence_date before it may be approved`;
      }
      // A `donnee_externe` is a fact about the world, so its evidence must be a public source anyone can
      // check. Facts about ORION itself may cite an internal record — `internal:<ref>` — because the
      // evidence is a client confirmation held by Digitaall rather than a published page.
      if (i.class === 'donnee_externe' && i.evidence_url && !/^https?:\/\//.test(String(i.evidence_url))) {
        return 'class "donnee_externe" requires a public http(s) evidence_url, not an internal reference';
      }
      if (i.evidence_url && !/^(https?:\/\/|internal:)/.test(String(i.evidence_url))) {
        return `evidence_url "${i.evidence_url}" must be an http(s) URL or an internal: reference`;
      }
      return null;
    },
  },

  product: {
    required: ['slug', 'model', 'type', 'power_kw', 'connector', 'warranty_months', 'availability'],
    enums: {
      type: ['ac_wallbox', 'ac_pedestal', 'dc_rapide'],
      availability: ['en_stock', 'sur_commande'],
    },
    validate(i) {
      // CLAUDE.md: hardware carries CE and RoHS only. IEC 61851 must never appear anywhere on this site.
      const certs = i.certifications || [];
      const forbidden = certs.filter((c) => /IEC|61851|62196|NF\s*C/i.test(String(c)));
      if (forbidden.length) {
        return `certification "${forbidden.join(', ')}" is not held — CE and RoHS only`;
      }
      // All four models are GB/T, which is incompatible with the Type 2 and CCS2 connectors fitted to
      // European, Japanese and Korean vehicles. Until the client decides how to present that, no product
      // may carry a claim of universal compatibility.
      const universal = /tous?\s+(les\s+)?(v[ée]hicules|mod[èe]les|marques)|toutes\s+les\s+marques|universel/i;
      for (const field of ['compatibility', 'use_case', 'note']) {
        if (i[field] && universal.test(String(i[field]))) {
          return `${field} claims universal vehicle compatibility, which GB/T connectors do not support`;
        }
      }
      return null;
    },
  },

  person: {
    required: ['slug', 'name', 'role'],
    // No publication consent and no confirmed certifications. Built, not published.
    gate: (i) => i.draft !== true && i.consent_on_file === true,
    gateReason: 'draft, or consent_on_file !== true',
  },

  station: {
    required: ['slug', 'name', 'status', 'owner_type'],
    enums: {
      status: ['ouverte', 'installation', 'annoncee', 'etude'],
      owner_type: ['orion', 'partner', 'private'],
    },
    // All sites are confidential in this phase. `private` is hard-disabled on top of the publish gate so
    // peer-to-peer listings cannot surface even if someone flips `publish` — the field exists today only so
    // that enabling the feature later is a flag, not a data migration.
    gate: (i) => i.publish === true && i.owner_type !== 'private',
    gateReason: 'publish !== true, or owner_type is private',
    refs: { city: 'city' },
  },

  city: {
    required: ['slug', 'name'],
    gate: (i) => i.coverage_real === true,
    gateReason: 'coverage_real !== true',
  },

  partner: {
    required: ['slug', 'name'],
    gate: (i) => i.verified === true && i.consent_on_file === true,
    gateReason: 'verified !== true, or consent_on_file !== true',
  },

  testimonial: {
    required: ['slug', 'quote', 'attribution'],
    gate: (i) => i.consent_on_file === true,
    gateReason: 'consent_on_file !== true',
  },

  cta: {
    required: ['slug', 'label', 'href'],
    enums: { style: ['primary', 'secondary', 'outline', 'ghost'] },
  },

  form_definition: {
    required: ['slug', 'segment', 'title', 'fields'],
    enums: { segment: ['residentiel', 'entreprise', 'site_partenaire', 'support'] },
    validate(i) {
      // The client's response-time commitment is under review. No confirmation message may imply one.
      const sla = /\b\d+\s*(h|heures?|jours?|minutes?|min)\b|sous\s+\d|24\s*h/i;
      if (i.success_message && sla.test(String(i.success_message))) {
        return 'success_message contains a response-time figure; none may be published';
      }
      return null;
    },
  },

  sector_solution: {
    required: ['slug', 'sector', 'title'],
    refs: { related_products: 'product' },
  },

  faq_item: {
    // The answer is the Markdown body, not a front-matter field — prose belongs in prose.
    required: ['slug', 'question'],
    requireBody: true,
    refs: { claim_refs: 'claim' },
  },

  guide: { required: ['slug', 'title'], requireBody: true },

  article: {
    required: ['slug', 'title', 'date'],
    requireBody: true,
    refs: { author: 'person' },
  },

  site_settings: { required: ['slug'] },
};

/* ------------------------------------------------------------------ *
 * Load
 * ------------------------------------------------------------------ */

const errors = [];
const gated = [];
const broken = [];

function readCollection(name) {
  const dir = path.join(ROOT, name);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        ...data,
        slug: data.slug || file.replace(/\.md$/, ''),
        lang: data.lang || 'fr',
        body: content.trim(),
        _file: `content/${name}/${file}`,
      };
    });
}

function validate(name, schema, item) {
  const where = item._file;

  for (const field of schema.required || []) {
    const v = item[field];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
      errors.push(`${where}: missing required field "${field}"`);
    }
  }

  for (const [field, allowed] of Object.entries(schema.enums || {})) {
    if (item[field] !== undefined && !allowed.includes(item[field])) {
      errors.push(`${where}: ${field} "${item[field]}" is not one of ${allowed.join(' | ')}`);
    }
  }

  if (schema.requireBody && !item.body) {
    errors.push(`${where}: body is empty — this collection carries its prose in the Markdown body`);
  }

  if (schema.validate) {
    const problem = schema.validate(item);
    if (problem) errors.push(`${where}: ${problem}`);
  }
}

const content = {};
const all = {};

// Pass 1 — read, validate, gate.
for (const [name, schema] of Object.entries(COLLECTIONS)) {
  const items = readCollection(name);
  all[name] = items;

  const kept = [];
  for (const item of items) {
    validate(name, schema, item);

    const draftBlocked = item.draft === true && !schema.gate;
    const gateBlocked = schema.gate && !schema.gate(item);

    if (draftBlocked || gateBlocked) {
      gated.push(`${name}/${item.slug} — ${schema.gateReason || 'draft: true'}`);
      continue;
    }
    kept.push(item);
  }
  content[name] = kept;
}

// Pass 2 — resolve references against what actually survived the gates.
for (const [name, schema] of Object.entries(COLLECTIONS)) {
  if (!schema.refs) continue;

  for (const item of content[name]) {
    for (const [field, target] of Object.entries(schema.refs)) {
      const value = item[field];
      if (value === undefined || value === null) continue;

      const exists = (slug) => content[target].some((t) => t.slug === slug);

      if (Array.isArray(value)) {
        const resolved = value.filter((slug) => {
          if (exists(slug)) return true;
          broken.push(`${item._file}: ${field} → ${target}/${slug} (missing or gated)`);
          return false;
        });
        item[field] = resolved;
      } else if (!exists(value)) {
        broken.push(`${item._file}: ${field} → ${target}/${value} (missing or gated)`);
        item[field] = null;
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Indexes and report
 * ------------------------------------------------------------------ */

// Approved claims, keyed by slug. The {% claim %} shortcode reads only this.
content.claimBySlug = Object.fromEntries(content.claim.map((c) => [c.slug, c]));
content.productBySlug = Object.fromEntries(content.product.map((p) => [p.slug, p]));

content._gated = gated;
content._broken = broken;
content._counts = Object.fromEntries(
  Object.keys(COLLECTIONS).map((n) => [n, { loaded: all[n].length, published: content[n].length }])
);

if (errors.length) {
  throw new Error(
    `\n\nContent model validation failed — ${errors.length} error(s):\n` +
      errors.map((e) => `  ✗ ${e}`).join('\n') +
      '\n\nSee docs/CONTENT-MODEL.md.\n'
  );
}

const withheld = Object.entries(content._counts)
  .filter(([, c]) => c.loaded !== c.published)
  .map(([n, c]) => `${n} ${c.published}/${c.loaded}`);

console.log(
  `[content] ${Object.values(content._counts).reduce((a, c) => a + c.published, 0)} items published` +
    (withheld.length ? ` · withheld by governance: ${withheld.join(', ')}` : '') +
    (broken.length ? ` · ${broken.length} broken ref(s)` : '')
);
if (gated.length) gated.forEach((g) => console.log(`[content]   withheld: ${g}`));
if (broken.length) broken.forEach((b) => console.log(`[content]   broken ref: ${b}`));

module.exports = content;
