#!/usr/bin/env node
/**
 * parity.js — arithmetic parity between the ported revenue indicator and the reference implementation.
 *
 * Runs the real formula out of src/js/calculator.js in a DOM-less harness, driven by the real assumptions
 * out of the content collection. A mismatch means the port is wrong, not that the expectation is stale.
 *
 * Hand-verified against docs/reference/ORION_Indicateur_Revenus_Site.html:
 *   2 points · 60 kW · 14 h/day · tariff 200 · cost 99 · fees 2% · efficiency 0.85 · moderate · month 12
 *     net 30%   → 74 799 – 149 597 FCFA
 *     gross 10% → 51 408 – 102 816 FCFA
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

/** Load the real formulas by executing calculator.js against a minimal DOM stub. */
function loadFormulas() {
  const src = fs.readFileSync(path.join(root, 'src/js/calculator.js'), 'utf8');
  const captured = {};
  const noop = () => {};
  const doc = {
    addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') captured.ready = fn; },
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop, classList: { add: noop } }),
    documentElement: { lang: 'fr' },
  };
  const sandbox = {
    document: doc,
    window: { location: { pathname: '/' }, addEventListener: noop },
    sessionStorage: { getItem: () => null, setItem: noop },
    console,
    Math, Date, JSON, Number, String, Object, Array, isFinite, parseFloat, parseInt, RegExp,
  };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);

  // FORMULAS lives inside the IIFE closure, so re-run just the formula section with an exported hook.
  const exposed = src.replace(
    '  document.addEventListener(\'DOMContentLoaded\', function () {',
    '  window.__FORMULAS__ = FORMULAS;\n  document.addEventListener(\'DOMContentLoaded\', function () {'
  );
  vm.runInContext(exposed, sandbox);
  return sandbox.window.__FORMULAS__;
}

/** A form stub answering only what the revenue formula asks of it. */
function makeForm({ shareModel, pace, siteType, kw, productModel }) {
  return {
    querySelector(sel) {
      if (sel === '[name="share_model"]:checked') return { value: shareModel };
      if (sel === '[name="pace"]:checked') return { value: pace };
      if (sel === '[name="site_type"]') return { value: siteType };
      if (sel === '[name="product"]') {
        return { value: String(kw), selectedIndex: 0, options: [{ dataset: { model: productModel } }] };
      }
      return null;
    },
  };
}

const orion = require(path.join(root, 'src/_data/orion.js'));
const config = orion.assumptionsBySlug['indicateur-revenus-site'];
const FORMULAS = loadFormulas();

const failures = [];
const ok = (label, actual, expected) => {
  const pass = actual === expected;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label.padEnd(34)} ${actual}${pass ? '' : `   expected ${expected}`}`);
  if (!pass) failures.push(`${label}: got "${actual}", expected "${expected}"`);
};

const INPUTS = { points: 2, hours: 14, tariff: 200, electricity_cost: 99, payment_fee: 2, net_share: 30, gross_share: 10 };

console.log('\nArithmetic parity — 2 points · 60 kW · 14 h/day · tariff 200 · cost 99 · fees 2% · moderate · month 12\n');

for (const [mode, expected] of [['net', '74 799 – 149 597 FCFA'], ['gross', '51 408 – 102 816 FCFA']]) {
  const form = makeForm({ shareModel: mode, pace: 'mid', siteType: 'forecourt', kw: 60, productModel: 'TA-DC-DD60kW' });
  const r = FORMULAS.siteRevenue(INPUTS, form, config);
  ok(`${mode} ${mode === 'net' ? '30' : '10'}% at month 12`, r.headline, expected);

  // The band must be rendered, not just returned as a headline.
  const bandInHtml = r.html.includes(expected.replace(' FCFA', ''));
  console.log(`  ${bandInHtml ? 'ok  ' : 'FAIL'}  ${('band appears in rendered ' + mode).padEnd(34)} ${bandInHtml}`);
  if (!bandInHtml) failures.push(`${mode}: band not present in rendered html`);
}

/* --- framing assertions --- */
console.log('\nFraming\n');
const form = makeForm({ shareModel: 'net', pace: 'mid', siteType: 'forecourt', kw: 60, productModel: 'TA-DC-DD60kW' });
const out = FORMULAS.siteRevenue(INPUTS, form, config).html;

const bands = (out.match(/class="rev-card-band">[^<]*/g) || []).map((b) => b.split('>')[1].trim());
const allBands = bands.every((b) => / – /.test(b));
console.log(`  ${allBands ? 'ok  ' : 'FAIL'}  every horizon is a band, not a figure   ${bands.length} cards`);
if (!allBands) failures.push('a milestone card rendered a single figure');

const bothModels = /Partage du net/.test(out) && /Partage du brut/.test(out);
console.log(`  ${bothModels ? 'ok  ' : 'FAIL'}  both share models rendered at once`);
if (!bothModels) failures.push('only one share model rendered');

const stamped = /ne constitue ni une offre ni un engagement de revenus/.test(out);
console.log(`  ${stamped ? 'ok  ' : 'FAIL'}  not-an-offer stamp present`);
if (!stamped) failures.push('not-an-offer stamp missing');

const noSource = /Aucune source externe/.test(out);
console.log(`  ${noSource ? 'ok  ' : 'FAIL'}  ramps declared unsourced on the page`);
if (!noSource) failures.push('utilisation ramps not declared unsourced');

/* --- the 7 kW model must produce a visibly smaller host band --- */
console.log('\nHardware sensitivity\n');
const big = FORMULAS.siteRevenue(INPUTS, makeForm({ shareModel: 'net', pace: 'mid', siteType: 'forecourt', kw: 60, productModel: 'TA-DC-DD60kW' }), config);
const small = FORMULAS.siteRevenue(INPUTS, makeForm({ shareModel: 'net', pace: 'mid', siteType: 'forecourt', kw: 7, productModel: 'XD-AC-G07-P' }), config);
const num = (h) => parseInt(h.split('–')[1].replace(/[^0-9]/g, ''), 10);
const ratio = num(big.headline) / num(small.headline);
const smaller = num(small.headline) < num(big.headline);
console.log(`  ${smaller ? 'ok  ' : 'FAIL'}  7 kW earns a host less than 60 kW     ${small.headline} vs ${big.headline} (${ratio.toFixed(1)}×)`);
if (!smaller) failures.push('the 7 kW model did not produce a smaller host band');

console.log('');
if (failures.length) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
console.log('Parity holds.\n');
