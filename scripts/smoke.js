const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/nelson/Projects/orion-energy/_site';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.json':'application/json', '.yml':'text/yaml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(4321, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  // Land with UTM params, then navigate away, then open a form on another page.
  await page.goto('http://localhost:4321/?utm_source=test_src&utm_medium=cpc&utm_campaign=lancement', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:4321/services/entreprises/', { waitUntil: 'networkidle' });

  // Open the modal via a CTA
  await page.click('[data-form-type="devis"]');
  await page.waitForSelector('.modal-overlay.active', { timeout: 3000 });

  // Fill required fields and submit; endpoint is empty so we expect an explicit error, not fake success.
  await page.fill('#modalForm input[name="name"]', 'Test Utilisateur');
  await page.fill('#modalForm input[name="phone"]', '+237600000000');
  // Fill every visible, enabled, required field — whatever this form configuration actually shows.
  for (const el of await page.$$('#modalForm [data-field]:not(.hidden) select[required]')) {
    const opts = await el.$$eval('option', os => os.map(o => o.value).filter(Boolean));
    if (opts.length) await el.selectOption(opts[0]);
  }
  await page.click('#modalForm button[type="submit"]');
  await page.waitForTimeout(400);

  const hidden = await page.$$eval('#modalForm input[type="hidden"]', els => els.map(e => [e.name, e.value]));
  const hasSuccess = await page.$('.form-success') !== null;
  const errorText = await page.$eval('.form-error', e => e.textContent.trim()).catch(() => null);
  const waHref = await page.$eval('a.whatsapp-float', e => e.href);
  const deadLinks = await page.$$eval('a[href="#"]', els => els.length);

  console.log('--- hidden fields stamped on the form ---');
  hidden.forEach(([k, v]) => console.log('   ', k, '=', v));
  console.log('--- outcome ---');
  console.log('   fake success shown?  ', hasSuccess, hasSuccess ? '  <-- FAIL' : '  <-- correct');
  console.log('   error shown?         ', errorText ? 'yes' : 'NO  <-- FAIL');
  if (errorText) console.log('   error text:          ', errorText.slice(0, 120));
  console.log('   whatsapp float href: ', decodeURIComponent(waHref).slice(0, 110));
  console.log('   href="#" on page:    ', deadLinks);
  console.log('--- console errors ---');
  console.log(errors.length ? errors.join('\n') : '   none');

  await browser.close();
  server.close();
})();
