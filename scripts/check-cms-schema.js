#!/usr/bin/env node
/**
 * check-cms-schema.js — cross-validate the Sveltia config against the content loader.
 *
 * The loader FAILS THE BUILD on invalid content. A CMS that permits a save the loader rejects therefore
 * lets an editor break the live site from the admin panel, with no warning until the deploy fails
 * silently. This asserts they agree.
 *
 * Standing rules enforced here, both from defects found in the previous run:
 *   - every collection and file entry states its `format` explicitly, never inferred
 *   - no handlebars conditionals in `summary` strings; Decap/Sveltia render them literally
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cfg = yaml.load(fs.readFileSync(path.join(root, 'src/admin/config.yml'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'src/_data/orion.js'), 'utf8');

// Brace-balanced extraction, so nothing bleeds across collection boundaries.
const body = src.slice(src.indexOf('const COLLECTIONS = {'));
const specs = {};
for (const m of body.matchAll(/\n  (\w+): \{/g)) {
  let i = m.index + m[0].length - 1, depth = 0, j = i;
  for (; j < body.length; j++) {
    if (body[j] === '{') depth++;
    else if (body[j] === '}') { depth--; if (depth === 0) break; }
  }
  specs[m[1]] = body.slice(i, j + 1);
}

const constants = {};
for (const m of src.matchAll(/const ([A-Z_]+) = \[([^\]]*)\]/g)) {
  constants[m[1]] = m[2].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
}

const listOf = (raw) =>
  raw.trim().startsWith('[')
    ? raw.trim().slice(1, -1).split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean)
    : constants[raw.trim()] || null;

const problems = [];

for (const c of cfg.collections) {
  if (c.summary && /\{\{[#/]/.test(c.summary)) {
    problems.push(`${c.name}: summary contains a handlebars conditional — rendered literally by Sveltia`);
  }
  for (const f of c.files || []) {
    if (!(f.format || c.format)) problems.push(`${c.name}/${f.name}: no explicit format — Sveltia must infer it`);
    if (!fs.existsSync(path.join(root, f.file))) problems.push(`${c.name}/${f.name}: ${f.file} does not exist`);
  }
  if (!c.folder) continue;

  if (!c.format) problems.push(`${c.name}: no explicit format — Sveltia must infer it`);
  if (!fs.existsSync(path.join(root, c.folder))) problems.push(`${c.name}: folder ${c.folder} does not exist`);

  const spec = specs[c.name];
  if (!spec) { problems.push(`${c.name}: no loader schema — the CMS can create content nothing reads`); continue; }

  const reqM = spec.match(/required:\s*\[([^\]]*)\]/);
  const required = reqM ? reqM[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean) : [];
  const fields = c.fields || [];
  const names = fields.map((f) => f.name);
  const cmsRequired = fields.filter((f) => f.required !== false).map((f) => f.name);

  for (const r of required) {
    if (!names.includes(r)) problems.push(`${c.name}: loader requires "${r}", CMS has no such field`);
    else if (!cmsRequired.includes(r)) problems.push(`${c.name}: loader requires "${r}", CMS marks it optional — a save can break the build`);
  }

  const enumM = spec.match(/enums:\s*\{([\s\S]*?)\n {4}\},/) || spec.match(/enums:\s*\{([^}]*)\}/);
  if (enumM) {
    for (const em of enumM[1].matchAll(/(\w+):\s*(\[[^\]]*\]|[A-Z_]+)/g)) {
      const allowed = listOf(em[2]);
      if (!allowed) continue;
      const f = fields.find((x) => x.name === em[1]);
      if (!f) { problems.push(`${c.name}: loader constrains "${em[1]}", CMS has no such field`); continue; }
      if (f.widget !== 'select') { problems.push(`${c.name}.${em[1]}: enum-constrained but CMS widget is "${f.widget}" — free text breaks the build`); continue; }
      const opts = (f.options || []).map((o) => (typeof o === 'string' ? o : o.value));
      const bad = opts.filter((o) => !allowed.includes(o));
      const missing = allowed.filter((a) => !opts.includes(a));
      if (bad.length) problems.push(`${c.name}.${em[1]}: CMS offers values the loader rejects: ${bad.join(', ')}`);
      if (missing.length) problems.push(`${c.name}.${em[1]}: loader allows values the CMS does not offer: ${missing.join(', ')}`);
    }
  }
}

console.log(`CMS ↔ loader: ${cfg.collections.length} collections checked`);
if (problems.length) {
  problems.forEach((p) => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('  clean — the CMS cannot save a file the loader rejects');
