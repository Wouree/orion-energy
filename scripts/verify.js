#!/usr/bin/env node
/**
 * verify.js — the assertion suite from Lot 8 of the build brief.
 *
 * Run it after any lot, not only at the end: a broken internal link or a leaked claim is cheapest to fix
 * in the commit that introduced it. Exits non-zero when anything fails.
 *
 *   node scripts/verify.js
 */

const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', '_site');
const failures = [];
const warnings = [];
let checks = 0;

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return e.name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles(SITE);
const rel = (f) => path.relative(SITE, f);

function check(name, fn) {
  checks++;
  const before = failures.length;
  fn();
  const status = failures.length === before ? '  ok  ' : ' FAIL ';
  console.log(`[${status}] ${name}`);
}

function fail(msg) {
  failures.push(msg);
}

/** Page text with script, style and svg content removed. */
function textOf(file) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  return s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ');
}

console.log(`\nVerifying ${pages.length} built pages in _site/\n`);

/* -- 2. No dead CTAs -------------------------------------------------- */
check('no href="#" survives', () => {
  for (const f of pages) {
    const s = fs.readFileSync(f, 'utf8');
    const n = (s.match(/href\s*=\s*["']#["']/g) || []).length;
    if (n) fail(`${rel(f)}: ${n} × href="#"`);
  }
});

/* -- 3/4. No unapproved claim, no banned string ----------------------- */
const BANNED = [
  ['IEC 61851', /IEC\s*61851/i],
  ['IEC 62196', /IEC\s*62196/i],
  ['IEC (any)', /\bIEC\b/],
  ['NF C 15-100', /NF\s*C\s*15-?100/i],
  ['Pionnier', /\bpionnier/i],
  ['Premier réseau', /premier\s+r[ée]seau/i],
  ['Garantie complète', /garantie\s+compl[èe]te/i],
  ['Ingénieurs certifiés', /ing[ée]nieurs?\s+certifi/i],
  ['MRS', /\bMRS\b/],
  ['Corley', /\bCorley\b/i],
];
check('no banned claim string in page text', () => {
  for (const f of pages) {
    const t = textOf(f);
    for (const [label, re] of BANNED) {
      if (re.test(t)) fail(`${rel(f)}: contains "${label}"`);
    }
  }
});

check('no unapproved claim renders', () => {
  const orion = require('../src/_data/orion.js');
  const unapproved = fs
    .readdirSync(path.join(__dirname, '..', 'content', 'claim'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .filter((slug) => !orion.claimBySlug[slug]);

  const matter = require('gray-matter');
  for (const slug of unapproved) {
    const raw = matter(fs.readFileSync(path.join(__dirname, '..', 'content', 'claim', `${slug}.md`), 'utf8'));
    const text = String(raw.data.text || '').trim();
    if (!text) continue;
    for (const f of pages) {
      if (textOf(f).includes(text)) fail(`${rel(f)}: renders unapproved claim "${slug}"`);
    }
  }
  if (!unapproved.length) warnings.push('no unapproved claim exists to test the gate against');
});

/* -- 5. No response-time figure --------------------------------------- */
check('no response-time figure published', () => {
  const RE = /(?:r[ée]ponse|r[ée]pond(?:ons|re|u)?|recontact\w*|rappel\w*|proposition|devis|intervention)[^.!?]{0,60}\bsous\s+\d|\bsous\s+\d+\s*(?:h\b|heures?|jours?|minutes?)|r[ée]ponse\s+garantie|d[ée]lai\s+de\s+r[ée]ponse\s+de\s+\d/i;
  for (const f of pages) {
    const t = textOf(f).replace(/\s+/g, ' ');
    const m = t.match(RE);
    if (m) fail(`${rel(f)}: response-time figure — "${m[0].trim()}"`);
  }
});

/* -- 6. Colour audit --------------------------------------------------- */
const BRAND = new Set(
  ['#14328C','#0B47BF','#1383F2','#0F79F2','#48D951','#73D844','#D3D936','#0E1A2B','#3D5068','#6B839A','#F4F6FA','#DDE3EB','#FFFFFF','#FFF',
   // documented extensions, declared in the client questionnaire or derived and listed in DECISIONS.md
   '#0E2A6E','#4BA0F5','#3AB843','#8DE06A','#CAC343',
   // status colours, deliberately outside the brand palette
   '#C42B2B','#FDF2F2','#B47A05','#FDF8EC','#1F7A46','#F0F8F3',
   // third-party channel colour on a third-party channel button
   '#25D366'].map((c) => c.toUpperCase())
);
check('only known colours appear in CSS', () => {
  const css = fs.readFileSync(path.join(SITE, 'css', 'style.css'), 'utf8');

  // Print output is deliberately achromatic: brand blue on paper wastes ink and reads worse than black.
  // Rather than widen the brand allowlist with a hand-maintained list of greys, neutral values are
  // permitted *inside the @media print block only*, and only when they are genuinely achromatic
  // (R = G = B). Any chromatic stray still fails, in print as everywhere else.
  const printBlock = (css.match(/@media print\s*\{[\s\S]*\}\s*$/) || [''])[0];
  const achromatic = (hex) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    if (full.length !== 6) return false;
    const [r, g, b] = [full.slice(0, 2), full.slice(2, 4), full.slice(4, 6)];
    return r === g && g === b;
  };

  for (const m of css.matchAll(/#[0-9a-fA-F]{3,6}\b/g)) {
    const c = m[0].toUpperCase();
    if (BRAND.has(c)) continue;
    const inPrint = printBlock && printBlock.includes(m[0]);
    if (inPrint && achromatic(c)) continue;
    fail(`style.css: undeclared colour ${c}${inPrint ? ' (in print block, but not achromatic)' : ''}`);
  }
});

/* -- Internal links resolve ------------------------------------------- */
check('every internal link resolves', () => {
  const exists = (href) => {
    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') return fs.existsSync(path.join(SITE, 'index.html'));
    const p = path.join(SITE, clean);
    return fs.existsSync(p) || fs.existsSync(path.join(p, 'index.html')) || fs.existsSync(p.replace(/\/$/, '') + '.html');
  };
  for (const f of pages) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/href\s*=\s*"(\/[^"]*)"/g)) {
      if (!exists(m[1])) fail(`${rel(f)}: broken internal link → ${m[1]}`);
    }
  }
});

/* -- Governance and pending ------------------------------------------- */
check('no PENDING_DATA marker leaks into output', () => {
  for (const f of pages) {
    if (fs.readFileSync(f, 'utf8').includes('PENDING_DATA')) fail(`${rel(f)}: PENDING_DATA marker in output`);
  }
});

check('no placeholder contact details', () => {
  for (const f of pages) {
    const s = fs.readFileSync(f, 'utf8');
    if (/6XXXXXXXX|XXX\s*XXX|YOUR_[A-Z_]+_HERE/.test(s)) fail(`${rel(f)}: placeholder contact detail`);
    if (/href="tel:"\s|href="tel:">/.test(s)) fail(`${rel(f)}: empty tel: link`);
    if (/wa\.me\/(?:["?]|\s)/.test(s)) fail(`${rel(f)}: WhatsApp link with no number`);
  }
});

check('every page has a canonical URL and a lang', () => {
  for (const f of pages) {
    if (rel(f).startsWith('admin')) continue;
    const s = fs.readFileSync(f, 'utf8');
    if (!/<link rel="canonical"/.test(s)) fail(`${rel(f)}: no canonical`);
    if (!/<html lang="[a-z]{2}"/.test(s)) fail(`${rel(f)}: no lang attribute`);
  }
});

check('JSON-LD parses on every page', () => {
  for (const f of pages) {
    if (rel(f).startsWith('admin')) continue;
    const s = fs.readFileSync(f, 'utf8');
    const m = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) { fail(`${rel(f)}: no JSON-LD`); continue; }
    try { JSON.parse(m[1]); } catch (e) { fail(`${rel(f)}: JSON-LD invalid — ${e.message}`); }
  }
});

/* -- Revenue indicator: arithmetic parity and framing ------------------ */
check('revenue indicator matches the reference arithmetic', () => {
  const { execFileSync } = require('child_process');
  try {
    execFileSync('node', [path.join(__dirname, 'parity.js')], { stdio: 'pipe' });
  } catch (e) {
    const out = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    out.split('\n').filter((l) => /FAIL|✗/.test(l)).forEach((l) => fail('parity: ' + l.trim()));
    if (!/FAIL|✗/.test(out)) fail('parity: ' + (e.message || 'harness failed').split('\n')[0]);
  }
});

check('no hardcoded FCFA figure in the revenue template', () => {
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'src/outils/calculateur-revenus-site/index.njk'), 'utf8');
  // Every number on this page must come from the assumptions collection or a claim.
  for (const m of tpl.matchAll(/value="(\d[\d\s.,]*)"/g)) {
    fail(`revenue template: literal value="${m[1]}" — assumptions must come from the collection`);
  }
  for (const m of tpl.matchAll(/(\d[\d\s.]{2,})\s*FCFA/g)) {
    fail(`revenue template: hardcoded "${m[1].trim()} FCFA"`);
  }
});

check('print stylesheet hides capture, keeps assumptions and stamp', () => {
  const css = fs.readFileSync(path.join(SITE, 'css', 'style.css'), 'utf8');
  const m = css.match(/@media print\s*\{([\s\S]*)\}\s*$/);
  if (!m) { fail('no @media print block'); return; }
  const block = m[1];
  if (!/\.rev-capture[^{]*\{[^}]*display:\s*none/.test(block)) fail('print: .rev-capture is not hidden — the email capture would print');
  if (/\.rev-assumptions[^{]*\{[^}]*display:\s*none/.test(block)) fail('print: .rev-assumptions is hidden — the leave-behind would lose its assumptions');
  if (/\.rev-stamp[^{]*\{[^}]*display:\s*none/.test(block)) fail('print: .rev-stamp is hidden — the leave-behind would lose its date stamp');
});

check('revenue page renders no single-figure host output', () => {
  const f = path.join(SITE, 'outils', 'calculateur-revenus-site', 'index.html');
  const s = fs.readFileSync(f, 'utf8');
  // Server-rendered markup must not ship a host figure at all; it is computed client-side as a band.
  const t = textOf(f).replace(/\s+/g, ' ');
  const bare = t.match(/\b\d{1,3}(?: \d{3})+ FCFA\b/g) || [];
  const banded = t.match(/\b\d{1,3}(?: \d{3})* – \d{1,3}(?: \d{3})* FCFA\b/g) || [];
  bare.filter((b) => !banded.some((x) => x.includes(b))).forEach((b) => {
    fail(`revenue page: single host figure "${b}" rendered outside a band`);
  });
  if (!/hypothèse/.test(s)) fail('revenue page: no hypothesis badge rendered');
});

/* -- Report ------------------------------------------------------------ */
console.log(`\n${checks} checks run over ${pages.length} pages.`);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log('  ! ' + w));
}
if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  failures.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nAll checks passed.\n');
