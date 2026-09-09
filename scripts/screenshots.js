#!/usr/bin/env node
/**
 * screenshots.js — full-page captures at 390 / 768 / 1440 for every built page.
 *
 * Writes to docs/screenshots/<width>/<slug>.jpg and prints a per-page report of anything that looks
 * wrong: horizontal overflow, console errors, missing images.
 *
 *   node scripts/screenshots.js
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '_site');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const WIDTHS = [390, 768, 1440];
const PORT = 4331;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };

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

function pages(dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return pages(path.join(dir, e.name), base + '/' + e.name);
    return e.name === 'index.html' ? [(base || '') + '/'] : [];
  });
}

const slug = (url) => (url === '/' ? 'accueil' : url.replace(/^\/|\/$/g, '').replace(/\//g, '--'));

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const urls = pages(ROOT).filter((u) => !u.startsWith('/admin')).sort();
  const browser = await chromium.launch();
  const problems = [];

  console.log(`\nCapturing ${urls.length} pages × ${WIDTHS.length} widths = ${urls.length * WIDTHS.length} screenshots\n`);

  for (const width of WIDTHS) {
    const dir = path.join(OUT, String(width));
    fs.mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });

    for (const url of urls) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

      try {
        await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(250);

        // The page body must never scroll horizontally.
        const overflow = await page.evaluate(() =>
          Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
        );

        // JPEG, not PNG. Full-page captures of long pages run to ~800 KB each as PNG, and 120 of them
        // put 95 MB of binary into the repository permanently — enough to break the push and to slow
        // every clone from here on. At quality 62 the set is roughly a tenth of that and remains
        // perfectly legible for layout review, which is what these are for.
        await page.screenshot({
          path: path.join(dir, slug(url) + '.jpg'),
          fullPage: true,
          type: 'jpeg',
          quality: 62
        });

        if (overflow > 1) problems.push(`${width}px ${url}: horizontal overflow of ${overflow}px`);
        errors.forEach((e) => problems.push(`${width}px ${url}: console — ${e.slice(0, 120)}`));
      } catch (e) {
        problems.push(`${width}px ${url}: ${e.message.split('\n')[0]}`);
      }
      await page.close();
    }
    await context.close();
    console.log(`  ${width}px — ${urls.length} pages captured`);
  }

  await browser.close();
  server.close();

  console.log(`\nWritten to docs/screenshots/{390,768,1440}/ as JPEG (quality 62)`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.log('  ! ' + p));
    process.exitCode = 1;
  } else {
    console.log('\nNo overflow, no console errors, on any page at any width.\n');
  }
})();
