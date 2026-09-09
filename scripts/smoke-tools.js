const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '_site');
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(4322, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const B = 'http://localhost:4322';

  // --- 1. Segment router on the homepage ---
  await page.goto(B + '/?utm_source=smoke&utm_campaign=lot7', { waitUntil: 'networkidle' });
  await page.click('[data-segment-router] [data-segment="entreprise"]');
  await page.waitForLoadState('networkidle');
  const stored = await page.evaluate(() => sessionStorage.getItem('orion.segment'));
  console.log('1. router  → stored segment:', stored, stored === 'entreprise' ? '✓' : '✗ FAIL');
  console.log('   landed on:', new URL(page.url()).pathname);

  // --- 2. Fleet TCO calculator ---
  await page.goto(B + '/outils/calculateur-tco-flotte/', { waitUntil: 'networkidle' });
  await page.click('form[data-calculator="fleetTco"] button[type="submit"]');
  await page.waitForSelector('.calc-headline-value', { timeout: 3000 });
  const tco = await page.$eval('.calc-headline-value', e => e.textContent.trim());
  const tcoRows = await page.$$eval('[data-calculator-result] .data-table tr', rs => rs.map(r => r.innerText.replace(/\s+/g,' ').trim()));
  const assumptions = await page.$eval('[data-calculator-assumptions]', e => e.innerText.replace(/\s+/g,' ').trim().slice(0,200));
  const ctaVisible = await page.$eval('[data-calculator-cta]', e => !e.hidden);
  console.log('\n2. fleet TCO → headline:', tco);
  tcoRows.forEach(r => console.log('     ', r));
  console.log('   assumptions shown:', assumptions.slice(0, 120) + '…');
  console.log('   T3 CTA revealed:', ctaVisible ? '✓' : '✗ FAIL');

  // change an assumption, confirm the result moves
  await page.fill('#t-fuel', '600');
  await page.waitForTimeout(200);
  const tco2 = await page.$eval('.calc-headline-value', e => e.textContent.trim());
  console.log('   fuel price 840 → 600 changes result:', tco !== tco2 ? `✓ (${tco} → ${tco2})` : '✗ FAIL');

  // tool_result carried into the session
  const tool = await page.evaluate(() => sessionStorage.getItem('orion.tool_result'));
  console.log('   tool_result stored:', tool ? '✓' : '✗ FAIL');

  // --- 3. Site revenue: empty tariff must not invent a number ---
  await page.goto(B + '/outils/calculateur-revenus-site/', { waitUntil: 'networkidle' });
  await page.click('form[data-calculator="siteRevenue"] button[type="submit"]');
  await page.waitForSelector('.calc-headline-value', { timeout: 3000 });
  const rev = await page.$eval('.calc-headline-value', e => e.textContent.trim());
  console.log('\n3. site revenue with no tariff → headline:', JSON.stringify(rev), rev === '—' ? '✓ renders nothing' : '✗ FAIL invented a figure');
  await page.fill('#c-tariff', '150');
  await page.waitForTimeout(200);
  const rev2 = await page.$eval('.calc-headline-value', e => e.textContent.trim());
  console.log('   with tariff 150 →', rev2);

  // --- 4. Home checker blockers ---
  await page.goto(B + '/outils/verificateur-domicile/', { waitUntil: 'networkidle' });
  await page.check('input[name="earthing"][value="non"]');
  await page.check('input[name="parking"][value="non"]');
  await page.click('form[data-calculator="homeReadiness"] button[type="submit"]');
  await page.waitForSelector('.calc-headline-value', { timeout: 3000 });
  const blockers = await page.$$eval('[data-calculator-result] .form-error li', ls => ls.map(l => l.innerText.trim().slice(0, 70)));
  console.log('\n4. home checker (no earth, no parking) → blockers:', blockers.length);
  blockers.forEach(b => console.log('      •', b + '…'));

  // --- 5. Generated form carries its segment + attribution ---
  await page.goto(B + '/demande/site-partenaire/', { waitUntil: 'networkidle' });
  const fields = await page.$$eval('form[data-orion-form] input[type="hidden"]', els => els.map(e => [e.name, e.value]));
  console.log('\n5. /demande/site-partenaire/ hidden fields:');
  fields.forEach(([k, v]) => console.log('      ', k, '=', v));
  const labels = await page.$$eval('form[data-orion-form] label, form[data-orion-form] legend', ls => ls.length);
  console.log('   labelled controls:', labels);

  console.log('\n--- console errors ---');
  console.log(errors.length ? errors.join('\n') : '   none');

  await browser.close();
  server.close();
})();
