const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '_site');
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml' };
const server = http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(res);});

(async () => {
  await new Promise(r => server.listen(4351, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const fails = [];
  const t = (label, pass, detail='') => { console.log(`  ${pass?'ok  ':'FAIL'}  ${label}${detail?'   '+detail:''}`); if(!pass) fails.push(label); };

  await page.goto('http://localhost:4351/outils/calculateur-revenus-site/', { waitUntil: 'networkidle' });

  console.log('\nSCREEN\n');
  await page.click('form[data-calculator="siteRevenue"] button[type="submit"]');
  await page.waitForSelector('.rev-card-band', { timeout: 4000 });

  const bands = await page.$$eval('.rev-card-band', els => els.map(e => e.childNodes[0].textContent.trim()));
  t('four milestone bands rendered', bands.length === 4, bands.length + ' cards');
  t('every card is a band, not a figure', bands.every(b => b.includes('–')));
  t('net band matches parity target', bands[3] === '74 799 – 149 597', bands[3]);

  const models = await page.$$eval('.rev-model-value', els => els.map(e => e.childNodes[0].textContent.trim()));
  t('both share models show a figure', models.length === 2 && models.every(Boolean), models.join('  |  '));
  t('gross model matches parity target', models[1] === '51 408 – 102 816', models[1]);

  // switch model; the unselected one must keep its figure
  await page.check('input[name="share_model"][value="gross"]');
  await page.waitForTimeout(250);
  const after = await page.$$eval('.rev-model-value', els => els.map(e => e.childNodes[0].textContent.trim()));
  t('unselected model still shows its figure', after[0] === models[0] && after[1] === models[1]);
  const sel = await page.$$eval('.rev-model', els => els.map(e => e.classList.contains('is-selected')));
  t('selection moved to gross', sel[0] === false && sel[1] === true);
  await page.check('input[name="share_model"][value="net"]');
  await page.waitForTimeout(200);

  const badges = await page.$$eval('.claim-badge', els => els.map(e => e.textContent.trim()));
  t('hypothesis badges on tariff and cost', badges.length >= 2, badges.join(', '));

  // 7 kW must visibly shrink the host band
  const before = (await page.$$eval('.rev-card-band', e => e.map(x => x.childNodes[0].textContent.trim())))[3];
  await page.selectOption('#r-product', '7');
  await page.waitForTimeout(250);
  const small = (await page.$$eval('.rev-card-band', e => e.map(x => x.childNodes[0].textContent.trim())))[3];
  const n = s => parseInt(s.split('–')[1].replace(/\D/g,''),10);
  t('7 kW produces a visibly smaller band', n(small) < n(before), `${small}  vs  ${before}`);
  await page.selectOption('#r-product', '60');
  await page.waitForTimeout(250);

  t('assumptions block rendered', await page.$('.rev-assumptions li') !== null);
  t('date stamp rendered', /Simulation établie le/.test(await page.$eval('.rev-stamp', e => e.textContent)));
  t('not-an-offer stamp rendered', /ne constitue ni une offre/.test(await page.$eval('.rev-stamp', e => e.textContent)));
  t('T1 email capture visible on screen', await page.$eval('.rev-capture', e => e.offsetParent !== null));
  t('T3 CTA present', await page.$eval('.rev-t3 a', e => e.getAttribute('href')) === '/demande/site-partenaire/');

  console.log('\nPRINT EMULATION\n');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);
  const vis = sel => page.$eval(sel, e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden'; }).catch(() => false);
  t('email capture HIDDEN in print', !(await vis('.rev-capture')));
  t('print button hidden in print', !(await vis('.rev-print')));
  t('navigation hidden in print', !(await vis('.nav')));
  t('WhatsApp float hidden in print', !(await vis('.whatsapp-float')));
  t('assumptions block PRESENT in print', await vis('.rev-assumptions'));
  t('date stamp PRESENT in print', await vis('.rev-stamp'));
  t('bands PRESENT in print', await vis('.rev-cards'));
  t('detail table PRESENT in print', await vis('.rev-detail'));

  fs.mkdirSync(path.join(__dirname, '..', 'docs/screenshots/02'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, '..', 'docs/screenshots/02/print-leave-behind.jpg'), fullPage: true, type: 'jpeg', quality: 70 });
  await page.emulateMedia({ media: 'screen' });

  console.log('\nCONSOLE\n  ' + (errors.length ? errors.join('\n  ') : 'no errors'));
  if (errors.length) fails.push('console errors');

  await browser.close(); server.close();
  console.log('');
  if (fails.length) { console.log(fails.length + ' FAILURE(S): ' + fails.join('; ')); process.exit(1); }
  console.log('All revenue-indicator browser checks passed.\n');
})();
